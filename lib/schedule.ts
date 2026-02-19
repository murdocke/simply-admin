import type Database from 'better-sqlite3';

export type MeetingType = {
  id: string;
  slug: string;
  name: string;
  location: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minNoticeMinutes: number;
  maxHorizonDays: number;
  timezoneDefault: string;
  availabilityMode: 'all' | 'busy' | 'daily_limit';
  busyBufferPercent: number;
  busyPatternVersion: number;
  dailyLimit: number;
  showSimplyMusicHeader: boolean;
  simplyMusicSubheaderText: string;
  noOvernightSlots: boolean;
  allowPublicReschedule: boolean;
  adminUsername: string;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleSettings = {
  adminUsername: string;
  primaryTimezone: string;
  travelModeEnabled: boolean;
  travelTimezone: string | null;
  travelStartDate: string | null;
  travelEndDate: string | null;
  globalUnavailable: boolean;
  updatedAt: string;
};

export type WeeklyAvailability = {
  id: string;
  meetingTypeId: string;
  dayOfWeek: number;
  startTimeMinutes: number;
  endTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyBlackout = {
  id: string;
  meetingTypeId: string;
  dayOfWeek: number;
  startTimeMinutes: number;
  endTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type Blackout = {
  id: string;
  meetingTypeId: string;
  startsAtUtc: string;
  endsAtUtc: string;
  allDay: boolean;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
  id: string;
  meetingTypeId: string;
  startsAtUtc: string;
  endsAtUtc: string;
  name: string;
  email: string;
  notes: string;
  status: string;
  publicToken: string | null;
  bookingTimezone: string | null;
  zoomJoinUrl: string | null;
  zoomStartUrl: string | null;
  createdAt: string;
};

export type Slot = {
  startsAtUtc: string;
  endsAtUtc: string;
  label: string;
  meetingStartLocal: string;
  isBusy?: boolean;
};

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const INDEX_TO_WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (value: number) => String(value).padStart(2, '0');

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const formatDateUtc = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;

export const formatDateInTimeZone = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find(part => part.type === 'year')?.value ?? '1970';
  const month = parts.find(part => part.type === 'month')?.value ?? '01';
  const day = parts.find(part => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
};

export const formatTimeInTimeZone = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

const getMinutesInTimeZone = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find(part => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find(part => part.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
};

const parseDateParts = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return { year, month, day };
};

export const addDays = (date: string, days: number) => {
  const { year, month, day } = parseDateParts(date);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);
  return formatDateUtc(base);
};

export const listDatesBetween = (start: string, end: string) => {
  if (start === end) return [start];
  const dates: string[] = [];
  let current = start;
  const maxIterations = 8;
  let iterations = 0;
  while (current <= end && iterations < maxIterations) {
    dates.push(current);
    current = addDays(current, 1);
    iterations += 1;
  }
  if (!dates.includes(end)) dates.push(end);
  return Array.from(new Set(dates));
};

export const listDatesFromStart = (start: string, days: number) => {
  const count = Math.max(1, Math.min(days, 62));
  const dates: string[] = [];
  for (let i = 0; i < count; i += 1) {
    dates.push(addDays(start, i));
  }
  return dates;
};

const getTimeZoneOffset = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);

  const asIfUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );

  return (asIfUtc - date.getTime()) / 60000;
};

export const zonedTimeToUtc = (date: string, minutes: number, timeZone: string) => {
  const { year, month, day } = parseDateParts(date);
  const naive = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  naive.setUTCMinutes(naive.getUTCMinutes() + minutes);
  let offset = getTimeZoneOffset(naive, timeZone);
  let utc = new Date(naive.getTime() - offset * 60000);
  const revisedOffset = getTimeZoneOffset(utc, timeZone);
  if (revisedOffset !== offset) {
    offset = revisedOffset;
    utc = new Date(naive.getTime() - offset * 60000);
  }
  return utc;
};

const getWeekdayIndex = (date: string, timeZone: string) => {
  const sample = zonedTimeToUtc(date, 12 * 60, timeZone);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(sample);
  return WEEKDAY_TO_INDEX[weekday] ?? 0;
};

