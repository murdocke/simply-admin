'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

function TimeBadge({ label, timeZone }: { label: string; timeZone: string }) {
  const [now, setNow] = useState(() => new Date());
  const time = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
      }).format(now),
    [now, timeZone],
  );
  const date = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(now),
    [now, timeZone],
  );

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3 shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
        {time}
      </p>
      <p className="mt-1 text-xs text-[var(--c-6f6c65)]">{date}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const activeTeachers = 845;
  const activeStudents = activeTeachers * 27;
  const monthlyRoyaltiesDue = activeStudents * 9;
  const newStudentsThisMonth = 612;
  const outstandingPayments = 18420;
  const upcomingLessons = 1284;
  const curriculumIncomeTeachers = 26850;
  const curriculumIncomeStudents = 19440;
  const regionsCovered = 14;
  const churnRate = 3.2;
  const avgLessonsPerStudent = 4.6;
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [promoTitle, setPromoTitle] = useState('Quick Studio Update');
  const [promoBody, setPromoBody] = useState(
    'New practice tips are live in your dashboard. Check them out before your next lesson.',
  );
  const [promoCta, setPromoCta] = useState('GOT IT');
  const [promoAudience, setPromoAudience] = useState('both');
  const [promoTrigger, setPromoTrigger] = useState('dashboard');
  const [alertTitle, setAlertTitle] = useState('Important Reminder');
  const [alertBody, setAlertBody] = useState(
    'Please review the latest studio update before your next lesson.',
  );
  const [alertAudience, setAlertAudience] = useState('both');
  const [alertColor, setAlertColor] = useState('warning');
  const [alertPersistence, setAlertPersistence] = useState('persist');
  const [isPromoHistoryOpen, setIsPromoHistoryOpen] = useState(false);
  const [isAlertHistoryOpen, setIsAlertHistoryOpen] = useState(false);
  const [promoHistory, setPromoHistory] = useState<
    {
      id: string;
      title: string;
      body: string;
      cta?: string;
      trigger: string;
      createdAt: string;
      audience: string;
      status?: string;
    }[]
  >([]);
  const [alertHistory, setAlertHistory] = useState<
    {
      id: string;
      title: string;
      body: string;
      color: string;
      persistence: string;
      createdAt: string;
      audience: string;
      status?: string;
    }[]
  >([]);
  const [promoSearch, setPromoSearch] = useState('');
  const [alertSearch, setAlertSearch] = useState('');
  const [companyAlerts, setCompanyAlerts] = useState<
    {
      id?: string;
      title: string;
      body: string;
      color?: string;
      persistence?: string;
      createdAt?: string;
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
      questionnaireOpenedAt?: string;
      questionnaireActiveAt?: string;
      questionnaireCompletedAt?: string;
      registrationEmailedAt?: string;
      registrationOpenedAt?: string;
      registrationActiveAt?: string;
      registrationCompletedAt?: string;
    }[]
  >([]);
  const [companyAlertsLoading, setCompanyAlertsLoading] = useState(false);
  const [callScheduledMap, setCallScheduledMap] = useState<Record<string, boolean>>({});
  const [expandedQuestionnaires, setExpandedQuestionnaires] = useState<
    Record<string, boolean>
  >({});
  const [liveStatusTopMap, setLiveStatusTopMap] = useState<Record<string, number>>(
    {},
  );
  const [questionnaireDetails, setQuestionnaireDetails] = useState<
    Record<
      string,
      {
        loading: boolean;
        payload: Record<string, unknown> | null;
        submittedAt: string | null;
      }
    >
  >({});

  const toggleQuestionnaireDetails = useCallback(
    async (alertId: string) => {
      setExpandedQuestionnaires(current => ({
        ...current,
        [alertId]: !current[alertId],
      }));
      setQuestionnaireDetails(current => {
        if (current[alertId]) return current;
        return {
          ...current,
          [alertId]: { loading: true, payload: null, submittedAt: null },
        };
      });
      try {
        const response = await fetch(
          `/api/questionnaire?alertId=${encodeURIComponent(alertId)}`,
          { cache: 'no-store' },
        );
        if (!response.ok) return;
        const data = (await response.json()) as {
          payload?: Record<string, unknown> | null;
          submittedAt?: string | null;
        };
        setQuestionnaireDetails(current => ({
          ...current,
          [alertId]: {
            loading: false,
            payload: data.payload ?? null,
            submittedAt: data.submittedAt ?? null,
          },
        }));
      } catch {
        setQuestionnaireDetails(current => ({
          ...current,
          [alertId]: { loading: false, payload: null, submittedAt: null },
        }));
      }
    },
    [],
  );

  const loadCompanyAlerts = useCallback(async () => {
    setCompanyAlertsLoading(true);
    try {
      const response = await fetch('/api/company-alerts', { cache: 'no-store' });
      if (!response.ok) {
        setCompanyAlerts([]);
        return;
      }
      const data = (await response.json()) as {
        alerts?: { active?: { company?: typeof companyAlerts } };
      };
      const rawAlerts = data.alerts?.active?.company ?? [];
      const normalized = Array.isArray(rawAlerts) ? rawAlerts : [rawAlerts];
      setCompanyAlerts(
        normalized
          .filter(alert => alert?.title && alert?.body)
          .sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          }),
      );
    } catch {
      setCompanyAlerts([]);
    } finally {
      setCompanyAlertsLoading(false);
    }
  }, []);

  const renderInterestBody = (body: string) => {
    const divider = ' requested info about teaching Simply Music. ';
    if (!body.includes(divider)) {
    return <p className="mt-2 text-lg">{body}</p>;
  }
    const [name, rest] = body.split(divider);
    const parts = rest.split(' · ');
    const email = parts[0] ?? '';
    const phone = parts[1] ?? '';
    const location = parts.slice(2).join(' · ');
    return (
      <p className="mt-2 text-lg">
        <span className="font-semibold">{name}</span>
        {divider}
        <span className="font-semibold">{email}</span>
        {phone ? (
          <>
            {' '}
            · <span className="font-semibold">{phone}</span>
          </>
        ) : null}
        {location ? ` · ${location}` : null}
      </p>
    );
  };

  const writePromoPayload = () => {
    const payload = {
      id: crypto.randomUUID(),
      title: promoTitle.trim(),
      body: promoBody.trim(),
      cta: promoCta.trim() || 'GOT IT',
      trigger: promoTrigger,
      createdAt: new Date().toISOString(),
      audience: promoAudience,
    };
    if (!payload.title || !payload.body) return;
    if (promoAudience === 'teacher' || promoAudience === 'both') {
      window.localStorage.setItem('sm_company_promo_teacher', JSON.stringify(payload));
    }
    if (promoAudience === 'student' || promoAudience === 'both') {
      window.localStorage.setItem('sm_company_promo_student', JSON.stringify(payload));
    }
    void fetch('/api/company-promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audience: promoAudience, payload }),
    });
    setIsPromoOpen(false);
  };

  const writeAlertPayload = () => {
    const payload = {
      id: crypto.randomUUID(),
      title: alertTitle.trim(),
      body: alertBody.trim(),
      color: alertColor,
      persistence: alertPersistence,
      createdAt: new Date().toISOString(),
      audience: alertAudience,
    };
    if (!payload.title || !payload.body) return;
    if (alertAudience === 'teacher' || alertAudience === 'both') {
      try {
        const stored = window.localStorage.getItem('sm_company_alert_teacher');
        const existing = stored
          ? (Array.isArray(JSON.parse(stored)) ? JSON.parse(stored) : [JSON.parse(stored)])
          : [];
        window.localStorage.setItem(
          'sm_company_alert_teacher',
          JSON.stringify([payload, ...existing]),
        );
      } catch {
        window.localStorage.setItem('sm_company_alert_teacher', JSON.stringify(payload));
      }
    }
    if (alertAudience === 'student' || alertAudience === 'both') {
      try {
        const stored = window.localStorage.getItem('sm_company_alert_student');
        const existing = stored
          ? (Array.isArray(JSON.parse(stored)) ? JSON.parse(stored) : [JSON.parse(stored)])
          : [];
        window.localStorage.setItem(
          'sm_company_alert_student',
          JSON.stringify([payload, ...existing]),
        );
      } catch {
        window.localStorage.setItem('sm_company_alert_student', JSON.stringify(payload));
      }
    }
    void fetch('/api/company-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audience: alertAudience, payload }),
    });
    setIsAlertOpen(false);
  };

  const loadPromoHistory = async () => {
    try {
      const response = await fetch('/api/company-promos', { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as {
        promos?: { history?: typeof promoHistory };
      };
      setPromoHistory(data.promos?.history ?? []);
    } catch {
      setPromoHistory([]);
    }
  };

  const loadAlertHistory = async () => {
    try {
      const response = await fetch('/api/company-alerts', { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as {
        alerts?: { history?: typeof alertHistory };
      };
      setAlertHistory(data.alerts?.history ?? []);
    } catch {
      setAlertHistory([]);
    }
  };

  const handleRemovePromo = async (id: string) => {
    await fetch(`/api/company-promos?id=${id}`, { method: 'DELETE' });
    await loadPromoHistory();
    try {
      const channel = new BroadcastChannel('sm-company-promos');
      channel.postMessage({ type: 'promo-removed', id });
      channel.close();
    } catch {
      // ignore
    }
  };

  const handleRemoveAlert = async (id: string) => {
    await fetch(`/api/company-alerts?id=${id}`, { method: 'DELETE' });
    await loadAlertHistory();
    try {
      const channel = new BroadcastChannel('sm-company-alerts');
      channel.postMessage({ type: 'alert-removed', id });
      channel.close();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (!isActive) return;
      await loadCompanyAlerts();
    };
    void load();
    const interval = window.setInterval(load, 15000);
    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, [loadCompanyAlerts]);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('sm-company-alerts');
      channel.onmessage = event => {
        if (event?.data?.type === 'alert-added') {
          void loadCompanyAlerts();
        }
        if (event?.data?.type === 'alert-removed') {
          const removedId = event?.data?.id as string | undefined;
          if (removedId) {
            setCompanyAlerts(current => current.filter(item => item.id !== removedId));
          } else {
            void loadCompanyAlerts();
          }
        }
        if (event?.data?.type === 'alert-updated') {
          void loadCompanyAlerts();
        }
      };
    } catch {
      channel = null;
    }
    return () => {
      channel?.close();
    };
  }, [loadCompanyAlerts]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadCompanyAlerts();
    }, 12000);
    return () => clearInterval(interval);
  }, [loadCompanyAlerts]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Overview
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Choose a workspace to jump into a focused view.
          </p>
        </div>
        <div className="w-full rounded-3xl border border-[var(--c-ecebe7)] bg-[linear-gradient(135deg,var(--c-ffffff),var(--c-f7f7f5))] p-4 shadow-sm md:w-auto">
          <div className="grid gap-3 sm:grid-cols-2">
            <TimeBadge label="Melbourne" timeZone="Australia/Melbourne" />
            <TimeBadge label="Sacramento" timeZone="America/Los_Angeles" />
          </div>
        </div>
      </div>

      {companyAlerts.length > 0 ? (
        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Teacher Interest Alerts
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                New Teacher Submissions
              </h2>
            </div>
            <div />
          </div>

          <div className="mt-4 grid gap-3">
            {companyAlerts.map((alert, index) => {
              const alertKey = alert.id ?? `${alert.title}-${alert.body}-${index}`;
              const isQuestionnaireStage =
                alert.interestStage === 'questionnaire_sent' ||
                alert.interestStage === 'questionnaire_opened' ||
                alert.interestStage === 'questionnaire_completed' ||
                alert.interestStage === 'qualified' ||
                alert.interestStage === 'not_qualified';
              const isScheduled =
                alert.interestStage === 'call_scheduled' ||
                isQuestionnaireStage ||
                callScheduledMap[alertKey];
              const registrationEmailedAt = alert.registrationEmailedAt
                ? new Date(alert.registrationEmailedAt)
                : null;
              const registrationOpenedAt = alert.registrationOpenedAt
                ? new Date(alert.registrationOpenedAt)
                : null;
              const registrationActiveAt = alert.registrationActiveAt
                ? new Date(alert.registrationActiveAt)
                : null;
              const registrationCompletedAt = alert.registrationCompletedAt
                ? new Date(alert.registrationCompletedAt)
                : null;
              const isRegistrationActive = registrationActiveAt
                ? Date.now() - registrationActiveAt.getTime() < 30 * 1000
                : false;
              const registrationStatus = registrationCompletedAt
                ? 'Registration Completed'
                : isRegistrationActive
                  ? 'Registration In Progress'
                  : registrationOpenedAt
                    ? 'Registration Opened'
                    : registrationEmailedAt || alert.interestStage === 'qualified'
                      ? 'Registration Sent'
                      : null;
              const questionnaireOpenedAt = alert.questionnaireOpenedAt
                ? new Date(alert.questionnaireOpenedAt)
                : null;
              const questionnaireActiveAt = alert.questionnaireActiveAt
                ? new Date(alert.questionnaireActiveAt)
                : null;
              const questionnaireCompletedAt = alert.questionnaireCompletedAt
                ? new Date(alert.questionnaireCompletedAt)
                : null;
              const isQuestionnaireActive = questionnaireActiveAt
                ? Date.now() - questionnaireActiveAt.getTime() < 30 * 1000
                : false;
              const questionnaireStatus =
                alert.interestStage === 'questionnaire_completed' ||
                questionnaireCompletedAt
                  ? 'Questionnaire Completed'
                  : alert.interestStage === 'questionnaire_opened' ||
                      questionnaireOpenedAt
                    ? 'Questionnaire In Progress'
                    : alert.interestStage === 'questionnaire_sent'
                      ? 'Questionnaire Sent'
                      : null;
              const showRegistration = alert.interestStage === 'qualified';
              const liveStatus = showRegistration ? registrationStatus : questionnaireStatus;
              const liveOpenedAt = showRegistration
                ? registrationOpenedAt
                : questionnaireOpenedAt;
              const liveCompletedAt = showRegistration
                ? registrationCompletedAt
                : questionnaireCompletedAt;
              const liveActive = showRegistration ? isRegistrationActive : isQuestionnaireActive;
              const isQuestionnaireComplete =
                alert.interestStage === 'questionnaire_completed' ||
                Boolean(questionnaireCompletedAt);
              return (
                <div
                  key={alertKey}
                  className={`relative rounded-2xl border px-5 py-4 text-sm text-white shadow-[0_12px_30px_-24px_rgba(0,0,0,0.35)] ${
                    isQuestionnaireStage
                      ? 'border-[#1f7a3f] bg-[#1f7a3f]'
                      : isScheduled
                        ? 'border-[#d97706] bg-[#d97706]'
                        : 'border-[var(--c-c8102e)] bg-[var(--c-c8102e)]'
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!alert.id) return;
                    router.push(`/teacher-interest?alertId=${alert.id}`);
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      if (!alert.id) return;
                      router.push(`/teacher-interest?alertId=${alert.id}`);
                    }
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                      {alert.title}
                    </p>
                    <span className="text-xs uppercase tracking-[0.2em] opacity-70">
                      {alert.createdAt
                        ? new Date(alert.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'Just now'}
                    </span>
                  </div>
                  <div className="text-lg">
                    {renderInterestBody(alert.body)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        alert.id
                          ? fetch('/api/company-alerts', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                id: alert.id,
                                interestStage: 'call_scheduled',
                              }),
                            }).then(() => loadCompanyAlerts())
                          : setCallScheduledMap(current => ({
                              ...current,
                              [alertKey]: true,
                            }));
                      }}
                      disabled={isScheduled}
                      className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                        isScheduled
                          ? 'border-white/40 bg-white/15 text-white/70'
                          : 'border-white bg-white text-[var(--c-c8102e)] hover:bg-white/90'
                      }`}
                    >
                      {isScheduled ? '✓ Call Scheduled' : 'Call Scheduled'}
                    </button>
                    {alert.interestStage === 'call_scheduled' ||
                    alert.interestStage === 'questionnaire_sent' ||
                    alert.interestStage === 'questionnaire_opened' ||
                    alert.interestStage === 'questionnaire_completed' ||
                    alert.interestStage === 'qualified' ||
                    alert.interestStage === 'not_qualified' ? (
                      <>
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation();
                            if (!alert.id) return;
                            if (isQuestionnaireComplete) {
                              void toggleQuestionnaireDetails(alert.id);
                              return;
                            }
                            void fetch('/api/company-alerts', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                id: alert.id,
                                action: 'send_questionnaire',
                              }),
                            }).then(() => loadCompanyAlerts());
                          }}
                          disabled={
                            alert.interestStage === 'questionnaire_sent' ||
                            alert.interestStage === 'questionnaire_opened' ||
                            (!isQuestionnaireComplete &&
                              (alert.interestStage === 'qualified' ||
                                alert.interestStage === 'not_qualified'))
                          }
                          className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                            alert.interestStage === 'questionnaire_sent' ||
                            alert.interestStage === 'questionnaire_opened' ||
                            alert.interestStage === 'questionnaire_completed' ||
                            alert.interestStage === 'qualified' ||
                            alert.interestStage === 'not_qualified'
                              ? 'border-white/40 bg-white/15 text-white/70'
                              : 'border-white/60 bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {isQuestionnaireComplete
                            ? `✓ Questionnaire Complete ${
                                expandedQuestionnaires[alert.id ?? '']
                                  ? '▴'
                                  : '▾'
                              }`
                            : alert.interestStage === 'questionnaire_sent' ||
                                alert.interestStage === 'questionnaire_opened' ||
                                alert.interestStage === 'qualified' ||
                                alert.interestStage === 'not_qualified'
                              ? '✓ Email The Questionnaire'
                              : 'Email The Questionnaire'}
                        </button>
                        {alert.interestStage === 'questionnaire_sent' ||
                        alert.interestStage === 'questionnaire_opened' ||
                        alert.interestStage === 'questionnaire_completed' ||
                        alert.interestStage === 'qualified' ? (
                          <button
                            type="button"
                            onClick={event => {
                              event.stopPropagation();
                              alert.id
                                ? fetch('/api/company-alerts', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      id: alert.id,
                                      action: 'mark_qualified',
                                    }),
                                  }).then(() => loadCompanyAlerts())
                                : null;
                            }}
                            disabled={alert.interestStage === 'qualified'}
                            className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                              alert.interestStage === 'qualified'
                                ? 'border-white/40 bg-white/15 text-white/70'
                                : 'border-white/60 bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            {alert.interestStage === 'qualified'
                              ? '✓ Registration Sent'
                              : 'Teacher Qualified'}
                          </button>
                        ) : null}
                        {alert.interestStage === 'not_qualified' ? (
                          <button
                            type="button"
                            disabled
                            className="rounded-full border border-white/40 bg-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70"
                          >
                            ✓ Not Qualified
                          </button>
                        ) : alert.interestStage !== 'qualified' ? (
                          <button
                            type="button"
                            onClick={event => {
                              event.stopPropagation();
                              alert.id
                                ? fetch('/api/company-alerts', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      id: alert.id,
                                      action: 'mark_not_qualified',
                                    }),
                                  }).then(() => loadCompanyAlerts())
                                : null;
                            }}
                            className="rounded-full border border-white/60 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/20"
                          >
                            Not Qualified
                          </button>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                  {liveStatus || liveActive ? (
                    <div
                      ref={node => {
                        if (!node) return;
                        if (liveStatusTopMap[alertKey] !== undefined) return;
                        const parent = node.offsetParent as HTMLElement | null;
                        if (!parent) return;
                        const nodeRect = node.getBoundingClientRect();
                        const parentRect = parent.getBoundingClientRect();
                        const center =
                          nodeRect.top + nodeRect.height / 2 - parentRect.top;
                        setLiveStatusTopMap(current => ({
                          ...current,
                          [alertKey]: center,
                        }));
                      }}
                      className="pointer-events-none absolute right-4 top-1/2 z-20 w-[310px] -translate-y-1/2 rounded-2xl border border-white/25 bg-white/10 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85 shadow-[0_12px_28px_-18px_rgba(0,0,0,0.6)] backdrop-blur-sm"
                      style={
                        liveStatusTopMap[alertKey] !== undefined
                          ? { top: liveStatusTopMap[alertKey] }
                          : undefined
                      }
                    >
                      <div className="text-[10px] uppercase tracking-[0.28em] text-white/60">
                        Live Status
                      </div>
                      <div className="mt-2 space-y-2">
                        {liveStatus ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-2 w-2 rounded-full bg-white/80" />
                            <span>{liveStatus}</span>
                          </div>
                        ) : null}
                        {liveOpenedAt ? (
                          <div className="text-white/65">
                            Last opened{' '}
                            {liveOpenedAt.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        ) : null}
                        {liveCompletedAt ? (
                          <div className="text-white/65">
                            Completed{' '}
                            {liveCompletedAt.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        ) : null}
                        {liveActive ? (
                          <div className="flex items-center gap-2 text-white/80">
                            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                              <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-white/60" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                            </span>
                            Currently Active
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {alert.id &&
                  isQuestionnaireComplete &&
                  expandedQuestionnaires[alert.id] ? (
                    <div className="mt-4 rounded-2xl border border-white/25 bg-white/15 p-4 text-sm text-white/85">
                      {questionnaireDetails[alert.id]?.loading ? (
                        <p className="text-white/60">Loading questionnaire answers…</p>
                      ) : questionnaireDetails[alert.id]?.payload ? (
                        <div className="space-y-3">
                          {questionnaireDetails[alert.id]?.submittedAt ? (
                            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                              Submitted{' '}
                              {new Date(
                                questionnaireDetails[alert.id]?.submittedAt ?? '',
                              ).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          ) : null}
                          {Object.entries(
                            questionnaireDetails[alert.id]?.payload ?? {},
                          ).map(([key, value]) => (
                            <div key={key} className="rounded-xl border border-white/10 bg-white/5 p-3">
                              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </p>
                              <p className="mt-1 text-white/85">
                                {String(value || '—')}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/60">No questionnaire answers yet.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            label: 'Total Active Students',
            value: activeStudents.toLocaleString('en-US'),
            note: 'Currently enrolled and billing.',
          },
          {
            label: 'New Students This Month',
            value: newStudentsThisMonth.toLocaleString('en-US'),
            note: 'First-time activations in the last 30 days.',
          },
          {
            label: 'Active Teachers',
            value: activeTeachers.toLocaleString('en-US'),
            note: 'Teaching in the network right now.',
          },
          {
            label: 'Monthly Revenue',
            value: `$${monthlyRoyaltiesDue.toLocaleString('en-US')}`,
            note: 'Projected subscriptions for this month.',
          },
          {
            label: 'Curriculum Income (Teachers)',
            value: `$${curriculumIncomeTeachers.toLocaleString('en-US')}`,
            note: 'Teacher purchases this month.',
            href: '/company/orders',
          },
          {
            label: 'Curriculum Income (Students)',
            value: `$${curriculumIncomeStudents.toLocaleString('en-US')}`,
            note: 'Student purchases this month.',
            href: '/company/orders',
          },
          {
            label: 'Outstanding Payments',
            value: `$${outstandingPayments.toLocaleString('en-US')}`,
            note: 'Open invoices and unpaid balances.',
          },
          {
            label: 'Upcoming Lessons (Global View)',
            value: upcomingLessons.toLocaleString('en-US'),
            note: 'Next 7 days, all studios combined.',
          },
          {
            label: 'Geographic Distribution',
            value: `${regionsCovered} regions`,
            note: 'Active locations with learners.',
          },
          {
            label: 'Student Churn Rate',
            value: `${churnRate.toFixed(1)}%`,
            note: 'Rolling 30-day cancellations.',
          },
          {
            label: 'Avg Lesson Per Student',
            value: avgLessonsPerStudent.toFixed(1),
            note: 'Average lessons per learner this month.',
          },
          {
            label: 'Revenue Trend',
            value: '+6.2%',
            note: '$128,430 over the last 6 months.',
            href: '/company/financial-layer',
          },
        ].map(metric =>
          metric.href ? (
            <Link
              key={metric.label}
              href={metric.href}
              className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 text-left shadow-sm transition hover:border-[color:var(--c-c8102e)]/40 hover:shadow-md"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                {metric.label}
              </p>
              <p className="text-3xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
                {metric.value}
              </p>
              <p className="text-sm text-[var(--c-6f6c65)] mt-2">
                {metric.note}
              </p>
            </Link>
          ) : (
            <button
              key={metric.label}
              type="button"
              className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 text-left shadow-sm transition hover:border-[color:var(--c-c8102e)]/40 hover:shadow-md"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                {metric.label}
              </p>
              <p className="text-3xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
                {metric.value}
              </p>
              <p className="text-sm text-[var(--c-6f6c65)] mt-2">
                {metric.note}
              </p>
            </button>
          ),
        )}
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Quick Promo
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
            Send a quick promo message
          </h2>
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
            Opens a modal for teachers or students when they are in their account.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPromoOpen(true)}
              className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
            >
              Create Promo
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPromoHistoryOpen(true);
                void loadPromoHistory();
              }}
              className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
            >
              View History
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Dashboard Alert
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
            Add an alert to dashboards
          </h2>
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
            Pick the color and choose if it persists until dismissed.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAlertOpen(true)}
              className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
            >
              Create Alert
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAlertHistoryOpen(true);
                void loadAlertHistory();
              }}
              className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
            >
              View History
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Growth Workspace
            </p>
            <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
              Teacher Acquisition & Onboarding
            </h2>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Capture instructor leads, manage follow-ups, and convert prospects
              into active teachers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsLeadFormOpen(true)}
            className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
          >
            Open Lead Form
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Lead Capture
            </p>
            <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
              New teacher leads this week
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
              186
            </p>
            <div className="mt-4 grid gap-2 text-sm text-[var(--c-6f6c65)]">
              <div className="flex items-center justify-between">
                <span>Web inquiry form</span>
                <span className="font-semibold text-[var(--c-1f1f1d)]">62</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Teacher referral</span>
                <span className="font-semibold text-[var(--c-1f1f1d)]">41</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Social campaigns</span>
                <span className="font-semibold text-[var(--c-1f1f1d)]">53</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Partner listings</span>
                <span className="font-semibold text-[var(--c-1f1f1d)]">30</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Add Intake Form
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Sync CRM
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Auto-Reply
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Follow-Up Tracking
            </p>
            <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
              Follow-ups due today
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
              24
            </p>
            <div className="mt-4 grid gap-2 text-sm text-[var(--c-6f6c65)]">
              <div className="flex items-center justify-between">
                <span>Overdue</span>
                <span className="font-semibold text-[var(--c-c8102e)]">6</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Next 24 hours</span>
                <span className="font-semibold text-[var(--c-1f1f1d)]">18</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Automated sequences</span>
                <span className="font-semibold text-[var(--c-1f1f1d)]">9</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Needs owner</span>
                <span className="font-semibold text-[var(--c-1f1f1d)]">4</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Assign Owners
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                SMS Reminders
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Call Scripts
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Tags & Status
            </p>
            <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
              Segment teacher prospects with lifecycle tags.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {[
                { label: 'Prospect', count: 402, tone: 'bg-[var(--c-ffffff)]' },
                { label: 'Training', count: 128, tone: 'bg-[var(--c-ffffff)]' },
                { label: 'Certified', count: 214, tone: 'bg-[var(--c-ffffff)]' },
                { label: 'Active', count: 845, tone: 'bg-[var(--c-ffffff)]' },
                { label: 'Dropped', count: 96, tone: 'bg-[var(--c-ffffff)]' },
              ].map(tag => (
                <span
                  key={tag.label}
                  className={`flex items-center gap-2 rounded-full border border-[var(--c-ecebe7)] ${tag.tone} px-3 py-1 text-[var(--c-6f6c65)]`}
                >
                  <span className="uppercase tracking-[0.2em] text-xs text-[var(--c-6f6c65)]">
                    {tag.label}
                  </span>
                  <span className="font-semibold text-[var(--c-1f1f1d)]">
                    {tag.count.toLocaleString('en-US')}
                  </span>
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Auto-Tag Rules
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Tag Audits
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Segments
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Pipeline Stages
            </p>
            <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
              Track movement from first inquiry to teaching activation.
            </p>
            <div className="mt-4 grid gap-3 text-sm text-[var(--c-6f6c65)]">
              {[
                { label: 'New Inquiry', value: 124 },
                { label: 'Screening Call', value: 62 },
                { label: 'Training Enrolled', value: 38 },
                { label: 'Certified', value: 29 },
                { label: 'Activated', value: 18 },
              ].map(stage => (
                <div
                  key={stage.label}
                  className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-[0.2em] text-xs text-[var(--c-6f6c65)]">
                      {stage.label}
                    </span>
                    <span className="font-semibold text-[var(--c-1f1f1d)]">
                      {stage.value}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--c-ecebe7)]">
                    <div
                      className="h-full rounded-full bg-[var(--c-c8102e)]/70"
                      style={{ width: `${Math.min(100, stage.value * 1.2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Stage SLAs
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Win/Loss Notes
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Bottleneck Alerts
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Conversion Tracking
            </p>
            <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
              Measure drop-off across the teacher acquisition funnel.
            </p>
            <div className="mt-4 grid gap-3 text-sm text-[var(--c-6f6c65)]">
              {[
                { label: 'Lead → Screen', value: 48 },
                { label: 'Screen → Training', value: 61 },
                { label: 'Training → Certified', value: 39 },
                { label: '90-Day Activation', value: 72 },
              ].map(step => (
                <div
                  key={step.label}
                  className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-[0.2em] text-xs text-[var(--c-6f6c65)]">
                      {step.label}
                    </span>
                    <span className="font-semibold text-[var(--c-1f1f1d)]">
                      {step.value}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--c-ecebe7)]">
                    <div
                      className="h-full rounded-full bg-[var(--c-1f1f1d)]/70"
                      style={{ width: `${step.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Cohort Views
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Source Attribution
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Goal Targets
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Support Command
            </p>
            <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
              Live Chats & Ticket Triage
            </h2>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Resolve issues faster with a unified inbox, priority queues, and
              quick actions.
            </p>
          </div>
          <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
            9 friendly check-ins
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[
            {
              label: 'Live Chats',
              value: '6',
              note: 'Active right now',
              detail: 'Avg response: 4m 05s',
            },
            {
              label: 'Open Tickets',
              value: '18',
              note: 'Friendly questions',
              detail: 'Ready to reply: 7',
            },
            {
              label: 'SLA Health',
              value: '97%',
              note: 'Responses on track',
              detail: 'Warm touch today: 3',
            },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                {stat.label}
              </p>
              <p className="mt-3 text-sm text-[var(--c-6f6c65)]">{stat.note}</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">{stat.detail}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                  Auto-Assign
                </span>
                <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                  Escalations
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Priority Queue
              </p>
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                6 urgent
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                {
                  title: 'Help choosing the right program',
                  owner: 'Assigned: K. Torres',
                  status: 'Simple',
                  time: 'Waiting 18m',
                },
                {
                  title: 'Scheduling a first call',
                  owner: 'Assigned: M. Zhao',
                  status: 'Simple',
                  time: 'Waiting 44m',
                },
                {
                  title: 'Curious about training dates',
                  owner: 'Assigned: A. Rhodes',
                  status: 'Simple',
                  time: 'Waiting 1h 12m',
                },
                {
                  title: 'Materials included with onboarding',
                  owner: 'Assigned: R. Patel',
                  status: 'Simple',
                  time: 'Waiting 2h 06m',
                },
              ].map(item => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                      {item.title}
                    </p>
                    <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--c-6f6c65)]">
                    <span>{item.owner}</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Quick Actions
            </p>
            <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
              Standardize replies and resolve tickets fast.
            </p>
            <div className="mt-4 grid gap-3 text-sm text-[var(--c-6f6c65)]">
              {[
                {
                  title: 'Send welcome info',
                  detail: 'Template · New lead',
                },
                {
                  title: 'Offer a short intro call',
                  detail: 'Schedule + reminder',
                },
                {
                  title: 'Share training overview',
                  detail: 'Program guide link',
                },
                {
                  title: 'Request more details',
                  detail: 'Friendly follow-up',
                },
              ].map(action => (
                <div
                  key={action.title}
                  className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                    {action.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
                    {action.detail}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Canned Replies
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Macros
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
                Knowledge Base
              </span>
            </div>
          </div>
        </div>
      </section>

      {isLeadFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsLeadFormOpen(false)}
          />
          <div className="relative h-[90vh] w-full max-w-[95vw] overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--c-ecebe7)] px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Teacher Lead Form
                </p>
                <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
                  Preview the full lead capture experience.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLeadFormOpen(false)}
                className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
              >
                Close
              </button>
            </div>
            <div className="h-[calc(90vh-72px)] w-full bg-[var(--c-fcfcfb)]">
              <iframe
                title="Lead form preview"
                src="/embed/lead-form"
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      ) : null}

      {isPromoOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsPromoOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Quick Promo Message
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
              Deliver a message on next sign-in
            </h3>
            <div className="mt-5 grid gap-4">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Title
                <input
                  type="text"
                  value={promoTitle}
                  onChange={event => setPromoTitle(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Message
                <textarea
                  value={promoBody}
                  onChange={event => setPromoBody(event.target.value)}
                  className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Promo Image
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Upload image"
                    className="w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  />
                  <button
                    type="button"
                    className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                  >
                    Upload
                  </button>
                </div>
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Button Text
                <input
                  type="text"
                  value={promoCta}
                  onChange={event => setPromoCta(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Audience
                <select
                  value={promoAudience}
                  onChange={event => setPromoAudience(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                >
                  <option value="teacher">Teachers</option>
                  <option value="student">Students</option>
                  <option value="both">Teacher + Student</option>
                </select>
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Show
                <select
                  value={promoTrigger}
                  onChange={event => setPromoTrigger(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                >
                  <option value="dashboard">Next dashboard visit</option>
                  <option value="lesson-library">On lesson library visit</option>
                  <option value="login">On next login</option>
                  <option value="instant">Instant</option>
                </select>
              </label>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsPromoOpen(false)}
                className="w-full rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={writePromoPayload}
                className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
              >
                Send Promo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAlertOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsAlertOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Dashboard Alert
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
              Create a themed alert
            </h3>
            <div className="mt-5 grid gap-4">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Title
                <input
                  type="text"
                  value={alertTitle}
                  onChange={event => setAlertTitle(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Message
                <textarea
                  value={alertBody}
                  onChange={event => setAlertBody(event.target.value)}
                  className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Audience
                  <select
                    value={alertAudience}
                    onChange={event => setAlertAudience(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  >
                    <option value="teacher">Teachers</option>
                    <option value="student">Students</option>
                    <option value="both">Teacher + Student</option>
                  </select>
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Background
                  <select
                    value={alertColor}
                    onChange={event => setAlertColor(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="update">Update</option>
                  </select>
                </label>
              </div>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Visibility
                <select
                  value={alertPersistence}
                  onChange={event => setAlertPersistence(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                >
                  <option value="once">Next visit only</option>
                  <option value="persist">Persist until dismissed</option>
                </select>
              </label>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsAlertOpen(false)}
                className="w-full rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={writeAlertPayload}
                className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
              >
                Add Alert
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPromoHistoryOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsPromoHistoryOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Promo History
            </p>
            <div className="mt-4">
              <input
                type="text"
                placeholder="Search promos..."
                value={promoSearch}
                onChange={event => setPromoSearch(event.target.value)}
                className="w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
              />
            </div>
            <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto">
              {promoHistory
                .filter(item =>
                  `${item.title} ${item.body}`.toLowerCase().includes(promoSearch.toLowerCase()),
                )
                .map(item => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border px-4 py-3 ${item.status === 'removed' ? 'border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]' : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {item.title}
                      </p>
                      <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                        {item.status === 'removed' ? 'REMOVED' : item.trigger}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{item.body}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      <span>{item.audience}</span>
                      <span>{item.cta ?? 'GOT IT'}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemovePromo(item.id)}
                        disabled={item.status === 'removed'}
                        className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em]"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : null}

      {isAlertHistoryOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsAlertHistoryOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Alert History
            </p>
            <div className="mt-4">
              <input
                type="text"
                placeholder="Search alerts..."
                value={alertSearch}
                onChange={event => setAlertSearch(event.target.value)}
                className="w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
              />
            </div>
            <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto">
              {alertHistory
                .filter(item =>
                  `${item.title} ${item.body}`.toLowerCase().includes(alertSearch.toLowerCase()),
                )
                .map(item => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border px-4 py-3 ${item.status === 'removed' ? 'border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]' : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {item.title}
                      </p>
                      <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                        {item.status === 'removed' ? 'REMOVED' : item.persistence}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{item.body}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      <span>{item.audience}</span>
                      <span>{item.color}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveAlert(item.id)}
                        disabled={item.status === 'removed'}
                        className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em]"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Brand Compliance
          </p>
          <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Logo & Curriculum Integrity
          </h2>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Keep materials aligned with Simply Music brand standards.
          </p>
          <div className="mt-6 space-y-3">
            {[
              { label: 'Logo usage checks', value: '6' },
              { label: 'Curriculum audits', value: '4' },
              { label: 'Pending approvals', value: '3' },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3"
              >
                <div className="flex items-center justify-between text-sm text-[var(--c-6f6c65)]">
                  <span>{item.label}</span>
                  <span className="text-base font-semibold text-[var(--c-1f1f1d)]">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
              Review Requests
            </span>
            <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
              Usage Guidelines
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Required Training
          </p>
          <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Completion Readiness
          </h2>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Track teacher training progress and upcoming milestones.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3">
            {[
              { label: 'On track to complete', value: '22' },
              { label: 'Needs follow-up', value: '7' },
              { label: 'Overdue modules', value: '4' },
              { label: 'Upcoming cohorts', value: '3' },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3"
              >
                <div className="flex items-center justify-between text-sm text-[var(--c-6f6c65)]">
                  <span>{item.label}</span>
                  <span className="text-base font-semibold text-[var(--c-1f1f1d)]">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
              Send Reminders
            </span>
            <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
              Cohort View
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Certification Tracking
          </p>
          <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Active Credentials
          </h2>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Monitor certification status and renewal windows.
          </p>
          <div className="mt-6 space-y-3">
            {[
              { label: 'Certified this month', value: '9' },
              { label: 'Renewals coming up', value: '5' },
              { label: 'Pending assessments', value: '4' },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3"
              >
                <div className="flex items-center justify-between text-sm text-[var(--c-6f6c65)]">
                  <span>{item.label}</span>
                  <span className="text-base font-semibold text-[var(--c-1f1f1d)]">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
              Renewal Alerts
            </span>
            <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1">
              Export Roster
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
