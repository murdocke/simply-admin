"use client";

import { Space_Grotesk } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";

type Step = 1 | 2 | 3 | 4;

type FormState = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  businessName: string;
  street1: string;
  street2: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
  referral: string;
  about: string;
};

const randomFirstNames = [
  "Ava",
  "Lila",
  "Mia",
  "Sofia",
  "Harper",
  "Isla",
  "Nora",
  "Ella",
  "Grace",
  "Chloe",
  "Zoe",
  "Amelia",
  "Luna",
  "Sadie",
  "Ruby",
  "Lucy",
];

const randomLastNames = [
  "Gray",
  "Simmons",
  "Parker",
  "Bennett",
  "Collins",
  "Hayes",
  "Sanchez",
  "Reed",
  "Foster",
  "Adams",
  "Watts",
  "Barnes",
  "Lopez",
  "King",
  "Murphy",
  "Diaz",
];

const randomStreets = [
  "Willow Crest Ave",
  "Juniper Hollow Rd",
  "Larkspur Way",
  "Magnolia Ridge Dr",
  "Cedar Meadow Ln",
  "Brighton Grove St",
  "Sycamore Ridge Ct",
  "Maple Leaf Blvd",
  "Solstice Park Dr",
  "Summit View Way",
  "Riverstone Pkwy",
  "Canyon Rose St",
];

const randomSuites = [
  "Suite 140",
  "Suite 210",
  "Apt 3B",
  "Unit 12",
  "Suite 305",
  "Floor 2",
  "Studio 7",
];

const randomAbout = [
  "Classical piano background with a focus on creativity and improv.",
  "Currently teaching a small studio and exploring new methods.",
  "Looking to grow as a teacher and build a more modern program.",
  "Former performer now focused on private instruction and group classes.",
  "Interested in Simply Music for its approach to reading and creativity.",
];

const getRandomPrefill = (): FormState => {
  const firstName =
    randomFirstNames[Math.floor(Math.random() * randomFirstNames.length)];
  const lastName =
    randomLastNames[Math.floor(Math.random() * randomLastNames.length)];
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`;
  const street1 = `${Math.floor(Math.random() * 8000 + 120)} ${
    randomStreets[Math.floor(Math.random() * randomStreets.length)]
  }`;
  const street2 =
    randomSuites[Math.floor(Math.random() * randomSuites.length)];
  return {
    email,
    firstName,
    lastName,
    phone: `1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
    businessName: "",
    street1,
    street2,
    city: "Sacramento",
    region: "California",
    country: "United States",
    postalCode: "95814",
    referral:
      referralOptions[Math.floor(Math.random() * referralOptions.length)],
    about: randomAbout[Math.floor(Math.random() * randomAbout.length)],
  };
};

const referralOptions = [
  "Friend or colleague",
  "Social media",
  "Search engine",
  "Podcast or interview",
  "Simply Music student",
  "Other",
];

const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "New Zealand",
  "Other",
] as const;

const countryRegions: Record<
  (typeof countries)[number] | "",
  { label: string; options?: string[] }
> = {
  "": {
    label: "State / Province / Region",
  },
  "United States": {
    label: "State",
    options: [
      "Alabama",
      "Alaska",
      "Arizona",
      "Arkansas",
      "California",
      "Colorado",
      "Connecticut",
      "Delaware",
      "Florida",
      "Georgia",
      "Hawaii",
      "Idaho",
      "Illinois",
      "Indiana",
      "Iowa",
      "Kansas",
      "Kentucky",
      "Louisiana",
      "Maine",
      "Maryland",
      "Massachusetts",
      "Michigan",
      "Minnesota",
      "Mississippi",
      "Missouri",
      "Montana",
      "Nebraska",
      "Nevada",
      "New Hampshire",
      "New Jersey",
      "New Mexico",
      "New York",
      "North Carolina",
      "North Dakota",
      "Ohio",
      "Oklahoma",
      "Oregon",
      "Pennsylvania",
      "Rhode Island",
      "South Carolina",
      "South Dakota",
      "Tennessee",
      "Texas",
      "Utah",
      "Vermont",
      "Virginia",
      "Washington",
      "West Virginia",
      "Wisconsin",
      "Wyoming",
    ],
  },
  Canada: {
    label: "Province",
    options: [
      "Alberta",
      "British Columbia",
      "Manitoba",
      "New Brunswick",
      "Newfoundland and Labrador",
      "Nova Scotia",
      "Ontario",
      "Prince Edward Island",
      "Quebec",
      "Saskatchewan",
      "Northwest Territories",
      "Nunavut",
      "Yukon",
    ],
  },
  "United Kingdom": {
    label: "County / Region",
  },
  Australia: {
    label: "State / Territory",
    options: [
      "Australian Capital Territory",
      "New South Wales",
      "Northern Territory",
      "Queensland",
      "South Australia",
      "Tasmania",
      "Victoria",
      "Western Australia",
    ],
  },
  "New Zealand": {
    label: "Region",
    options: [
      "Auckland",
      "Bay of Plenty",
      "Canterbury",
      "Gisborne",
      "Hawke's Bay",
      "Manawatu-Whanganui",
      "Marlborough",
      "Nelson",
      "Northland",
      "Otago",
      "Southland",
      "Taranaki",
      "Tasman",
      "Waikato",
      "Wellington",
      "West Coast",
    ],
  },
  Other: {
    label: "State / Province / Region",
  },
};

