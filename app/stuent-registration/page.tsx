"use client";

import { Space_Grotesk } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"] as const;
const blackKeys = ["C#", "D#", "F#", "G#", "A#"] as const;
const blackKeyPositions: Record<(typeof blackKeys)[number], number> = {
  "C#": 1,
  "D#": 2,
  "F#": 4,
  "G#": 5,
  "A#": 6,
};
const pianoNotes = [...whiteKeys, ...blackKeys] as const;

type PianoNote =
  | (typeof whiteKeys)[number]
  | (typeof blackKeys)[number];

const getRandomPianoSequence = (length: number) => {
  const pool = [...pianoNotes];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, length);
};

const noteFrequencies: Record<PianoNote, number> = {
  C: 261.63,
  "C#": 277.18,
  D: 293.66,
  "D#": 311.13,
  E: 329.63,
  F: 349.23,
  "F#": 369.99,
  G: 392.0,
  "G#": 415.3,
  A: 440.0,
  "A#": 466.16,
  B: 493.88,
};

const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

const formatCountdown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
};

const canResend = (remaining: number | null, sent: boolean) => {
  if (!sent) return true;
  if (remaining === null) return true;
  return remaining <= 0;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
  botField: string;
};

const initialState: FormState = {
  firstName: "Avery",
  lastName: "Hart",
  email: "student@example.com",
  confirmEmail: "student@example.com",
  password: "Music@2026",
  confirmPassword: "Music@2026",
  terms: true,
  botField: "",
};

