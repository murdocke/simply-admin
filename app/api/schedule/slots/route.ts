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
  listDatesFromStart,
} from '@/lib/schedule';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const meetingTypeId = url.searchParams.get('meetingTypeId');
  const slug = url.searchParams.get('slug');
  const date = url.searchParams.get('date');
  const startDate = url.searchParams.get('startDate');
  const daysParam = url.searchParams.get('days');
  const timeZone = url.searchParams.get('timezone') ?? 'UTC';

  if (!date && !startDate) {
    return NextResponse.json(
      { error: 'date or startDate is required.' },
      { status: 400 },
    );
  }
  if (!meetingTypeId && !slug) {
    return NextResponse.json(
      { error: 'meetingTypeId or slug is required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const meetingType = getMeetingType(db, { id: meetingTypeId, slug });

  if (!meetingType) {
    return NextResponse.json({ error: 'Meeting type not found.' }, { status: 404 });
  }

  const availability = listAvailability(db, meetingType.id);
  const weeklyBlackouts = listWeeklyBlackouts(db, meetingType.id);
  const blackouts = listBlackouts(db, meetingType.id);
  const bookings = listUpcomingBookings(db, meetingType.id, new Date().toISOString());
  const scheduleSettings = getScheduleSettings(db, meetingType.adminUsername);

  const dates = startDate
    ? listDatesFromStart(startDate, Number(daysParam) || 7)
    : [date as string];
  const days = dates.map(day => ({
    date: day,
    slots: computeSlots({
      meetingType,
      availability,
      weeklyBlackouts,
      blackouts,
      bookings,
      date: day,
      viewerTimeZone: timeZone,
      scheduleSettings,
    }),
  }));

  return NextResponse.json({
    meetingType: {
      id: meetingType.id,
      name: meetingType.name,
      durationMinutes: meetingType.durationMinutes,
      timezoneDefault: meetingType.timezoneDefault,
      location: meetingType.location,
    },
    days,
  });
}