const postalLabels: Record<(typeof countries)[number] | "", string> = {
  "": "Postal Code",
  "United States": "Zip Code",
  Canada: "Postal Code",
  "United Kingdom": "Postcode",
  Australia: "Postcode",
  "New Zealand": "Postcode",
  Other: "Postal Code",
};

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

const isPhone = (value: string) => value.replace(/\D/g, "").length >= 10;

const formatPhone = (value: string) => {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return hasPlus ? "+" : "";
  if (!hasPlus) {
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits.startsWith("1")) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
  }
  const grouped = digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
  return `+${grouped}`;
};

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

const sanitizeUsername = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^_+|_+$/g, "")
    .slice(0, 18);

const buildUsername = (email: string, firstName: string, lastName: string) => {
  const emailHandle = email.split("@")[0] ?? "";
  const fromEmail = sanitizeUsername(emailHandle);
  if (fromEmail) return fromEmail;
  const fromName = sanitizeUsername(`${firstName}${lastName}`);
  return fromName || `teacher${Math.floor(Math.random() * 9000 + 1000)}`;
};

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export default function LeadFormEmbedPage() {
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<FormState>(() => getRandomPrefill());
  const [targetSequence, setTargetSequence] = useState<PianoNote[]>([]);
  const [pianoSequence, setPianoSequence] = useState<PianoNote[]>([]);
  const [pianoPassed, setPianoPassed] = useState(false);
  const [leadVerificationToken, setLeadVerificationToken] = useState(() =>
    crypto.randomUUID(),
  );
  const [emailCode, setEmailCode] = useState("");
  const [emailSentStatus, setEmailSentStatus] = useState(false);
  const [emailExpiresAt, setEmailExpiresAt] = useState<string | null>(null);
  const [emailRemaining, setEmailRemaining] = useState<number | null>(null);
  const [emailResetKey, setEmailResetKey] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

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
      audioContext.currentTime
    );

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      0.08,
      audioContext.currentTime + 0.02
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.7
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.75);
  };

  const setField = (key: keyof FormState, value: string) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const handleCountryChange = (value: string) => {
    setState((prev) => ({
      ...prev,
      country: value,
      region: "",
      postalCode: "",
    }));
  };

  const step1Valid = useMemo(() => {
    return (
      isEmail(state.email) &&
      state.firstName.trim().length > 0 &&
      state.lastName.trim().length > 0 &&
      isPhone(state.phone)
    );
  }, [state]);

  const step2Valid = useMemo(() => {
    return emailSentStatus && emailCode.trim().length >= 6;
  }, [emailCode, emailSentStatus]);

  const step3Valid = useMemo(() => {
    return (
      state.street1.trim().length > 0 &&
      state.city.trim().length > 0 &&
      state.region.trim().length > 0 &&
      state.country.trim().length > 0 &&
      state.postalCode.trim().length > 0
    );
  }, [state]);

  const step4Valid = useMemo(() => {
    return (
      state.referral.trim().length > 0 &&
      state.about.trim().length >= 10 &&
      pianoPassed
    );
  }, [state, pianoPassed]);

  const emailCanResend = canResend(emailRemaining, emailSentStatus);

  const sendEmailVerification = async () => {
    if (!isEmail(state.email)) {
      setVerifyError("Enter a valid email address before sending a code.");
      return;
    }
    setVerifyError(null);
    const response = await fetch("/api/lead-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send-code",
        token: leadVerificationToken,
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
    const response = await fetch("/api/lead-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify-code",
        token: leadVerificationToken,
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

  const handleNext = async () => {
    if (step === 1 && step1Valid) {
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!emailSentStatus) {
        setVerifyError("Send the code first — it only takes a second.");
        return;
      }
      if (emailCode.trim().length < 6) {
        setVerifyError("Enter the full 6-digit code to continue.");
        return;
      }
      const verified = await verifyEmailCode();
      if (!verified) return;
      setStep(3);
      return;
    }
    if (step === 3 && step3Valid) {
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
    if (step === 4) {
      setStep(3);
      handleResetPiano();
    }
  };

  useEffect(() => {
    setTargetSequence(getRandomPianoSequence(3));
  }, []);

  useEffect(() => {
    setState(prev => ({
      ...prev,
      phone: prev.phone ? formatPhone(prev.phone) : prev.phone,
    }));
  }, []);

  useEffect(() => {
    setEmailSentStatus(false);
    setEmailVerified(false);
    setEmailCode("");
    setEmailExpiresAt(null);
    setEmailRemaining(null);
    setEmailResetKey(current => current + 1);
    setLeadVerificationToken(crypto.randomUUID());
    setVerifyError(null);
  }, [state.email]);

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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!step4Valid || !emailVerified) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const submitLead = async () => {
      const fullName = `${state.firstName.trim()} ${state.lastName.trim()}`.trim();
      const baseUsername = buildUsername(state.email, state.firstName, state.lastName);
      let username = baseUsername;
      let response: Response | null = null;

      const lastFour = state.phone.replace(/\D/g, "").slice(-4);
      const suffixes = [
        lastFour ? `-${lastFour}` : '',
        `-${Math.floor(Math.random() * 9000 + 1000)}`,
        `-${Date.now().toString().slice(-4)}`,
      ].filter(Boolean);

      for (let attempt = 0; attempt < 1 + suffixes.length; attempt += 1) {
        const candidate = attempt === 0 ? username : `${baseUsername}${suffixes[attempt - 1]}`;
        response = await fetch("/api/teachers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company: "neil",
            username: candidate,
            name: fullName,
            email: state.email.trim(),
            region: state.region || "Unassigned",
            status: "Interested",
          }),
        });
        if (response.status !== 409) {
          username = candidate;
          break;
        }
      }

      if (!response || !response.ok) {
        throw new Error("Unable to submit");
      }

      const alertPayload = {
        id: crypto.randomUUID(),
        title: "New Teacher Interest",
        body: `${fullName} requested info about teaching Simply Music. ${state.email.trim()} · ${state.phone.trim()} · ${state.city.trim()}, ${state.region.trim()}`,
        color: "info",
        persistence: "persist",
        createdAt: new Date().toISOString(),
        audience: "company",
        username,
        interestStage: "new",
        interestName: fullName,
        interestEmail: state.email.trim(),
        interestPhone: state.phone.trim(),
        interestCity: state.city.trim(),
        interestRegion: state.region.trim(),
        interestCountry: state.country.trim(),
        interestPostalCode: state.postalCode.trim(),
        interestStreet1: state.street1.trim(),
        interestStreet2: state.street2.trim(),
        interestBusinessName: state.businessName.trim(),
        interestReferral: state.referral.trim(),
        interestAbout: state.about.trim(),
      };

      await fetch("/api/company-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience: "company", payload: alertPayload }),
      });

      try {
        const channel = new BroadcastChannel("sm-company-alerts");
        channel.postMessage({ type: "alert-added", audience: "company", payload: alertPayload });
        channel.close();
      } catch {
        // ignore
      }

      let companyEmail = "neil@simplymusic.com";
      try {
        const accountsResponse = await fetch("/api/accounts", { cache: "no-store" });
        if (accountsResponse.ok) {
          const data = (await accountsResponse.json()) as {
            accounts?: { username: string; role: string; email?: string }[];
          };
          const companyAccount = data.accounts?.find(
            account =>
              account.role === "company" &&
              account.username?.toLowerCase() === "neil",
          );
          if (companyAccount?.email) {
            companyEmail = companyAccount.email;
          }
        }
      } catch {
        // ignore
      }

      await fetch("/api/notifications/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: companyEmail,
          subject: "New Teacher Interest",
          body: alertPayload.body,
          source: "Teacher Interest",
          data: { alertId: alertPayload.id },
        }),
      });

      await fetch("/api/notifications/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: companyEmail,
          title: "New Teacher Interest",
          body: alertPayload.body,
          source: "Teacher Interest",
          data: { alertId: alertPayload.id },
        }),
      });

      await fetch("/api/notifications/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: state.email.trim(),
          subject: "Thanks for your interest in Simply Music",
          body: "Thanks for your interest in becoming a Simply Music teacher. We will be in touch soon with next steps.",
          source: "Teacher Interest",
          data: { alertId: alertPayload.id },
        }),
      });
    };

    submitLead()
      .then(() => {
        setIsSubmitted(true);
        setShowConfirmation(true);
      })
      .catch(() => {
        setSubmitError("Almost there — we couldn’t submit yet. Please try again.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <>
    <div className="relative min-h-screen overflow-hidden bg-white px-4 py-10 text-neutral-900">
      <div className="mx-auto w-full max-w-4xl">
        <header className="text-center">
          <p
            className={`${spaceGrotesk.className} text-4xl font-semibold tracking-tight text-neutral-900 sm:text-6xl`}
          >
            Talk to Us About Teaching Simply Music
          </p>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-red-600" />
          <p className="mt-4 text-lg text-neutral-500 sm:text-xl">
            The first step is to contact us and set up a one-on-one call with
            <br />
            Simply Music’s Founder, Neil Moore.
          </p>
          <p className="mt-3 text-lg text-neutral-500 sm:text-xl">
            Please complete the form below and let us know a little about
            yourself.
          </p>
        </header>

        <div className="relative mt-10">
          <img
            src="https://app.simplymusic.com/c44a858fa58e03e52efb9ae34349b386.svg"
            alt=""
            className="pointer-events-none absolute left-0 top-full z-20 h-auto w-[600px] opacity-100"
            style={{
              clipPath: "inset(0 0 50% 0)",
              transform: "translate(-55%, -86%) translateX(10px) scaleX(-1)",
            }}
            aria-hidden
          />
          <img
            src="https://app.simplymusic.com/c44a858fa58e03e52efb9ae34349b386.svg"
            alt=""
            className="pointer-events-none absolute left-0 top-full z-0 h-auto w-[600px] opacity-100"
            style={{
              clipPath: "inset(50% 0 0 0)",
              transform: "translate(-55%, -86%) translateX(10px) scaleX(-1)",
            }}
            aria-hidden
          />
          <div className="relative z-10 overflow-hidden rounded-[32px] border border-neutral-200 bg-white px-6 py-8 shadow-[0_20px_60px_-45px_rgba(17,17,17,0.3)] sm:px-10">
            <img
              src="https://app.simplymusic.com/5668f9bc9ee0f3f3ac8f.png"
              alt=""
              className="balloon-float pointer-events-none absolute right-0 top-0 z-0 h-auto w-auto max-w-[320px] opacity-100"
              style={
                {
                  "--balloon-x": "calc(18% - 25px)",
                  "--balloon-y": "calc(-10% + 20px)",
                } as React.CSSProperties
              }
              aria-hidden
            />
          <div className="relative z-10 mx-auto w-full max-w-4xl rounded-[28px] border border-white/60 bg-white/60 px-6 py-4 shadow-[0_18px_45px_-30px_rgba(17,17,17,0.35)] backdrop-blur-md">
            <div className="flex items-center justify-center gap-4">
              {[1, 2, 3, 4].map((number) => {
                const isComplete = number < step;
                const isActive = number === step;
                return (
                  <div key={number} className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-semibold shadow-sm transition ${
                          isActive
                            ? "bg-red-600 text-white shadow-red-200"
                            : isComplete
                              ? "bg-red-100 text-red-600"
                              : "bg-neutral-100 text-neutral-500"
                        }`}
                        aria-current={isActive ? "step" : undefined}
                      >
                        {isComplete ? (
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            className="h-5 w-5"
                          >
                            <path
                              d="M5 12.5l4.2 4.2L19 7.9"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          number
                        )}
                      </div>
                      <div className="text-[12px] font-semibold uppercase tracking-[0.22em] text-neutral-600">
                        {number === 1 && "Details"}
                        {number === 2 && "Email Verification"}
                        {number === 3 && "Address"}
                        {number === 4 && "Submit"}
                      </div>
                    </div>
                    {number !== 4 && (
                      <div className="h-[2px] w-16 rounded-full bg-neutral-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            step > number ? "bg-red-600" : "bg-transparent"
                          }`}
                          style={{
                            width: step > number ? "100%" : "0%",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <form className="relative z-10 mt-8 text-base sm:text-lg" onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="text-base font-semibold" htmlFor="email">
                    Your Email Address*
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-red-500"
                    placeholder="name@example.com"
                    value={state.email}
                    onChange={(event) => setField("email", event.target.value)}
                    autoComplete="email"
                    required
                  />
                  {state.email.length > 0 && !isEmail(state.email) && (
                    <p className="mt-2 text-sm text-red-500">
                      Please enter a valid email address.
                    </p>
                  )}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="text-base font-semibold" htmlFor="firstName">
                      First Name*
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-red-500"
                      value={state.firstName}
                      onChange={(event) =>
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
                      onChange={(event) =>
                        setField("lastName", event.target.value)
                      }
                      autoComplete="family-name"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="text-base font-semibold" htmlFor="phone">
                      Phone*
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-red-500"
                      placeholder="Numeric Phone Number"
                      value={state.phone}
                      onChange={(event) =>
                        setField("phone", formatPhone(event.target.value))
                      }
                      autoComplete="tel"
                      required
                    />
                    {state.phone.length > 0 && !isPhone(state.phone) && (
                      <p className="mt-2 text-sm text-red-500">
                        Please enter a valid phone number.
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      className="text-base font-semibold"
                      htmlFor="businessName"
                    >
                      Business Name
                    </label>
                    <input
                      id="businessName"
                      type="text"
                      className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-red-500"
                      value={state.businessName}
                      onChange={(event) =>
                        setField("businessName", event.target.value)
                      }
                      autoComplete="organization"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="text-base font-semibold" htmlFor="verify-email">
                    Email Address
                  </label>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      id="verify-email"
                      type="email"
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-red-500"
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
                    className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-6xl text-center font-semibold placeholder:text-neutral-300 outline-none transition focus:border-red-500"
                    value={emailCode}
                    onChange={(event) =>
                      setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 6))
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
                    <p className="mt-2 text-base font-semibold">{verifyError}</p>
                  </div>
                ) : null}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="text-base font-semibold" htmlFor="street1">
                    Street Address*
                  </label>
                  <input
                    id="street1"
                    type="text"
                    className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-red-500"
                    value={state.street1}
                    onChange={(event) => setField("street1", event.target.value)}
                    autoComplete="address-line1"
                    required
                  />
                </div>
                <div>
                  <label className="text-base font-semibold" htmlFor="street2">
                    Street Line 2 (Optional)
                  </label>
                  <input
                    id="street2"
                    type="text"
                    className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-red-500"
                    placeholder="North Elm Street"
                    value={state.street2}
                    onChange={(event) => setField("street2", event.target.value)}
                    autoComplete="address-line2"
                  />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="text-base font-semibold" htmlFor="country">
                      Country*
                    </label>
                    <div className="relative mt-2">
                      <select
                        id="country"
                        className="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 pr-10 text-base outline-none transition focus:border-red-500"
                        value={state.country}
                        onChange={(event) =>
                          handleCountryChange(event.target.value)
                        }
                        required
                      >
                        <option value="" disabled>
                          Select a country
                        </option>
                        {countries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                        ▾
                      </span>
                    </div>
                  </div>
                  <div>
                    <label
                      className="text-base font-semibold"
                      htmlFor="postalCode"
                    >
                      {postalLabels[
                        state.country as keyof typeof postalLabels
                      ] ?? "Postal Code"}
                      *
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-red-500"
                      value={state.postalCode}
                      onChange={(event) =>
                        setField("postalCode", event.target.value)
                      }
                      autoComplete="postal-code"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="text-base font-semibold" htmlFor="city">
                      City*
                    </label>
                    <input
                      id="city"
                      type="text"
                      className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-red-500"
                      value={state.city}
                      onChange={(event) => setField("city", event.target.value)}
                      autoComplete="address-level2"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-base font-semibold" htmlFor="region">
                      {countryRegions[state.country as keyof typeof countryRegions]
                        ?.label ?? "State / Province / Region"}
                      *
                    </label>
                    {countryRegions[state.country as keyof typeof countryRegions]
                      ?.options ? (
                      <div className="relative mt-2">
                        <select
                          id="region"
                          className="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 pr-10 text-base outline-none transition focus:border-red-500"
                          value={state.region}
                          onChange={(event) =>
                            setField("region", event.target.value)
                          }
                          required
                        >
                          <option value="" disabled>
                            Select {countryRegions[state.country as keyof typeof countryRegions]?.label}
                          </option>
                          {countryRegions[
                            state.country as keyof typeof countryRegions
                          ]?.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                          ▾
                        </span>
                      </div>
                    ) : (
                      <input
                        id="region"
                        type="text"
                        className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-red-500"
                        value={state.region}
                        onChange={(event) =>
                          setField("region", event.target.value)
                        }
                        autoComplete="address-level1"
                        required
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="text-base font-semibold" htmlFor="referral">
                    How did you hear about Simply Music?*
                  </label>
                  <div className="relative mt-2">
                    <select
                      id="referral"
                      className="w-full appearance-none rounded-xl border border-neutral-200 bg-white/70 px-4 py-3 pr-10 text-base outline-none backdrop-blur-sm transition focus:border-red-500"
                      value={state.referral}
                      onChange={(event) =>
                        setField("referral", event.target.value)
                      }
                      required
                    >
                      <option value="" disabled>
                        Select a reference
                      </option>
                      {referralOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                      ▾
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-base font-semibold" htmlFor="about">
                    Tell us a little bit about yourself.
                  </label>
                  <textarea
                    id="about"
                    rows={5}
                    className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none transition focus:border-red-500"
                    placeholder="Write here..."
                    value={state.about}
                    onChange={(event) => setField("about", event.target.value)}
                    required
                  />
                  <p className="mt-2 text-sm text-neutral-500">
                    Minimum 10 characters.
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">
                        Quick Piano Check
                      </p>
                      <p className="mt-1 text-base text-neutral-500">
                        Click the keys in order:{" "}
                        <span className="font-semibold text-neutral-700">
                          {targetSequence.length
                            ? targetSequence.join(" - ")
                            : "Loading..."}
                        </span>
                      </p>
                    </div>
                    {!pianoPassed && (
                      <button
                        type="button"
                        className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                        onClick={handleResetPiano}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="relative mt-4 h-40 w-full">
                    <div className="flex h-40 gap-1">
                      {whiteKeys.map((note) => {
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
                      {blackKeys.map((blackNote) => {
                        const position = (blackKeyPositions[blackNote] / 7) * 100;
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

                {isSubmitted && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-600">
                      Submission Received
                    </p>
                    <p className="mt-2 text-base font-semibold">
                      You’re in — we’ll be in touch shortly.
                    </p>
                  </div>
                )}
                {submitError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-red-500">
                      Almost There
                    </p>
                    <p className="mt-2 text-base font-semibold">{submitError}</p>
                    <p className="mt-1 text-xs text-red-500">
                      If it keeps happening, give it another try in a moment.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="relative z-10 mt-10 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button
                type="button"
                className={`w-full rounded-full border px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] transition sm:w-1/2 ${
                  step === 1
                    ? "border-neutral-200 text-neutral-400"
                    : "border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
                onClick={handleBack}
                disabled={step === 1}
              >
                Back
              </button>
              {step < 4 && (
                <button
                  type="button"
                  className={`w-full rounded-full bg-red-600 px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-red-500 sm:w-1/2 ${
                    (step === 1 && !step1Valid) ||
                    (step === 2 && !step2Valid) ||
                    (step === 3 && !step3Valid)
                      ? "bg-red-300"
                      : ""
                  }`}
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !step1Valid) ||
                    (step === 2 && !step2Valid) ||
                    (step === 3 && !step3Valid)
                  }
                >
                  Next
                </button>
              )}
              {step === 4 && (
                <button
                  type="submit"
                  className={`w-full rounded-full bg-red-600 px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-red-500 sm:w-1/2 ${
                    step4Valid && emailVerified && !isSubmitting ? "" : "bg-red-300"
                  }`}
                  disabled={!step4Valid || !emailVerified || isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
    {showConfirmation ? (
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
              We’ve received your inquiry and will be in touch with you soon
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
        </div>
      </div>
    ) : null}
    </>
  );
}
