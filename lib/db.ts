import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

type AccountsJson = {
  accounts?: Array<{
    username: string;
    role: string;
    name?: string;
    email?: string;
    status?: string;
    membershipStatus?: string;
    accountStatus?: string;
    goesBy?: string;
    lastLogin?: string | null;
    password?: string;
    teacherId?: string;
  }>;
};

type StudentsJson = {
  students?: Array<Record<string, unknown>>;
};

type TeachersJson = {
  teachers?: Array<Record<string, unknown>>;
};

type CompaniesJson = {
  companies?: Array<Record<string, unknown>>;
};

type ParentsJson = {
  parents?: Array<Record<string, unknown>>;
};

type StudiosJson = {
  studios?: Array<Record<string, unknown>>;
};

type CommunicationsJson = {
  communications?: Array<Record<string, unknown>>;
};

type CompanyPromosJson = {
  active?: Record<string, Record<string, unknown> | null>;
  history?: Array<Record<string, unknown>>;
};

type CompanyAlertsJson = {
  active?: Record<string, Array<Record<string, unknown>> | Record<string, unknown>>;
  history?: Array<Record<string, unknown>>;
};

type LessonPacksJson = {
  lessonPacks?: Array<Record<string, unknown>>;
};

type LessonPlansJson = {
  plans?: Array<Record<string, unknown>>;
};

type MessagesJson = {
  threads?: Record<string, Array<Record<string, unknown>>>;
  subjects?: Record<string, string>;
};

type PracticeHubVisibilityJson = Record<string, Record<string, unknown>>;

type PresenceJson = {
  lastSeen?: Record<string, string>;
  activity?: Record<string, Record<string, unknown>>;
};

type PricingOverridesJson = {
  overrides?: Record<string, Record<string, unknown>>;
};

type TeachersSubscriptionsJson = Array<Record<string, unknown>>;

type TypingJson = {
  lastSeen?: Record<string, string>;
};

type LessonTypesJson = string[];

type LessonSectionsJson = Record<string, unknown>;

type LessonMaterialsJson = Record<string, string[]>;

type LessonPartsJson = Record<string, string[]>;

let dbInstance: Database.Database | null = null;

const DB_PATH = path.join(process.cwd(), 'data', 'simply-music.db');
const ACCOUNTS_JSON = path.join(process.cwd(), 'data', 'accounts.json');
const STUDENTS_JSON = path.join(process.cwd(), 'data', 'students.json');
const TEACHERS_JSON = path.join(process.cwd(), 'data', 'teachers.json');
const COMPANIES_JSON = path.join(process.cwd(), 'data', 'companies.json');
const PARENTS_JSON = path.join(process.cwd(), 'data', 'parents.json');
const STUDIOS_JSON = path.join(process.cwd(), 'data', 'studios.json');
const COMMUNICATIONS_JSON = path.join(process.cwd(), 'data', 'communications.json');
const COMPANY_PROMOS_JSON = path.join(process.cwd(), 'data', 'company-promos.json');
const COMPANY_ALERTS_JSON = path.join(process.cwd(), 'data', 'company-alerts.json');
const LESSON_PACKS_JSON = path.join(process.cwd(), 'data', 'lesson-packs.json');
const LESSON_PLANS_JSON = path.join(process.cwd(), 'data', 'lesson-plans.json');
const MESSAGES_JSON = path.join(process.cwd(), 'data', 'messages.json');
const PRACTICE_HUB_VISIBILITY_JSON = path.join(
  process.cwd(),
  'data',
  'practice-hub-visibility.json',
);
const PRESENCE_JSON = path.join(process.cwd(), 'data', 'presence.json');
const PRICING_OVERRIDES_JSON = path.join(process.cwd(), 'data', 'pricing-overrides.json');
const TEACHERS_SUBSCRIPTIONS_JSON = path.join(
  process.cwd(),
  'data',
  'teachers-subscriptions.json',
);
const TYPING_JSON = path.join(process.cwd(), 'data', 'typing.json');
const LESSON_TYPES_JSON = path.join(
  process.cwd(),
  'app',
  '(admin)',
  'teachers',
  'students',
  'lesson-data',
  'lesson-types.json',
);
const LESSON_SECTIONS_JSON = path.join(
  process.cwd(),
  'app',
  '(admin)',
  'teachers',
  'students',
  'lesson-data',
  'lesson-sections.json',
);
const LESSON_MATERIALS_JSON = path.join(
  process.cwd(),
  'app',
  '(admin)',
  'teachers',
  'students',
  'lesson-data',
  'lesson-materials.json',
);
const LESSON_PARTS_JSON = path.join(
  process.cwd(),
  'app',
  '(admin)',
  'teachers',
  'students',
  'lesson-data',
  'lesson-parts.json',
);

