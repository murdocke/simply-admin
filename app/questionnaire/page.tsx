"use client";

import { Space_Grotesk } from "next/font/google";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

type FormState = {
  educator: string;
  organizations: string;
  background: string;
  discovery: string;
  motivation: string;
  challenges: string;
  disclosures: string;
  referralTeacher: string;
  bookWorld: string;
  bookKeys: string;
  bookMars: string;
};

type Step = 1 | 2 | 3 | 4;

const initialState: FormState = {
  educator: "",
  organizations: "",
  background: "",
  discovery: "",
  motivation: "",
  challenges: "",
  disclosures: "",
  referralTeacher: "",
  bookWorld: "",
  bookKeys: "",
  bookMars: "",
};

export default function QuestionnairePage() {
  useEffect(() => {
    document.documentElement.dataset.theme = 'light';
  }, []);

  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [interestName, setInterestName] = useState<string | null>(null);
  const [alertId, setAlertId] = useState<string | null>(null);
  const [prefillApplied, setPrefillApplied] = useState(false);
  const [state, setState] = useState<FormState>(initialState);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>(
    {},
  );
  const [viewMode, setViewMode] = useState<"scroll" | "wizard">("wizard");
  const [step, setStep] = useState<Step>(1);
  const [wizardSubmitted, setWizardSubmitted] = useState(false);

  const setField = (key: keyof FormState, value: string) => {
    setState(current => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors(current => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  useEffect(() => {
    if (viewMode === "wizard") {
      setIsSubmitted(false);
      setWizardSubmitted(false);
    }
  }, [viewMode]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch(`/api/questionnaire?token=${encodeURIComponent(token)}`, {
      cache: 'no-store',
    })
      .then(async response => {
        if (!response.ok) return null;
        const data = (await response.json()) as {
          name?: string | null;
          alertId?: string | null;
          isRegisteredTraining?: boolean;
          teacherName?: string | null;
          teacherEmail?: string | null;
        };
        if (data?.isRegisteredTraining) {
          const params = new URLSearchParams();
          params.set('role', 'teacher');
          params.set('welcome', '1');
          if (data.teacherEmail) params.set('email', data.teacherEmail);
          if (data.teacherName) params.set('name', data.teacherName);
          window.location.replace(`/login?${params.toString()}`);
          return null;
        }
        if (data?.alertId) {
          setAlertId(data.alertId);
        }
        return data.name ?? null;
      })
      .then(name => {
        if (active) setInterestName(name);
      })
      .catch(() => {
        if (active) setInterestName(null);
      });
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!alertId) return;
    try {
      const channel = new BroadcastChannel('sm-company-alerts');
      channel.postMessage({ type: 'alert-updated', id: alertId });
      channel.close();
    } catch {
      // no-op
    }
  }, [alertId]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const sendPing = () => {
      if (!active) return;
      fetch('/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'ping' }),
      })
        .then(() => {
          try {
            const channel = new BroadcastChannel('sm-company-alerts');
            channel.postMessage({ type: 'alert-updated', id: alertId ?? undefined });
            channel.close();
          } catch {
            // no-op
          }
        })
        .catch(() => null);
    };
    sendPing();
    const interval = setInterval(sendPing, 15000);
    const sendInactive = () => {
      if (!token) return;
      try {
        navigator.sendBeacon(
          '/api/questionnaire',
          JSON.stringify({ token, action: 'inactive' }),
        );
      } catch {
        fetch('/api/questionnaire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action: 'inactive' }),
          keepalive: true,
        }).catch(() => null);
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        sendInactive();
      }
    };
    window.addEventListener('pagehide', sendInactive);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('pagehide', sendInactive);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [token, alertId]);

  useEffect(() => {
    if (!token || prefillApplied) return;
    const hasAnyValue = Object.values(state).some(value =>
      typeof value === 'string' ? value.trim().length > 0 : value === true,
    );
    if (hasAnyValue) return;

    const hashToken = (value: string) => {
      let hash = 2166136261;
      for (let i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return Math.abs(hash);
    };

    const pick = <T,>(list: T[], seed: number, offset: number) =>
      list[(seed + offset) % list.length];

    const seed = hashToken(token);
    const firstName = interestName?.split(' ')[0] ?? 'there';

    setState({
      educator: pick(['Yes', 'No'], seed, 1),
      organizations: pick(
        [
          'MTNA member',
          'AMEB member',
          'Independent teacher association',
          'Local music educators group',
        ],
        seed,
        2,
      ),
      background: pick(
        [
          `Teaching piano for 6+ years with a focus on adult beginners.`,
          `Classical background with a passion for creative improvisation.`,
          `Studio owner with a mix of in-person and online students.`,
          `Former performer transitioning into teaching full-time.`,
        ],
        seed,
        3,
      ),
      discovery: pick(
        [
          'Found Simply Music through a teacher workshop.',
          'Recommended by a colleague in my studio network.',
          'Discovered via a podcast interview.',
          'Saw Simply Music referenced in a training community.',
        ],
        seed,
        4,
      ),
      motivation: pick(
        [
          'I want a more intuitive, creative approach for my students.',
          'Looking to expand the programs I can offer in my studio.',
          'I love the emphasis on immediate music-making.',
          'I want to support more adult learners with a flexible method.',
        ],
        seed,
        5,
      ),
      challenges: pick(
        [
          'Balancing training time with current teaching load.',
          'Transitioning existing students to a new method.',
          'Building awareness in my local area.',
          'Scheduling and logistics for onboarding.',
        ],
        seed,
        6,
      ),
      disclosures: pick(
        ['No disclosures at this time.', 'None to disclose.'],
        seed,
        7,
      ),
      referralTeacher: pick(
        [
          'Yes — referred by a Simply Music teacher in my city.',
          'No, this was my own discovery.',
          `Yes — ${firstName} recommended the program.`,
        ],
        seed,
        8,
      ),
      bookWorld: pick(
        ['Not yet, but on my list.', 'Started it and loved the stories.'],
        seed,
        9,
      ),
      bookKeys: pick(
        ['Enjoyed the teaching insights.', 'Planning to read it soon.'],
        seed,
        10,
      ),
      bookMars: pick(
        ['Skimmed chapters on creativity.', 'Not yet, but intrigued.'],
        seed,
        11,
      ),
    });
    setPrefillApplied(true);
  }, [token, prefillApplied, state, interestName]);

  const requiredFields: (keyof FormState)[] = [
    "educator",
    "organizations",
    "background",
    "discovery",
    "motivation",
    "challenges",
    "disclosures",
    "referralTeacher",
  ];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    requiredFields.forEach(field => {
      if (!state[field]?.trim()) {
        nextErrors[field] = "This field is required.";
      }
    });
    setErrors(nextErrors);
    setTouched(current => ({
      ...current,
      educator: true,
      organizations: true,
      background: true,
      discovery: true,
      motivation: true,
      challenges: true,
      disclosures: true,
      referralTeacher: true,
      ...current,
    }));
    if (Object.keys(nextErrors).length > 0) return;
    setIsSubmitted(true);
    setWizardSubmitted(viewMode === "wizard");
    submitQuestionnaire();
  };

  const markTouched = (field: keyof FormState) =>
    setTouched(current => ({ ...current, [field]: true }));

  const isInvalid = (field: keyof FormState) =>
    Boolean(touched[field] && errors[field]);

  const RequiredPill = () => (
    <span className="select-none rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-700">
      Required
    </span>
  );

  const FieldError = ({ message }: { message?: string }) =>
    message ? (
      <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-red-500">
          Quick Fix
        </p>
        <p className="mt-2 text-base font-semibold">{message}</p>
      </div>
    ) : null;

  const steps = useMemo(
    () => [
      {
        id: 1,
        label: "Background",
        fields: ["educator", "organizations", "background"] as (keyof FormState)[],
      },
      {
        id: 2,
        label: "Discovery",
        fields: ["discovery", "motivation", "challenges"] as (keyof FormState)[],
      },
      {
        id: 3,
        label: "Disclosures",
        fields: ["disclosures", "referralTeacher"] as (keyof FormState)[],
      },
      {
        id: 4,
        label: "Books",
        fields: ["bookWorld", "bookKeys", "bookMars"] as (keyof FormState)[],
      },
    ],
    [],
  );

  const totalSteps = steps.length;
  const stepIndex = step - 1;
  const currentStep = steps[stepIndex];
  const optionalFields = ["bookWorld", "bookKeys", "bookMars"] as const;
  const optionalWeight = 0.5;
  const requiredWeight = 1;
  const completedRequired = requiredFields.filter(field => state[field]?.trim())
    .length;
  const completedOptional = optionalFields.filter(field => state[field]?.trim())
    .length;
  const totalWeight =
    requiredFields.length * requiredWeight +
    optionalFields.length * optionalWeight;
  const earnedWeight =
    completedRequired * requiredWeight + completedOptional * optionalWeight;
  const progress = isSubmitted
    ? 100
    : Math.round((earnedWeight / totalWeight) * 100);

  const validateFields = (fields: (keyof FormState)[]) => {
    const nextErrors: Partial<Record<keyof FormState, string>> = { ...errors };
    fields.forEach(field => {
      const isRequired =
        field !== "bookWorld" && field !== "bookKeys" && field !== "bookMars";
      if (isRequired && !state[field]?.trim()) {
        nextErrors[field] = "Almost there — we need a response here.";
      }
      markTouched(field);
    });
    setErrors(nextErrors);
    return fields.every(field => !nextErrors[field]);
  };

  const handleNext = () => {
    if (!currentStep) return;
    const canAdvance = validateFields(currentStep.fields);
    if (!canAdvance) return;
    setStep(current => (current < totalSteps ? ((current + 1) as Step) : current));
  };

  const handleBack = () => {
    setStep(current => (current > 1 ? ((current - 1) as Step) : current));
  };

  const handleWizardSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handleWizardFinalSubmit = () => {
    const hasAllRequired = validateFields(requiredFields);
    if (!hasAllRequired) return;
    setIsSubmitted(true);
    setWizardSubmitted(true);
    submitQuestionnaire();
  };

  const submitQuestionnaire = () => {
    if (!token) return;
    void fetch('/api/questionnaire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        payload: state,
      }),
    })
      .then(() => {
        try {
          const channel = new BroadcastChannel('sm-company-alerts');
          channel.postMessage({ type: 'alert-updated', id: alertId ?? undefined });
          channel.close();
        } catch {
          // no-op
        }
      })
      .catch(() => null);
  };

  const renderRequiredBlock = (
    field: keyof FormState,
    label: string,
    content: React.ReactNode,
  ) => (
    <div>
      <div className="mb-2">
        <RequiredPill />
      </div>
      <label className="text-base font-semibold" htmlFor={field}>
        {label}
      </label>
      {content}
      {isInvalid(field) ? <FieldError message={errors[field]} /> : null}
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-white px-4 py-10 text-neutral-900">
      <div className="mx-auto w-full max-w-4xl">
        <header className="relative text-center">
          <div className="fixed right-6 top-6 z-50 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("scroll")}
              className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                viewMode === "scroll"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-neutral-200 bg-white text-neutral-500 hover:border-red-200 hover:text-red-600"
              }`}
            >
              Scroll
            </button>
            <button
              type="button"
              onClick={() => setViewMode("wizard")}
              className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                viewMode === "wizard"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-neutral-200 bg-white text-neutral-500 hover:border-red-200 hover:text-red-600"
              }`}
            >
              Wizard
            </button>
          </div>
          <p
            className={`${spaceGrotesk.className} text-4xl font-semibold tracking-tight text-neutral-900 sm:text-6xl`}
          >
            Simply Music Teacher Questionnaire
          </p>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-red-600" />
          <p className="mt-4 text-lg text-neutral-500 sm:text-xl">
            {interestName ? `Hey ${interestName}! - Thanks for your interest!` : 'Thanks for your interest!'}
            <br />
            Please complete the questionnaire below to help us learn more about your
            <br />
            interest in the Teacher Training Program.
          </p>
        </header>

        <div className="relative mt-10">
          <div className="relative z-10 overflow-hidden rounded-[32px] border border-neutral-200 bg-white px-6 py-8 shadow-[0_20px_60px_-45px_rgba(17,17,17,0.3)] sm:px-10">
            <form
              className="relative z-10 mt-2 text-base sm:text-lg"
              onSubmit={viewMode === "wizard" ? handleWizardSubmit : handleSubmit}
            >
              {viewMode === "wizard" ? (
                <div className="space-y-8">
                  <div className="select-none rounded-3xl border border-neutral-200 bg-neutral-50 px-6 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">
                          Step {step} of {totalSteps}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-neutral-900">
                          {currentStep?.label ?? "Questionnaire"}
                        </p>
                      </div>
                      <div className="text-3xl font-medium text-neutral-400">
                        {progress}% complete
                      </div>
                    </div>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-red-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      {steps.map(stepItem => {
                        const isActive = stepItem.id === step;
                        const stepRequired = stepItem.fields.filter(field =>
                          requiredFields.includes(field),
                        );
                        const hasRequired = stepRequired.length > 0;
                        const requiredComplete = stepRequired.every(
                          field => state[field]?.trim(),
                        );
                        const optionalComplete =
                          stepItem.label === "Books"
                            ? stepItem.fields.every(field => state[field]?.trim())
                            : false;
                        const isComplete =
                          (hasRequired && requiredComplete) ||
                          optionalComplete ||
                          (stepItem.id === totalSteps && isSubmitted);
                        return (
                          <div
                            key={stepItem.id}
                            className={`rounded-2xl border px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] ${
                              isComplete
                                ? "border-emerald-200 bg-emerald-100 text-emerald-900"
                                : isActive
                                  ? "border-red-200 bg-white text-red-600"
                                  : "border-transparent bg-transparent text-neutral-400"
                            }`}
                          >
                            {stepItem.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {step === 1 && (
                      <>
                        {renderRequiredBlock(
                          "educator",
                          "Are you a music educator?",
                          <div className="relative mt-2">
                            <select
                              id="educator"
                              className={`w-full appearance-none rounded-xl border bg-white px-4 py-3 pr-10 text-base outline-none transition focus:border-neutral-400 ${
                                isInvalid("educator")
                                  ? "border-red-300"
                                  : "border-neutral-200"
                              }`}
                              value={state.educator}
                              onChange={event =>
                                setField("educator", event.target.value)
                              }
                              onBlur={() => markTouched("educator")}
                              required
                            >
                              <option value="" disabled>
                                Select one
                              </option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                              ▾
                            </span>
                          </div>,
                        )}

                        {renderRequiredBlock(
                          "organizations",
                          "Are you a member of any music teacher organizations?",
                          <>
                            <p className="mt-1 text-sm text-neutral-500">
                              Example: MTNA or AMEB.
                            </p>
                            <textarea
                              id="organizations"
                              rows={3}
                              className={`mt-2 w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-neutral-400 ${
                                isInvalid("organizations")
                                  ? "border-red-300"
                                  : "border-neutral-200"
                              }`}
                              value={state.organizations}
                              onChange={event =>
                                setField("organizations", event.target.value)
                              }
                              onBlur={() => markTouched("organizations")}
                              required
                            />
                          </>,
                        )}

                        {renderRequiredBlock(
                          "background",
                          "Briefly describe your background as it relates to music.",
                          <textarea
                            id="background"
                            rows={4}
                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-neutral-400 ${
                              isInvalid("background")
                                ? "border-red-300"
                                : "border-neutral-200"
                            }`}
                            value={state.background}
                            onChange={event =>
                              setField("background", event.target.value)
                            }
                            onBlur={() => markTouched("background")}
                            required
                          />,
                        )}
                      </>
                    )}

                    {step === 2 && (
                      <>
                        {renderRequiredBlock(
                          "discovery",
                          "Exactly how did you come to find out about the Simply Music method?",
                          <textarea
                            id="discovery"
                            rows={3}
                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-neutral-400 ${
                              isInvalid("discovery")
                                ? "border-red-300"
                                : "border-neutral-200"
                            }`}
                            value={state.discovery}
                            onChange={event =>
                              setField("discovery", event.target.value)
                            }
                            onBlur={() => markTouched("discovery")}
                            required
                          />,
                        )}

                        {renderRequiredBlock(
                          "motivation",
                          "Why do you wish to participate in the Simply Music Teacher Training Program?",
                          <textarea
                            id="motivation"
                            rows={4}
                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-neutral-400 ${
                              isInvalid("motivation")
                                ? "border-red-300"
                                : "border-neutral-200"
                            }`}
                            value={state.motivation}
                            onChange={event =>
                              setField("motivation", event.target.value)
                            }
                            onBlur={() => markTouched("motivation")}
                            required
                          />,
                        )}

                        {renderRequiredBlock(
                          "challenges",
                          "What do you believe will be the most significant challenges you face in becoming a Simply Music Teacher?",
                          <textarea
                            id="challenges"
                            rows={4}
                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-neutral-400 ${
                              isInvalid("challenges")
                                ? "border-red-300"
                                : "border-neutral-200"
                            }`}
                            value={state.challenges}
                            onChange={event =>
                              setField("challenges", event.target.value)
                            }
                            onBlur={() => markTouched("challenges")}
                            required
                          />,
                        )}
                      </>
                    )}

                    {step === 3 && (
                      <>
                        {renderRequiredBlock(
                          "disclosures",
                          "Is there anything that we should know about that you have a responsibility to communicate, would assist us in supporting you, and/or impact our decision to grant you a license to teach the Simply Music method?",
                          <>
                            <p className="mt-1 text-sm text-neutral-500">
                              If you have nothing to communicate, clearly state so
                              as part of your answer.
                            </p>
                            <textarea
                              id="disclosures"
                              rows={5}
                              className={`mt-2 w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-neutral-400 ${
                                isInvalid("disclosures")
                                  ? "border-red-300"
                                  : "border-neutral-200"
                              }`}
                              value={state.disclosures}
                              onChange={event =>
                                setField("disclosures", event.target.value)
                              }
                              onBlur={() => markTouched("disclosures")}
                              required
                            />
                          </>,
                        )}

                        {renderRequiredBlock(
                          "referralTeacher",
                          "Was there a Simply Music Teacher instrumental in your decision to begin the Teacher Training Program?",
                          <textarea
                            id="referralTeacher"
                            rows={3}
                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-neutral-400 ${
                              isInvalid("referralTeacher")
                                ? "border-red-300"
                                : "border-neutral-200"
                            }`}
                            value={state.referralTeacher}
                            onChange={event =>
                              setField("referralTeacher", event.target.value)
                            }
                            onBlur={() => markTouched("referralTeacher")}
                            required
                          />,
                        )}
                      </>
                    )}

                    {step === 4 && (
                      <>
                        <div>
                          <label className="text-base font-semibold" htmlFor="bookWorld">
                            Have you read the book “A World Where Everyone Plays” by
                            Bernadette Ashby?
                          </label>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                            <span>If so, please let us know your thoughts.</span>
                            <a
                              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-700 transition hover:border-red-300 hover:bg-red-100"
                              href="https://www.amazon.com/World-Where-Everyone-Plays/dp/1603300015#:~:text=Book%20overview&text=A%20World%20Where%20Everyone%20Plays%20is%20an%20anthology%20of%20stories,of%20its%20student%20and%20teachers."
                              target="_blank"
                              rel="noreferrer"
                            >
                              View Book
                            </a>
                          </p>
                          <textarea
                            id="bookWorld"
                            rows={3}
                            className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-neutral-400"
                            value={state.bookWorld}
                            onChange={event =>
                              setField("bookWorld", event.target.value)
                            }
                          />
                        </div>

                        <div>
                          <label className="text-base font-semibold" htmlFor="bookKeys">
                            Have you read the book “I Found Your Keys” by Laurie Richards?
                          </label>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                            <span>If so, please let us know your thoughts.</span>
                            <a
                              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-700 transition hover:border-red-300 hover:bg-red-100"
                              href="https://www.amazon.com/Found-Your-Keys-revolutionary-approach-ebook/dp/B0B1XRG26Z/ref=sr_1_1?crid=3SULW5CTEL0TG&dib=eyJ2IjoiMSJ9.Q6ci48ShnAv6abmQc13pzQ.U4m-9NNABsLo0Lw8r4mSY3mpj4F31HXaEdoTCnjotFs&dib_tag=se&keywords=I+found+your+keys&qid=1771211931&s=books&sprefix=i+found+your+keys%2Cstripbooks%2C114&sr=1-1"
                              target="_blank"
                              rel="noreferrer"
                            >
                              View Book
                            </a>
                          </p>
                          <textarea
                            id="bookKeys"
                            rows={3}
                            className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-neutral-400"
                            value={state.bookKeys}
                            onChange={event =>
                              setField("bookKeys", event.target.value)
                            }
                          />
                        </div>

                        <div>
                          <label className="text-base font-semibold" htmlFor="bookMars">
                            Have you read the book “Music on Mars” by Neil Moore?
                          </label>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                            <span>If so, please let us know your thoughts.</span>
                            <a
                              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-700 transition hover:border-red-300 hover:bg-red-100"
                              href="https://www.amazon.com/Music-Mars-Creativity-Tomorrows-Critical-ebook/dp/B0DVNVZ533/ref=sr_1_1?crid=235IV1VPS21N&dib=eyJ2IjoiMSJ9.CAxiBXGX1Pyja_WGsCscW0r1NgBgk-6CU5P17uks3keffOQUzh4OlVvFZgjHloB1PbiEsYJG1Rz4CxZqseSz2Yl0NfUfqR8cSJ_Rq3rLw-bj1Yv1N75viLVV_wv4Gym0rxo0aFZ-B5Dr23kdKM-z1ff8vtB8qPXsRJrLbGb9uo-Sbtle30oZSkVeT29iuhhBgPW4DQw-aIHIxlI5xOifr82HokFNvxDxpeepLAsCxhA.8hTAcWIophksvX81VgC8xW1ujqp7eQddgqtupyS5AKE&dib_tag=se&keywords=music+on+mars&qid=1771211948&s=books&sprefix=music+on+mars%2Cstripbooks%2C115&sr=1-1"
                              target="_blank"
                              rel="noreferrer"
                            >
                              View Book
                            </a>
                          </p>
                          <textarea
                            id="bookMars"
                            rows={3}
                            className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-neutral-400"
                            value={state.bookMars}
                            onChange={event =>
                              setField("bookMars", event.target.value)
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={step === 1}
                      className={`min-w-[200px] rounded-full border px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                        step === 1
                          ? "border-neutral-200 text-neutral-400"
                          : "border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      }`}
                    >
                      Back
                    </button>
                    {step < totalSteps ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="min-w-[220px] rounded-full bg-red-600 px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-red-500"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleWizardFinalSubmit}
                        className="min-w-[220px] rounded-full bg-red-600 px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-red-500"
                      >
                        Submit
                      </button>
                    )}
                  </div>

                  {isSubmitted && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 shadow-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-600">
                        Submission Complete
                      </p>
                      <p className="mt-2 text-base font-semibold">
                        You’re all set — thanks for sharing your story.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
              <>
              <div className="grid gap-8 lg:grid-cols-[1fr_260px] lg:items-start">
                <div className="space-y-6">
                <div>
                  <div className="mb-2">
                    <RequiredPill />
                  </div>
                  <label className="text-base font-semibold" htmlFor="educator">
                    Are you a music educator?
                  </label>
                  <div className="relative mt-2">
                    <select
                      id="educator"
                      className={`w-full appearance-none rounded-xl border bg-white px-4 py-3 pr-10 text-base outline-none transition focus:border-neutral-400 ${
                        isInvalid("educator") ? "border-red-300" : "border-neutral-200"
                      }`}
                      value={state.educator}
                      onChange={event => setField("educator", event.target.value)}
                      onBlur={() => markTouched("educator")}
                      required
                    >
                      <option value="" disabled>
                        Select one
                      </option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                      ▾
                    </span>
                  </div>
                  {isInvalid("educator") ? (
                    <FieldError message={errors.educator} />
                  ) : null}
                </div>

                <div>
                  <div className="mb-2">
                    <RequiredPill />
                  </div>
                  <label className="text-base font-semibold" htmlFor="organizations">
                    Are you a member of any music teacher organizations?
                  </label>
                  <p className="mt-1 text-sm text-neutral-500">
                    Example: MTNA or AMEB.
                  </p>
                  <textarea
                    id="organizations"
                    rows={3}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-neutral-400 ${
                      isInvalid("organizations") ? "border-red-300" : "border-neutral-200"
                    }`}
                    value={state.organizations}
                    onChange={event => setField("organizations", event.target.value)}
                    onBlur={() => markTouched("organizations")}
                    required
                  />
                  {isInvalid("organizations") ? (
                    <FieldError message={errors.organizations} />
                  ) : null}
                </div>

                <div>
                  <div className="mb-2">
                    <RequiredPill />
                  </div>
                  <label className="text-base font-semibold" htmlFor="background">
                    Briefly describe your background as it relates to music.
                  </label>
                  <textarea
                    id="background"
                    rows={4}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-neutral-400 ${
                      isInvalid("background") ? "border-red-300" : "border-neutral-200"
                    }`}
                    value={state.background}
                    onChange={event => setField("background", event.target.value)}
                    onBlur={() => markTouched("background")}
                    required
                  />
                  {isInvalid("background") ? (
                    <FieldError message={errors.background} />
                  ) : null}
                </div>

                <div>
                  <div className="mb-2">
                    <RequiredPill />
                  </div>
                  <label className="text-base font-semibold" htmlFor="discovery">
                    Exactly how did you come to find out about the Simply Music method?
                  </label>
                  <textarea
                    id="discovery"
                    rows={3}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-neutral-400 ${
                      isInvalid("discovery") ? "border-red-300" : "border-neutral-200"
                    }`}
                    value={state.discovery}
                    onChange={event => setField("discovery", event.target.value)}
                    onBlur={() => markTouched("discovery")}
                    required
                  />
                  {isInvalid("discovery") ? (
                    <FieldError message={errors.discovery} />
                  ) : null}
                </div>

                <div>
                  <div className="mb-2">
                    <RequiredPill />
                  </div>
                  <label className="text-base font-semibold" htmlFor="motivation">
                    Why do you wish to participate in the Simply Music Teacher Training Program?
                  </label>
                  <textarea
                    id="motivation"
                    rows={4}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-neutral-400 ${
                      isInvalid("motivation") ? "border-red-300" : "border-neutral-200"
                    }`}
                    value={state.motivation}
                    onChange={event => setField("motivation", event.target.value)}
                    onBlur={() => markTouched("motivation")}
                    required
                  />
                  {isInvalid("motivation") ? (
                    <FieldError message={errors.motivation} />
                  ) : null}
                </div>

                <div>
                  <div className="mb-2">
                    <RequiredPill />
                  </div>
                  <label className="text-base font-semibold" htmlFor="challenges">
                    What do you believe will be the most significant challenges you face in becoming a Simply Music Teacher?
                  </label>
                  <textarea
                    id="challenges"
                    rows={4}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-neutral-400 ${
                      isInvalid("challenges") ? "border-red-300" : "border-neutral-200"
                    }`}
                    value={state.challenges}
                    onChange={event => setField("challenges", event.target.value)}
                    onBlur={() => markTouched("challenges")}
                    required
                  />
                  {isInvalid("challenges") ? (
                    <FieldError message={errors.challenges} />
                  ) : null}
                </div>

                <div>
                  <div className="mb-2">
                    <RequiredPill />
                  </div>
                  <label className="text-base font-semibold" htmlFor="disclosures">
                    Is there anything that we should know about that you have a responsibility to communicate, would assist us in supporting you, and/or impact our decision to grant you a license to teach the Simply Music method?
                  </label>
                  <p className="mt-1 text-sm text-neutral-500">
                    If you have nothing to communicate, clearly state so as part of your answer.
                  </p>
                  <textarea
                    id="disclosures"
                    rows={5}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-neutral-400 ${
                      isInvalid("disclosures") ? "border-red-300" : "border-neutral-200"
                    }`}
                    value={state.disclosures}
                    onChange={event => setField("disclosures", event.target.value)}
                    onBlur={() => markTouched("disclosures")}
                    required
                  />
                  {isInvalid("disclosures") ? (
                    <FieldError message={errors.disclosures} />
                  ) : null}
                </div>

                <div>
                  <div className="mb-2">
                    <RequiredPill />
                  </div>
                  <label className="text-base font-semibold" htmlFor="referralTeacher">
                    Was there a Simply Music Teacher instrumental in your decision to begin the Teacher Training Program?
                  </label>
                  <textarea
                    id="referralTeacher"
                    rows={3}
                    className={`mt-2 w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:border-neutral-400 ${
                      isInvalid("referralTeacher") ? "border-red-300" : "border-neutral-200"
                    }`}
                    value={state.referralTeacher}
                    onChange={event => setField("referralTeacher", event.target.value)}
                    onBlur={() => markTouched("referralTeacher")}
                    required
                  />
                  {isInvalid("referralTeacher") ? (
                    <FieldError message={errors.referralTeacher} />
                  ) : null}
                </div>

                <div>
                  <label className="text-base font-semibold" htmlFor="bookWorld">
                    Have you read the book “A World Where Everyone Plays” by Bernadette Ashby?
                  </label>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                    <span>If so, please let us know your thoughts.</span>
                    <a
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-700 transition hover:border-red-300 hover:bg-red-100"
                      href="https://www.amazon.com/World-Where-Everyone-Plays/dp/1603300015#:~:text=Book%20overview&text=A%20World%20Where%20Everyone%20Plays%20is%20an%20anthology%20of%20stories,of%20its%20student%20and%20teachers."
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Book
                    </a>
                  </p>
                  <textarea
                    id="bookWorld"
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-neutral-400"
                    value={state.bookWorld}
                    onChange={event => setField("bookWorld", event.target.value)}
                  />
                </div>

                <div>
                  <label className="text-base font-semibold" htmlFor="bookKeys">
                    Have you read the book “I Found Your Keys” by Laurie Richards?
                  </label>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                    <span>If so, please let us know your thoughts.</span>
                    <a
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-700 transition hover:border-red-300 hover:bg-red-100"
                      href="https://www.amazon.com/Found-Your-Keys-revolutionary-approach-ebook/dp/B0B1XRG26Z/ref=sr_1_1?crid=3SULW5CTEL0TG&dib=eyJ2IjoiMSJ9.Q6ci48ShnAv6abmQc13pzQ.U4m-9NNABsLo0Lw8r4mSY3mpj4F31HXaEdoTCnjotFs&dib_tag=se&keywords=I+found+your+keys&qid=1771211931&s=books&sprefix=i+found+your+keys%2Cstripbooks%2C114&sr=1-1"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Book
                    </a>
                  </p>
                  <textarea
                    id="bookKeys"
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-neutral-400"
                    value={state.bookKeys}
                    onChange={event => setField("bookKeys", event.target.value)}
                  />
                </div>

                <div>
                  <label className="text-base font-semibold" htmlFor="bookMars">
                    Have you read the book “Music on Mars” by Neil Moore?
                  </label>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                    <span>If so, please let us know your thoughts.</span>
                    <a
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-700 transition hover:border-red-300 hover:bg-red-100"
                      href="https://www.amazon.com/Music-Mars-Creativity-Tomorrows-Critical-ebook/dp/B0DVNVZ533/ref=sr_1_1?crid=235IV1VPS21N&dib=eyJ2IjoiMSJ9.CAxiBXGX1Pyja_WGsCscW0r1NgBgk-6CU5P17uks3keffOQUzh4OlVvFZgjHloB1PbiEsYJG1Rz4CxZqseSz2Yl0NfUfqR8cSJ_Rq3rLw-bj1Yv1N75viLVV_wv4Gym0rxo0aFZ-B5Dr23kdKM-z1ff8vtB8qPXsRJrLbGb9uo-Sbtle30oZSkVeT29iuhhBgPW4DQw-aIHIxlI5xOifr82HokFNvxDxpeepLAsCxhA.8hTAcWIophksvX81VgC8xW1ujqp7eQddgqtupyS5AKE&dib_tag=se&keywords=music+on+mars&qid=1771211948&s=books&sprefix=music+on+mars%2Cstripbooks%2C115&sr=1-1"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Book
                    </a>
                  </p>
                  <textarea
                    id="bookMars"
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-neutral-400"
                    value={state.bookMars}
                    onChange={event => setField("bookMars", event.target.value)}
                  />
                </div>

                  {isSubmitted && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 shadow-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-600">
                        Submission Complete
                      </p>
                      <p className="mt-2 text-base font-semibold">
                        You’re all set — thanks for sharing your story.
                      </p>
                    </div>
                  )}
                  <div className="relative z-10 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <button
                      type="submit"
                      className="min-w-[240px] rounded-full bg-red-600 px-10 py-4 text-lg font-semibold text-white transition hover:bg-red-500"
                    >
                      Submit
                    </button>
                  </div>
                </div>

                <aside className="lg:fixed lg:right-[calc(50%-405px)] lg:top-[calc(23rem+35px)] lg:w-[260px]">
                  <div className="select-none rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">
                      Progress
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-neutral-900">
                      Questionnaire
                    </p>
                    <div className="mt-3 text-3xl font-medium text-neutral-400">
                      {progress}% complete
                    </div>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-red-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-4 grid gap-3">
                      {steps.map(stepItem => {
                        const stepRequired = stepItem.fields.filter(field =>
                          requiredFields.includes(field),
                        );
                        const hasRequired = stepRequired.length > 0;
                        const requiredComplete = stepRequired.every(
                          field => state[field]?.trim(),
                        );
                        const optionalComplete =
                          stepItem.label === "Books"
                            ? stepItem.fields.every(field => state[field]?.trim())
                            : false;
                        const isComplete =
                          (hasRequired && requiredComplete) || optionalComplete;
                        return (
                          <div
                            key={stepItem.id}
                            className={`rounded-2xl border px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] ${
                              isComplete
                                ? "border-emerald-200 bg-emerald-100 text-emerald-900"
                                : "border-neutral-200 bg-white text-neutral-700"
                            }`}
                          >
                            {stepItem.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </aside>
                <div className="hidden lg:block" aria-hidden />
              </div>
              </>
              )}
            </form>
          </div>
        </div>

        {viewMode === "wizard" && isSubmitted && wizardSubmitted ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)]">
              <div className="h-1 w-full bg-red-600" />
              <div className="px-6 py-7 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white">
                    ✓
                  </div>
                </div>
                <p className="mt-4 text-4xl font-semibold text-neutral-900">
                  Thank you
                </p>
                <p className="mt-3 text-lg text-neutral-500">
                  We’ve received your inquiry and will be in touch with you soon.
                </p>
                <p className="mt-2 text-lg text-neutral-500">
                  Meanwhile, dive into our blog for more musical inspiration and
                  learning.
                </p>
                <a
                  href="https://simplymusic.com/blog/"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-red-600 px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-red-500"
                >
                  Read our Blog
                </a>
              </div>

              <div className="select-none border-t border-neutral-200 bg-neutral-50 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">
                      Step {totalSteps} of {totalSteps}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-neutral-900">
                      Teacher Questionaire Complete
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-neutral-500">
                    {progress}% complete
                  </div>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-red-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      {steps.map(stepItem => {
                        const stepRequired = stepItem.fields.filter(field =>
                          requiredFields.includes(field),
                        );
                        const hasRequired = stepRequired.length > 0;
                        const requiredComplete = stepRequired.every(
                          field => state[field]?.trim(),
                        );
                        const optionalComplete =
                          stepItem.label === "Books"
                            ? stepItem.fields.every(field => state[field]?.trim())
                            : false;
                        const isComplete =
                          (hasRequired && requiredComplete && stepItem.id < step) ||
                          optionalComplete ||
                          (stepItem.id === totalSteps && isSubmitted);
                    return (
                      <div
                        key={stepItem.id}
                        className={`rounded-2xl border px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] ${
                          isComplete
                            ? "border-emerald-200 bg-emerald-100 text-emerald-900"
                            : "border-neutral-200 bg-white text-neutral-700"
                        }`}
                      >
                        {stepItem.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
