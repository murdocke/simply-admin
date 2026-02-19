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
    action?: 'cancel' | 'reschedule';
    bookingId?: string;
    meetingTypeId?: string;
    date?: string;
    timezone?: string;
    startsAtUtc?: string;
  };

  if (!body.action || !body.bookingId || !body.meetingTypeId) {
    return NextResponse.json(
      { error: 'action, bookingId, and meetingTypeId are required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const meetingType = getMeetingType(db, { id: body.meetingTypeId });
  if (!meetingType) {
    return NextResponse.json({ error: 'Meeting type not found.' }, { status: 404 });
  }

  if (body.action === 'cancel') {
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('canceled', body.bookingId);
    return NextResponse.json({ ok: true });
  }

  if (!body.date || !body.startsAtUtc) {
    return NextResponse.json(
      { error: 'date and startsAtUtc are required for reschedule.' },
      { status: 400 },
    );
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
    bookings: bookings.filter(item => item.id !== body.bookingId),
    date: body.date,
    viewerTimeZone: body.timezone ?? meetingType.timezoneDefault,
    scheduleSettings,
  });

  const selected = slots.find(slot => slot.startsAtUtc === body.startsAtUtc);
  if (!selected || selected.isBusy) {
    return NextResponse.json(
      { error: 'That slot is no longer available.' },
      { status: 409 },
    );
  }

  const zoom = await createZoomMeeting({
    topic: meetingType.name,
    startsAtUtc: selected.startsAtUtc,
    durationMinutes: meetingType.durationMinutes,
  });

  db.prepare(
    `
      UPDATE bookings
      SET starts_at_utc = ?,
          ends_at_utc = ?,
          status = ?,
          zoom_join_url = ?,
          zoom_start_url = ?
      WHERE id = ?
    `,
  ).run(
    selected.startsAtUtc,
    selected.endsAtUtc,
    'rescheduled',
    zoom.join_url,
    zoom.start_url,
    body.bookingId,
  );

  return NextResponse.json({ ok: true });
}