function readJsonFile<T>(filePath: string, _fallback?: T): T {
  throw new Error(
    `JSON seeding has been disabled. Attempted to read: ${filePath}`,
  );
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      username TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT,
      email TEXT,
      status TEXT,
      membership_status TEXT,
      account_status TEXT,
      goes_by TEXT,
      last_login TEXT,
      password TEXT,
      teacher_id TEXT,
      PRIMARY KEY (username, role)
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      teacher TEXT,
      name TEXT,
      email TEXT,
      username TEXT,
      password TEXT,
      level TEXT,
      status TEXT,
      lesson_fee_amount TEXT,
      lesson_fee_period TEXT,
      lesson_day TEXT,
      lesson_time TEXT,
      lesson_duration TEXT,
      lesson_type TEXT,
      lesson_location TEXT,
      lesson_notes TEXT,
      student_alert TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      company TEXT,
      username TEXT,
      name TEXT,
      email TEXT,
      region TEXT,
      status TEXT,
      created_at TEXT,
      updated_at TEXT,
      password TEXT,
      goes_by TEXT,
      studio_id TEXT,
      studio_role TEXT
    );

    CREATE TABLE IF NOT EXISTS teacher_training_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      item_key TEXT NOT NULL,
      item_type TEXT NOT NULL,
      status TEXT NOT NULL,
      progress REAL,
      created_at TEXT,
      updated_at TEXT,
      UNIQUE (username, item_key)
    );

    CREATE TABLE IF NOT EXISTS teacher_training_activity (
      username TEXT PRIMARY KEY,
      first_opened_at TEXT,
      last_opened_at TEXT,
      last_session_seconds INTEGER,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS companies (
      username TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      status TEXT,
      last_login TEXT,
      password TEXT
    );

    CREATE TABLE IF NOT EXISTS parents (
      id TEXT PRIMARY KEY,
      username TEXT,
      name TEXT,
      email TEXT,
      phone TEXT,
      preferred_contact TEXT,
      billing_status TEXT,
      billing_next_payment_due TEXT,
      billing_monthly_total REAL,
      billing_last_paid TEXT
    );

    CREATE TABLE IF NOT EXISTS parent_students (
      parent_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      PRIMARY KEY (parent_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS studios (
      id TEXT PRIMARY KEY,
      company TEXT,
      name TEXT,
      location TEXT,
      time_zone TEXT,
      status TEXT,
      created_at TEXT,
      admin_teacher_id TEXT
    );

    CREATE TABLE IF NOT EXISTS studio_teachers (
      studio_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      PRIMARY KEY (studio_id, teacher_id)
    );

    CREATE TABLE IF NOT EXISTS communications (
      id TEXT PRIMARY KEY,
      title TEXT,
      body TEXT,
      media_type TEXT,
      media_url TEXT,
      created_at TEXT,
      author TEXT
    );

    CREATE TABLE IF NOT EXISTS company_promos (
      id TEXT PRIMARY KEY,
      title TEXT,
      body TEXT,
      cta TEXT,
      trigger TEXT,
      created_at TEXT,
      audience TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS company_promos_active (
      audience TEXT PRIMARY KEY,
      promo_id TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS company_alerts (
      id TEXT PRIMARY KEY,
      title TEXT,
      body TEXT,
      color TEXT,
      persistence TEXT,
      created_at TEXT,
      audience TEXT,
      status TEXT,
      username TEXT,
      interest_stage TEXT,
      interest_name TEXT,
      interest_email TEXT,
      interest_phone TEXT,
      interest_city TEXT,
      interest_region TEXT,
      call_scheduled_at TEXT,
      questionnaire_emailed_at TEXT,
      questionnaire_token TEXT,
      questionnaire_opened_at TEXT,
      questionnaire_active_at TEXT,
      questionnaire_completed_at TEXT,
      registration_token TEXT,
      registration_emailed_at TEXT,
      registration_opened_at TEXT,
      registration_active_at TEXT,
      registration_completed_at TEXT,
      qualified_at TEXT,
      not_qualified_at TEXT
    );

    CREATE TABLE IF NOT EXISTS questionnaire_responses (
      id TEXT PRIMARY KEY,
      alert_id TEXT,
      token TEXT,
      payload_json TEXT,
      submitted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS registration_verification_codes (
      id TEXT PRIMARY KEY,
      alert_id TEXT NOT NULL,
      token TEXT NOT NULL,
      channel TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS company_alerts_active (
      audience TEXT NOT NULL,
      alert_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (audience, alert_id)
    );

    CREATE TABLE IF NOT EXISTS lesson_packs (
      id TEXT PRIMARY KEY,
      title TEXT,
      subtitle TEXT,
      description TEXT,
      cover_image TEXT,
      tags_json TEXT,
      price_teacher REAL,
      price_student REAL,
      subject_count INTEGER,
      status TEXT,
      created_at TEXT,
      updated_at TEXT,
      subjects_json TEXT
    );

    CREATE TABLE IF NOT EXISTS lesson_plans (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      student_name TEXT,
      teacher TEXT,
      lesson_date TEXT,
      range_start TEXT,
      range_end TEXT,
      items_json TEXT,
      notes TEXT,
      focus TEXT,
      resources TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS message_threads (
      thread_id TEXT PRIMARY KEY,
      subject TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT,
      sender TEXT,
      text TEXT,
      timestamp TEXT,
      subject TEXT
    );

    CREATE TABLE IF NOT EXISTS practice_hub_visibility (
      student_id TEXT PRIMARY KEY,
      selected_ids_json TEXT,
      focus_ids_json TEXT,
      practice_days_json TEXT,
      help_flags_json TEXT
    );

    CREATE TABLE IF NOT EXISTS presence (
      key TEXT PRIMARY KEY,
      last_seen TEXT,
      activity_label TEXT,
      activity_detail TEXT,
      activity_updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS pricing_overrides (
      scope TEXT PRIMARY KEY,
      student_price REAL,
      teacher_price REAL
    );

    CREATE TABLE IF NOT EXISTS teachers_subscriptions (
      id TEXT PRIMARY KEY,
      name TEXT,
      region TEXT,
      last_students INTEGER,
      current_students INTEGER
    );

    CREATE TABLE IF NOT EXISTS typing (
      key TEXT PRIMARY KEY,
      last_seen TEXT
    );

    CREATE TABLE IF NOT EXISTS lesson_types (
      name TEXT PRIMARY KEY,
      sort_order INTEGER
    );

    CREATE TABLE IF NOT EXISTS lesson_sections (
      program TEXT PRIMARY KEY,
      sections_json TEXT
    );

    CREATE TABLE IF NOT EXISTS lesson_materials (
      program TEXT NOT NULL,
      section TEXT NOT NULL,
      material_order INTEGER NOT NULL,
      title TEXT,
      PRIMARY KEY (program, section, material_order)
    );

    CREATE TABLE IF NOT EXISTS lesson_parts (
      material_code TEXT NOT NULL,
      part_order INTEGER NOT NULL,
      title TEXT,
      PRIMARY KEY (material_code, part_order)
    );

    CREATE TABLE IF NOT EXISTS notification_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      to_value TEXT,
      source TEXT,
      subject TEXT,
      title TEXT,
      body TEXT,
      data_json TEXT,
      status TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS avatar_onboarding_videos (
      id TEXT PRIMARY KEY,
      video_key TEXT NOT NULL UNIQUE,
      title TEXT,
      description TEXT,
      provider TEXT,
      vimeo_id TEXT,
      video_path TEXT,
      open_on_load INTEGER DEFAULT 0,
      auto_play INTEGER DEFAULT 1,
      auto_close_on_end INTEGER DEFAULT 1,
      open_after_modal_key TEXT,
      open_button_label TEXT,
      ui_ref_key TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS avatar_onboarding_images (
      id TEXT PRIMARY KEY,
      video_key TEXT NOT NULL,
      image_path TEXT,
      start_seconds REAL,
      end_seconds REAL,
      sort_order INTEGER,
      ui_ref_key TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);
    CREATE INDEX IF NOT EXISTS idx_students_teacher ON students(teacher);
    CREATE INDEX IF NOT EXISTS idx_teachers_company ON teachers(company);
    CREATE INDEX IF NOT EXISTS idx_parents_username ON parents(username);
    CREATE INDEX IF NOT EXISTS idx_studios_company ON studios(company);
    CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_plans_student ON lesson_plans(student_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_type ON notification_events(type);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notification_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_reg_verifications_alert ON registration_verification_codes(alert_id);
    CREATE INDEX IF NOT EXISTS idx_reg_verifications_channel ON registration_verification_codes(channel);
    CREATE INDEX IF NOT EXISTS idx_avatar_onboarding_key ON avatar_onboarding_videos(video_key);
    CREATE INDEX IF NOT EXISTS idx_avatar_onboarding_images_key ON avatar_onboarding_images(video_key);
  `);
}

function seedAccounts(db: Database.Database) {
  const data = readJsonFile<AccountsJson>(ACCOUNTS_JSON, { accounts: [] });
  const accounts = data.accounts ?? [];
  if (accounts.length === 0) return;

  const insert = db.prepare(`
    INSERT INTO accounts (
      username,
      role,
      name,
      email,
      status,
      membership_status,
      account_status,
      goes_by,
      last_login,
      password,
      teacher_id
    ) VALUES (
      @username,
      @role,
      @name,
      @email,
      @status,
      @membershipStatus,
      @accountStatus,
      @goesBy,
      @lastLogin,
      @password,
      @teacherId
    )
  `);

  const tx = db.transaction(() => {
    for (const account of accounts) {
      insert.run({
        username: account.username,
        role: account.role,
        name: account.name ?? '',
        email: account.email ?? '',
        status: account.status ?? '',
        membershipStatus: account.membershipStatus ?? '',
        accountStatus: account.accountStatus ?? '',
        goesBy: account.goesBy ?? '',
        lastLogin: account.lastLogin ?? null,
        password: account.password ?? '',
        teacherId: account.teacherId ?? '',
      });
    }
  });
  tx();
}

function seedStudents(db: Database.Database) {
  const data = readJsonFile<StudentsJson>(STUDENTS_JSON, { students: [] });
  const students = (data.students ?? []) as Array<Record<string, unknown>>;
  if (students.length === 0) return;

  const insert = db.prepare(`
    INSERT INTO students (
      id,
      teacher,
      name,
      email,
      username,
      password,
      level,
      status,
      lesson_fee_amount,
      lesson_fee_period,
      lesson_day,
      lesson_time,
      lesson_duration,
      lesson_type,
      lesson_location,
      lesson_notes,
      student_alert,
      created_at,
      updated_at
    ) VALUES (
      @id,
      @teacher,
      @name,
      @email,
      @username,
      @password,
      @level,
      @status,
      @lessonFeeAmount,
      @lessonFeePeriod,
      @lessonDay,
      @lessonTime,
      @lessonDuration,
      @lessonType,
      @lessonLocation,
      @lessonNotes,
      @studentAlert,
      @createdAt,
      @updatedAt
    )
  `);

  const tx = db.transaction(() => {
    for (const student of students) {
      const record = student as Record<string, unknown>;
      insert.run({
        id: record.id,
        teacher: record.teacher ?? '',
        name: record.name ?? '',
        email: record.email ?? '',
        username: record.username ?? '',
        password: record.password ?? '',
        level: record.level ?? '',
        status: record.status ?? '',
        lessonFeeAmount: record.lessonFeeAmount ?? '',
        lessonFeePeriod: record.lessonFeePeriod ?? '',
        lessonDay: record.lessonDay ?? '',
        lessonTime: record.lessonTime ?? '',
        lessonDuration: record.lessonDuration ?? '',
        lessonType: record.lessonType ?? '',
        lessonLocation: record.lessonLocation ?? '',
        lessonNotes: record.lessonNotes ?? '',
        studentAlert: record.studentAlert ?? '',
        createdAt: record.createdAt ?? '',
        updatedAt: record.updatedAt ?? '',
      });
    }
  });
  tx();
}

function seedTeachers(db: Database.Database) {
  const data = readJsonFile<TeachersJson>(TEACHERS_JSON, { teachers: [] });
  const teachers = (data.teachers ?? []) as Array<Record<string, unknown>>;
  if (teachers.length === 0) return;

  const insert = db.prepare(`
    INSERT INTO teachers (
      id,
      company,
      username,
      name,
      email,
      region,
      status,
      created_at,
      updated_at,
      password,
      goes_by,
      studio_id,
      studio_role
    ) VALUES (
      @id,
      @company,
      @username,
      @name,
      @email,
      @region,
      @status,
      @createdAt,
      @updatedAt,
      @password,
      @goesBy,
      @studioId,
      @studioRole
    )
  `);

  const tx = db.transaction(() => {
    for (const teacher of teachers) {
      const record = teacher as Record<string, unknown>;
      insert.run({
        id: record.id,
        company: record.company ?? '',
        username: record.username ?? '',
        name: record.name ?? '',
        email: record.email ?? '',
        region: record.region ?? '',
        status: record.status ?? '',
        createdAt: record.createdAt ?? '',
        updatedAt: record.updatedAt ?? '',
        password: record.password ?? '',
        goesBy: record.goesBy ?? '',
        studioId: record.studioId ?? '',
        studioRole: record.studioRole ?? '',
      });
    }
  });
  tx();
}

function seedCompanies(db: Database.Database) {
  const data = readJsonFile<CompaniesJson>(COMPANIES_JSON, { companies: [] });
  const companies = (data.companies ?? []) as Array<Record<string, unknown>>;
  if (companies.length === 0) return;

  const insert = db.prepare(`
    INSERT INTO companies (
      username,
      name,
      email,
      status,
      last_login,
      password
    ) VALUES (
      @username,
      @name,
      @email,
      @status,
      @lastLogin,
      @password
    )
  `);

  const tx = db.transaction(() => {
    for (const company of companies) {
      const record = company as Record<string, unknown>;
      insert.run({
        username: record.username,
        name: record.name ?? '',
        email: record.email ?? '',
        status: record.status ?? '',
        lastLogin: record.lastLogin ?? null,
        password: record.password ?? '',
      });
    }
  });
  tx();
}

function seedParents(db: Database.Database) {
  const data = readJsonFile<ParentsJson>(PARENTS_JSON, { parents: [] });
  const parents = (data.parents ?? []) as Array<Record<string, unknown>>;
  if (parents.length === 0) return;

  const insertParent = db.prepare(`
    INSERT INTO parents (
      id,
      username,
      name,
      email,
      phone,
      preferred_contact,
      billing_status,
      billing_next_payment_due,
      billing_monthly_total,
      billing_last_paid
    ) VALUES (
      @id,
      @username,
      @name,
      @email,
      @phone,
      @preferredContact,
      @billingStatus,
      @billingNextPaymentDue,
      @billingMonthlyTotal,
      @billingLastPaid
    )
  `);
  const insertParentStudent = db.prepare(`
    INSERT INTO parent_students (parent_id, student_id)
    VALUES (@parentId, @studentId)
  `);

  const tx = db.transaction(() => {
    for (const parent of parents) {
      const record = parent as Record<string, unknown>;
      const billing = (record.billing ?? {}) as Record<string, unknown>;
      insertParent.run({
        id: record.id,
        username: record.username ?? '',
        name: record.name ?? '',
        email: record.email ?? '',
        phone: record.phone ?? '',
        preferredContact: record.preferredContact ?? '',
        billingStatus: billing.status ?? '',
        billingNextPaymentDue: billing.nextPaymentDue ?? '',
        billingMonthlyTotal:
          typeof billing.monthlyTotal === 'number'
            ? billing.monthlyTotal
            : billing.monthlyTotal
              ? Number(billing.monthlyTotal)
              : null,
        billingLastPaid: billing.lastPaid ?? '',
      });

      const students = (record.students ?? []) as Array<string>;
      for (const studentId of students) {
        insertParentStudent.run({ parentId: record.id, studentId });
      }
    }
  });
  tx();
}

function seedStudios(db: Database.Database) {
  const data = readJsonFile<StudiosJson>(STUDIOS_JSON, { studios: [] });
  const studios = (data.studios ?? []) as Array<Record<string, unknown>>;
  if (studios.length === 0) return;

  const insertStudio = db.prepare(`
    INSERT INTO studios (
      id,
      company,
      name,
      location,
      time_zone,
      status,
      created_at,
      admin_teacher_id
    ) VALUES (
      @id,
      @company,
      @name,
      @location,
      @timeZone,
      @status,
      @createdAt,
      @adminTeacherId
    )
  `);
  const insertStudioTeacher = db.prepare(`
    INSERT INTO studio_teachers (studio_id, teacher_id)
    VALUES (@studioId, @teacherId)
  `);

  const tx = db.transaction(() => {
    for (const studio of studios) {
      const record = studio as Record<string, unknown>;
      insertStudio.run({
        id: record.id,
        company: record.company ?? '',
        name: record.name ?? '',
        location: record.location ?? '',
        timeZone: record.timeZone ?? '',
        status: record.status ?? '',
        createdAt: record.createdAt ?? '',
        adminTeacherId: record.adminTeacherId ?? '',
      });

      const teacherIds = (record.teacherIds ?? []) as Array<string>;
      for (const teacherId of teacherIds) {
        insertStudioTeacher.run({ studioId: record.id, teacherId });
      }
    }
  });
  tx();
}

function seedCommunications(db: Database.Database) {
  const data = readJsonFile<CommunicationsJson>(COMMUNICATIONS_JSON, {
    communications: [],
  });
  const communications = (data.communications ?? []) as Array<Record<string, unknown>>;
  if (communications.length === 0) return;

  const insert = db.prepare(`
    INSERT INTO communications (
      id,
      title,
      body,
      media_type,
      media_url,
      created_at,
      author
    ) VALUES (
      @id,
      @title,
      @body,
      @mediaType,
      @mediaUrl,
      @createdAt,
      @author
    )
  `);

  const tx = db.transaction(() => {
    for (const entry of communications) {
      insert.run({
        id: entry.id,
        title: entry.title ?? '',
        body: entry.body ?? '',
        mediaType: entry.mediaType ?? 'none',
        mediaUrl: entry.mediaUrl ?? '',
        createdAt: entry.createdAt ?? '',
        author: entry.author ?? '',
      });
    }
  });
  tx();
}

function seedCompanyPromos(db: Database.Database) {
  const data = readJsonFile<CompanyPromosJson>(COMPANY_PROMOS_JSON, {});
  const history = (data.history ?? []) as Array<Record<string, unknown>>;
  const active = data.active ?? {};
  if (!history.length && !active) return;

  const insertPromo = db.prepare(`
    INSERT INTO company_promos (
      id,
      title,
      body,
      cta,
      trigger,
      created_at,
      audience,
      status
    ) VALUES (
      @id,
      @title,
      @body,
      @cta,
      @trigger,
      @createdAt,
      @audience,
      @status
    )
  `);

  const insertActive = db.prepare(`
    INSERT INTO company_promos_active (audience, promo_id, updated_at)
    VALUES (@audience, @promoId, @updatedAt)
  `);

  const seen = new Set<string>();

  const tx = db.transaction(() => {
    for (const promo of history) {
      if (!promo?.id || seen.has(String(promo.id))) continue;
      seen.add(String(promo.id));
      insertPromo.run({
        id: promo.id,
        title: promo.title ?? '',
        body: promo.body ?? '',
        cta: promo.cta ?? '',
        trigger: promo.trigger ?? '',
        createdAt: promo.createdAt ?? '',
        audience: promo.audience ?? 'both',
        status: promo.status ?? 'active',
      });
    }

    const activeTeacher = active.teacher as Record<string, unknown> | null | undefined;
    const activeStudent = active.student as Record<string, unknown> | null | undefined;
    if (activeTeacher?.id) {
      if (!seen.has(String(activeTeacher.id))) {
        insertPromo.run({
          id: activeTeacher.id,
          title: activeTeacher.title ?? '',
          body: activeTeacher.body ?? '',
          cta: activeTeacher.cta ?? '',
          trigger: activeTeacher.trigger ?? '',
          createdAt: activeTeacher.createdAt ?? '',
          audience: activeTeacher.audience ?? 'teacher',
          status: activeTeacher.status ?? 'active',
        });
        seen.add(String(activeTeacher.id));
      }
      insertActive.run({
        audience: 'teacher',
        promoId: activeTeacher.id,
        updatedAt: activeTeacher.createdAt ?? '',
      });
    }
    if (activeStudent?.id) {
      if (!seen.has(String(activeStudent.id))) {
        insertPromo.run({
          id: activeStudent.id,
          title: activeStudent.title ?? '',
          body: activeStudent.body ?? '',
          cta: activeStudent.cta ?? '',
          trigger: activeStudent.trigger ?? '',
          createdAt: activeStudent.createdAt ?? '',
          audience: activeStudent.audience ?? 'student',
          status: activeStudent.status ?? 'active',
        });
        seen.add(String(activeStudent.id));
      }
      insertActive.run({
        audience: 'student',
        promoId: activeStudent.id,
        updatedAt: activeStudent.createdAt ?? '',
      });
    }
  });
  tx();
}

function seedCompanyAlerts(db: Database.Database) {
  const data = readJsonFile<CompanyAlertsJson>(COMPANY_ALERTS_JSON, {});
  const history = (data.history ?? []) as Array<Record<string, unknown>>;
  const active = data.active ?? {};
  if (!history.length && !active) return;

  const insertAlert = db.prepare(`
    INSERT INTO company_alerts (
      id,
      title,
      body,
      color,
      persistence,
      created_at,
      audience,
      status,
      username
    ) VALUES (
      @id,
      @title,
      @body,
      @color,
      @persistence,
      @createdAt,
      @audience,
      @status,
      @username
    )
  `);

  const insertActive = db.prepare(`
    INSERT INTO company_alerts_active (audience, alert_id, sort_order)
    VALUES (@audience, @alertId, @sortOrder)
  `);

  const seen = new Set<string>();

  const tx = db.transaction(() => {
    for (const alert of history) {
      if (!alert?.id || seen.has(String(alert.id))) continue;
      seen.add(String(alert.id));
      insertAlert.run({
        id: alert.id,
        title: alert.title ?? '',
        body: alert.body ?? '',
        color: alert.color ?? '',
        persistence: alert.persistence ?? '',
        createdAt: alert.createdAt ?? '',
        audience: alert.audience ?? 'both',
        status: alert.status ?? 'active',
        username: alert.username ?? '',
      });
    }

    const activeTeacher = active.teacher as
      | Array<Record<string, unknown>>
      | Record<string, unknown>
      | undefined;
    const activeStudent = active.student as
      | Array<Record<string, unknown>>
      | Record<string, unknown>
      | undefined;
    const activeCompany = active.company as
      | Array<Record<string, unknown>>
      | Record<string, unknown>
      | undefined;

    const normalizeList = (
      value:
        | Array<Record<string, unknown>>
        | Record<string, unknown>
        | undefined,
    ) => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    };

    const insertActiveList = (
      audience: 'teacher' | 'student' | 'company',
      list: Array<Record<string, unknown>>,
    ) => {
      list.forEach((alert, index) => {
        if (!alert?.id) return;
        if (!seen.has(String(alert.id))) {
          insertAlert.run({
            id: alert.id,
            title: alert.title ?? '',
            body: alert.body ?? '',
            color: alert.color ?? '',
            persistence: alert.persistence ?? '',
            createdAt: alert.createdAt ?? '',
            audience: alert.audience ?? audience,
            status: alert.status ?? 'active',
            username: alert.username ?? '',
          });
          seen.add(String(alert.id));
        }
        insertActive.run({
          audience,
          alertId: alert.id,
          sortOrder: index,
        });
      });
    };

    insertActiveList('teacher', normalizeList(activeTeacher));
    insertActiveList('student', normalizeList(activeStudent));
    insertActiveList('company', normalizeList(activeCompany));
  });
  tx();
}

function seedLessonPacks(db: Database.Database) {
  const data = readJsonFile<LessonPacksJson>(LESSON_PACKS_JSON, {
    lessonPacks: [],
  });
  const packs = (data.lessonPacks ?? []) as Array<Record<string, unknown>>;
  if (!packs.length) return;

  const insert = db.prepare(`
    INSERT INTO lesson_packs (
      id,
      title,
      subtitle,
      description,
      cover_image,
      tags_json,
      price_teacher,
      price_student,
      subject_count,
      status,
      created_at,
      updated_at,
      subjects_json
    ) VALUES (
      @id,
      @title,
      @subtitle,
      @description,
      @coverImage,
      @tagsJson,
      @priceTeacher,
      @priceStudent,
      @subjectCount,
      @status,
      @createdAt,
      @updatedAt,
      @subjectsJson
    )
  `);

  const tx = db.transaction(() => {
    for (const pack of packs) {
      insert.run({
        id: pack.id,
        title: pack.title ?? '',
        subtitle: pack.subtitle ?? '',
        description: pack.description ?? '',
        coverImage: pack.coverImage ?? '',
        tagsJson: JSON.stringify(pack.tags ?? []),
        priceTeacher:
          typeof pack.priceTeacher === 'number' ? pack.priceTeacher : null,
        priceStudent:
          typeof pack.priceStudent === 'number' ? pack.priceStudent : null,
        subjectCount:
          typeof pack.subjectCount === 'number' ? pack.subjectCount : null,
        status: pack.status ?? '',
        createdAt: pack.createdAt ?? '',
        updatedAt: pack.updatedAt ?? '',
        subjectsJson: JSON.stringify(pack.subjects ?? []),
      });
    }
  });
  tx();
}

function seedLessonPlans(db: Database.Database) {
  const data = readJsonFile<LessonPlansJson>(LESSON_PLANS_JSON, { plans: [] });
  const plans = (data.plans ?? []) as Array<Record<string, unknown>>;
  if (!plans.length) return;

  const insert = db.prepare(`
    INSERT INTO lesson_plans (
      id,
      student_id,
      student_name,
      teacher,
      lesson_date,
      range_start,
      range_end,
      items_json,
      notes,
      focus,
      resources,
      created_at,
      updated_at
    ) VALUES (
      @id,
      @studentId,
      @studentName,
      @teacher,
      @lessonDate,
      @rangeStart,
      @rangeEnd,
      @itemsJson,
      @notes,
      @focus,
      @resources,
      @createdAt,
      @updatedAt
    )
  `);

  const tx = db.transaction(() => {
    for (const plan of plans) {
      insert.run({
        id: plan.id,
        studentId: plan.studentId ?? '',
        studentName: plan.studentName ?? '',
        teacher: plan.teacher ?? '',
        lessonDate: plan.lessonDate ?? '',
        rangeStart: plan.rangeStart ?? '',
        rangeEnd: plan.rangeEnd ?? '',
        itemsJson: JSON.stringify(plan.items ?? []),
        notes: plan.notes ?? '',
        focus: plan.focus ?? '',
        resources: plan.resources ?? '',
        createdAt: plan.createdAt ?? '',
        updatedAt: plan.updatedAt ?? '',
      });
    }
  });
  tx();
}

function seedMessages(db: Database.Database) {
  const data = readJsonFile<MessagesJson>(MESSAGES_JSON, {});
  const threads = data.threads ?? {};
  const subjects = data.subjects ?? {};
  const threadEntries = Object.entries(threads);
  if (!threadEntries.length && !Object.keys(subjects).length) return;

  const insertThread = db.prepare(`
    INSERT INTO message_threads (thread_id, subject)
    VALUES (@threadId, @subject)
  `);
  const insertMessage = db.prepare(`
    INSERT INTO messages (
      id,
      thread_id,
      sender,
      text,
      timestamp,
      subject
    ) VALUES (
      @id,
      @threadId,
      @sender,
      @text,
      @timestamp,
      @subject
    )
  `);

  const tx = db.transaction(() => {
    for (const [threadId, subject] of Object.entries(subjects)) {
      insertThread.run({ threadId, subject });
    }
    for (const [threadId, messages] of threadEntries) {
      for (const message of messages ?? []) {
        insertMessage.run({
          id: message.id,
          threadId,
          sender: message.sender ?? '',
          text: message.text ?? '',
          timestamp: message.timestamp ?? '',
          subject: message.subject ?? null,
        });
      }
      if (!(threadId in subjects)) {
        insertThread.run({ threadId, subject: null });
      }
    }
  });
  tx();
}

function seedPracticeHubVisibility(db: Database.Database) {
  const data = readJsonFile<PracticeHubVisibilityJson>(PRACTICE_HUB_VISIBILITY_JSON, {});
  const entries = Object.entries(data ?? {});
  if (!entries.length) return;

  const insert = db.prepare(`
    INSERT INTO practice_hub_visibility (
      student_id,
      selected_ids_json,
      focus_ids_json,
      practice_days_json,
      help_flags_json
    ) VALUES (
      @studentId,
      @selectedIdsJson,
      @focusIdsJson,
      @practiceDaysJson,
      @helpFlagsJson
    )
  `);

  const tx = db.transaction(() => {
    for (const [studentId, state] of entries) {
      const record = state as Record<string, unknown>;
      insert.run({
        studentId,
        selectedIdsJson: JSON.stringify(record.selectedIds ?? []),
        focusIdsJson: JSON.stringify(record.focusIds ?? []),
        practiceDaysJson: JSON.stringify(record.practiceDays ?? {}),
        helpFlagsJson: JSON.stringify(record.helpFlags ?? {}),
      });
    }
  });
  tx();
}

function seedPresence(db: Database.Database) {
  const data = readJsonFile<PresenceJson>(PRESENCE_JSON, {
    lastSeen: {},
    activity: {},
  });
  const lastSeen = data.lastSeen ?? {};
  const activity = data.activity ?? {};
  const keys = new Set([...Object.keys(lastSeen), ...Object.keys(activity)]);
  if (!keys.size) return;

  const insert = db.prepare(`
    INSERT INTO presence (
      key,
      last_seen,
      activity_label,
      activity_detail,
      activity_updated_at
    ) VALUES (
      @key,
      @lastSeen,
      @activityLabel,
      @activityDetail,
      @activityUpdatedAt
    )
  `);

  const tx = db.transaction(() => {
    for (const key of keys) {
      const activityEntry = activity[key] as Record<string, unknown> | undefined;
      insert.run({
        key,
        lastSeen: lastSeen[key] ?? null,
        activityLabel: activityEntry?.label ?? null,
        activityDetail: activityEntry?.detail ?? null,
        activityUpdatedAt: activityEntry?.updatedAt ?? null,
      });
    }
  });
  tx();
}

function seedPricingOverrides(db: Database.Database) {
  const data = readJsonFile<PricingOverridesJson>(PRICING_OVERRIDES_JSON, {
    overrides: {},
  });
  const overrides = data.overrides ?? {};
  const entries = Object.entries(overrides);
  if (!entries.length) return;

  const insert = db.prepare(`
    INSERT INTO pricing_overrides (scope, student_price, teacher_price)
    VALUES (@scope, @studentPrice, @teacherPrice)
  `);

  const tx = db.transaction(() => {
    for (const [scope, override] of entries) {
      const record = override as Record<string, unknown>;
      insert.run({
        scope,
        studentPrice:
          typeof record.student === 'number' ? record.student : null,
        teacherPrice:
          typeof record.teacher === 'number' ? record.teacher : null,
      });
    }
  });
  tx();
}

function seedTeachersSubscriptions(db: Database.Database) {
  const data = readJsonFile<TeachersSubscriptionsJson>(TEACHERS_SUBSCRIPTIONS_JSON, []);
  if (!data.length) return;

  const insert = db.prepare(`
    INSERT INTO teachers_subscriptions (
      id,
      name,
      region,
      last_students,
      current_students
    ) VALUES (
      @id,
      @name,
      @region,
      @lastStudents,
      @currentStudents
    )
  `);

  const tx = db.transaction(() => {
    for (const entry of data) {
      insert.run({
        id: entry.id,
        name: entry.name ?? '',
        region: entry.region ?? '',
        lastStudents:
          typeof entry.lastStudents === 'number' ? entry.lastStudents : null,
        currentStudents:
          typeof entry.currentStudents === 'number'
            ? entry.currentStudents
            : null,
      });
    }
  });
  tx();
}

function seedTyping(db: Database.Database) {
  const data = readJsonFile<TypingJson>(TYPING_JSON, { lastSeen: {} });
  const entries = Object.entries(data.lastSeen ?? {});
  if (!entries.length) return;

  const insert = db.prepare(`
    INSERT INTO typing (key, last_seen)
    VALUES (@key, @lastSeen)
  `);

  const tx = db.transaction(() => {
    for (const [key, lastSeen] of entries) {
      insert.run({ key, lastSeen });
    }
  });
  tx();
}

function seedLessonTypes(db: Database.Database) {
  const data = readJsonFile<LessonTypesJson>(LESSON_TYPES_JSON, []);
  if (!data.length) return;

  const insert = db.prepare(`
    INSERT INTO lesson_types (name, sort_order)
    VALUES (@name, @sortOrder)
  `);

  const tx = db.transaction(() => {
    data.forEach((name, index) => {
      insert.run({ name, sortOrder: index });
    });
  });
  tx();
}

function seedLessonSections(db: Database.Database) {
  const data = readJsonFile<LessonSectionsJson>(LESSON_SECTIONS_JSON, {});
  const entries = Object.entries(data ?? {});
  if (!entries.length) return;

  const insert = db.prepare(`
    INSERT INTO lesson_sections (program, sections_json)
    VALUES (@program, @sectionsJson)
  `);

  const tx = db.transaction(() => {
    for (const [program, sections] of entries) {
      insert.run({
        program,
        sectionsJson: JSON.stringify(sections ?? []),
      });
    }
  });
  tx();
}

function seedLessonMaterials(db: Database.Database) {
  const data = readJsonFile<LessonMaterialsJson>(LESSON_MATERIALS_JSON, {});
  const entries = Object.entries(data ?? {});
  if (!entries.length) return;

  const insert = db.prepare(`
    INSERT INTO lesson_materials (
      program,
      section,
      material_order,
      title
    ) VALUES (
      @program,
      @section,
      @materialOrder,
      @title
    )
  `);

  const tx = db.transaction(() => {
    for (const [key, list] of entries) {
      const [program, section] = key.split('|');
      if (!program || !section || !Array.isArray(list)) continue;
      list.forEach((title, index) => {
        insert.run({
          program,
          section,
          materialOrder: index,
          title,
        });
      });
    }
  });
  tx();
}

function seedLessonParts(db: Database.Database) {
  const data = readJsonFile<LessonPartsJson>(LESSON_PARTS_JSON, {});
  const entries = Object.entries(data ?? {});
  if (!entries.length) return;

  const insert = db.prepare(`
    INSERT INTO lesson_parts (
      material_code,
      part_order,
      title
    ) VALUES (
      @materialCode,
      @partOrder,
      @title
    )
  `);

  const tx = db.transaction(() => {
    for (const [materialCode, list] of entries) {
      if (!Array.isArray(list)) continue;
      list.forEach((title, index) => {
        insert.run({
          materialCode,
          partOrder: index,
          title,
        });
      });
    }
  });
  tx();
}

function tableHasRows(db: Database.Database, table: string) {
  try {
    const row = db
      .prepare(`SELECT COUNT(*) as count FROM ${table}`)
      .get() as { count: number };
    return row.count > 0;
  } catch {
    return false;
  }
}

function seedIfEmpty(db: Database.Database) {
  if (!tableHasRows(db, 'accounts')) seedAccounts(db);
  if (!tableHasRows(db, 'students')) seedStudents(db);
  if (!tableHasRows(db, 'teachers')) seedTeachers(db);
  if (!tableHasRows(db, 'companies')) seedCompanies(db);
  if (!tableHasRows(db, 'parents')) seedParents(db);
  if (!tableHasRows(db, 'studios')) seedStudios(db);
  if (!tableHasRows(db, 'communications')) seedCommunications(db);
  if (!tableHasRows(db, 'company_promos')) seedCompanyPromos(db);
  if (!tableHasRows(db, 'company_alerts')) seedCompanyAlerts(db);
  if (!tableHasRows(db, 'lesson_packs')) seedLessonPacks(db);
  if (!tableHasRows(db, 'lesson_plans')) seedLessonPlans(db);
  if (!tableHasRows(db, 'message_threads')) seedMessages(db);
  if (!tableHasRows(db, 'practice_hub_visibility')) seedPracticeHubVisibility(db);
  if (!tableHasRows(db, 'presence')) seedPresence(db);
  if (!tableHasRows(db, 'pricing_overrides')) seedPricingOverrides(db);
  if (!tableHasRows(db, 'teachers_subscriptions')) seedTeachersSubscriptions(db);
  if (!tableHasRows(db, 'typing')) seedTyping(db);
  if (!tableHasRows(db, 'lesson_types')) seedLessonTypes(db);
  if (!tableHasRows(db, 'lesson_sections')) seedLessonSections(db);
  if (!tableHasRows(db, 'lesson_materials')) seedLessonMaterials(db);
  if (!tableHasRows(db, 'lesson_parts')) seedLessonParts(db);
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('foreign_keys = ON');
    initSchema(dbInstance);
    ensureCompanyAlertsColumns(dbInstance);
  }
  return dbInstance;
}

function ensureCompanyAlertsColumns(db: Database.Database) {
  const columns = db
    .prepare(`PRAGMA table_info(company_alerts)`)
    .all()
    .map(entry => String(entry.name));
  const ensure = (name: string, definition: string) => {
    if (!columns.includes(name)) {
      db.prepare(`ALTER TABLE company_alerts ADD COLUMN ${name} ${definition}`).run();
    }
  };
  ensure('questionnaire_opened_at', 'TEXT');
  ensure('questionnaire_active_at', 'TEXT');
  ensure('registration_token', 'TEXT');
  ensure('registration_emailed_at', 'TEXT');
  ensure('registration_opened_at', 'TEXT');
  ensure('registration_active_at', 'TEXT');
  ensure('registration_completed_at', 'TEXT');
}
