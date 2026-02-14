"use client";

import { Space_Grotesk } from "next/font/google";
import { useMemo, useRef, useState } from "react";

type Step = 1 | 2 | 3;

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

const initialState: FormState = {
  email: "riffsandchops@gmail.com",
  firstName: "Brian",
  lastName: "Gray",
  phone: "12145551111",
  businessName: "Riffs & Chops",
  street1: "1234 Harmony Lane",
  street2: "Suite 220",
  city: "Sacramento",
  region: "California",
  country: "United States",
  postalCode: "95814",
  referral: "",
  about: "",
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

const pianoChord = ["D", "F", "A"] as const;

const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"] as const;
const blackKeys = ["C#", "D#", "F#", "G#", "A#"] as const;

type PianoNote =
  | (typeof whiteKeys)[number]
  | (typeof blackKeys)[number];

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

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export default function LeadFormEmbedPage() {
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<FormState>(initialState);
  const [pianoSequence, setPianoSequence] = useState<PianoNote[]>([]);
  const [pianoPassed, setPianoPassed] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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
    return (
      state.street1.trim().length > 0 &&
      state.city.trim().length > 0 &&
      state.region.trim().length > 0 &&
      state.country.trim().length > 0 &&
      state.postalCode.trim().length > 0
    );
  }, [state]);

  const step3Valid = useMemo(() => {
    return (
      state.referral.trim().length > 0 &&
      state.about.trim().length >= 10 &&
      pianoPassed
    );
  }, [state, pianoPassed]);

  const handleNext = () => {
    if (step === 1 && step1Valid) setStep(2);
    if (step === 2 && step2Valid) setStep(3);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handlePianoClick = (note: PianoNote) => {
    if (pianoPassed) return;
    playPianoNote(note);
    const nextSequence = [...pianoSequence, note];
    setPianoSequence(nextSequence);

    const expected = pianoChord[nextSequence.length - 1];
    if (note !== expected) {
      setPianoSequence([]);
      setPianoPassed(false);
      return;
    }

    if (nextSequence.length === pianoChord.length) {
      setPianoPassed(true);
    }
  };

  const handleResetPiano = () => {
    setPianoSequence([]);
    setPianoPassed(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!step3Valid) return;
    setIsSubmitted(true);
    // TODO: wire to real endpoint
  };

  return (
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
                  "--balloon-y": "calc(-18% + 20px)",
                } as React.CSSProperties
              }
              aria-hidden
            />
          <div className="relative z-10 mx-auto flex max-w-2xl items-center justify-center gap-4">
            {[1, 2, 3].map((number) => {
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
                      {isComplete ? "✓" : number}
                    </div>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
                      {number === 1 && "Details"}
                      {number === 2 && "Address"}
                      {number === 3 && "Submit"}
                    </div>
                  </div>
                  {number !== 3 && (
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
                      placeholder="+1 (555) 444-1111"
                      value={state.phone}
                      onChange={(event) => setField("phone", event.target.value)}
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

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="text-base font-semibold" htmlFor="referral">
                    How did you hear about Simply Music?*
                  </label>
                  <div className="relative mt-2">
                    <select
                      id="referral"
                      className="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 pr-10 text-base outline-none transition focus:border-red-500"
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
                        Quick piano check
                      </p>
                      <p className="mt-1 text-base text-neutral-500">
                        Click the keys in order to play a D minor chord.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-base font-semibold text-red-600"
                      onClick={handleResetPiano}
                    >
                      Reset
                    </button>
                  </div>
                  <div className="relative mt-4 h-36 w-full">
                    <div className="flex h-36 gap-1">
                      {whiteKeys.map((note) => {
                        const isClicked = pianoSequence.includes(note);
                        return (
                          <button
                            key={note}
                            type="button"
                            onClick={() => handlePianoClick(note)}
                            className={`relative flex h-full flex-1 items-end justify-center rounded-b-lg border px-1 pb-3 text-lg font-semibold transition ${
                              pianoPassed
                                ? "border-green-500 bg-green-50 text-green-700"
                                : isClicked
                                  ? "border-red-500 bg-red-50 text-red-700"
                                  : "border-neutral-200 bg-white text-neutral-700 hover:border-red-400"
                            }`}
                            aria-pressed={isClicked}
                          >
                            {note}
                          </button>
                        );
                      })}
                    </div>
                    <div className="pointer-events-none absolute left-0 top-0 flex h-24 w-full">
                      {whiteKeys.map((note) => {
                        const hasBlack = note !== "E" && note !== "B";
                        if (!hasBlack) {
                          return (
                            <div key={`${note}-spacer`} className="flex-1" />
                          );
                        }
                        const blackNote =
                          note === "C"
                            ? "C#"
                            : note === "D"
                              ? "D#"
                              : note === "F"
                                ? "F#"
                                : note === "G"
                                  ? "G#"
                                  : "A#";
                        return (
                          <div key={`${note}-black`} className="flex-1">
                            <button
                              type="button"
                              onClick={() => handlePianoClick(blackNote)}
                              className={`pointer-events-auto mx-auto block h-24 w-8 rounded-b-md border border-neutral-800 bg-neutral-900 text-sm font-semibold text-white transition ${
                                pianoSequence.includes(blackNote)
                                  ? "border-red-500 bg-red-700"
                                  : "hover:bg-neutral-700"
                              }`}
                              aria-pressed={pianoSequence.includes(blackNote)}
                            >
                              {blackNote}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {pianoPassed ? (
                    <p className="mt-3 text-base font-semibold text-green-700">
                      Nice! You’re all set to submit.
                    </p>
                  ) : (
                    <p className="mt-3 text-base text-neutral-500">
                      Click the notes in order. If you miss, it resets.
                    </p>
                  )}
                </div>

                {isSubmitted && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
                    <p className="text-base font-semibold text-green-700">
                      Thanks! We’ll be in touch shortly.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="relative z-10 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button
                type="button"
                className={`min-w-[160px] rounded-full border px-6 py-2 text-base font-semibold transition ${
                  step === 1
                    ? "border-neutral-200 text-neutral-400"
                    : "border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
                onClick={handleBack}
                disabled={step === 1}
              >
                Back
              </button>
              {step < 3 && (
                <button
                  type="button"
                  className={`min-w-[160px] rounded-full px-6 py-2 text-base font-semibold text-white transition ${
                    (step === 1 && !step1Valid) || (step === 2 && !step2Valid)
                      ? "bg-red-300"
                      : "bg-red-600 hover:bg-red-500"
                  }`}
                  onClick={handleNext}
                  disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                >
                  Next
                </button>
              )}
              {step === 3 && (
                <button
                  type="submit"
                  className={`min-w-[160px] rounded-full px-6 py-2 text-base font-semibold text-white transition ${
                    step3Valid
                      ? "bg-red-600 hover:bg-red-500"
                      : "bg-red-300"
                  }`}
                  disabled={!step3Valid}
                >
                  Submit
                </button>
              )}
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
