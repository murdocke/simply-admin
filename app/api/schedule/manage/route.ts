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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'token is required.' }, { status: 400 });
  }
  const db = getDb();
  const booking = db
    .prepare(
      `
        SELECT b.*, m.name as meeting_name, m.location as meeting_location
        FROM bookings b
        JOIN meeting_types m ON m.id = b.meeting_type_id
        WHERE b.public_token = ?
        LIMIT 1
      `,
    )
    .get(token) as
    | (Record<string, string | number | null> & {
        meeting_name?: string | null;
        meeting_location?: string | null;
      })
    | undefined;

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }

  return NextResponse.json({
    booking: {
      id: String(booking.id ?? ''),
      meetingTypeId: String(booking.meeting_type_id ?? ''),
      startsAtUtc: String(booking.starts_at_utc ?? ''),
      endsAtUtc: String(booking.ends_at_utc ?? ''),
      name: String(booking.name ?? ''),
      email: String(booking.email ?? ''),
      notes: String(booking.notes ?? ''),
      status: String(booking.status ?? ''),
      publicToken: String(booking.public_token ?? ''),
      bookingTimezone: booking.booking_timezone ? String(booking.booking_timezone) : null,
      zoomJoinUrl: booking.zoom_join_url ? String(booking.zoom_join_url) : null,
      zoomStartUrl: booking.zoom_start_url ? String(booking.zoom_start_url) : null,
      createdAt: String(booking.created_at ?? ''),
      meetingName: String(booking.meeting_name ?? ''),
      meetingLocation: String(booking.meeting_location ?? ''),
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: 'cancel' | 'reschedule';
    token?: string;
    date?: string;
    timezone?: string;
    startsAtUtc?: string;
  };

  if (!body.action || !body.token) {
    return NextResponse.json(
      { error: 'action and token are required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const booking = db
    .prepare('SELECT * FROM bookings WHERE public_token = ?')
    .get(body.token) as Record<string, string | number | null> | undefined;

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }

  const meetingType = getMeetingType(db, { id: String(booking.meeting_type_id ?? '') });
  if (!meetingType || !meetingType.allowPublicReschedule) {
    return NextResponse.json(
      { error: 'Public reschedule is not allowed.' },
      { status: 403 },
    );
  }

  if (body.action === 'cancel') {
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('canceled', booking.id);
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
    bookings: bookings.filter(item => item.id !== booking.id),
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
          booking_timezone = ?,
          zoom_join_url = ?,
          zoom_start_url = ?
      WHERE id = ?
    `,
  ).run(
    selected.startsAtUtc,
    selected.endsAtUtc,
    'rescheduled',
    body.timezone ?? meetingType.timezoneDefault,
    zoom.join_url,
    zoom.start_url,
    booking.id,
  );

  return NextResponse.json({ ok: true });
}
