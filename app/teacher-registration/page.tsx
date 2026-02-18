"use client";

import { Space_Grotesk } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

type Step = 1 | 2 | 3 | 4;

type FormState = {
  email: string;
  phone: string;
  phoneCode: string;
  plan: string;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardZip: string;
  password: string;
  confirmPassword: string;
  agreement: boolean;
  initials: string;
  terms: boolean;
  communications: boolean;
  policyMedia: boolean;
  policyTrademark: boolean;
  policyCurriculum: boolean;
  policyPractice: boolean;
  policyBackground: boolean;
  policyInsurance: boolean;
  policyCode: boolean;
  policyData: boolean;
  policyPayments: boolean;
  policyTermination: boolean;
};

const initialState: FormState = {
  email: "",
  phone: "",
  phoneCode: "",
  plan: "standard",
  cardName: "Lucy Barnes",
  cardNumber: "4242 4242 4242 4242",
  cardExpiry: "12/28",
  cardCvc: "123",
  cardZip: "95814",
  password: "",
  confirmPassword: "",
  agreement: false,
  initials: "",
  terms: false,
  communications: false,
  policyMedia: false,
  policyTrademark: false,
  policyCurriculum: false,
  policyPractice: false,
  policyBackground: false,
  policyInsurance: false,
  policyCode: false,
  policyData: false,
  policyPayments: false,
  policyTermination: false,
};

