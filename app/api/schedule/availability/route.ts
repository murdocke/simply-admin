import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  ensureMeetingType,
  getMeetingType,
  listAvailability,
  listWeeklyBlackouts,
  listBlackouts,
  listUpcomingBookings,
  listMeetingTypes,
  replaceAvailability,
  replaceWeeklyBlackouts,
  upsertMeetingType,
  getScheduleSettings,
  upsertScheduleSettings,
  updateMeetingTypesTimezone,
  insertBlackout,
  deleteBlackout,
  deleteMeetingType,
  zonedTimeToUtc,
  type MeetingType,
  type WeeklyAvailability,
  type WeeklyBlackout,
} from '@/lib/schedule';

export const runtime = 'nodejs';

const parseNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const meetingTypeId = url.searchParams.get('meetingTypeId');
    const slug = url.searchParams.get('slug');
    const publicView = url.searchParams.get('public') === '1';
    const adminHeader = request.headers.get('x-sm-admin')?.trim();
    const adminCookie = request.cookies.get('sm_admin')?.value?.trim();
    const adminUsername =
      adminHeader || adminCookie || url.searchParams.get('adminUsername') || '';
    const db = getDb();

    if (publicView) {
      const meetingType = getMeetingType(db, { id: meetingTypeId, slug });
      if (!meetingType) {
        return NextResponse.json({ error: 'Meeting type not found.' }, { status: 404 });
      }
      const scheduleSettings = getScheduleSettings(db, meetingType.adminUsername);
      const meetingTypeWithPrimary = scheduleSettings
        ? { ...meetingType, timezoneDefault: scheduleSettings.primaryTimezone }
        : meetingType;
      return NextResponse.json({ meetingType: meetingTypeWithPrimary });
    }

    if (!adminUsername) {
      return NextResponse.json(
        { error: 'Admin session required.' },
        { status: 401 },
      );
    }

    let meetingTypes = listMeetingTypes(db, adminUsername);
    if (meetingTypes.length === 0) {
      const created = ensureMeetingType(db, adminUsername);
      meetingTypes = [created];
    }

    let meetingType = getMeetingType(db, { id: meetingTypeId, slug, adminUsername });
    if (!meetingType) {
      meetingType = meetingTypes[0] ?? null;
    }

    if (!meetingType) {
      return NextResponse.json({ error: 'Meeting type not found.' }, { status: 404 });
    }

    const availability = listAvailability(db, meetingType.id);
    const weeklyBlackouts = listWeeklyBlackouts(db, meetingType.id);
    const blackouts = listBlackouts(db, meetingType.id);
    const bookings = listUpcomingBookings(db, meetingType.id, new Date().toISOString());
    const scheduleSettings =
      getScheduleSettings(db, adminUsername) || {
        adminUsername,
        primaryTimezone: meetingType.timezoneDefault,
        travelModeEnabled: false,
        travelTimezone: null,
        travelStartDate: null,
        travelEndDate: null,
        globalUnavailable: false,
        updatedAt: new Date().toISOString(),
      };

    return NextResponse.json({
      meetingType,
      availability,
      weeklyBlackouts,
      blackouts,
      bookings,
      meetingTypes,
      scheduleSettings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[schedule availability] GET failed', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = (await request.json()) as {
      action?: string;
      meetingType?: Partial<MeetingType>;
      availability?: Array<Partial<WeeklyAvailability>>;
      weeklyBlackouts?: Array<Partial<WeeklyBlackout>>;
      adminUsername?: string;
      newMeetingTypeName?: string;
      meetingTypeId?: string;
      scheduleSettings?: {
        primaryTimezone?: string;
        travelModeEnabled?: boolean;
        travelTimezone?: string | null;
        travelStartDate?: string | null;
        travelEndDate?: string | null;
        globalUnavailable?: boolean;
      };
      blackout?: {
        meetingTypeId?: string;
        startDate?: string;
        endDate?: string;
        startTime?: string;
        endTime?: string;
        allDay?: boolean;
        timezone?: string;
        note?: string;
      };
      blackoutId?: string;
    };

    const action = body.action ?? 'save';

    const adminUsername =
      request.headers.get('x-sm-admin')?.trim() ||
      request.cookies.get('sm_admin')?.value?.trim() ||
      body.adminUsername?.trim() ||
      body.meetingType?.adminUsername?.trim() ||
      '';

    if (!adminUsername) {
      return NextResponse.json(
        { error: 'Admin session required.' },
        { status: 401 },
      );
    }

    if (action === 'createMeetingType') {
      const name = body.newMeetingTypeName?.trim();
      if (!name) {
        return NextResponse.json(
          { error: 'newMeetingTypeName is required.' },
          { status: 400 },
        );
      }
      const scheduleSettings = getScheduleSettings(db, adminUsername);
      const now = new Date().toISOString();
      const meetingType: MeetingType = {
        id: crypto.randomUUID(),
        slug: name,
        name,
        location: 'Zoom',
        durationMinutes: 30,
        bufferBeforeMinutes: 5,
        bufferAfterMinutes: 5,
        minNoticeMinutes: 120,
        maxHorizonDays: 30,
        timezoneDefault: scheduleSettings?.primaryTimezone ?? 'America/Los_Angeles',
        availabilityMode: 'all',
        busyBufferPercent: 60,
        busyPatternVersion: 1,
        dailyLimit: 4,
        showSimplyMusicHeader: false,
        simplyMusicSubheaderText:
          'Set up a One-On-One Zoom Call with Simply Music’s Founder, Neil Moore',
        noOvernightSlots: true,
        allowPublicReschedule: false,
        adminUsername,
        createdAt: now,
        updatedAt: now,
      };
      const saved = upsertMeetingType(db, meetingType);
      return NextResponse.json({ meetingType: saved });
    }

    if (action === 'deleteBlackout') {
      if (!body.blackoutId) {
        return NextResponse.json({ error: 'blackoutId is required.' }, { status: 400 });
      }
      deleteBlackout(db, body.blackoutId);
      return NextResponse.json({ ok: true });
    }

    if (action === 'deleteMeetingType') {
      const meetingTypeId = body.meetingType?.id || body.meetingTypeId;
      if (!meetingTypeId) {
        return NextResponse.json(
          { error: 'meetingTypeId is required.' },
          { status: 400 },
        );
      }
      const meetingType = getMeetingType(db, { id: meetingTypeId, adminUsername });
      if (!meetingType) {
        return NextResponse.json(
          { error: 'Meeting type not found.' },
          { status: 404 },
        );
      }
      deleteMeetingType(db, meetingTypeId, adminUsername);
      return NextResponse.json({ ok: true });
    }

    if (action === 'addBlackout') {
      const blackout = body.blackout;
      if (!blackout?.meetingTypeId || !blackout.startDate || !blackout.endDate) {
        return NextResponse.json(
          { error: 'meetingTypeId, startDate, and endDate are required.' },
          { status: 400 },
        );
      }
      const meetingTypeForAdmin = getMeetingType(db, {
        id: blackout.meetingTypeId,
        adminUsername,
      });
      if (!meetingTypeForAdmin) {
        return NextResponse.json(
          { error: 'Meeting type not found.' },
          { status: 404 },
        );
      }
      const timeZone = blackout.timezone || 'UTC';
      const startMinutes = blackout.startTime
        ? parseNumber(blackout.startTime.split(':')[0], 0) * 60 +
          parseNumber(blackout.startTime.split(':')[1], 0)
        : 0;
      const endMinutes = blackout.endTime
        ? parseNumber(blackout.endTime.split(':')[0], 0) * 60 +
          parseNumber(blackout.endTime.split(':')[1], 0)
        : 24 * 60;

      const startsAtUtc = zonedTimeToUtc(
        blackout.startDate,
        blackout.allDay ? 0 : startMinutes,
        timeZone,
      );
      const endsAtUtc = zonedTimeToUtc(
        blackout.endDate,
        blackout.allDay ? 24 * 60 : endMinutes,
        timeZone,
      );

      if (endsAtUtc <= startsAtUtc) {
        return NextResponse.json(
          { error: 'Blackout end must be after start.' },
          { status: 400 },
        );
      }

      const id = insertBlackout(db, {
        id: crypto.randomUUID(),
        meetingTypeId: blackout.meetingTypeId,
        startsAtUtc: startsAtUtc.toISOString(),
        endsAtUtc: endsAtUtc.toISOString(),
        allDay: blackout.allDay ?? false,
        note: blackout.note ?? '',
      });

      return NextResponse.json({ id });
    }

    if (!body.meetingType?.name) {
      return NextResponse.json({ error: 'Meeting type name is required.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const existingMeetingType = body.meetingType.id
      ? getMeetingType(db, { id: body.meetingType.id, adminUsername })
      : null;
    if (body.meetingType.id && !existingMeetingType) {
      return NextResponse.json({ error: 'Meeting type not found.' }, { status: 404 });
    }
    const meetingType: MeetingType = {
      id: body.meetingType.id ?? crypto.randomUUID(),
      slug: body.meetingType.slug ?? body.meetingType.name,
      name: body.meetingType.name,
      location: body.meetingType.location ?? 'Zoom',
      durationMinutes: parseNumber(body.meetingType.durationMinutes, 30),
      bufferBeforeMinutes: parseNumber(body.meetingType.bufferBeforeMinutes, 0),
      bufferAfterMinutes: parseNumber(body.meetingType.bufferAfterMinutes, 0),
      minNoticeMinutes: parseNumber(body.meetingType.minNoticeMinutes, 120),
      maxHorizonDays: parseNumber(body.meetingType.maxHorizonDays, 30),
      timezoneDefault: body.meetingType.timezoneDefault ?? 'UTC',
      availabilityMode:
        (body.meetingType.availabilityMode as MeetingType['availabilityMode']) ?? 'all',
      busyBufferPercent: parseNumber(body.meetingType.busyBufferPercent, 40),
      busyPatternVersion: parseNumber(body.meetingType.busyPatternVersion, 1),
      dailyLimit: parseNumber(body.meetingType.dailyLimit, 0),
      showSimplyMusicHeader: Boolean(body.meetingType.showSimplyMusicHeader),
      simplyMusicSubheaderText: String(body.meetingType.simplyMusicSubheaderText ?? ''),
      noOvernightSlots: Boolean(body.meetingType.noOvernightSlots ?? true),
      allowPublicReschedule: Boolean(body.meetingType.allowPublicReschedule),
      adminUsername,
      createdAt: body.meetingType.createdAt ?? now,
      updatedAt: now,
    };

    const saved = upsertMeetingType(db, meetingType);

    if (body.scheduleSettings?.primaryTimezone) {
      const scheduleSettings = upsertScheduleSettings(db, {
        adminUsername,
        primaryTimezone: String(body.scheduleSettings.primaryTimezone),
        travelModeEnabled: Boolean(body.scheduleSettings.travelModeEnabled),
        travelTimezone: body.scheduleSettings.travelTimezone
          ? String(body.scheduleSettings.travelTimezone)
          : null,
        travelStartDate: body.scheduleSettings.travelStartDate
          ? String(body.scheduleSettings.travelStartDate)
          : null,
        travelEndDate: body.scheduleSettings.travelEndDate
          ? String(body.scheduleSettings.travelEndDate)
          : null,
        globalUnavailable: Boolean(body.scheduleSettings.globalUnavailable),
        updatedAt: now,
      });
      updateMeetingTypesTimezone(db, adminUsername, scheduleSettings.primaryTimezone);
    }

    if (Array.isArray(body.availability)) {
      const cleaned = body.availability
        .map(item => ({
          id: item.id ?? crypto.randomUUID(),
          meetingTypeId: saved.id,
          dayOfWeek: parseNumber(item.dayOfWeek, 0),
          startTimeMinutes: parseNumber(item.startTimeMinutes, 0),
          endTimeMinutes: parseNumber(item.endTimeMinutes, 0),
          createdAt: item.createdAt ?? now,
          updatedAt: now,
        }))
        .filter(item =>
          Number.isFinite(item.dayOfWeek) &&
          item.startTimeMinutes >= 0 &&
          item.endTimeMinutes <= 24 * 60 &&
          item.endTimeMinutes > item.startTimeMinutes,
        );
      replaceAvailability(db, saved.id, cleaned);
    }

    if (Array.isArray(body.weeklyBlackouts)) {
      const cleaned = body.weeklyBlackouts
        .map(item => ({
          id: item.id ?? crypto.randomUUID(),
          meetingTypeId: saved.id,
          dayOfWeek: parseNumber(item.dayOfWeek, 0),
          startTimeMinutes: parseNumber(item.startTimeMinutes, 0),
          endTimeMinutes: parseNumber(item.endTimeMinutes, 0),
          createdAt: item.createdAt ?? now,
          updatedAt: now,
        }))
        .filter(item =>
          Number.isFinite(item.dayOfWeek) &&
          item.startTimeMinutes >= 0 &&
          item.endTimeMinutes <= 24 * 60 &&
          item.endTimeMinutes > item.startTimeMinutes,
        );
      replaceWeeklyBlackouts(db, saved.id, cleaned);
    }

    return NextResponse.json({ meetingType: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[schedule availability] POST failed', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
