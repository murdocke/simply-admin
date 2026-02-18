'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type InterestAlert = {
  id?: string;
  title: string;
  body: string;
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
  qualifiedAt?: string;
  notQualifiedAt?: string;
};

type QuestionnaireDetail = {
  loading: boolean;
  payload: Record<string, unknown> | null;
  submittedAt: string | null;
};

const formatTimestamp = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function TeacherInterestPage() {
  const searchParams = useSearchParams();
  const focusId = searchParams?.get('alertId') ?? null;
  const [alerts, setAlerts] = useState<InterestAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionnaireDetails, setQuestionnaireDetails] = useState<
    Record<string, QuestionnaireDetail>
  >({});
  const [expandedQuestionnaires, setExpandedQuestionnaires] = useState<
    Record<string, boolean>
  >({});

  const loadAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/company-alerts', { cache: 'no-store' });
      if (!response.ok) throw new Error('Request failed');
      const data = (await response.json()) as {
        alerts?: { history?: InterestAlert[] };
      };
      const history = data.alerts?.history ?? [];
      const filtered = history.filter(alert =>
        Boolean(
          alert.interestStage ||
            alert.interestName ||
            alert.interestEmail ||
            alert.interestPhone ||
            alert.interestRegion ||
            alert.interestCity,
        ) && !alert.registrationCompletedAt,
      );
      filtered.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      setAlerts(filtered);
    } catch {
      setError('Unable to load teacher interest records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    if (!focusId) return;
    if (alerts.length === 0) return;
    const target = document.getElementById(`alert-${focusId}`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [alerts, focusId]);

  const toggleQuestionnaireDetails = useCallback(
    async (alertId: string) => {
      setExpandedQuestionnaires(current => ({
        ...current,
        [alertId]: !current[alertId],
      }));
      if (questionnaireDetails[alertId]?.payload) return;
      setQuestionnaireDetails(current => ({
        ...current,
        [alertId]: { loading: true, payload: null, submittedAt: null },
      }));
      try {
        const response = await fetch(`/api/questionnaire?alertId=${alertId}`);
        if (!response.ok) throw new Error('Request failed');
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
    [questionnaireDetails],
  );

  const focusIndex = useMemo(() => {
    if (!focusId) return -1;
    return alerts.findIndex(alert => alert.id === focusId);
  }, [alerts, focusId]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Accounts
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
            Teacher Interest
          </h1>
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
            Review lead details, questionnaire progress, and registration status
            before a teacher becomes active.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAlerts}
          className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
        >
          Refresh
        </button>
      </header>

      {error ? (
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
          Loading teacher interest records...
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
          No teacher interest records yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert, index) => {
            const isFocused = focusIndex === index;
            const hasQuestionnaire = Boolean(alert.questionnaireToken || alert.id);
            const showQuestionnaire =
              alert.interestStage === 'questionnaire_completed' ||
              alert.interestStage === 'questionnaire_opened' ||
              alert.interestStage === 'questionnaire_sent' ||
              Boolean(alert.questionnaireCompletedAt) ||
              Boolean(alert.questionnaireOpenedAt) ||
              Boolean(alert.questionnaireEmailedAt);

            return (
              <div
                key={alert.id ?? `${alert.title}-${index}`}
                id={alert.id ? `alert-${alert.id}` : undefined}
                className={`rounded-2xl border bg-[var(--c-ffffff)] p-6 shadow-sm ${
                  isFocused ? 'border-[var(--c-c8102e)]' : 'border-[var(--c-ecebe7)]'
                }`}
                style={{ scrollMarginTop: '96px' }}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                      {alert.title || 'Teacher Interest'}
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
                      {alert.interestName || 'Unnamed Lead'}
                    </h2>
                    <p className="mt-2 text-base text-[var(--c-6f6c65)]">
                      Created {formatTimestamp(alert.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    {alert.interestStage ? (
                      <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1">
                        Stage: {alert.interestStage.replace('_', ' ')}
                      </span>
                    ) : null}
                    {alert.qualifiedAt ? (
                      <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1">
                        Qualified
                      </span>
                    ) : null}
                    {alert.notQualifiedAt ? (
                      <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1">
                        Not Qualified
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                      Lead Details
                    </p>
                    <div className="mt-3 space-y-2 text-base text-[var(--c-6f6c65)]">
                      <p>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          Business:
                        </span>{' '}
                        {alert.interestBusinessName || '—'}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          Email:
                        </span>{' '}
                        {alert.interestEmail ?? '—'}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          Phone:
                        </span>{' '}
                        {alert.interestPhone ?? '—'}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          Location:
                        </span>{' '}
                        {[alert.interestCity, alert.interestRegion]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          Address:
                        </span>{' '}
                        {[alert.interestStreet1, alert.interestStreet2]
                          .filter(Boolean)
                          .join(' ') || '—'}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          Postal:
                        </span>{' '}
                        {alert.interestPostalCode || '—'}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          Country:
                        </span>{' '}
                        {alert.interestCountry || '—'}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          Referral:
                        </span>{' '}
                        {alert.interestReferral || '—'}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          About:
                        </span>{' '}
                        {alert.interestAbout || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                      Questionnaire
                    </p>
                    <div className="mt-3 space-y-2 text-base text-[var(--c-6f6c65)]">
                      <p>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          Sent:
                        </span>{' '}
                        {formatTimestamp(alert.questionnaireEmailedAt)}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          Opened:
                        </span>{' '}
                        {formatTimestamp(alert.questionnaireOpenedAt)}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          Completed:
                        </span>{' '}
                        {formatTimestamp(alert.questionnaireCompletedAt)}
                      </p>
                    </div>
                    {hasQuestionnaire ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!alert.id) return;
                          void toggleQuestionnaireDetails(alert.id);
                        }}
                        className="mt-3 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                      >
                        {expandedQuestionnaires[alert.id ?? '']
                          ? 'Hide Questionnaire'
                          : 'View Questionnaire'}
                      </button>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                      Registration
                    </p>
                    <div className="mt-3 space-y-2 text-base text-[var(--c-6f6c65)]">
                      <p>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          Sent:
                        </span>{' '}
                        {formatTimestamp(alert.registrationEmailedAt)}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          Opened:
                        </span>{' '}
                        {formatTimestamp(alert.registrationOpenedAt)}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          Completed:
                        </span>{' '}
                        {formatTimestamp(alert.registrationCompletedAt)}
                      </p>
                    </div>
                    {alert.registrationToken ? (
                      <p className="mt-3 text-xs text-[var(--c-9a9892)]">
                        Token: {alert.registrationToken}
                      </p>
                    ) : null}
                  </div>
                </div>

                {showQuestionnaire &&
                alert.id &&
                expandedQuestionnaires[alert.id] ? (
                  <div className="mt-5 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4 text-base text-[var(--c-6f6c65)]">
                    {questionnaireDetails[alert.id]?.loading ? (
                      <p>Loading questionnaire answers…</p>
                    ) : questionnaireDetails[alert.id]?.payload ? (
                      <div className="space-y-3">
                        {questionnaireDetails[alert.id]?.submittedAt ? (
                          <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                            Submitted{' '}
                            {formatTimestamp(
                              questionnaireDetails[alert.id]?.submittedAt,
                            )}
                          </p>
                        ) : null}
                        {Object.entries(
                          questionnaireDetails[alert.id]?.payload ?? {},
                        ).map(([key, value]) => (
                          <div
                            key={key}
                            className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2"
                          >
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="mt-1 text-[var(--c-1f1f1d)]">
                              {String(value || '—')}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No questionnaire answers yet.</p>
                    )}
                  </div>
                ) : null}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