export default function TeacherRegistrationPage() {
  useEffect(() => {
    document.documentElement.dataset.theme = 'light';
  }, []);

  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<FormState>(initialState);
  const mode: "wizard" = "wizard";
  const [interestName, setInterestName] = useState<string | null>(null);
  const [alertId, setAlertId] = useState<string | null>(null);
  const [smsSentStatus, setSmsSentStatus] = useState(false);
  const [smsExpiresAt, setSmsExpiresAt] = useState<string | null>(null);
  const [smsCanResend, setSmsCanResend] = useState(true);
  const [smsExpired, setSmsExpired] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [smsResetKey, setSmsResetKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [last4, setLast4] = useState("");
  const smsVerifyingRef = useRef(false);
  const maskPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return "";
    const last4 = digits.slice(-4);
    return `***-***-${last4}`;
  };

  const formatCountdown = (remaining: number | null) => {
    if (remaining === null) return "";
    const clamped = Math.max(0, remaining);
    const minutes = Math.floor(clamped / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(clamped % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const CODE_TTL_SECONDS = 600;
  const RESEND_AFTER_SECONDS = 60;
  const canResend = (remaining: number | null, sent: boolean) => {
    if (!sent) return true;
    if (remaining === null) return true;
    if (remaining <= 0) return true;
    const elapsed = Math.max(0, CODE_TTL_SECONDS - remaining);
    return elapsed >= RESEND_AFTER_SECONDS;
  };

  const SmsCountdown = ({ expiresAt }: { expiresAt: string | null }) => {
    const [remaining, setRemaining] = useState<number | null>(null);
    useEffect(() => {
      if (!expiresAt) {
        setRemaining(null);
        return;
      }
      const tick = () => {
        const next = Math.max(
          0,
          Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000),
        );
        setRemaining(next);
      };
      tick();
      const interval = window.setInterval(tick, 1000);
      return () => window.clearInterval(interval);
    }, [expiresAt]);
    if (remaining === null) return null;
    return (
      <div className="mt-3 flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm text-neutral-600 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
          Code Expires In
        </p>
        <p className="text-lg font-semibold text-neutral-700">
          {formatCountdown(remaining)}
        </p>
      </div>
    );
  };

  const sendVerification = async () => {
    if (!token) return;
    setStepError(null);
    try {
      const response = await fetch("/api/teacher-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action: "send-code",
          channel: "sms",
        }),
      });
      const data = (await response.json()) as { expiresAt?: string; error?: string };
      if (!response.ok) {
        setStepError(data.error ?? "We couldn’t send a code just yet.");
        return;
      }
      setState(current => ({ ...current, phoneCode: "" }));
      setSmsSentStatus(true);
      setSmsExpiresAt(data.expiresAt ?? null);
      setSmsResetKey(current => current + 1);
      setSmsCanResend(false);
      setSmsExpired(false);
    } catch {
      setStepError("We couldn’t send a code just yet.");
    }
  };

  const CodeInput = ({
    onChange,
    label,
    name,
    resetKey,
  }: {
    onChange: (next: string) => void;
    label: string;
    name: string;
    resetKey: number;
  }) => {
    const [localValue, setLocalValue] = useState("");
    useEffect(() => {
      setLocalValue("");
    }, [resetKey]);
    return (
      <div className="mt-4">
        <p className="text-base font-semibold">{label}</p>
        <div className="mt-4 pb-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="\\d*"
            value={localValue}
            onChange={event => {
              const cleaned = event.target.value.replace(/\D/g, "").slice(0, 6);
              setStepError(null);
              setLocalValue(cleaned);
            }}
            onBlur={() => {
              onChange(localValue);
            }}
            maxLength={6}
            placeholder="6-Digit Code"
            className="h-36 w-full rounded-3xl border border-neutral-200 bg-white px-8 text-center text-6xl font-semibold text-neutral-900 placeholder:text-neutral-300 outline-none transition focus:border-neutral-400"
            aria-label={`${label} code`}
            name={name}
            style={{ letterSpacing: localValue.length > 0 ? "0.5em" : "normal" }}
          />
        </div>
      </div>
    );
  };

  const ErrorCallout = ({ message }: { message: string }) => (
    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-red-500">
          Quick Fix
        </p>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400">
          Action Needed
        </span>
      </div>
      <p className="mt-2 text-base font-semibold">{message}</p>
    </div>
  );

  const SuccessCallout = ({
    title,
    message,
  }: {
    title: string;
    message: string;
  }) => (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-600">
        {title}
      </p>
      <p className="mt-2 text-base font-semibold">{message}</p>
    </div>
  );

  const steps = useMemo(
    () => [
      { id: 1, label: "Phone Verify" },
      { id: 2, label: "Program" },
      { id: 3, label: "Password" },
      { id: 4, label: "Agreements" },
    ],
    [],
  );

  const progress = Math.round(((step - 1) / (steps.length - 1)) * 100);

  const verifyCode = async (code: string) => {
    if (!token) {
      return { ok: false, error: "Missing registration token." };
    }
    const response = await fetch("/api/teacher-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        action: "verify-code",
        channel: "sms",
        code,
      }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok) {
      return { ok: false, error: data.error ?? "Unable to verify yet." };
    }
    return data;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!smsSentStatus) {
        await sendVerification();
        return;
      }
      if (state.phoneCode.trim().length < 6) {
        setStepError("Enter the full 6-digit code to continue.");
        return;
      }
      const result = await verifyCode(state.phoneCode.trim());
      if (!result.ok) {
        setStepError(
          result.error === "expired"
            ? "That code expired — send a new one."
            : "That code doesn’t match yet. Double-check and try again.",
        );
        setState(current => ({ ...current, phoneCode: "" }));
        setSmsResetKey(current => current + 1);
        return;
      }
      setStepError(null);
      setStep(2);
      return;
    }
    if (step === 3) {
      if (!state.password.trim() || !state.confirmPassword.trim()) {
        setStepError("Add and confirm your password so we can secure your account.");
        return;
      }
      if (state.password !== state.confirmPassword) {
        setStepError("Passwords don’t match yet. Give it one more try.");
        return;
      }
    }
    if (step === 4) {
      const checks = [
        state.agreement,
        state.terms,
        state.communications,
        state.policyMedia,
        state.policyTrademark,
        state.policyCurriculum,
        state.policyPractice,
        state.policyBackground,
        state.policyInsurance,
        state.policyCode,
        state.policyData,
        state.policyPayments,
        state.policyTermination,
      ];
      const last4Digits = state.phone.replace(/\D/g, "").slice(-4);
      if (!state.initials.trim()) {
        setStepError("Add your initials so we can confirm the agreement.");
        return;
      }
      if (last4.trim() !== last4Digits) {
        setStepError("Those digits don’t match your phone on file.");
        return;
      }
      if (checks.some(item => !item)) {
        setStepError("Please check every agreement box to continue.");
        return;
      }
    }
    setStepError(null);
    setStep(current => (current < steps.length ? ((current + 1) as Step) : current));
  };


  useEffect(() => {
    if (!smsSentStatus || !smsExpiresAt) {
      setSmsCanResend(true);
      setSmsExpired(false);
      return;
    }
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(smsExpiresAt).getTime() - Date.now()) / 1000),
      );
      const canResendNow = canResend(remaining, smsSentStatus);
      setSmsCanResend(canResendNow);
      setSmsExpired(remaining <= 0);
    };
    tick();
    const interval = window.setInterval(tick, 5000);
    return () => window.clearInterval(interval);
  }, [smsExpiresAt, smsSentStatus]);


  useEffect(() => {
    if (step !== 1) return;
    if (!smsSentStatus) return;
    if (state.phoneCode.trim().length !== 6) return;
    if (smsVerifyingRef.current) return;
    smsVerifyingRef.current = true;
    void verifyCode(state.phoneCode.trim())
      .then(result => {
        if (result.ok) {
          setStepError(null);
          setStep(2);
          return;
        }
        setStepError(
          result.error === "expired"
            ? "That code expired — send a new one."
            : "That code doesn’t match yet. Double-check and try again.",
        );
        setState(current => ({ ...current, phoneCode: "" }));
        setSmsResetKey(current => current + 1);
      })
      .finally(() => {
        smsVerifyingRef.current = false;
      });
  }, [step, state.phoneCode, smsSentStatus]);

  const handleComplete = async () => {
    if (step !== 4) return;
    const checks = [
      state.agreement,
      state.terms,
      state.communications,
      state.policyMedia,
      state.policyTrademark,
      state.policyCurriculum,
      state.policyPractice,
      state.policyBackground,
      state.policyInsurance,
      state.policyCode,
      state.policyData,
      state.policyPayments,
      state.policyTermination,
    ];
    const last4Digits = state.phone.replace(/\D/g, "").slice(-4);
    if (!state.initials.trim()) {
      setStepError("Add your initials so we can confirm the agreement.");
      return;
    }
    if (last4.trim() !== last4Digits) {
      setStepError("Those digits don’t match your phone on file.");
      return;
    }
    if (checks.some(item => !item)) {
      setStepError("Please check every agreement box to continue.");
      return;
    }
    setStepError(null);
    if (!token) return;
    try {
      const response = await fetch("/api/teacher-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action: "complete",
          password: state.password.trim(),
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        email?: string;
        name?: string;
        username?: string;
      };
      if (!response.ok || !data?.ok) {
        setStepError("We couldn’t finalize your registration. Try again.");
        return;
      }
      const params = new URLSearchParams();
      params.set("role", "teacher");
      params.set("welcome", "1");
      if (data.email) params.set("email", data.email);
      if (data.name) params.set("name", data.name);
      router.replace(`/login?${params.toString()}`);
    } catch {
      setStepError("We couldn’t finalize your registration. Try again.");
    }
  };

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch(`/api/teacher-registration?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    })
      .then(async response => {
        if (!response.ok) return null;
        const data = (await response.json()) as {
          name?: string | null;
          alertId?: string | null;
          email?: string | null;
          phone?: string | null;
          city?: string | null;
          region?: string | null;
          smsCodeExpiresAt?: string | null;
          isRegisteredTraining?: boolean;
          teacherName?: string | null;
          teacherEmail?: string | null;
        };
        if (data?.isRegisteredTraining) {
          const params = new URLSearchParams();
          params.set("role", "teacher");
          params.set("welcome", "1");
          if (data.teacherEmail) params.set("email", data.teacherEmail);
          if (data.teacherName) params.set("name", data.teacherName);
          router.replace(`/login?${params.toString()}`);
          return null;
        }
        if (data?.alertId) {
          setAlertId(data.alertId);
        }
        setState(current => ({
          ...current,
          email: data?.email ?? current.email,
          phone: data?.phone ?? current.phone,
        }));
        if (data?.smsCodeExpiresAt) {
          setSmsExpiresAt(data.smsCodeExpiresAt);
          setSmsSentStatus(true);
        }
        return data?.name ?? null;
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
    if (!token) return;
    let active = true;
    const sendPing = () => {
      if (!active) return;
      fetch("/api/teacher-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "ping" }),
      })
        .then(() => {
          try {
            const channel = new BroadcastChannel("sm-company-alerts");
            channel.postMessage({ type: "alert-updated", id: alertId ?? undefined });
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
          "/api/teacher-registration",
          JSON.stringify({ token, action: "inactive" }),
        );
      } catch {
        fetch("/api/teacher-registration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, action: "inactive" }),
          keepalive: true,
        }).catch(() => null);
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        sendInactive();
      }
    };
    window.addEventListener("pagehide", sendInactive);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("pagehide", sendInactive);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [token, alertId]);

  if (!token) {
    return (
      <div className="min-h-screen bg-white px-4 py-16 text-neutral-900">
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">
            Access Required
          </p>
          <h1 className="mt-4 text-3xl font-semibold">
            Teacher Registration Link Needed
          </h1>
          <p className="mt-3 text-base text-neutral-500">
            Please use the registration link sent to your email to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white px-4 py-10 text-neutral-900">
      <div className="mx-auto w-full max-w-4xl">
        <header className="relative text-center">
          <p
            className={`${spaceGrotesk.className} text-4xl font-semibold tracking-tight text-neutral-900 sm:text-6xl`}
          >
            {interestName
              ? `${interestName.split(" ")[0]}, Let's Get You Started With Your Teacher Training!`
              : "Let's Get You Started With Your Teacher Training!"}
          </p>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-red-600" />
          <p className="mt-4 text-lg text-neutral-500 sm:text-xl">
            Complete your registration to begin the Simply Music Teacher Training Program.
          </p>
        </header>

        <div className="relative mt-10">
          <div className="relative z-10 overflow-hidden rounded-[32px] border border-neutral-200 bg-white px-6 py-8 shadow-[0_20px_60px_-45px_rgba(17,17,17,0.3)] sm:px-10">
            {mode === "wizard" ? (
              <div className="space-y-8">
                <div className="select-none rounded-3xl border border-neutral-200 bg-neutral-50 px-6 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">
                        Step {step} of {steps.length}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-neutral-900">
                        {steps.find(item => item.id === step)?.label}
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
                    {steps.map(item => (
                      <div
                        key={item.id}
                        className={`rounded-2xl border px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] ${
                          item.id === step
                            ? "border-red-200 bg-white text-red-600"
                            : "border-neutral-200 bg-white text-neutral-700"
                        }`}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
                {step === 2 ? (
                  <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                    <img
                      src="/reference/SimplyMusic-3Device.png"
                      alt="Simply Music multi-device preview"
                      className="w-full"
                    />
                  </div>
                ) : null}

                {step === 1 && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-600">
                        Phone Verification
                      </p>
                      <label className="mx-auto mt-4 block w-full max-w-[640px] text-base font-semibold">
                        Phone Number
                        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                          <input
                            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-neutral-400"
                            value={maskPhone(state.phone)}
                            readOnly
                            placeholder="Numeric Phone Number"
                          />
                          <button
                            type="button"
                            onClick={sendVerification}
                            disabled={!smsCanResend}
                            className={`whitespace-nowrap rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                              smsCanResend
                                ? "bg-neutral-300 text-neutral-700 hover:bg-neutral-400"
                                : "cursor-not-allowed bg-neutral-200 text-neutral-400"
                            }`}
                          >
                            {smsSentStatus
                              ? smsCanResend
                                ? "Send Again"
                                : "Code Sent"
                              : "Send SMS"}
                          </button>
                        </div>
                      </label>
                      <div className="mx-auto w-full max-w-[640px]">
                      <CodeInput
                        label="SMS Code"
                        onChange={value =>
                          setState(current => ({
                            ...current,
                            phoneCode: value,
                          }))
                        }
                        name="sms-code"
                        resetKey={smsResetKey}
                      />
                      {smsSentStatus ? (
                        <SuccessCallout
                          title="Text Sent"
                          message="Code delivered — check your phone to keep going."
                        />
                      ) : null}
                      {smsSentStatus ? (
                        <SmsCountdown expiresAt={smsExpiresAt} />
                      ) : null}
                      {smsExpired ? (
                        <ErrorCallout message="That code expired — send a new one." />
                      ) : null}
                      {stepError && step === 1 ? (
                        <ErrorCallout message={stepError} />
                      ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm h-full">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
                        Payment Details
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-neutral-900">
                        Program Payment
                      </p>
                      <div className="mt-4 text-3xl font-semibold text-neutral-900">
                        $795
                      </div>
                      <div className="mt-6 grid gap-4">
                        <label className="text-base font-semibold">
                          Cardholder Name
                          <input
                            className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none focus:border-neutral-400"
                            value={state.cardName}
                            onChange={event =>
                              setState(current => ({
                                ...current,
                                cardName: event.target.value,
                              }))
                            }
                            placeholder="Name on card"
                          />
                        </label>
                        <label className="text-base font-semibold">
                          Card Number
                          <input
                            className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none focus:border-neutral-400"
                            value={state.cardNumber}
                            onChange={event =>
                              setState(current => ({
                                ...current,
                                cardNumber: event.target.value,
                              }))
                            }
                            placeholder="1234 1234 1234 1234"
                          />
                        </label>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <label className="text-base font-semibold">
                            Expiration
                            <input
                              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none focus:border-neutral-400"
                              value={state.cardExpiry}
                              onChange={event =>
                                setState(current => ({
                                  ...current,
                                  cardExpiry: event.target.value,
                                }))
                              }
                              placeholder="MM/YY"
                            />
                          </label>
                          <label className="text-base font-semibold">
                            CVC
                            <input
                              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none focus:border-neutral-400"
                              value={state.cardCvc}
                              onChange={event =>
                                setState(current => ({
                                  ...current,
                                  cardCvc: event.target.value,
                                }))
                              }
                              placeholder="123"
                            />
                          </label>
                          <label className="text-base font-semibold">
                            ZIP
                            <input
                              className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none focus:border-neutral-400"
                              value={state.cardZip}
                              onChange={event =>
                                setState(current => ({
                                  ...current,
                                  cardZip: event.target.value,
                                }))
                              }
                              placeholder="ZIP"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 h-full">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
                        Teacher Training Program
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-neutral-900">
                        Join the global community of Simply Music Teachers
                      </p>
                      <p className="mt-4 text-xl text-neutral-500 leading-relaxed">
                        Getting started as a Simply Music Teacher begins with
                        successfully completing our Initial Teacher Training Program.
                        We provide you with everything you need to get started and
                        successfully teach our program. Our promise is to astound you
                        with value that is far beyond the cost.
                      </p>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <label className="text-base font-semibold">
                      Create Password
                      <div className="relative mt-2">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="w-full rounded-xl border border-neutral-200 px-4 py-3 pr-12 text-base outline-none focus:border-neutral-400"
                          value={state.password}
                          onChange={event =>
                            setState(current => ({
                              ...current,
                              password: event.target.value,
                            }))
                          }
                          placeholder="Create password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(current => !current)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-600"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </label>
                    <label className="text-base font-semibold mt-4 block">
                      Confirm Password
                      <div className="relative mt-2">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className="w-full rounded-xl border border-neutral-200 px-4 py-3 pr-12 text-base outline-none focus:border-neutral-400"
                          value={state.confirmPassword}
                          onChange={event =>
                            setState(current => ({
                              ...current,
                              confirmPassword: event.target.value,
                            }))
                          }
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(current => !current)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-600"
                        >
                          {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </label>
                    {stepError && step === 3 ? (
                      <ErrorCallout message={stepError} />
                    ) : null}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm select-none">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
                        Main Terms & Agreement
                      </p>
                      <p className="mt-2 text-xl font-semibold text-neutral-900">
                        Teacher Training Agreement
                      </p>
                      <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
                        This agreement outlines the responsibilities, standards,
                        and expectations for participating in the Simply Music
                        Teacher Training Program. By continuing, you acknowledge
                        your commitment to uphold program integrity and support
                        student success.
                      </p>
                    </div>
                    <label className="group flex cursor-pointer select-none items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700 transition hover:border-neutral-300 hover:bg-white">
                      <input
                        type="checkbox"
                        checked={state.agreement}
                        onChange={event =>
                          setState(current => ({
                            ...current,
                            agreement: event.target.checked,
                          }))
                        }
                        className="mt-1 h-5 w-5 rounded-md border-neutral-300 text-red-600 focus:ring-red-200"
                      />
                      <span>
                        I agree to the Teacher Training Program terms and main
                        agreement.
                      </span>
                    </label>
                    <label className="group flex cursor-pointer select-none items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700 transition hover:border-neutral-300 hover:bg-white">
                      <input
                        type="checkbox"
                        checked={state.terms}
                        onChange={event =>
                          setState(current => ({ ...current, terms: event.target.checked }))
                        }
                        className="mt-1 h-5 w-5 rounded-md border-neutral-300 text-red-600 focus:ring-red-200"
                      />
                      <span>I accept the code of conduct and policies.</span>
                    </label>
                    <label className="group flex cursor-pointer select-none items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700 transition hover:border-neutral-300 hover:bg-white">
                      <input
                        type="checkbox"
                        checked={state.policyMedia}
                        onChange={event =>
                          setState(current => ({
                            ...current,
                            policyMedia: event.target.checked,
                          }))
                        }
                        className="mt-1 h-5 w-5 rounded-md border-neutral-300 text-red-600 focus:ring-red-200"
                      />
                      <span>
                        I consent to the use of my name and studio details for
                        program announcements and marketing materials.
                      </span>
                    </label>
                    <label className="group flex cursor-pointer select-none items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700 transition hover:border-neutral-300 hover:bg-white">
                      <input
                        type="checkbox"
                        checked={state.policyTrademark}
                        onChange={event =>
                          setState(current => ({
                            ...current,
                            policyTrademark: event.target.checked,
                          }))
                        }
                        className="mt-1 h-5 w-5 rounded-md border-neutral-300 text-red-600 focus:ring-red-200"
                      />
                      <span>
                        I will use Simply Music branding and trademarks only as
                        permitted in the teacher guidelines.
                      </span>
                    </label>
                    <label className="group flex cursor-pointer select-none items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700 transition hover:border-neutral-300 hover:bg-white">
                      <input
                        type="checkbox"
                        checked={state.policyCurriculum}
                        onChange={event =>
                          setState(current => ({
                            ...current,
                            policyCurriculum: event.target.checked,
                          }))
                        }
                        className="mt-1 h-5 w-5 rounded-md border-neutral-300 text-red-600 focus:ring-red-200"
                      />
                      <span>
                        I agree to teach the Simply Music curriculum as designed
                        and maintain program standards.
                      </span>
                    </label>
                    <label className="group flex cursor-pointer select-none items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700 transition hover:border-neutral-300 hover:bg-white">
                      <input
                        type="checkbox"
                        checked={state.policyPractice}
                        onChange={event =>
                          setState(current => ({
                            ...current,
                            policyPractice: event.target.checked,
                          }))
                        }
                        className="mt-1 h-5 w-5 rounded-md border-neutral-300 text-red-600 focus:ring-red-200"
                      />
                      <span>
                        I will encourage safe, supportive practice expectations
                        for all students.
                      </span>
                    </label>
                    <label className="group flex cursor-pointer select-none items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700 transition hover:border-neutral-300 hover:bg-white">
                      <input
                        type="checkbox"
                        checked={state.policyBackground}
                        onChange={event =>
                          setState(current => ({
                            ...current,
                            policyBackground: event.target.checked,
                          }))
                        }
                        className="mt-1 h-5 w-5 rounded-md border-neutral-300 text-red-600 focus:ring-red-200"
                      />
                      <span>
                        I confirm I will meet any required background check or
                        safeguarding obligations for my region.
                      </span>
                    </label>
                    <label className="group flex cursor-pointer select-none items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700 transition hover:border-neutral-300 hover:bg-white">
                      <input
                        type="checkbox"
                        checked={state.policyInsurance}
                        onChange={event =>
                          setState(current => ({
                            ...current,
                            policyInsurance: event.target.checked,
                          }))
                        }
                        className="mt-1 h-5 w-5 rounded-md border-neutral-300 text-red-600 focus:ring-red-200"
                      />
                      <span>
                        I will maintain any required studio insurance and
                        licensing where applicable.
                      </span>
                    </label>
                    <label className="group flex cursor-pointer select-none items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700 transition hover:border-neutral-300 hover:bg-white">
                      <input
                        type="checkbox"
                        checked={state.policyCode}
                        onChange={event =>
                          setState(current => ({
                            ...current,
                            policyCode: event.target.checked,
                          }))
                        }
                        className="mt-1 h-5 w-5 rounded-md border-neutral-300 text-red-600 focus:ring-red-200"
                      />
                      <span>
                        I will uphold the Simply Music teacher code of conduct in
                        my communications and teaching.
                      </span>
                    </label>
                    <label className="group flex cursor-pointer select-none items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700 transition hover:border-neutral-300 hover:bg-white">
                      <input
                        type="checkbox"
                        checked={state.policyData}
                        onChange={event =>
                          setState(current => ({
                            ...current,
                            policyData: event.target.checked,
                          }))
                        }
                        className="mt-1 h-5 w-5 rounded-md border-neutral-300 text-red-600 focus:ring-red-200"
                      />
                      <span>
                        I agree to handle student data responsibly and comply with
                        applicable privacy laws.
                      </span>
                    </label>
                    <label className="group flex cursor-pointer select-none items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700 transition hover:border-neutral-300 hover:bg-white">
                      <input
                        type="checkbox"
                        checked={state.policyPayments}
                        onChange={event =>
                          setState(current => ({
                            ...current,
                            policyPayments: event.target.checked,
                          }))
                        }
                        className="mt-1 h-5 w-5 rounded-md border-neutral-300 text-red-600 focus:ring-red-200"
                      />
                      <span>
                        I acknowledge program fees, renewal policies, and payment
                        schedules as outlined.
                      </span>
                    </label>
                    <label className="group flex cursor-pointer select-none items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700 transition hover:border-neutral-300 hover:bg-white">
                      <input
                        type="checkbox"
                        checked={state.policyTermination}
                        onChange={event =>
                          setState(current => ({
                            ...current,
                            policyTermination: event.target.checked,
                          }))
                        }
                        className="mt-1 h-5 w-5 rounded-md border-neutral-300 text-red-600 focus:ring-red-200"
                      />
                      <span>
                        I understand Simply Music may revoke access for material
                        breaches of the agreement.
                      </span>
                    </label>
                    <label className="group flex cursor-pointer items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700 transition hover:border-neutral-300 hover:bg-white">
                      <input
                        type="checkbox"
                        checked={state.communications}
                        onChange={event =>
                          setState(current => ({
                            ...current,
                            communications: event.target.checked,
                          }))
                        }
                        className="mt-1 h-5 w-5 rounded-md border-neutral-300 text-red-600 focus:ring-red-200"
                      />
                      <span>I agree to receive onboarding communications.</span>
                    </label>
                    <div className="grid gap-4 pt-2 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-sm font-semibold text-neutral-700">
                        Initials
                        <input
                          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base outline-none focus:border-neutral-400"
                          value={state.initials}
                          onChange={event =>
                            setState(current => ({
                              ...current,
                              initials: event.target.value,
                            }))
                          }
                          placeholder="AB"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-semibold text-neutral-700">
                        Type last 4 digits of your phone
                        <input
                          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base outline-none focus:border-neutral-400"
                          value={last4}
                          onChange={event => {
                            const cleaned = event.target.value.replace(/\\D/g, "").slice(0, 4);
                            setLast4(cleaned);
                          }}
                          maxLength={4}
                          placeholder="1234"
                        />
                      </label>
                    </div>
                    {stepError && step === 4 ? (
                      <ErrorCallout message={stepError} />
                    ) : null}
                  </div>
                )}

                <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setStep(current => (current > 1 ? ((current - 1) as Step) : current))}
                    disabled={step === 1}
                    className={`w-full rounded-full border px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition sm:w-1/2 ${
                      step === 1
                        ? "border-neutral-200 text-neutral-400"
                        : "border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    Back
                  </button>
                  {step < steps.length ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full rounded-full bg-red-600 px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-red-500 sm:w-1/2"
                    >
                      {step === 1 ? "Verify Phone" : "Next"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleComplete}
                      className="w-full rounded-full bg-red-600 px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-red-500 sm:w-1/2"
                    >
                      Complete Registration
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-sm text-neutral-500">
                  Scroll view coming next. Use Wizard for now.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
