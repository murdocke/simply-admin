import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';

type AlertPayload = {
  id: string;
  title: string;
  body: string;
  color: string;
  persistence: string;
  createdAt: string;
  audience: 'teacher' | 'student' | 'both' | 'company';
  status?: 'active' | 'removed';
  interestStage?:
    | 'new'
    | 'call_scheduled'
    | 'questionnaire_sent'
    | 'questionnaire_opened'
    | 'questionnaire_completed'
    | 'qualified'
    | 'not_qualified';
  interestName?: string;
  interestEmail?: string;
  interestPhone?: string;
  interestCity?: string;
  interestRegion?: string;
  interestCountry?: string;
  interestPostalCode?: string;
  interestStreet1?: string;
  interestStreet2?: string;
  interestBusinessName?: string;
  interestReferral?: string;
  interestAbout?: string;
  callScheduledAt?: string;
  questionnaireEmailedAt?: string;
  questionnaireToken?: string;
  questionnaireOpenedAt?: string;
  questionnaireActiveAt?: string;
  questionnaireCompletedAt?: string;
  registrationToken?: string;
  registrationEmailedAt?: string;
  registrationOpenedAt?: string;
  registrationActiveAt?: string;
  registrationCompletedAt?: string;
  trainingLastOpenedAt?: string;
  trainingUpdatedAt?: string;
  trainingLastSessionSeconds?: number | null;
  qualifiedAt?: string;
  notQualifiedAt?: string;
  username?: string;
};

export const runtime = 'nodejs';

type AlertStore = {
  active?: {
    teacher?: AlertPayload[];
    student?: AlertPayload[];
    company?: AlertPayload[];
  };
  history?: AlertPayload[];
};