export default function StudentRegistrationPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"gate" | "form">("gate");
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [state, setState] = useState<FormState>(initialState);
  const [targetSequence, setTargetSequence] = useState<PianoNote[]>([]);
  const [pianoSequence, setPianoSequence] = useState<PianoNote[]>([]);
  const [pianoPassed, setPianoPassed] = useState(false);
  const [verificationToken, setVerificationToken] = useState(() =>
    crypto.randomUUID(),
  );
  const [emailCode, setEmailCode] = useState("");
  const [emailSentStatus, setEmailSentStatus] = useState(false);
  const [emailExpiresAt, setEmailExpiresAt] = useState<string | null>(null);
  const [emailRemaining, setEmailRemaining] = useState<number | null>(null);
  const [emailResetKey, setEmailResetKey] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const totalSteps = 5;
  const stepLabels = ["Details", "Verify Email", "Set Password", "Terms", "Captcha"];
  const progress = Math.round(((step - 1) / (totalSteps - 1)) * 100);

  useEffect(() => {
    document.title = 'Student Registration | Simply Music';
  }, []);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const playPianoNote = (note: PianoNote) => {
    const audioContext = getAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      noteFrequencies[note],
      audioContext.currentTime,
    );

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.7,
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.75);
  };

  const setField = (key: keyof FormState, value: string | boolean) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const emailMatches =
    state.email.trim().length > 0 &&
    state.confirmEmail.trim().length > 0 &&
    state.email.trim() === state.confirmEmail.trim();

  const passwordMatches =
    state.password.length > 0 &&
    state.confirmPassword.length > 0 &&
    state.password === state.confirmPassword;

  const passwordValid = state.password.length >= 8;

  const detailsValid = useMemo(() => {
    return (
      state.firstName.trim().length > 0 &&
      state.lastName.trim().length > 0 &&
      isEmail(state.email) &&
      emailMatches &&
      passwordValid &&
      passwordMatches
    );
  }, [
    state.firstName,
    state.lastName,
    state.email,
    emailMatches,
    passwordValid,
    passwordMatches,
  ]);

  const passwordStepValid = passwordValid && passwordMatches;
  const termsValid = state.terms;
  const captchaValid = pianoPassed;
  const readyToSubmit = useMemo(() => {
    return (
      detailsValid &&
      emailVerified &&
      passwordStepValid &&
      termsValid &&
      captchaValid &&
      state.botField.trim().length === 0
    );
  }, [
    detailsValid,
    emailVerified,
    passwordStepValid,
    termsValid,
    captchaValid,
    state.botField,
  ]);

  const emailCanResend = canResend(emailRemaining, emailSentStatus);

  const sendEmailVerification = async () => {
    if (!isEmail(state.email) || !emailMatches) {
      setVerifyError("Enter matching email addresses before sending a code.");
      return;
    }
    setVerifyError(null);
    const response = await fetch("/api/lead-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send-code",
        token: verificationToken,
        email: state.email.trim(),
      }),
    });
    if (!response.ok) {
      setVerifyError("We couldn't send the code yet. Please try again.");
      return;
    }
    const data = (await response.json()) as { expiresAt?: string | null };
    setEmailSentStatus(true);
    setEmailExpiresAt(data?.expiresAt ?? null);
    setEmailVerified(false);
    setEmailCode("");
    setEmailResetKey(current => current + 1);
  };

  const verifyEmailCode = async () => {
    if (emailCode.trim().length < 6) {
      setVerifyError("Enter the full 6-digit code to continue.");
      return false;
    }
    const response = await fetch("/api/lead-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify-code",
        token: verificationToken,
        email: state.email.trim(),
        code: emailCode.trim(),
      }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setVerifyError(
        data.error === "expired"
          ? "That code expired — send a new one."
          : "That code doesn’t match yet. Double-check and try again.",
      );
      return false;
    }
    setVerifyError(null);
    setEmailVerified(true);
    return true;
  };

  const handlePianoClick = (note: PianoNote) => {
    if (pianoPassed) return;
    playPianoNote(note);
    const nextSequence = [...pianoSequence, note];
    setPianoSequence(nextSequence);

    const expected = targetSequence[nextSequence.length - 1];
    if (!expected || note !== expected) {
      setPianoSequence([]);
      setPianoPassed(false);
      setTargetSequence(getRandomPianoSequence(3));
      return;
    }

    if (nextSequence.length === targetSequence.length) {
      setPianoPassed(true);
    }
  };

  const handleResetPiano = () => {
    setPianoSequence([]);
    setPianoPassed(false);
    setTargetSequence(getRandomPianoSequence(3));
  };

  const isCorrectPianoNote = (note: PianoNote) => {
    const index = pianoSequence.indexOf(note);
    if (index === -1) return false;
    return targetSequence[index] === note;
  };

  useEffect(() => {
    setTargetSequence(getRandomPianoSequence(3));
  }, []);

  useEffect(() => {
    setEmailSentStatus(false);
    setEmailVerified(false);
    setEmailCode("");
    setEmailExpiresAt(null);
    setEmailRemaining(null);
    setEmailResetKey(current => current + 1);
    setVerificationToken(crypto.randomUUID());
    setVerifyError(null);
  }, [state.email, state.confirmEmail]);

  useEffect(() => {
    if (!emailExpiresAt) {
      setEmailRemaining(null);
      return;
    }
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(emailExpiresAt).getTime() - Date.now()) / 1000),
      );
      setEmailRemaining(remaining);
      if (remaining <= 0) {
        setEmailSentStatus(false);
      }
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [emailExpiresAt]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    if (!readyToSubmit) {
      setSubmitError("Finish the verification steps before submitting.");
      return;
    }
    if (state.botField.trim().length > 0) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const fullName = `${state.firstName.trim()} ${state.lastName.trim()}`.trim();
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher: '',
          name: fullName,
          email: state.email.trim(),
          status: 'Active',
          level: 'Beginner',
        }),
      });
      if (!response.ok) {
        throw new Error('Unable to create student');
      }
      setIsSubmitted(true);
    } catch {
      setSubmitError('We couldn’t enroll you yet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!detailsValid) {
        setSubmitError("Please complete all required details.");
        return;
      }
      setSubmitError(null);
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!emailSentStatus) {
        await sendEmailVerification();
        return;
      }
      if (!emailVerified) {
        const verified = await verifyEmailCode();
        if (!verified) return;
      }
      setVerifyError(null);
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!passwordStepValid) {
        setSubmitError("Enter matching passwords (8+ characters).");
        return;
      }
      setSubmitError(null);
      setStep(4);
      return;
    }
    if (step === 4) {
      if (!termsValid) {
        setSubmitError("Please accept the terms to continue.");
        return;
      }
      setSubmitError(null);
      setStep(5);
      return;
    }
  };

  const handleBack = () => {
    setSubmitError(null);
    setVerifyError(null);
    setStep(current => (current > 1 ? ((current - 1) as 1 | 2 | 3 | 4 | 5) : 1));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white px-4 py-10 text-neutral-900">
      <div className="mx-auto w-full max-w-4xl">
        <header className="text-center">
          <p
            className={`${spaceGrotesk.className} text-4xl font-semibold tracking-tight text-neutral-900 sm:text-6xl`}
          >
            Simply Music Student Registration
          </p>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-red-600" />
          <p className="mt-4 text-lg text-neutral-500 sm:text-xl">
            Let’s create your student account and get you connected.
          </p>
        </header>

        <div className="relative mt-10">
          <div className="relative z-10 overflow-hidden rounded-[32px] border border-neutral-200 bg-white px-6 py-8 shadow-[0_20px_60px_-45px_rgba(17,17,17,0.3)] sm:px-10">
            <div className="relative z-10">
              {phase === "gate" ? (
                <div className="space-y-8 text-center">
                  <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-6 py-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">
                      Simply Music
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-neutral-900">
                      Do you already have a Simply Music teacher?
                    </p>
                    <p className="mt-3 text-base text-neutral-500">
                      We need an existing teacher connection before creating a
                      student account.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                      <button
                        type="button"
                        onClick={() => setPhase("form")}
                        className="w-full rounded-full bg-red-600 px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-red-500 sm:w-auto"
                      >
                        Yes, I do
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/simplymusic/locator")}
                        className="w-full rounded-full border border-neutral-200 bg-white px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-700 transition hover:border-red-200 hover:text-red-600 sm:w-auto"
                      >
                        No, help me find one
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="space-y-10" onSubmit={handleSubmit}>
                <div className="hidden select-none rounded-3xl border border-neutral-200/70 bg-white/55 px-6 py-6 shadow-[0_30px_70px_-40px_rgba(17,17,17,0.25)] backdrop-blur-xl md:block">
                  <div className="relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">
                          Step {step} of {totalSteps}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-neutral-900">
                          {stepLabels[step - 1]}
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
                    <div className="mt-4 grid gap-3 sm:grid-cols-5">
                    {stepLabels.map((label, index) => {
                      const number = index + 1;
                      const isActive = number === step;
                      const isComplete = number < step;
                      const isCaptchaStep = label.toLowerCase() === 'captcha';
                      const isCaptchaComplete = isCaptchaStep && pianoPassed;
                      return (
                        <div
                          key={label}
                          className={`rounded-full border px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em] transition ${
                            isCaptchaComplete
                              ? "border-emerald-200 bg-emerald-100 text-emerald-900 shadow-sm"
                              : isComplete
                              ? "border-emerald-200 bg-emerald-100 text-emerald-900 shadow-sm"
                              : isActive
                                ? "border-red-200 bg-white text-red-700 shadow-[0_6px_18px_-12px_rgba(200,16,46,0.6)]"
                                : "border-white/70 bg-white/40 text-neutral-500"
                            }`}
                          >
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-lg font-semibold text-neutral-900">
                        Your Details
                      </p>
                      <p className="text-sm text-neutral-500">
                        Enter the name and email your teacher already knows.
                      </p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label
                          className="text-base font-semibold"
                          htmlFor="firstName"
                        >
                          First Name*
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-red-500"
                          value={state.firstName}
                          onChange={event =>
                            setField("firstName", event.target.value)
                          }
                          autoComplete="given-name"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-base font-semibold" htmlFor="lastName">
                          Last Name*
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-red-500"
                          value={state.lastName}
                          onChange={event =>
                            setField("lastName", event.target.value)
                          }
                          autoComplete="family-name"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className="text-base font-semibold" htmlFor="email">
                          Email Address*
                        </label>
                        <input
                          id="email"
                          type="email"
                          className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-red-500"
                          value={state.email}
                          onChange={event => setField("email", event.target.value)}
                          autoComplete="email"
                          required
                        />
                        {state.email.length > 0 && !isEmail(state.email) ? (
                          <p className="mt-2 text-sm text-red-500">
                            Please enter a valid email address.
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <label
                          className="text-base font-semibold"
                          htmlFor="confirmEmail"
                        >
                          Confirm Email*
                        </label>
                        <input
                          id="confirmEmail"
                          type="email"
                          className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-red-500"
                          value={state.confirmEmail}
                          onChange={event =>
                            setField("confirmEmail", event.target.value)
                          }
                          autoComplete="email"
                          required
                        />
                        {state.confirmEmail.length > 0 && !emailMatches ? (
                          <p className="mt-2 text-sm text-red-500">
                            Emails need to match.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 rounded-3xl border border-neutral-200 bg-neutral-50 px-6 py-6">
                    <div>
                      <p className="text-lg font-semibold text-neutral-900">
                        Verify Your Email
                      </p>
                      <p className="text-sm text-neutral-500">
                        We will send a 6-digit verification code.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        type="email"
                        className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base outline-none transition focus:border-red-500"
                        value={state.email}
                        readOnly
                      />
                    <button
                      type="button"
                      onClick={sendEmailVerification}
                      disabled={!emailCanResend}
                      className={`whitespace-nowrap rounded-full border px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur-md transition ${
                        emailCanResend
                          ? "border-neutral-200 bg-white/50 text-neutral-700 hover:bg-white/70"
                          : "cursor-not-allowed border-neutral-200 bg-white/30 text-neutral-400"
                      }`}
                    >
                        {emailSentStatus
                          ? emailCanResend
                            ? "Send Again"
                            : "Code Sent"
                          : "Send Code"}
                      </button>
                    </div>
                    <div>
                      <label className="text-base font-semibold" htmlFor="email-code">
                        Verification Code
                      </label>
                    <input
                      key={emailResetKey}
                      id="email-code"
                      type="text"
                      inputMode="numeric"
                      className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-4xl text-center font-semibold placeholder:text-neutral-300 outline-none transition focus:border-red-500"
                      value={emailCode}
                      onChange={event =>
                        setEmailCode(
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      placeholder="6-Digit Code"
                      style={{
                        letterSpacing: emailCode.length > 0 ? "0.5em" : "normal",
                      }}
                    />
                  </div>
                    {emailSentStatus && emailRemaining !== 0 ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-600">
                          Email Sent
                        </p>
                        <p className="mt-2 text-base font-semibold">
                          Code delivered — check your inbox to keep going.
                        </p>
                      </div>
                    ) : null}
                    {emailRemaining === 0 ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-red-500">
                          Action Needed
                        </p>
                        <p className="mt-2 text-base font-semibold">
                          That code expired — send a new one.
                        </p>
                      </div>
                    ) : null}
                    {emailSentStatus && emailRemaining !== null ? (
                      <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm text-neutral-600 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
                          Code Expires In
                        </p>
                        <p className="text-lg font-semibold text-neutral-700">
                          {formatCountdown(emailRemaining)}
                        </p>
                      </div>
                    ) : null}
                    {emailVerified ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 shadow-sm">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-600">
                          Verified
                        </p>
                        <p className="mt-2 text-base font-semibold">
                          Your email is verified — you can continue.
                        </p>
                      </div>
                    ) : null}
                {verifyError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-red-500">
                      Action Needed
                    </p>
                    <p className="mt-2 text-base font-semibold">
                      {verifyError}
                    </p>
                  </div>
                ) : null}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-lg font-semibold text-neutral-900">
                        Set a Password
                      </p>
                      <p className="text-sm text-neutral-500">
                        Use at least 8 characters.
                      </p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label
                          className="text-base font-semibold"
                          htmlFor="password"
                        >
                          Password*
                        </label>
                        <div className="relative mt-2">
                          <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            className="w-full rounded-xl border border-neutral-200 px-4 py-3 pr-20 text-base outline-none transition focus:border-red-500"
                            value={state.password}
                            onChange={event =>
                              setField("password", event.target.value)
                            }
                            autoComplete="new-password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(value => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 transition hover:border-red-200 hover:text-red-600"
                          >
                            {showPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                        {state.password.length > 0 && !passwordValid ? (
                          <p className="mt-2 text-sm text-red-500">
                            Use at least 8 characters.
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <label
                          className="text-base font-semibold"
                          htmlFor="confirmPassword"
                        >
                          Confirm Password*
                        </label>
                        <div className="relative mt-2">
                          <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            className="w-full rounded-xl border border-neutral-200 px-4 py-3 pr-20 text-base outline-none transition focus:border-red-500"
                            value={state.confirmPassword}
                            onChange={event =>
                              setField("confirmPassword", event.target.value)
                            }
                            autoComplete="new-password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(value => !value)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 transition hover:border-red-200 hover:text-red-600"
                          >
                            {showConfirmPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                        {state.confirmPassword.length > 0 && !passwordMatches ? (
                          <p className="mt-2 text-sm text-red-500">
                            Passwords need to match.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-lg font-semibold text-neutral-900">
                        Terms
                      </p>
                      <p className="text-sm text-neutral-500">
                        Please review and accept the terms.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                      <a className="text-red-600 underline" href="/terms">
                        Terms &amp; Conditions
                      </a>
                      <a className="text-red-600 underline" href="/privacy">
                        Privacy Policy
                      </a>
                      <a className="text-red-600 underline" href="/refunds">
                        Refund Policy
                      </a>
                    </div>
                    <textarea
                      readOnly
                      rows={12}
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm"
                      value={
                        "Welcome to Simply Music. By enrolling as a student, you agree to participate with consistent practice and to communicate promptly about scheduling needs or concerns.\n\nLessons are reserved on a recurring basis. Please provide at least 24 hours’ notice for cancellations or rescheduling requests. Missed lessons without notice may be forfeited at the teacher’s discretion.\n\nTuition and fees are billed according to your teacher’s studio policy. Payments are due by the scheduled date, and access to lessons or materials may be paused for overdue accounts.\n\nBy checking the agreement box, you acknowledge that you have reviewed the studio policies, understand the expectations, and agree to abide by them."
                      }
                    />
                    <label className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-neutral-700">
                      <input
                        type="checkbox"
                        className="h-6 w-6 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                        checked={state.terms}
                        onChange={event => setField("terms", event.target.checked)}
                        required
                      />
                      <span className="select-none text-base font-semibold">
                        I agree to the student terms above.
                      </span>
                    </label>
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      className="hidden"
                      value={state.botField}
                      onChange={event => setField("botField", event.target.value)}
                      aria-hidden
                    />
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold">Quick Piano Check</p>
                          <p className="mt-1 text-base text-neutral-500">
                            Click the keys in order:{" "}
                            <span className="font-semibold text-neutral-700">
                              {targetSequence.length
                                ? targetSequence.join(" - ")
                                : "Loading..."}
                            </span>
                          </p>
                        </div>
                        {!pianoPassed ? (
                          <button
                            type="button"
                            className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                            onClick={handleResetPiano}
                          >
                            Reset
                          </button>
                        ) : null}
                      </div>
                      <div className="relative mt-4 h-40 w-full">
                        <div className="flex h-40 gap-1">
                          {whiteKeys.map(note => {
                            const isClicked = pianoSequence.includes(note);
                            const isCorrect = isCorrectPianoNote(note);
                            return (
                              <button
                                key={note}
                                type="button"
                                onClick={() => handlePianoClick(note)}
                                className={`relative flex h-full flex-1 items-end justify-center rounded-b-lg border px-1 pb-3 text-lg font-semibold transition ${
                                  pianoPassed
                                    ? "border-green-500 bg-green-50 text-green-700"
                                    : isClicked
                                      ? isCorrect
                                        ? "border-green-500 bg-green-50 text-green-700"
                                        : "border-red-500 bg-red-50 text-red-700"
                                      : "border-neutral-200 bg-white text-neutral-700 hover:border-red-400"
                                }`}
                                aria-pressed={isClicked}
                              >
                                {note}
                              </button>
                            );
                          })}
                        </div>
                        <div className="pointer-events-none absolute left-0 top-0 h-24 w-full">
                          {blackKeys.map(blackNote => {
                            const position =
                              (blackKeyPositions[blackNote] / 7) * 100;
                            const isCorrect = isCorrectPianoNote(blackNote);
                            return (
                              <button
                                key={blackNote}
                                type="button"
                                onClick={() => handlePianoClick(blackNote)}
                                style={{ left: `${position}%` }}
                                className={`pointer-events-auto absolute top-0 h-24 w-8 -translate-x-1/2 rounded-b-md border text-sm font-semibold text-white transition ${
                                  pianoPassed
                                    ? "border-green-600 bg-green-700"
                                    : pianoSequence.includes(blackNote)
                                      ? isCorrect
                                        ? "border-green-600 bg-green-700"
                                        : "border-red-500 bg-red-700"
                                      : "border-neutral-800 bg-neutral-900 hover:bg-neutral-700"
                                }`}
                                aria-pressed={pianoSequence.includes(blackNote)}
                              >
                                {blackNote}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {pianoPassed ? (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-600">
                            All Set
                          </p>
                          <p className="mt-2 text-base font-semibold">
                            Great job — you’re ready to submit.
                          </p>
                        </div>
                      ) : (
                        <p className="mt-3 text-base text-neutral-500">
                          Click the notes in order. If you miss, it resets.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {submitError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-red-500">
                      Action Needed
                    </p>
                    <p className="mt-2 text-base font-semibold">{submitError}</p>
                  </div>
                ) : null}
                {isSubmitted ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-600">
                      Submission Received
                    </p>
                    <p className="mt-2 text-base font-semibold">
                      You’re in — check your inbox for next steps.
                    </p>
                  </div>
                ) : null}

                <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    className="w-full rounded-full border border-neutral-200 bg-neutral-100 px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-700 transition hover:bg-neutral-200 sm:w-1/2"
                    onClick={() => {
                      if (step === 1) {
                        setPhase("gate");
                        return;
                      }
                      handleBack();
                    }}
                  >
                    Back
                  </button>
                  {step < 5 ? (
                    <button
                      type="button"
                      className="w-full rounded-full bg-red-600 px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-red-500 sm:w-1/2"
                      onClick={handleNext}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className={`w-full rounded-full px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition sm:w-1/2 ${
                        readyToSubmit
                          ? "bg-red-600 text-white hover:bg-red-500"
                          : "bg-red-200 text-white"
                      }`}
                      disabled={!readyToSubmit || isSubmitting}
                    >
                      {isSubmitting ? "Enrolling..." : "Enroll"}
                    </button>
                  )}
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
