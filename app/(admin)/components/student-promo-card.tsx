'use client';

import { useEffect, useState } from 'react';

type StudentPromoCardProps = {
  imageSrc?: string;
  imageAlt?: string;
  imageFit?: 'cover' | 'contain';
  imageFrame?: 'none' | 'white';
  pillLabel?: string;
  eyebrowLabel?: string;
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export default function StudentPromoCard({
  imageSrc = '/reference/JAZZ-COLORS.png',
  imageAlt = 'Jazzy lesson pack preview',
  imageFit = 'cover',
  imageFrame = 'none',
  pillLabel = 'New Pack',
  eyebrowLabel = 'Lesson Added',
  title = 'New Lesson Pack: Jazz Colors',
  body = 'Swing into a fresh set of grooves, chords, and riffs. This pack is made for quick wins and big sound — even in your first week.',
  ctaLabel = 'View Lesson Pack Details',
  ctaHref = '/students/lesson-library',
}: StudentPromoCardProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const frameClass =
    imageFrame === 'white' ? 'bg-white p-3' : '';
  const fitClass = imageFit === 'contain' ? 'object-contain' : 'object-cover';
  const overlayClass =
    theme === 'dark'
      ? 'bg-[linear-gradient(180deg,rgba(0,0,0,0.35),rgba(0,0,0,0.82))]'
      : 'bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(0,0,0,0.2))]';

  useEffect(() => {
    const getTheme = () =>
      document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    setTheme(getTheme());
    const observer = new MutationObserver(() => {
      setTheme(getTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] ring-1 ring-[var(--c-ecebe7)]">
      <div className={`relative h-36 overflow-hidden ${frameClass}`}>
        <img
          src={imageSrc}
          alt={imageAlt}
          className={`h-full w-full ${fitClass}`}
        />
        <div className={`absolute inset-0 ${overlayClass}`} />
        <div
          className={`absolute bottom-3 left-4 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.32em] shadow-[0_16px_28px_-16px_rgba(0,0,0,0.75)] ${
            theme === 'dark'
              ? 'border-white/50 bg-white/10 text-white'
              : 'border-black/15 bg-white/70 text-[var(--c-3a3935)]'
          }`}
        >
          {pillLabel}
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          {eyebrowLabel}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
          {title}
        </h3>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">{body}</p>
        <a
          href={ctaHref}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-[var(--c-1f1f1d)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
        >
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}
