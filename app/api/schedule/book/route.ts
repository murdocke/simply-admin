import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  getMeetingType,
  listAvailability,
  listWeeklyBlackouts,
  listBlackouts,
  listUpcomingBookings,
  getScheduleSettings,
  computeSlots,
} from '@/lib/schedule';
import { createZoomMeeting } from '@/lib/zoom';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    meetingTypeId?: string;
    slug?: string;
    date?: string;
    timezone?: string;
    startsAtUtc?: string;
    name?: string;
    email?: string;
    notes?: string;
  };

  if (!body.date || !body.startsAtUtc || !body.name || !body.email) {
    return NextResponse.json(
      { error: 'date, startsAtUtc, name, and email are required.' },
      { status: 400 },
    );
  }
  if (!body.meetingTypeId && !body.slug) {
    return NextResponse.json(
      { error: 'meetingTypeId or slug is required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const meetingType = getMeetingType(db, { id: body.meetingTypeId, slug: body.slug });

  if (!meetingType) {
    return NextResponse.json({ error: 'Meeting type not found.' }, { status: 404 });
  }

  const availability = listAvailability(db, meetingType.id);
  const weeklyBlackouts = listWeeklyBlackouts(db, meetingType.id);
  const blackouts = listBlackouts(db, meetingType.id);
  const bookings = listUpcomingBookings(db, meetingType.id, new Date().toISOString());
  const scheduleSettings = getScheduleSettings(db, meetingType.adminUsername);

  const slots = computeSlots({
    meetingType,
    availability,
    weeklyBlackouts,
    blackouts,
    bookings,
    date: body.date,
    viewerTimeZone: body.timezone ?? meetingType.timezoneDefault,
    scheduleSettings,
  });

  const selected = slots.find(slot => slot.startsAtUtc === body.startsAtUtc);
  if (!selected || selected.isBusy) {
    return NextResponse.json(
      { error: 'That slot is no longer available. Please select a new time.' },
      { status: 409 },
    );
  }

  const zoom = await createZoomMeeting({
    topic: meetingType.name,
    startsAtUtc: selected.startsAtUtc,
    durationMinutes: meetingType.durationMinutes,
  });

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const publicToken = meetingType.allowPublicReschedule
    ? crypto.randomUUID()
    : null;

  db.prepare(
    `
      INSERT INTO bookings (
        id,
        meeting_type_id,
        starts_at_utc,
        ends_at_utc,
        name,
        email,
        notes,
        status,
        public_token,
        booking_timezone,
        zoom_join_url,
        zoom_start_url,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    id,
    meetingType.id,
    selected.startsAtUtc,
    selected.endsAtUtc,
    body.name,
    body.email,
    body.notes ?? '',
    'scheduled',
    publicToken,
    body.timezone ?? meetingType.timezoneDefault,
    zoom.join_url,
    zoom.start_url,
    createdAt,
  );

  return NextResponse.json({
    booking: {
      id,
      meetingTypeId: meetingType.id,
      startsAtUtc: selected.startsAtUtc,
      endsAtUtc: selected.endsAtUtc,
      name: body.name,
      email: body.email,
      notes: body.notes ?? '',
      status: 'scheduled',
      publicToken,
      bookingTimezone: body.timezone ?? meetingType.timezoneDefault,
      zoomJoinUrl: zoom.join_url,
      zoomStartUrl: zoom.start_url,
      createdAt,
    },
  });
}
