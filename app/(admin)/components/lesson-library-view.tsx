'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import LockedSectionCard from './locked-section-card';
import LessonCartPurchaseButton from './lesson-cart-actions';
import {
  formatCurrency,
  formatTeacherPriceLabel,
  getSectionPriceForRole,
  hydrateSectionPriceOverrides,
} from './lesson-pricing';
import { AUTH_STORAGE_KEY, VIEW_ROLE_STORAGE_KEY } from './auth';
import { useLessonData } from './use-lesson-data';

const toProgramSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

type LessonLibraryViewProps = {
  basePath: string;
  showLocks?: boolean;
  showCartButton?: boolean;
  showPricing?: boolean;
};

function UnlockedSectionCard({
  programName,
  sectionName,
  href,
  showPricing,
}: {
  programName: string;
  sectionName: string;
  href: string;
  showPricing: boolean;
}) {
  const studentPrice = formatCurrency(
    getSectionPriceForRole('student', programName, sectionName),
  );
  const teacherPriceLabel = formatTeacherPriceLabel(programName, sectionName);

  return (
    <Link
      href={href}
      className="block w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 text-left transition hover:border-white hover:bg-[var(--c-fcfcfb)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--c-2d6a4f)]">
            {sectionName}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--c-2d6a4f)]">
            View materials
          </p>
        </div>
        {showPricing ? (
          <div className="flex flex-col items-end gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-f3f4f6)] px-3.5 py-1.5 font-semibold text-[var(--c-3a3935)]">
              Student {studentPrice}
            </span>
            <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-f3f4f6)] px-3.5 py-1.5 font-semibold text-[var(--c-3a3935)]">
              Teacher {teacherPriceLabel}
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export default function LessonLibraryView({
  basePath,
  showLocks = true,
  showCartButton = false,
  showPricing = false,
}: LessonLibraryViewProps) {
  const { lessonTypes, lessonSections } = useLessonData();
  const [actionLabel, setActionLabel] = useState('Update');
  const [showSpecialActions, setShowSpecialActions] = useState(true);
  const [, setPricingVersion] = useState(0);

  useEffect(() => {
    try {
      if (basePath.startsWith('/students')) {
        setActionLabel('View all');
        setShowSpecialActions(false);
        return;
      }
      if (basePath.startsWith('/teachers')) {
        setActionLabel('View all');
        setShowSpecialActions(true);
        return;
      }
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) {
        setActionLabel('Update');
        setShowSpecialActions(true);
        return;
      }
      const parsed = JSON.parse(stored) as { role?: string };
      const role = parsed?.role ?? null;
      if (role === 'company') {
        const viewRole = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
        const isTeacherOrStudent = viewRole === 'teacher' || viewRole === 'student';
        setActionLabel(isTeacherOrStudent ? 'View all' : 'Update');
        setShowSpecialActions(viewRole !== 'student');
        return;
      }
      setActionLabel(role === 'teacher' || role === 'student' ? 'View all' : 'Update');
      setShowSpecialActions(role !== 'student');
    } catch {
      setActionLabel('Update');
      setShowSpecialActions(true);
    }
  }, []);

  useEffect(() => {
    const handlePricingUpdate = () => {
      setPricingVersion(version => version + 1);
    };
    window.addEventListener('sm-pricing-updated', handlePricingUpdate);
    void hydrateSectionPriceOverrides();
    return () => {
      window.removeEventListener('sm-pricing-updated', handlePricingUpdate);
    };
  }, []);

  const renderSectionCard = (
    programName: string,
    sectionName: string,
    href: string,
  ) =>
    showLocks ? (
      <LockedSectionCard
        programName={programName}
        sectionName={sectionName}
        href={href}
      />
    ) : (
      <UnlockedSectionCard
        programName={programName}
        sectionName={sectionName}
        href={href}
        showPricing={showPricing}
      />
    );

  return (
    <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
        <div className="md:pr-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Curriculum
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
            Program Library
          </h2>
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
            Browse each program and open a section to see materials.
          </p>
        </div>
        {showCartButton ? (
          <div className="md:flex md:justify-end">
            <div className="md:sticky md:top-4 md:w-1/2">
              <LessonCartPurchaseButton className="w-full" />
            </div>
          </div>
        ) : null}
      </div>
      <div className="mt-6 space-y-6">
        {lessonTypes
          .filter(
            type => type !== 'Learn-at-Home' && type !== 'Simply Music Gateway',
          )
          .map(type => {
            const sectionData =
              (lessonSections[type as keyof typeof lessonSections] as
                | string[]
                | Record<string, string[]>
                | undefined) ?? [];
            const sections = Array.isArray(sectionData)
              ? sectionData
              : sectionData
                ? Object.values(sectionData).flat()
                : [];
            return (
              <div
                key={type}
                id={
                  type === 'Development Program' ? 'development-program' : undefined
                }
                className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="w-full">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                      {type}
                    </p>
                    <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                      {sections.length > 0
                        ? 'Choose a section to view materials.'
                        : 'No sections available yet.'}
                    </p>
                    {type === 'Extensions Program' ? (
                      <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                        The Extensions Program is a further collection of
                        pieces that provide additional source material for both
                        beginning or more advanced students. It consists of new
                        or re-purposed compositions and arrangements, many of
                        which have two or three presentation versions provided,
                        each pertaining to students who may be at different
                        stages of their learning.
                      </p>
                    ) : null}
                  </div>
                  <div className="sm:pt-1">
                    <Link
                      href={`${basePath}/${toProgramSlug(type)}`}
                      className="inline-flex items-center whitespace-nowrap rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1.5 text-[12px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                    >
                      {actionLabel}
                    </Link>
                  </div>
                </div>
                {sections.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                    {Array.isArray(sectionData) ? (
                      <>
                        <div className="min-w-0 space-y-4">
                          {sections
                            .slice(0, Math.ceil(sections.length / 2))
                            .map(section => (
                              <div key={section}>
                                {renderSectionCard(
                                  type,
                                  section,
                                  `${basePath}/${toProgramSlug(type)}/${toProgramSlug(section)}`,
                                )}
                              </div>
                            ))}
                        </div>
                        <div className="min-w-0 space-y-4">
                          {sections
                            .slice(Math.ceil(sections.length / 2))
                            .map(section => (
                              <div key={section}>
                                {renderSectionCard(
                                  type,
                                  section,
                                  `${basePath}/${toProgramSlug(type)}/${toProgramSlug(section)}`,
                                )}
                              </div>
                            ))}
                        </div>
                      </>
                    ) : (
                      <div className="col-span-full space-y-10">
                        {Object.entries(sectionData ?? {}).map(
                          ([group, groupSections]) => (
                            <div key={group} className="space-y-4">
                              <p className="text-sm font-semibold tracking-[0.2em] text-white">
                                {group}
                              </p>
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {groupSections.map(section => (
                                  <div key={section}>
                                    {renderSectionCard(
                                      type,
                                      section,
                                      `${basePath}/${toProgramSlug(type)}/${toProgramSlug(section)}`,
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                  Special Needs Program
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                  Simply Music Gateway
                </p>
              </div>
              {showSpecialActions ? (
                <Link
                  href={`${basePath}/${toProgramSlug('Simply Music Gateway')}`}
                  className="inline-flex items-center whitespace-nowrap rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1.5 text-[12px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                >
                  {actionLabel}
                </Link>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              The Simply Music Gateway Program is a playing-based piano
              method designed for anybody with special needs and learning
              differences, including those on the Autism spectrum, as well
              as those with learning disabilities, neurological dysfunction,
              developmental delays, and ADHD.
            </p>
            <div className="mt-4">
              {renderSectionCard(
                'Simply Music Gateway',
                'Materials',
                `${basePath}/${toProgramSlug('Simply Music Gateway')}/${toProgramSlug('Materials')}`,
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Self-Study Programs
              </p>
              {showSpecialActions ? (
                <Link
                  href={`${basePath}/${toProgramSlug('Learn-at-Home')}`}
                  className="inline-flex items-center whitespace-nowrap rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1.5 text-[12px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                >
                  {actionLabel}
                </Link>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1.5 text-xs font-semibold text-[var(--c-1f1f1d)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]">
                Music &amp; Creativity
              </button>
              <Link
                href={`${basePath}/${toProgramSlug('Learn-at-Home')}/${toProgramSlug('Materials')}`}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1.5 text-xs font-semibold text-[var(--c-1f1f1d)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
              >
                Learn-at-Home
              </Link>
            </div>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Many students who complete our self-study programs continue
              into lessons with a Simply Music Teacher. So you are aware of
              the content provided, you may access these programs for
              reference in case you acquire a self-study student.
            </p>
            <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
              We highly recommend that you create your own free Music &amp;
              Creativity Program (MAC) account and familiarize yourself
              with the contents. MAC replaces a prior self-study course,
              the Learn-at-Home Program (LAH), that was produced and
              released in 1999.
            </p>
            <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
              For more information on self-study programs please review the
              Extras portion of Module 10 of the Initial Teacher Training
              Program (ITTP).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