export async function GET() {
  const db = getDb();
  const historyRows = db
    .prepare(
      `
        SELECT c.id, c.title, c.body, c.color, c.persistence, c.created_at, c.audience, c.status, c.username,
          c.interest_stage, c.interest_name, c.interest_email, c.interest_phone, c.interest_city, c.interest_region,
          c.interest_country, c.interest_postal_code, c.interest_street1, c.interest_street2, c.interest_business_name,
          c.interest_referral, c.interest_about,
          c.call_scheduled_at, c.questionnaire_emailed_at, c.questionnaire_token, c.questionnaire_opened_at, c.questionnaire_active_at, c.questionnaire_completed_at,
          c.registration_token, c.registration_emailed_at, c.registration_opened_at, c.registration_active_at, c.registration_completed_at,
          c.qualified_at, c.not_qualified_at, tta.last_opened_at as training_last_opened_at, tta.updated_at as training_updated_at, tta.last_session_seconds as training_last_session_seconds,
          qr.submitted_at as questionnaire_response_at
        FROM company_alerts c
        LEFT JOIN teachers t ON (
          LOWER(t.email) = LOWER(c.interest_email)
          OR (
            c.username IS NOT NULL
            AND c.username != ''
            AND LOWER(t.username) = LOWER(c.username)
          )
        )
        LEFT JOIN teacher_training_activity tta
          ON LOWER(tta.username) = LOWER(COALESCE(NULLIF(c.username, ''), t.username))
        LEFT JOIN (
          SELECT alert_id, MAX(submitted_at) as submitted_at
          FROM questionnaire_responses
          GROUP BY alert_id
        ) qr ON qr.alert_id = c.id
        ORDER BY c.created_at DESC
      `,
    )
    .all() as Array<Record<string, string | null>>;
  const history = historyRows.map(row => {
    const completedAt =
      row.questionnaire_completed_at && String(row.questionnaire_completed_at).trim()
        ? String(row.questionnaire_completed_at)
        : row.questionnaire_response_at
          ? String(row.questionnaire_response_at)
          : undefined;
    const baseStage = row.interest_stage ?? undefined;
    const computedStage =
      baseStage === 'qualified' || baseStage === 'not_qualified'
        ? baseStage
        : baseStage === 'questionnaire_completed' || !completedAt
          ? baseStage
          : 'questionnaire_completed';
    return {
    id: row.id ?? '',
    title: row.title ?? '',
    body: row.body ?? '',
    color: row.color ?? '',
    persistence: row.persistence ?? '',
    createdAt: row.created_at ?? '',
    audience: (row.audience ?? 'both') as AlertPayload['audience'],
    status: (row.status ?? 'active') as AlertPayload['status'],
    username: row.username ?? undefined,
    interestStage: (computedStage ?? undefined) as AlertPayload['interestStage'],
    interestName: row.interest_name ?? undefined,
    interestEmail: row.interest_email ?? undefined,
    interestPhone: row.interest_phone ?? undefined,
    interestCity: row.interest_city ?? undefined,
    interestRegion: row.interest_region ?? undefined,
    interestCountry: row.interest_country ?? undefined,
    interestPostalCode: row.interest_postal_code ?? undefined,
    interestStreet1: row.interest_street1 ?? undefined,
    interestStreet2: row.interest_street2 ?? undefined,
    interestBusinessName: row.interest_business_name ?? undefined,
    interestReferral: row.interest_referral ?? undefined,
    interestAbout: row.interest_about ?? undefined,
    callScheduledAt: row.call_scheduled_at ?? undefined,
    questionnaireEmailedAt: row.questionnaire_emailed_at ?? undefined,
    questionnaireToken: row.questionnaire_token ?? undefined,
    questionnaireOpenedAt: row.questionnaire_opened_at ?? undefined,
    questionnaireActiveAt: row.questionnaire_active_at ?? undefined,
    questionnaireCompletedAt: completedAt,
    registrationToken: row.registration_token ?? undefined,
    registrationEmailedAt: row.registration_emailed_at ?? undefined,
    registrationOpenedAt: row.registration_opened_at ?? undefined,
    registrationActiveAt: row.registration_active_at ?? undefined,
    registrationCompletedAt: row.registration_completed_at ?? undefined,
    trainingLastOpenedAt: row.training_last_opened_at ?? undefined,
    trainingUpdatedAt: row.training_updated_at ?? undefined,
    trainingLastSessionSeconds: row.training_last_session_seconds
      ? Number(row.training_last_session_seconds)
      : null,
    qualifiedAt: row.qualified_at ?? undefined,
    notQualifiedAt: row.not_qualified_at ?? undefined,
  };
  });

  const activeRows = db
    .prepare(
      `
        SELECT a.audience, a.sort_order, c.id, c.title, c.body, c.color, c.persistence, c.created_at, c.audience as alert_audience, c.status, c.username,
          c.interest_stage, c.interest_name, c.interest_email, c.interest_phone, c.interest_city, c.interest_region,
          c.interest_country, c.interest_postal_code, c.interest_street1, c.interest_street2, c.interest_business_name,
          c.interest_referral, c.interest_about,
          c.call_scheduled_at, c.questionnaire_emailed_at, c.questionnaire_token, c.questionnaire_opened_at, c.questionnaire_active_at, c.questionnaire_completed_at,
          c.registration_token, c.registration_emailed_at, c.registration_opened_at, c.registration_active_at, c.registration_completed_at,
          c.qualified_at, c.not_qualified_at, tta.last_opened_at as training_last_opened_at, tta.updated_at as training_updated_at, tta.last_session_seconds as training_last_session_seconds,
          qr.submitted_at as questionnaire_response_at
        FROM company_alerts_active a
        JOIN company_alerts c ON c.id = a.alert_id
        LEFT JOIN teachers t ON (
          LOWER(t.email) = LOWER(c.interest_email)
          OR (
            c.username IS NOT NULL
            AND c.username != ''
            AND LOWER(t.username) = LOWER(c.username)
          )
        )
        LEFT JOIN teacher_training_activity tta
          ON LOWER(tta.username) = LOWER(COALESCE(NULLIF(c.username, ''), t.username))
        LEFT JOIN (
          SELECT alert_id, MAX(submitted_at) as submitted_at
          FROM questionnaire_responses
          GROUP BY alert_id
        ) qr ON qr.alert_id = c.id
        ORDER BY a.audience ASC, a.sort_order ASC
      `,
    )
    .all() as Array<Record<string, string | number | null>>;

  const active: AlertStore['active'] = { teacher: [], student: [], company: [] };
  activeRows.forEach(row => {
    const completedAt =
      row.questionnaire_completed_at && String(row.questionnaire_completed_at).trim()
        ? String(row.questionnaire_completed_at)
        : row.questionnaire_response_at
          ? String(row.questionnaire_response_at)
          : undefined;
    const baseStage = row.interest_stage ?? undefined;
    const computedStage =
      baseStage === 'qualified' || baseStage === 'not_qualified'
        ? baseStage
        : baseStage === 'questionnaire_completed' || !completedAt
          ? baseStage
          : 'questionnaire_completed';
    const payload: AlertPayload = {
      id: String(row.id ?? ''),
      title: String(row.title ?? ''),
      body: String(row.body ?? ''),
      color: String(row.color ?? ''),
      persistence: String(row.persistence ?? ''),
      createdAt: String(row.created_at ?? ''),
      audience: (row.alert_audience ?? 'both') as AlertPayload['audience'],
      status: (row.status ?? 'active') as AlertPayload['status'],
      username: row.username ? String(row.username) : undefined,
      interestStage: computedStage
        ? (String(computedStage) as AlertPayload['interestStage'])
        : undefined,
      interestName: row.interest_name ? String(row.interest_name) : undefined,
      interestEmail: row.interest_email ? String(row.interest_email) : undefined,
      interestPhone: row.interest_phone ? String(row.interest_phone) : undefined,
      interestCity: row.interest_city ? String(row.interest_city) : undefined,
      interestRegion: row.interest_region ? String(row.interest_region) : undefined,
      interestCountry: row.interest_country
        ? String(row.interest_country)
        : undefined,
      interestPostalCode: row.interest_postal_code
        ? String(row.interest_postal_code)
        : undefined,
      interestStreet1: row.interest_street1
        ? String(row.interest_street1)
        : undefined,
      interestStreet2: row.interest_street2
        ? String(row.interest_street2)
        : undefined,
      interestBusinessName: row.interest_business_name
        ? String(row.interest_business_name)
        : undefined,
      interestReferral: row.interest_referral
        ? String(row.interest_referral)
        : undefined,
      interestAbout: row.interest_about ? String(row.interest_about) : undefined,
      callScheduledAt: row.call_scheduled_at
        ? String(row.call_scheduled_at)
        : undefined,
      questionnaireEmailedAt: row.questionnaire_emailed_at
        ? String(row.questionnaire_emailed_at)
        : undefined,
      questionnaireToken: row.questionnaire_token
        ? String(row.questionnaire_token)
        : undefined,
      questionnaireOpenedAt: row.questionnaire_opened_at
        ? String(row.questionnaire_opened_at)
        : undefined,
      questionnaireActiveAt: row.questionnaire_active_at
        ? String(row.questionnaire_active_at)
        : undefined,
      questionnaireCompletedAt: completedAt,
      registrationToken: row.registration_token
        ? String(row.registration_token)
        : undefined,
      registrationEmailedAt: row.registration_emailed_at
        ? String(row.registration_emailed_at)
        : undefined,
      registrationOpenedAt: row.registration_opened_at
        ? String(row.registration_opened_at)
        : undefined,
      registrationActiveAt: row.registration_active_at
        ? String(row.registration_active_at)
        : undefined,
      registrationCompletedAt: row.registration_completed_at
        ? String(row.registration_completed_at)
        : undefined,
      trainingLastOpenedAt: row.training_last_opened_at
        ? String(row.training_last_opened_at)
        : undefined,
      trainingUpdatedAt: row.training_updated_at
        ? String(row.training_updated_at)
        : undefined,
      trainingLastSessionSeconds:
        row.training_last_session_seconds !== null &&
        row.training_last_session_seconds !== undefined
          ? Number(row.training_last_session_seconds)
          : null,
      qualifiedAt: row.qualified_at ? String(row.qualified_at) : undefined,
      notQualifiedAt: row.not_qualified_at
        ? String(row.not_qualified_at)
        : undefined,
    };
    if (row.audience === 'teacher') active.teacher?.push(payload);
    if (row.audience === 'student') active.student?.push(payload);
    if (row.audience === 'company') active.company?.push(payload);
  });

  return NextResponse.json({ alerts: { active, history } });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    audience?: 'teacher' | 'student' | 'both' | 'company';
    payload?: AlertPayload;
  };
  if (
    !body?.payload?.id ||
    !body?.payload?.title ||
    !body?.payload?.body ||
    !body?.payload?.color ||
    !body?.payload?.persistence ||
    !body?.payload?.createdAt
  ) {
    return NextResponse.json(
      { error: 'title, body, color, persistence, createdAt are required.' },
      { status: 400 },
    );
  }
  const db = getDb();
  const payload: AlertPayload = {
    ...body.payload,
    audience: body.audience ?? body.payload.audience ?? 'both',
    status: 'active',
  };
  db.prepare(
    `
      INSERT INTO company_alerts (
        id,
        title,
        body,
        color,
        persistence,
        created_at,
        audience,
        status,
        username,
        interest_stage,
        interest_name,
        interest_email,
        interest_phone,
        interest_city,
        interest_region,
        interest_country,
        interest_postal_code,
        interest_street1,
        interest_street2,
        interest_business_name,
        interest_referral,
        interest_about,
        call_scheduled_at,
        questionnaire_emailed_at,
        questionnaire_token,
        questionnaire_opened_at,
        questionnaire_completed_at,
        registration_token,
        registration_emailed_at,
        registration_opened_at,
        registration_active_at,
        registration_completed_at,
        qualified_at,
        not_qualified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        body = excluded.body,
        color = excluded.color,
        persistence = excluded.persistence,
        created_at = excluded.created_at,
        audience = excluded.audience,
        status = excluded.status,
        username = excluded.username,
        interest_stage = excluded.interest_stage,
        interest_name = excluded.interest_name,
        interest_email = excluded.interest_email,
        interest_phone = excluded.interest_phone,
        interest_city = excluded.interest_city,
        interest_region = excluded.interest_region,
        interest_country = excluded.interest_country,
        interest_postal_code = excluded.interest_postal_code,
        interest_street1 = excluded.interest_street1,
        interest_street2 = excluded.interest_street2,
        interest_business_name = excluded.interest_business_name,
        interest_referral = excluded.interest_referral,
        interest_about = excluded.interest_about,
        call_scheduled_at = excluded.call_scheduled_at,
        questionnaire_emailed_at = excluded.questionnaire_emailed_at,
        questionnaire_token = excluded.questionnaire_token,
        questionnaire_opened_at = excluded.questionnaire_opened_at,
        questionnaire_completed_at = excluded.questionnaire_completed_at,
        registration_token = excluded.registration_token,
        registration_emailed_at = excluded.registration_emailed_at,
        registration_opened_at = excluded.registration_opened_at,
        registration_active_at = excluded.registration_active_at,
        registration_completed_at = excluded.registration_completed_at,
        qualified_at = excluded.qualified_at,
        not_qualified_at = excluded.not_qualified_at
    `,
  ).run(
    payload.id,
    payload.title,
    payload.body,
    payload.color,
    payload.persistence,
    payload.createdAt,
    payload.audience,
    payload.status ?? 'active',
    payload.username ?? '',
    payload.interestStage ?? 'new',
    payload.interestName ?? '',
    payload.interestEmail ?? '',
    payload.interestPhone ?? '',
    payload.interestCity ?? '',
    payload.interestRegion ?? '',
    payload.interestCountry ?? '',
    payload.interestPostalCode ?? '',
    payload.interestStreet1 ?? '',
    payload.interestStreet2 ?? '',
    payload.interestBusinessName ?? '',
    payload.interestReferral ?? '',
    payload.interestAbout ?? '',
    payload.callScheduledAt ?? '',
    payload.questionnaireEmailedAt ?? '',
    payload.questionnaireToken ?? '',
    payload.questionnaireOpenedAt ?? '',
    payload.questionnaireCompletedAt ?? '',
    payload.registrationToken ?? '',
    payload.registrationEmailedAt ?? '',
    payload.registrationOpenedAt ?? '',
    payload.registrationActiveAt ?? '',
    payload.registrationCompletedAt ?? '',
    payload.qualifiedAt ?? '',
    payload.notQualifiedAt ?? '',
  );

  const bumpAndInsert = (audience: 'teacher' | 'student' | 'company') => {
    db.prepare(
      `
        DELETE FROM company_alerts_active
        WHERE audience = ? AND alert_id = ?
      `,
    ).run(audience, payload.id);
    db.prepare(
      `
        UPDATE company_alerts_active
        SET sort_order = sort_order + 1
        WHERE audience = ?
      `,
    ).run(audience);
    db.prepare(
      `
        INSERT INTO company_alerts_active (audience, alert_id, sort_order)
        VALUES (?, ?, 0)
      `,
    ).run(audience, payload.id);
  };

  if (body.audience === 'teacher' || body.audience === 'both') {
    bumpAndInsert('teacher');
  }
  if (body.audience === 'student' || body.audience === 'both') {
    bumpAndInsert('student');
  }
  if (body.audience === 'company') {
    bumpAndInsert('company');
  }

  const historyRows = db
    .prepare(
      `
        SELECT c.id, c.title, c.body, c.color, c.persistence, c.created_at, c.audience, c.status, c.username,
          c.interest_stage, c.interest_name, c.interest_email, c.interest_phone, c.interest_city, c.interest_region,
          c.interest_country, c.interest_postal_code, c.interest_street1, c.interest_street2, c.interest_business_name,
          c.interest_referral, c.interest_about,
          c.call_scheduled_at, c.questionnaire_emailed_at, c.questionnaire_token, c.questionnaire_opened_at, c.questionnaire_completed_at,
          c.registration_token, c.registration_emailed_at, c.registration_opened_at, c.registration_active_at, c.registration_completed_at,
          c.qualified_at, c.not_qualified_at,
          qr.submitted_at as questionnaire_response_at
        FROM company_alerts c
        LEFT JOIN (
          SELECT alert_id, MAX(submitted_at) as submitted_at
          FROM questionnaire_responses
          GROUP BY alert_id
        ) qr ON qr.alert_id = c.id
        ORDER BY c.created_at DESC
      `,
    )
    .all() as Array<Record<string, string | null>>;
  const history = historyRows.map(row => {
    const completedAt =
      row.questionnaire_completed_at && String(row.questionnaire_completed_at).trim()
        ? String(row.questionnaire_completed_at)
        : row.questionnaire_response_at
          ? String(row.questionnaire_response_at)
          : undefined;
    const baseStage = row.interest_stage ?? undefined;
    const computedStage =
      baseStage === 'qualified' || baseStage === 'not_qualified'
        ? baseStage
        : baseStage === 'questionnaire_completed' || !completedAt
          ? baseStage
          : 'questionnaire_completed';
    return {
    id: row.id ?? '',
    title: row.title ?? '',
    body: row.body ?? '',
    color: row.color ?? '',
    persistence: row.persistence ?? '',
    createdAt: row.created_at ?? '',
    audience: (row.audience ?? 'both') as AlertPayload['audience'],
    status: (row.status ?? 'active') as AlertPayload['status'],
    username: row.username ?? undefined,
    interestStage: (computedStage ?? undefined) as AlertPayload['interestStage'],
    interestName: row.interest_name ?? undefined,
    interestEmail: row.interest_email ?? undefined,
    interestPhone: row.interest_phone ?? undefined,
    interestCity: row.interest_city ?? undefined,
    interestRegion: row.interest_region ?? undefined,
    interestCountry: row.interest_country ?? undefined,
    interestPostalCode: row.interest_postal_code ?? undefined,
    interestStreet1: row.interest_street1 ?? undefined,
    interestStreet2: row.interest_street2 ?? undefined,
    interestBusinessName: row.interest_business_name ?? undefined,
    interestReferral: row.interest_referral ?? undefined,
    interestAbout: row.interest_about ?? undefined,
    callScheduledAt: row.call_scheduled_at ?? undefined,
    questionnaireEmailedAt: row.questionnaire_emailed_at ?? undefined,
    questionnaireToken: row.questionnaire_token ?? undefined,
    questionnaireOpenedAt: row.questionnaire_opened_at ?? undefined,
    questionnaireCompletedAt: completedAt,
    registrationToken: row.registration_token ?? undefined,
    registrationEmailedAt: row.registration_emailed_at ?? undefined,
    registrationOpenedAt: row.registration_opened_at ?? undefined,
    registrationActiveAt: row.registration_active_at ?? undefined,
    registrationCompletedAt: row.registration_completed_at ?? undefined,
    qualifiedAt: row.qualified_at ?? undefined,
    notQualifiedAt: row.not_qualified_at ?? undefined,
  };
  });

  const activeRows = db
    .prepare(
      `
        SELECT a.audience, a.sort_order, c.id, c.title, c.body, c.color, c.persistence, c.created_at, c.audience as alert_audience, c.status, c.username,
          c.interest_stage, c.interest_name, c.interest_email, c.interest_phone, c.interest_city, c.interest_region,
          c.interest_country, c.interest_postal_code, c.interest_street1, c.interest_street2, c.interest_business_name,
          c.interest_referral, c.interest_about,
          c.call_scheduled_at, c.questionnaire_emailed_at, c.questionnaire_token, c.questionnaire_opened_at, c.questionnaire_completed_at,
          c.registration_token, c.registration_emailed_at, c.registration_opened_at, c.registration_active_at, c.registration_completed_at,
          c.qualified_at, c.not_qualified_at,
          qr.submitted_at as questionnaire_response_at
        FROM company_alerts_active a
        JOIN company_alerts c ON c.id = a.alert_id
        LEFT JOIN (
          SELECT alert_id, MAX(submitted_at) as submitted_at
          FROM questionnaire_responses
          GROUP BY alert_id
        ) qr ON qr.alert_id = c.id
        ORDER BY a.audience ASC, a.sort_order ASC
      `,
    )
    .all() as Array<Record<string, string | number | null>>;
  const active: AlertStore['active'] = { teacher: [], student: [], company: [] };
  activeRows.forEach(row => {
    const completedAt =
      row.questionnaire_completed_at && String(row.questionnaire_completed_at).trim()
        ? String(row.questionnaire_completed_at)
        : row.questionnaire_response_at
          ? String(row.questionnaire_response_at)
          : undefined;
    const baseStage = row.interest_stage ?? undefined;
    const computedStage =
      baseStage === 'qualified' || baseStage === 'not_qualified'
        ? baseStage
        : baseStage === 'questionnaire_completed' || !completedAt
          ? baseStage
          : 'questionnaire_completed';
    const nextPayload: AlertPayload = {
      id: String(row.id ?? ''),
      title: String(row.title ?? ''),
      body: String(row.body ?? ''),
      color: String(row.color ?? ''),
      persistence: String(row.persistence ?? ''),
      createdAt: String(row.created_at ?? ''),
      audience: (row.alert_audience ?? 'both') as AlertPayload['audience'],
      status: (row.status ?? 'active') as AlertPayload['status'],
      username: row.username ? String(row.username) : undefined,
      interestStage: computedStage
        ? (String(computedStage) as AlertPayload['interestStage'])
        : undefined,
      interestName: row.interest_name ? String(row.interest_name) : undefined,
      interestEmail: row.interest_email ? String(row.interest_email) : undefined,
      interestPhone: row.interest_phone ? String(row.interest_phone) : undefined,
      interestCity: row.interest_city ? String(row.interest_city) : undefined,
      interestRegion: row.interest_region ? String(row.interest_region) : undefined,
      interestCountry: row.interest_country
        ? String(row.interest_country)
        : undefined,
      interestPostalCode: row.interest_postal_code
        ? String(row.interest_postal_code)
        : undefined,
      interestStreet1: row.interest_street1
        ? String(row.interest_street1)
        : undefined,
      interestStreet2: row.interest_street2
        ? String(row.interest_street2)
        : undefined,
      interestBusinessName: row.interest_business_name
        ? String(row.interest_business_name)
        : undefined,
      interestReferral: row.interest_referral
        ? String(row.interest_referral)
        : undefined,
      interestAbout: row.interest_about ? String(row.interest_about) : undefined,
      callScheduledAt: row.call_scheduled_at
        ? String(row.call_scheduled_at)
        : undefined,
      questionnaireEmailedAt: row.questionnaire_emailed_at
        ? String(row.questionnaire_emailed_at)
        : undefined,
      questionnaireToken: row.questionnaire_token
        ? String(row.questionnaire_token)
        : undefined,
      questionnaireOpenedAt: row.questionnaire_opened_at
        ? String(row.questionnaire_opened_at)
        : undefined,
      questionnaireCompletedAt: completedAt,
      registrationToken: row.registration_token
        ? String(row.registration_token)
        : undefined,
      registrationEmailedAt: row.registration_emailed_at
        ? String(row.registration_emailed_at)
        : undefined,
      registrationOpenedAt: row.registration_opened_at
        ? String(row.registration_opened_at)
        : undefined,
      registrationActiveAt: row.registration_active_at
        ? String(row.registration_active_at)
        : undefined,
      registrationCompletedAt: row.registration_completed_at
        ? String(row.registration_completed_at)
        : undefined,
      qualifiedAt: row.qualified_at ? String(row.qualified_at) : undefined,
      notQualifiedAt: row.not_qualified_at
        ? String(row.not_qualified_at)
        : undefined,
    };
    if (row.audience === 'teacher') active.teacher?.push(nextPayload);
    if (row.audience === 'student') active.student?.push(nextPayload);
    if (row.audience === 'company') active.company?.push(nextPayload);
  });

  return NextResponse.json({ alerts: { active, history } });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const audience = searchParams.get('audience');
  const id = searchParams.get('id');
  const db = getDb();
  if (id) {
    db.prepare(
      `
        UPDATE company_alerts
        SET status = 'removed'
        WHERE id = ?
      `,
    ).run(id);
    db.prepare(
      `
        DELETE FROM company_alerts_active
        WHERE alert_id = ?
      `,
    ).run(id);
  } else if (audience) {
    if (audience === 'teacher') {
      db.prepare(`DELETE FROM company_alerts_active WHERE audience = 'teacher'`).run();
    }
    if (audience === 'student') {
      db.prepare(`DELETE FROM company_alerts_active WHERE audience = 'student'`).run();
    }
    if (audience === 'company') {
      db.prepare(`DELETE FROM company_alerts_active WHERE audience = 'company'`).run();
    }
    if (audience === 'both') {
      db.prepare(`DELETE FROM company_alerts_active WHERE audience IN ('teacher', 'student')`).run();
    }
  } else {
    return NextResponse.json({ error: 'audience or id required.' }, { status: 400 });
  }

  const historyRows = db
    .prepare(
      `
        SELECT id, title, body, color, persistence, created_at, audience, status, username
        FROM company_alerts
        ORDER BY created_at DESC
      `,
    )
    .all() as Array<Record<string, string | null>>;
  const history = historyRows.map(row => ({
    id: row.id ?? '',
    title: row.title ?? '',
    body: row.body ?? '',
    color: row.color ?? '',
    persistence: row.persistence ?? '',
    createdAt: row.created_at ?? '',
    audience: (row.audience ?? 'both') as AlertPayload['audience'],
    status: (row.status ?? 'active') as AlertPayload['status'],
    username: row.username ?? undefined,
  }));
  const activeRows = db
    .prepare(
      `
        SELECT a.audience, a.sort_order, c.id, c.title, c.body, c.color, c.persistence, c.created_at, c.audience as alert_audience, c.status, c.username
        FROM company_alerts_active a
        JOIN company_alerts c ON c.id = a.alert_id
        ORDER BY a.audience ASC, a.sort_order ASC
      `,
    )
    .all() as Array<Record<string, string | number | null>>;
  const active: AlertStore['active'] = { teacher: [], student: [], company: [] };
  activeRows.forEach(row => {
    const nextPayload: AlertPayload = {
      id: String(row.id ?? ''),
      title: String(row.title ?? ''),
      body: String(row.body ?? ''),
      color: String(row.color ?? ''),
      persistence: String(row.persistence ?? ''),
      createdAt: String(row.created_at ?? ''),
      audience: (row.alert_audience ?? 'both') as AlertPayload['audience'],
      status: (row.status ?? 'active') as AlertPayload['status'],
      username: row.username ? String(row.username) : undefined,
    };
    if (row.audience === 'teacher') active.teacher?.push(nextPayload);
    if (row.audience === 'student') active.student?.push(nextPayload);
    if (row.audience === 'company') active.company?.push(nextPayload);
  });

  return NextResponse.json({ alerts: { active, history } });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id?: string;
    interestStage?:
      | 'new'
      | 'call_scheduled'
      | 'questionnaire_sent'
      | 'questionnaire_opened'
      | 'questionnaire_completed'
      | 'qualified'
      | 'not_qualified';
    action?: 'send_questionnaire' | 'mark_qualified' | 'mark_not_qualified';
  };
  if (!body?.id) {
    return NextResponse.json({ error: 'id is required.' }, { status: 400 });
  }
  const db = getDb();
  const now = new Date().toISOString();

  if (body.action === 'send_questionnaire') {
    const alert = db
      .prepare(
        `
        SELECT id, interest_name, interest_email, questionnaire_token
        FROM company_alerts
        WHERE id = ?
      `,
      )
      .get(body.id) as
      | {
          id: string;
          interest_name?: string;
          interest_email?: string;
          questionnaire_token?: string;
        }
      | undefined;
    if (!alert?.id) {
      return NextResponse.json({ error: 'Alert not found.' }, { status: 404 });
    }
    const token = alert.questionnaire_token || randomUUID();
    db.prepare(
      `
        UPDATE company_alerts
        SET
          interest_stage = 'questionnaire_sent',
          questionnaire_emailed_at = ?,
          questionnaire_token = ?
        WHERE id = ?
      `,
    ).run(now, token, body.id);

    const name = alert.interest_name || 'there';
    const email = alert.interest_email || '';
    const link = `http://localhost:3000/questionnaire?token=${token}`;
    const bodyText = `Hi ${name},\n\nThanks again for your interest in Simply Music. Please complete your teacher questionnaire here:\n${link}\n\nIf you have any questions, just reply to this email.`;
    const messageData = JSON.stringify({ alertId: alert.id });
    db.prepare(
      `
        INSERT INTO notification_events (
          id,
          type,
          to_value,
          source,
          subject,
          title,
          body,
          data_json,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      randomUUID(),
      'email',
      email,
      'Teacher Interest',
      'Simply Music Teacher Questionnaire',
      '',
      bodyText,
      messageData,
      'sent',
      now,
    );
    db.prepare(
      `
        INSERT INTO notification_events (
          id,
          type,
          to_value,
          source,
          subject,
          title,
          body,
          data_json,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      randomUUID(),
      'push',
      'neil@simplymusic.com',
      'Teacher Interest',
      '',
      'Teacher Questionnaire Sent',
      `${name} was sent the teacher questionnaire.`,
      messageData,
      'sent',
      now,
    );

    return NextResponse.json({ ok: true, token });
  }

  if (body.action === 'mark_qualified') {
    const alert = db
      .prepare(
        `
        SELECT interest_name, interest_email, registration_token
        FROM company_alerts
        WHERE id = ?
      `,
      )
      .get(body.id) as
      | { interest_name?: string; interest_email?: string; registration_token?: string }
      | undefined;
    const token = alert?.registration_token || randomUUID();
    db.prepare(
      `
        UPDATE company_alerts
        SET
          interest_stage = 'qualified',
          qualified_at = ?,
          registration_token = ?,
          registration_emailed_at = ?
        WHERE id = ?
      `,
    ).run(now, token, now, body.id);
    if (alert?.interest_email) {
      const link = `http://localhost:3000/teacher-registration?token=${token}`;
      const bodyText = `Hi ${alert.interest_name ?? 'there'},\n\nGreat news! You’ve been approved to continue. Please complete your registration here:\n${link}\n\nIf you have any questions, just reply to this email.`;
      const messageData = JSON.stringify({
        alertId: body.id,
        registrationToken: token,
      });
      db.prepare(
        `
          INSERT INTO notification_events (
            id,
            type,
            to_value,
            source,
            subject,
            title,
            body,
            data_json,
            status,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      ).run(
      randomUUID(),
        'email',
        alert.interest_email,
        'Teacher Registration',
        'Complete Your Simply Music Registration',
        '',
        bodyText,
        messageData,
        'sent',
        now,
      );
      db.prepare(
        `
          INSERT INTO notification_events (
            id,
            type,
            to_value,
            source,
            subject,
            title,
            body,
            data_json,
            status,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      ).run(
        randomUUID(),
        'push',
        'neil@simplymusic.com',
        'Teacher Registration',
        '',
        'Teacher Registration Sent',
        `${alert.interest_name ?? 'A teacher'} was sent the registration link.`,
        messageData,
        'sent',
        now,
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'mark_not_qualified') {
    db.prepare(
      `
        UPDATE company_alerts
        SET
          interest_stage = 'not_qualified',
          not_qualified_at = ?
        WHERE id = ?
      `,
    ).run(now, body.id);
    return NextResponse.json({ ok: true });
  }

  if (!body?.interestStage) {
    return NextResponse.json(
      { error: 'interestStage or action is required.' },
      { status: 400 },
    );
  }

  const next = {
    callScheduledAt: body.interestStage === 'call_scheduled' ? now : null,
    questionnaireEmailedAt:
      body.interestStage === 'questionnaire_sent' ? now : null,
    questionnaireOpenedAt:
      body.interestStage === 'questionnaire_opened' ? now : null,
    notQualifiedAt: body.interestStage === 'not_qualified' ? now : null,
  };
  db.prepare(
    `
      UPDATE company_alerts
      SET
        interest_stage = ?,
        call_scheduled_at = COALESCE(?, call_scheduled_at),
        questionnaire_emailed_at = COALESCE(?, questionnaire_emailed_at),
        questionnaire_opened_at = COALESCE(?, questionnaire_opened_at),
        not_qualified_at = COALESCE(?, not_qualified_at)
      WHERE id = ?
    `,
  ).run(
    body.interestStage,
    next.callScheduledAt,
    next.questionnaireEmailedAt,
    next.questionnaireOpenedAt,
    next.notQualifiedAt,
    body.id,
  );

  return NextResponse.json({ ok: true });
}