const getEffectiveTimeZone = (
  meetingType: MeetingType,
  date: string,
  settings?: ScheduleSettings | null,
) => {
  const primary = settings?.primaryTimezone ?? meetingType.timezoneDefault;
  if (
    settings?.travelModeEnabled &&
    settings.travelTimezone &&
    settings.travelStartDate &&
    settings.travelEndDate
  ) {
    if (date >= settings.travelStartDate && date <= settings.travelEndDate) {
      return settings.travelTimezone;
    }
  }
  return primary;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'meeting';

export const ensureMeetingType = (db: Database.Database, adminUsername: string) => {
  const row = db
    .prepare(
      'SELECT * FROM meeting_types WHERE admin_username = ? ORDER BY created_at ASC LIMIT 1',
    )
    .get(adminUsername) as Record<string, string | number | null> | undefined;

  if (row) return mapMeetingType(row);

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const name = 'Intro Call';
  const baseSlug = slugify(name);
  const slug = createUniqueSlug(db, baseSlug);
  const meetingType: MeetingType = {
    id,
    slug,
    name,
    location: 'Zoom',
    durationMinutes: 30,
    bufferBeforeMinutes: 5,
    bufferAfterMinutes: 5,
    minNoticeMinutes: 120,
    maxHorizonDays: 30,
    timezoneDefault: 'America/Los_Angeles',
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

  db.prepare(
    `
      INSERT INTO meeting_types (
        id,
        slug,
        name,
        location,
        duration_minutes,
        buffer_before_minutes,
        buffer_after_minutes,
        min_notice_minutes,
        max_horizon_days,
        timezone_default,
        availability_mode,
        busy_buffer_percent,
        busy_pattern_version,
        daily_limit,
        show_simply_music_header,
        simply_music_subheader_text,
        no_overnight_slots,
        allow_public_reschedule,
        admin_username,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    meetingType.id,
    meetingType.slug,
    meetingType.name,
    meetingType.location,
    meetingType.durationMinutes,
    meetingType.bufferBeforeMinutes,
    meetingType.bufferAfterMinutes,
    meetingType.minNoticeMinutes,
    meetingType.maxHorizonDays,
    meetingType.timezoneDefault,
    meetingType.availabilityMode,
    meetingType.busyBufferPercent,
    meetingType.busyPatternVersion,
    meetingType.dailyLimit,
    meetingType.showSimplyMusicHeader ? 1 : 0,
    meetingType.simplyMusicSubheaderText,
    meetingType.noOvernightSlots ? 1 : 0,
    meetingType.allowPublicReschedule ? 1 : 0,
    meetingType.adminUsername,
    meetingType.createdAt,
    meetingType.updatedAt,
  );

  return meetingType;
};

const mapMeetingType = (row: Record<string, string | number | null>): MeetingType => ({
  id: String(row.id ?? ''),
  slug: String(row.slug ?? ''),
  name: String(row.name ?? ''),
  location: String(row.location ?? ''),
  durationMinutes: Number(row.duration_minutes ?? 30),
  bufferBeforeMinutes: Number(row.buffer_before_minutes ?? 0),
  bufferAfterMinutes: Number(row.buffer_after_minutes ?? 0),
  minNoticeMinutes: Number(row.min_notice_minutes ?? 0),
  maxHorizonDays: Number(row.max_horizon_days ?? 30),
  timezoneDefault: String(row.timezone_default ?? 'UTC'),
  availabilityMode: (row.availability_mode as MeetingType['availabilityMode']) ?? 'all',
  busyBufferPercent: Number(row.busy_buffer_percent ?? 40),
  busyPatternVersion: Number(row.busy_pattern_version ?? 1),
  dailyLimit: Number(row.daily_limit ?? 0),
  showSimplyMusicHeader: Boolean(row.show_simply_music_header),
  simplyMusicSubheaderText: String(row.simply_music_subheader_text ?? ''),
  noOvernightSlots:
    row.no_overnight_slots !== null ? Boolean(row.no_overnight_slots) : true,
  allowPublicReschedule: Boolean(row.allow_public_reschedule),
  adminUsername: String(row.admin_username ?? ''),
  createdAt: String(row.created_at ?? ''),
  updatedAt: String(row.updated_at ?? ''),
});

const mapAvailability = (
  row: Record<string, string | number | null>,
): WeeklyAvailability => ({
  id: String(row.id ?? ''),
  meetingTypeId: String(row.meeting_type_id ?? ''),
  dayOfWeek: Number(row.day_of_week ?? 0),
  startTimeMinutes: Number(row.start_time_minutes ?? 0),
  endTimeMinutes: Number(row.end_time_minutes ?? 0),
  createdAt: String(row.created_at ?? ''),
  updatedAt: String(row.updated_at ?? ''),
});

const mapWeeklyBlackout = (
  row: Record<string, string | number | null>,
): WeeklyBlackout => ({
  id: String(row.id ?? ''),
  meetingTypeId: String(row.meeting_type_id ?? ''),
  dayOfWeek: Number(row.day_of_week ?? 0),
  startTimeMinutes: Number(row.start_time_minutes ?? 0),
  endTimeMinutes: Number(row.end_time_minutes ?? 0),
  createdAt: String(row.created_at ?? ''),
  updatedAt: String(row.updated_at ?? ''),
});

const mapBlackout = (row: Record<string, string | number | null>): Blackout => ({
  id: String(row.id ?? ''),
  meetingTypeId: String(row.meeting_type_id ?? ''),
  startsAtUtc: String(row.starts_at_utc ?? ''),
  endsAtUtc: String(row.ends_at_utc ?? ''),
  allDay: Boolean(row.all_day),
  note: String(row.note ?? ''),
  createdAt: String(row.created_at ?? ''),
  updatedAt: String(row.updated_at ?? ''),
});

const mapBooking = (row: Record<string, string | number | null>): Booking => ({
  id: String(row.id ?? ''),
  meetingTypeId: String(row.meeting_type_id ?? ''),
  startsAtUtc: String(row.starts_at_utc ?? ''),
  endsAtUtc: String(row.ends_at_utc ?? ''),
  name: String(row.name ?? ''),
  email: String(row.email ?? ''),
  notes: String(row.notes ?? ''),
  status: String(row.status ?? ''),
  publicToken: row.public_token ? String(row.public_token) : null,
  bookingTimezone: row.booking_timezone ? String(row.booking_timezone) : null,
  zoomJoinUrl: row.zoom_join_url ? String(row.zoom_join_url) : null,
  zoomStartUrl: row.zoom_start_url ? String(row.zoom_start_url) : null,
  createdAt: String(row.created_at ?? ''),
});

const createUniqueSlug = (db: Database.Database, base: string) => {
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = db
      .prepare('SELECT id FROM meeting_types WHERE slug = ?')
      .get(slug) as { id?: string } | undefined;
    if (!existing) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
};

export const getMeetingType = (
  db: Database.Database,
  options: { id?: string | null; slug?: string | null; adminUsername?: string | null },
) => {
  if (options.id) {
    const row = options.adminUsername
      ? (db
          .prepare('SELECT * FROM meeting_types WHERE id = ? AND admin_username = ?')
          .get(options.id, options.adminUsername) as
          | Record<string, string | number | null>
          | undefined)
      : (db
          .prepare('SELECT * FROM meeting_types WHERE id = ?')
          .get(options.id) as Record<string, string | number | null> | undefined);
    if (row) return mapMeetingType(row);
  }
  if (options.slug) {
    const row = options.adminUsername
      ? (db
          .prepare('SELECT * FROM meeting_types WHERE slug = ? AND admin_username = ?')
          .get(options.slug, options.adminUsername) as
          | Record<string, string | number | null>
          | undefined)
      : (db
          .prepare('SELECT * FROM meeting_types WHERE slug = ?')
          .get(options.slug) as Record<string, string | number | null> | undefined);
    if (row) return mapMeetingType(row);
  }
  return null;
};

export const listMeetingTypes = (db: Database.Database, adminUsername: string) => {
  const rows = db
    .prepare(
      'SELECT * FROM meeting_types WHERE admin_username = ? ORDER BY created_at ASC',
    )
    .all(adminUsername) as Array<Record<string, string | number | null>>;
  return rows.map(mapMeetingType);
};

export const listAvailability = (db: Database.Database, meetingTypeId: string) => {
  const rows = db
    .prepare(
      'SELECT * FROM weekly_availability WHERE meeting_type_id = ? ORDER BY day_of_week, start_time_minutes',
    )
    .all(meetingTypeId) as Array<Record<string, string | number | null>>;
  return rows.map(mapAvailability);
};

export const listWeeklyBlackouts = (db: Database.Database, meetingTypeId: string) => {
  const rows = db
    .prepare(
      'SELECT * FROM weekly_blackouts WHERE meeting_type_id = ? ORDER BY day_of_week, start_time_minutes',
    )
    .all(meetingTypeId) as Array<Record<string, string | number | null>>;
  return rows.map(mapWeeklyBlackout);
};

export const listBlackouts = (db: Database.Database, meetingTypeId: string) => {
  const rows = db
    .prepare(
      'SELECT * FROM blackouts WHERE meeting_type_id = ? ORDER BY starts_at_utc DESC',
    )
    .all(meetingTypeId) as Array<Record<string, string | number | null>>;
  return rows.map(mapBlackout);
};

export const listUpcomingBookings = (
  db: Database.Database,
  meetingTypeId: string,
  fromUtc: string,
) => {
  const rows = db
    .prepare(
      `
        SELECT *
        FROM bookings
        WHERE meeting_type_id = ?
          AND status != 'canceled'
          AND ends_at_utc >= ?
        ORDER BY starts_at_utc ASC
        LIMIT 200
      `,
    )
    .all(meetingTypeId, fromUtc) as Array<Record<string, string | number | null>>;
  return rows.map(mapBooking);
};

export const upsertMeetingType = (
  db: Database.Database,
  meetingType: MeetingType,
) => {
  const slug = meetingType.slug ? slugify(meetingType.slug) : slugify(meetingType.name);
  const uniqueSlug = createUniqueSlugForId(db, slug, meetingType.id);
  db.prepare(
    `
      INSERT INTO meeting_types (
        id,
        slug,
        name,
        location,
        duration_minutes,
        buffer_before_minutes,
        buffer_after_minutes,
        min_notice_minutes,
      max_horizon_days,
      timezone_default,
      availability_mode,
      busy_buffer_percent,
      busy_pattern_version,
      daily_limit,
      show_simply_music_header,
      simply_music_subheader_text,
      no_overnight_slots,
      allow_public_reschedule,
      admin_username,
      created_at,
      updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        name = excluded.name,
        location = excluded.location,
        duration_minutes = excluded.duration_minutes,
        buffer_before_minutes = excluded.buffer_before_minutes,
        buffer_after_minutes = excluded.buffer_after_minutes,
        min_notice_minutes = excluded.min_notice_minutes,
        max_horizon_days = excluded.max_horizon_days,
        timezone_default = excluded.timezone_default,
        availability_mode = excluded.availability_mode,
        busy_buffer_percent = excluded.busy_buffer_percent,
        busy_pattern_version = excluded.busy_pattern_version,
        daily_limit = excluded.daily_limit,
        show_simply_music_header = excluded.show_simply_music_header,
        simply_music_subheader_text = excluded.simply_music_subheader_text,
        no_overnight_slots = excluded.no_overnight_slots,
        allow_public_reschedule = excluded.allow_public_reschedule,
        admin_username = excluded.admin_username,
        updated_at = excluded.updated_at
    `,
  ).run(
    meetingType.id,
    uniqueSlug,
    meetingType.name,
    meetingType.location,
    meetingType.durationMinutes,
    meetingType.bufferBeforeMinutes,
    meetingType.bufferAfterMinutes,
    meetingType.minNoticeMinutes,
    meetingType.maxHorizonDays,
    meetingType.timezoneDefault,
    meetingType.availabilityMode,
    meetingType.busyBufferPercent,
    meetingType.busyPatternVersion,
    meetingType.dailyLimit,
    meetingType.showSimplyMusicHeader ? 1 : 0,
    meetingType.simplyMusicSubheaderText,
    meetingType.noOvernightSlots ? 1 : 0,
    meetingType.allowPublicReschedule ? 1 : 0,
    meetingType.adminUsername,
    meetingType.createdAt,
    meetingType.updatedAt,
  );

  return { ...meetingType, slug: uniqueSlug };
};

export const deleteMeetingType = (
  db: Database.Database,
  meetingTypeId: string,
  adminUsername: string,
) => {
  db.prepare('DELETE FROM meeting_types WHERE id = ? AND admin_username = ?').run(
    meetingTypeId,
    adminUsername,
  );
};

const createUniqueSlugForId = (
  db: Database.Database,
  base: string,
  meetingTypeId: string,
) => {
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = db
      .prepare('SELECT id FROM meeting_types WHERE slug = ?')
      .get(slug) as { id?: string } | undefined;
    if (!existing || existing.id === meetingTypeId) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
};

export const replaceAvailability = (
  db: Database.Database,
  meetingTypeId: string,
  availability: WeeklyAvailability[],
) => {
  const now = new Date().toISOString();
  const deleteStmt = db.prepare('DELETE FROM weekly_availability WHERE meeting_type_id = ?');
  const insertStmt = db.prepare(
    `
      INSERT INTO weekly_availability (
        id,
        meeting_type_id,
        day_of_week,
        start_time_minutes,
        end_time_minutes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  );

  const tx = db.transaction(() => {
    deleteStmt.run(meetingTypeId);
    availability.forEach(item => {
      insertStmt.run(
        item.id || crypto.randomUUID(),
        meetingTypeId,
        item.dayOfWeek,
        item.startTimeMinutes,
        item.endTimeMinutes,
        item.createdAt || now,
        now,
      );
    });
  });
  tx();
};

export const replaceWeeklyBlackouts = (
  db: Database.Database,
  meetingTypeId: string,
  weeklyBlackouts: WeeklyBlackout[],
) => {
  const now = new Date().toISOString();
  const deleteStmt = db.prepare('DELETE FROM weekly_blackouts WHERE meeting_type_id = ?');
  const insertStmt = db.prepare(
    `
      INSERT INTO weekly_blackouts (
        id,
        meeting_type_id,
        day_of_week,
        start_time_minutes,
        end_time_minutes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  );

  const tx = db.transaction(() => {
    deleteStmt.run(meetingTypeId);
    weeklyBlackouts.forEach(item => {
      insertStmt.run(
        item.id || crypto.randomUUID(),
        meetingTypeId,
        item.dayOfWeek,
        item.startTimeMinutes,
        item.endTimeMinutes,
        item.createdAt || now,
        now,
      );
    });
  });
  tx();
};

export const getScheduleSettings = (
  db: Database.Database,
  adminUsername: string,
) => {
  const row = db
    .prepare('SELECT * FROM schedule_settings WHERE admin_username = ? LIMIT 1')
    .get(adminUsername) as Record<string, string | number | null> | undefined;
  if (!row) return null;
  return {
    adminUsername: String(row.admin_username ?? ''),
    primaryTimezone: String(row.primary_timezone ?? 'UTC'),
    travelModeEnabled: Boolean(row.travel_mode_enabled),
    travelTimezone: row.travel_timezone ? String(row.travel_timezone) : null,
    travelStartDate: row.travel_start_date ? String(row.travel_start_date) : null,
    travelEndDate: row.travel_end_date ? String(row.travel_end_date) : null,
    globalUnavailable: Boolean(row.global_unavailable),
    updatedAt: String(row.updated_at ?? ''),
  } satisfies ScheduleSettings;
};

export const upsertScheduleSettings = (
  db: Database.Database,
  settings: ScheduleSettings,
) => {
  db.prepare(
    `
      INSERT INTO schedule_settings (
        admin_username,
        primary_timezone,
        travel_mode_enabled,
        travel_timezone,
        travel_start_date,
        travel_end_date,
        global_unavailable,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(admin_username) DO UPDATE SET
        primary_timezone = excluded.primary_timezone,
        travel_mode_enabled = excluded.travel_mode_enabled,
        travel_timezone = excluded.travel_timezone,
        travel_start_date = excluded.travel_start_date,
        travel_end_date = excluded.travel_end_date,
        global_unavailable = excluded.global_unavailable,
        updated_at = excluded.updated_at
    `,
  ).run(
    settings.adminUsername,
    settings.primaryTimezone,
    settings.travelModeEnabled ? 1 : 0,
    settings.travelTimezone,
    settings.travelStartDate,
    settings.travelEndDate,
    settings.globalUnavailable ? 1 : 0,
    settings.updatedAt,
  );
  return settings;
};

export const updateMeetingTypesTimezone = (
  db: Database.Database,
  adminUsername: string,
  timeZone: string,
) => {
  db.prepare(
    'UPDATE meeting_types SET timezone_default = ?, updated_at = ? WHERE admin_username = ?',
  ).run(timeZone, new Date().toISOString(), adminUsername);
};

export const insertBlackout = (
  db: Database.Database,
  blackout: Omit<Blackout, 'createdAt' | 'updatedAt'>,
) => {
  const now = new Date().toISOString();
  const id = blackout.id || crypto.randomUUID();
  db.prepare(
    `
      INSERT INTO blackouts (
        id,
        meeting_type_id,
        starts_at_utc,
        ends_at_utc,
        all_day,
        note,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    id,
    blackout.meetingTypeId,
    blackout.startsAtUtc,
    blackout.endsAtUtc,
    blackout.allDay ? 1 : 0,
    blackout.note ?? '',
    now,
    now,
  );
  return id;
};

export const deleteBlackout = (db: Database.Database, id: string) => {
  db.prepare('DELETE FROM blackouts WHERE id = ?').run(id);
};

const overlaps = (startA: Date, endA: Date, startB: Date, endB: Date) =>
  startA < endB && endA > startB;

export const computeSlots = (params: {
  meetingType: MeetingType;
  availability: WeeklyAvailability[];
  weeklyBlackouts: WeeklyBlackout[];
  blackouts: Blackout[];
  bookings: Booking[];
  date: string;
  viewerTimeZone: string;
  scheduleSettings?: ScheduleSettings | null;
}) => {
  const {
    meetingType,
    availability,
    weeklyBlackouts,
    blackouts,
    bookings,
    date,
    viewerTimeZone,
    scheduleSettings,
  } = params;

  const viewerStartUtc = zonedTimeToUtc(date, 0, viewerTimeZone);
  const viewerEndUtc = zonedTimeToUtc(date, 24 * 60, viewerTimeZone);

  const meetingStartDate = formatDateInTimeZone(
    viewerStartUtc,
    getEffectiveTimeZone(meetingType, date, scheduleSettings),
  );
  const meetingEndDate = formatDateInTimeZone(
    new Date(viewerEndUtc.getTime() - 1),
    getEffectiveTimeZone(meetingType, date, scheduleSettings),
  );
  const datesToCheck = listDatesBetween(meetingStartDate, meetingEndDate);

  const now = Date.now();
  const minNoticeMs = meetingType.minNoticeMinutes * 60000;
  const maxHorizonMs = meetingType.maxHorizonDays * 24 * 60 * 60000;

  const blackoutWindows = blackouts.map(block => ({
    start: new Date(
      new Date(block.startsAtUtc).getTime() - meetingType.bufferBeforeMinutes * 60000,
    ),
    end: new Date(
      new Date(block.endsAtUtc).getTime() + meetingType.bufferAfterMinutes * 60000,
    ),
  }));

  const bookingWindows = bookings
    .filter(booking => booking.status !== 'canceled')
    .map(booking => ({
      start: new Date(
        new Date(booking.startsAtUtc).getTime() -
          meetingType.bufferBeforeMinutes * 60000,
      ),
      end: new Date(
        new Date(booking.endsAtUtc).getTime() +
          meetingType.bufferAfterMinutes * 60000,
      ),
    }));

  const slots: Slot[] = [];
  const stepMinutes = 15;

  for (const meetingDate of datesToCheck) {
    const effectiveTimeZone = getEffectiveTimeZone(
      meetingType,
      meetingDate,
      scheduleSettings,
    );
    const dayIndex = getWeekdayIndex(meetingDate, effectiveTimeZone);
    const windows = availability.filter(item => item.dayOfWeek === dayIndex);
    if (!windows.length) continue;

    const recurringBlackouts = weeklyBlackouts.filter(
      item => item.dayOfWeek === dayIndex,
    );
    const recurringBlackoutWindows = recurringBlackouts
      .map(block => {
        const paddedStart = Math.max(
          0,
          block.startTimeMinutes - meetingType.bufferBeforeMinutes,
        );
        const paddedEnd = Math.min(
          24 * 60,
          block.endTimeMinutes + meetingType.bufferAfterMinutes,
        );
        return {
          start: zonedTimeToUtc(meetingDate, paddedStart, effectiveTimeZone),
          end: zonedTimeToUtc(meetingDate, paddedEnd, effectiveTimeZone),
        };
      })
      .filter(block => block.end > block.start);

    const daySlots: Slot[] = [];

    for (const window of windows) {
      const windowStart = window.startTimeMinutes + meetingType.bufferBeforeMinutes;
      const latestStart =
        window.endTimeMinutes -
        meetingType.durationMinutes -
        meetingType.bufferAfterMinutes;

      if (latestStart < windowStart) continue;

      for (let startMinutes = windowStart; startMinutes <= latestStart; startMinutes += stepMinutes) {
        const meetingStartUtc = zonedTimeToUtc(
          meetingDate,
          startMinutes,
          effectiveTimeZone,
        );
        const meetingEndUtc = new Date(
          meetingStartUtc.getTime() + meetingType.durationMinutes * 60000,
        );

        if (
          meetingStartUtc.getTime() < now + minNoticeMs ||
          meetingStartUtc.getTime() > now + maxHorizonMs
        ) {
          continue;
        }

        if (meetingStartUtc < viewerStartUtc || meetingStartUtc >= viewerEndUtc) {
          continue;
        }

        if (meetingType.noOvernightSlots) {
          const viewerMinutes = getMinutesInTimeZone(meetingStartUtc, viewerTimeZone);
          if (viewerMinutes < 7 * 60 || viewerMinutes >= 21 * 60) {
            continue;
          }
        }

        const busyStart = new Date(
          meetingStartUtc.getTime() - meetingType.bufferBeforeMinutes * 60000,
        );
        const busyEnd = new Date(
          meetingEndUtc.getTime() + meetingType.bufferAfterMinutes * 60000,
        );

        const blocked = blackoutWindows.some(block =>
          overlaps(busyStart, busyEnd, block.start, block.end),
        );
        if (blocked) continue;

        const recurringBlocked = recurringBlackoutWindows.some(block =>
          overlaps(busyStart, busyEnd, block.start, block.end),
        );
        if (recurringBlocked) continue;

        const conflicts = bookingWindows.some(block =>
          overlaps(busyStart, busyEnd, block.start, block.end),
        );
        if (conflicts) continue;

        daySlots.push({
          startsAtUtc: meetingStartUtc.toISOString(),
          endsAtUtc: meetingEndUtc.toISOString(),
          label: formatTimeInTimeZone(meetingStartUtc, viewerTimeZone),
          meetingStartLocal: formatTimeInTimeZone(meetingStartUtc, meetingType.timezoneDefault),
        });
      }
    }

    daySlots.sort(
      (a, b) => new Date(a.startsAtUtc).getTime() - new Date(b.startsAtUtc).getTime(),
    );

    let filtered: Slot[] = daySlots;

    if (meetingType.availabilityMode === 'daily_limit' && meetingType.dailyLimit > 0) {
      filtered = daySlots.slice(0, meetingType.dailyLimit);
    }

    if (meetingType.availabilityMode === 'busy' && daySlots.length > 0) {
      const percent = Math.max(10, Math.min(90, meetingType.busyBufferPercent || 60));
      const targetHidden = Math.ceil((daySlots.length * percent) / 100);
      const hideCount = Math.min(daySlots.length - 1, targetHidden);
      if (hideCount > 0) {
        const seedBase = `${meetingType.id}:${meetingDate}:${meetingType.busyPatternVersion || 1}`;
        const seed = hashString(seedBase);
        const ranked = daySlots
          .map(slot => ({
            slot,
            score: hashString(`${seed}:${slot.startsAtUtc}`),
          }))
          .sort((a, b) => a.score - b.score);
        const hidden = new Set(ranked.slice(0, hideCount).map(item => item.slot.startsAtUtc));
        filtered = daySlots.map(slot =>
          hidden.has(slot.startsAtUtc) ? { ...slot, isBusy: true } : slot,
        );
      }
    }

    if (scheduleSettings?.globalUnavailable) {
      filtered = filtered.map(slot => ({ ...slot, isBusy: true }));
    }

    slots.push(...filtered);
  }

  slots.sort(
    (a, b) => new Date(a.startsAtUtc).getTime() - new Date(b.startsAtUtc).getTime(),
  );

  return slots;
};

export const getDayLabel = (dayIndex: number) => INDEX_TO_WEEKDAY[dayIndex] ?? 'Sun';
