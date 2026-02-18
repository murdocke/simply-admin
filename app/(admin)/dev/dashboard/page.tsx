'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  buildGraduatedTierBreakdown,
  calculateEcosystemModel,
  defaultEcosystemInputs,
  formatCurrency,
  formatPercent,
  type EcosystemInputs,
} from '@/lib/ecosystem-model';

const STORAGE_KEY = 'ecosystem_model_inputs';

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)] [[data-theme=dark]_&]:border-[var(--c-e5e3dd)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
        {title}
      </p>
      <p className="mt-3 text-xl font-semibold text-[var(--c-1f1f1d)]">
        {value}
      </p>
      {description ? (
        <p className="mt-2 text-xs text-[var(--c-7a776f)]">{description}</p>
      ) : null}
    </div>
  );
}

export default function DevDashboardPage() {
  const formatNumber = (value: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
      Number.isFinite(value) ? value : 0,
    );
  const [ecosystemInputs, setEcosystemInputs] =
    useState<EcosystemInputs>(defaultEcosystemInputs);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        setEcosystemInputs({ ...defaultEcosystemInputs, ...parsed });
      }
    } catch {
      // ignore invalid stored values
    }
  }, []);

  const ecosystemModel = useMemo(
    () => calculateEcosystemModel(ecosystemInputs),
    [ecosystemInputs],
  );
  const totalStudents = ecosystemModel.totalStudents;
  const payingStudents =
    totalStudents * (ecosystemInputs.avgStudentTuitionAdoptionRatePercent / 100);
  const tuitionMonthlyVolume = ecosystemModel.monthlyTuitionVolume;
  const stripeMonthlyShare = ecosystemModel.usStripeShare / 12;
  const lessonPackMonthlyRevenue = ecosystemModel.monthlyPackRevenue;
  const lessonPackCompanyMonthly = ecosystemModel.companyPackShare / 12;
  const lessonPackCcMonthly = ecosystemModel.usPackShare / 12;
  const lessonPackCreatorMonthly = ecosystemModel.creatorPackShare / 12;
  const subscriptionAnnual = ecosystemModel.annualSubscriptionRevenue;
  const curriculumAnnual = ecosystemInputs.annualCurriculumEstimate;
  const teachersUsingRoom = ecosystemModel.teachersUsingRoom;
  const onlineRoomMonthlyRevenue = ecosystemModel.annualRoomRevenue / 12;
  const onlineRoomCcMonthly = ecosystemModel.usRoomShare / 12;
  const subscriptionMonthly = ecosystemModel.annualSubscriptionRevenue / 12;
  const curriculumMonthly = ecosystemInputs.annualCurriculumEstimate / 12;
  const licenseMonthly =
    ecosystemInputs.teacherCount * ecosystemInputs.teacherLicenseFee;
  const graduatedTierBreakdown = useMemo(() => {
    const baseRevenue =
      subscriptionMonthly + curriculumMonthly + licenseMonthly;
    return buildGraduatedTierBreakdown(baseRevenue, {
      firstPercent: ecosystemInputs.graduatedRateFirstPercent,
      secondPercent: ecosystemInputs.graduatedRateSecondPercent,
      thirdPercent: ecosystemInputs.graduatedRateThirdPercent,
      abovePercent: ecosystemInputs.graduatedRateAbovePercent,
    });
  }, [
    subscriptionMonthly,
    curriculumMonthly,
    licenseMonthly,
    ecosystemInputs.graduatedRateFirstPercent,
    ecosystemInputs.graduatedRateSecondPercent,
    ecosystemInputs.graduatedRateThirdPercent,
    ecosystemInputs.graduatedRateAbovePercent,
  ]);
  const effectiveRate = graduatedTierBreakdown.effectiveRate;
  const ccCoSubscriptionMonthly = subscriptionMonthly * effectiveRate;
  const ccCoCurriculumMonthly = curriculumMonthly * effectiveRate;
  const ccCoLicenseMonthly = licenseMonthly * effectiveRate;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-white p-6 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)] [[data-theme=dark]_&]:border-[var(--c-e5e3dd)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
            Dashboard
          </h1>
          <div className="flex flex-wrap gap-3">
            <a
              href="/company/what-we-offer"
              className="inline-flex items-center justify-center rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
            >
              What We Offer
            </a>
            <a
              href="/company/features-overview"
              className="inline-flex items-center justify-center rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
            >
              Features Overview
            </a>
            <a
              href="/company/whats-next"
              className="inline-flex items-center justify-center rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
            >
              What&#39;s Next
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-white p-6 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)] [[data-theme=dark]_&]:border-[var(--c-e5e3dd)]">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Strategy
          </p>
          <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
            Ecosystem Revenue Strategy Overview
          </h2>
          <p className="text-sm text-[var(--c-6f6c65)]">
            Breakdown of primary revenue streams, partnership positioning, and
            value alignment with Simply Music.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <article className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-efece6)] [[data-theme=dark]_&]:border-[var(--c-e5e3dd)]">
            <h3 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
              Stripe Processing Share
            </h3>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              <span className="font-semibold text-[var(--c-1f1f1d)]">
                Summary:
              </span>{' '}
              1% share of tuition volume flowing through the platform.
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              <span className="font-semibold text-[var(--c-1f1f1d)]">
                Why It Is Profitable:
              </span>{' '}
              Scales automatically with student growth and tuition increases. No
              added friction to teachers.
            </p>
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Show Strategic Talking Points
              </summary>
              <div className="mt-3 grid gap-3 text-sm text-[var(--c-6f6c65)]">
                <div>
                  <p className="font-semibold text-[var(--c-1f1f1d)]">
                    Key Talking Points for Simply Music
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>We do not increase processing costs.</li>
                    <li>We help optimize billing systems.</li>
                    <li>We ensure compliance, reporting, automation.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[var(--c-1f1f1d)]">
                    How It Helps Simply Music
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>Increased teacher retention via better billing tools.</li>
                    <li>Reduced admin burden.</li>
                    <li>Transparent reporting.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[var(--c-1f1f1d)]">
                    How It Helps CleanCommit / CC.CO
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>Predictable recurring revenue.</li>
                    <li>Direct scaling with ecosystem growth.</li>
                  </ul>
                </div>
              </div>
            </details>
            <div className="mt-4 rounded-2xl border-l-4 border-[var(--c-c8102e)] bg-[var(--c-f7f7f5)] px-4 py-3 text-sm text-[var(--c-6f6c65)] [[data-theme=dark]_&]:bg-[var(--c-e7e4de)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Example
              </p>
              <p className="mt-2">
                If <span className="font-semibold">
                  {formatNumber(payingStudents)}
                </span>{' '}
                students pay{' '}
                <span className="font-semibold">
                  {formatCurrency(ecosystemInputs.avgStudentTuitionMonthly)}/month
                </span>
                :{' '}
                <span className="font-semibold">
                  {formatCurrency(tuitionMonthlyVolume)}
                </span>{' '}
                monthly volume. <span className="font-semibold">1%</span> share =
                <span className="font-semibold">
                  {formatCurrency(stripeMonthlyShare)}
                </span>{' '}
                monthly. No additional burden on teachers.
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-efece6)] [[data-theme=dark]_&]:border-[var(--c-e5e3dd)]">
            <h3 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
              Lesson Packs (65 / 25 / 10 Split)
            </h3>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              <span className="font-semibold text-[var(--c-1f1f1d)]">
                Summary:
              </span>{' '}
              Digital curriculum expansion built on platform infrastructure.
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              <span className="font-semibold text-[var(--c-1f1f1d)]">
                Why It Is Profitable:
              </span>{' '}
              High margin. Recurring potential. Creator-driven growth.
            </p>
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Show Strategic Talking Points
              </summary>
              <div className="mt-3 grid gap-3 text-sm text-[var(--c-6f6c65)]">
                <div>
                  <p className="font-semibold text-[var(--c-1f1f1d)]">
                    Key Talking Points for Simply Music
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>Encourages teacher creativity.</li>
                    <li>Drives internal content economy.</li>
                    <li>Expands revenue beyond subscriptions.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[var(--c-1f1f1d)]">
                    How It Helps Simply Music
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>New revenue channel.</li>
                    <li>Increases student engagement.</li>
                    <li>Reduces churn.</li>
                    <li>Creates internal stars (teacher creators).</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[var(--c-1f1f1d)]">
                    How It Helps CleanCommit / CC.CO
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>Infrastructure monetization.</li>
                    <li>Scales without operational cost increase.</li>
                  </ul>
                </div>
              </div>
            </details>
            <div className="mt-4 rounded-2xl border-l-4 border-[var(--c-c8102e)] bg-[var(--c-f7f7f5)] px-4 py-3 text-sm text-[var(--c-6f6c65)] [[data-theme=dark]_&]:bg-[var(--c-e7e4de)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Example
              </p>
              <p className="mt-2">
                If <span className="font-semibold">
                  {formatPercent(ecosystemInputs.lessonPackAdoptionRatePercent / 100)}
                </span>{' '}
                of <span className="font-semibold">{formatNumber(totalStudents)}</span>{' '}
                students buy a{' '}
                <span className="font-semibold">
                  {formatCurrency(ecosystemInputs.lessonPackPrice)}
                </span>{' '}
                pack:{' '}
                <span className="font-semibold">
                  {formatCurrency(lessonPackMonthlyRevenue)}
                </span>{' '}
                monthly. Company keeps{' '}
                <span className="font-semibold">
                  {formatCurrency(lessonPackCompanyMonthly)}
                </span>
                . We receive{' '}
                <span className="font-semibold">
                  {formatCurrency(lessonPackCcMonthly)}
                </span>
                . Creators receive{' '}
                <span className="font-semibold">
                  {formatCurrency(lessonPackCreatorMonthly)}
                </span>
                .
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-efece6)] [[data-theme=dark]_&]:border-[var(--c-e5e3dd)]">
            <h3 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
              Subscription % (Graduated Model)
            </h3>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              <span className="font-semibold text-[var(--c-1f1f1d)]">
                Summary:
              </span>{' '}
              Performance-based partnership scaling with revenue growth.
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              <span className="font-semibold text-[var(--c-1f1f1d)]">
                Why It Is Profitable:
              </span>{' '}
              Predictable base revenue. Decreases as revenue scales.
            </p>
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Show Strategic Talking Points
              </summary>
              <div className="mt-3 grid gap-3 text-sm text-[var(--c-6f6c65)]">
                <div>
                  <p className="font-semibold text-[var(--c-1f1f1d)]">
                    Key Talking Points for Simply Music
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>We grow with you.</li>
                    <li>We are more than a processor.</li>
                    <li>We support product, billing, growth systems.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[var(--c-1f1f1d)]">
                    How It Helps Simply Music
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>Long-term aligned incentives.</li>
                    <li>Stable infrastructure partner.</li>
                    <li>Scalable without renegotiation.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[var(--c-1f1f1d)]">
                    How It Helps CleanCommit / CC.CO
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>Foundational recurring revenue.</li>
                    <li>Supports ongoing development and support.</li>
                  </ul>
                </div>
              </div>
            </details>
            <div className="mt-4 rounded-2xl border-l-4 border-[var(--c-c8102e)] bg-[var(--c-f7f7f5)] px-4 py-3 text-sm text-[var(--c-6f6c65)] [[data-theme=dark]_&]:bg-[var(--c-e7e4de)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Example
              </p>
              <p className="mt-2">
                At{' '}
                <span className="font-semibold">
                  {formatCurrency(subscriptionAnnual)}
                </span>{' '}
                annual subscription revenue: Graduated tiers apply. Effective
                rate decreases as revenue increases.
              </p>
            </div>
            <div className="mt-6 rounded-2xl border border-[var(--c-ecebe7)] bg-white p-5 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)] [[data-theme=dark]_&]:border-[var(--c-e5e3dd)]">
              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--c-7a776f)]">
                  Graduated Percentage Model
                </h4>
                <p className="text-sm text-[var(--c-7a776f)]">
                  Subscription + Curriculum + Licenses total (monthly):
                  <span className="ml-2 font-semibold text-[var(--c-1f1f1d)]">
                    {formatCurrency(
                      subscriptionMonthly + curriculumMonthly + licenseMonthly,
                    )}
                  </span>
                </p>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <SummaryCard
                  title="Simply Music Total"
                  value={formatCurrency(subscriptionMonthly)}
                  description={`Subscription Monthly · CC.CO ${formatCurrency(
                    ccCoSubscriptionMonthly,
                  )}`}
                />
                <SummaryCard
                  title="Simply Music Total"
                  value={formatCurrency(curriculumMonthly)}
                  description={`Curriculum Monthly · CC.CO ${formatCurrency(
                    ccCoCurriculumMonthly,
                  )}`}
                />
                <SummaryCard
                  title="Simply Music Total"
                  value={formatCurrency(licenseMonthly)}
                  description={`Licenses Monthly · CC.CO ${formatCurrency(
                    ccCoLicenseMonthly,
                  )}`}
                />
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--c-ecebe7)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--c-fafafa)] text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)] [[data-theme=dark]_&]:bg-[var(--c-efece6)]">
                    <tr>
                      <th className="px-4 py-3">Tier</th>
                      <th className="px-4 py-3">Rate</th>
                      <th className="px-4 py-3">Revenue In Tier</th>
                      <th className="px-4 py-3">CC.CO Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--c-1f1f1d)]">
                    {graduatedTierBreakdown.tiers.map(tier => (
                      <tr
                        key={tier.label}
                        className="border-t border-[var(--c-ecebe7)]"
                      >
                        <td className="px-4 py-3 font-semibold">{tier.label}</td>
                        <td className="px-4 py-3">{formatPercent(tier.rate)}</td>
                        <td className="px-4 py-3">
                          {formatCurrency(tier.revenueInTier)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-700">
                          {formatCurrency(tier.ccCoCut)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] [[data-theme=dark]_&]:bg-[var(--c-efece6)]">
                      <td className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                        Total
                      </td>
                      <td className="px-4 py-3 text-[var(--c-7a776f)]">
                        {formatPercent(graduatedTierBreakdown.effectiveRate)}
                      </td>
                      <td className="px-4 py-3 text-[var(--c-7a776f)]">
                        {formatCurrency(
                          subscriptionMonthly +
                            curriculumMonthly +
                            licenseMonthly,
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">
                        {formatCurrency(graduatedTierBreakdown.totalCcCoCut)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-efece6)] [[data-theme=dark]_&]:border-[var(--c-e5e3dd)]">
            <h3 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
              Curriculum Percentage
            </h3>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              <span className="font-semibold text-[var(--c-1f1f1d)]">
                Summary:
              </span>{' '}
              Share of legacy curriculum sales flowing through the platform.
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              <span className="font-semibold text-[var(--c-1f1f1d)]">
                Why It Is Profitable:
              </span>{' '}
              Stable revenue line. Existing demand.
            </p>
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Show Strategic Talking Points
              </summary>
              <div className="mt-3 grid gap-3 text-sm text-[var(--c-6f6c65)]">
                <div>
                  <p className="font-semibold text-[var(--c-1f1f1d)]">
                    Key Talking Points for Simply Music
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>We modernize packaging.</li>
                    <li>We increase discoverability.</li>
                    <li>We enable digital expansion.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[var(--c-1f1f1d)]">
                    How It Helps Simply Music
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>Increases curriculum visibility.</li>
                    <li>Better tracking and reporting.</li>
                    <li>Opportunity to convert to lesson packs.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[var(--c-1f1f1d)]">
                    How It Helps CleanCommit / CC.CO
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>Modest but steady revenue.</li>
                    <li>Ties legacy system into platform.</li>
                  </ul>
                </div>
              </div>
            </details>
            <div className="mt-4 rounded-2xl border-l-4 border-[var(--c-c8102e)] bg-[var(--c-f7f7f5)] px-4 py-3 text-sm text-[var(--c-6f6c65)] [[data-theme=dark]_&]:bg-[var(--c-e7e4de)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Example
              </p>
              <p className="mt-2">
                If annual curriculum sales are{' '}
                <span className="font-semibold">
                  {formatCurrency(curriculumAnnual)}
                </span>
                : Top-tier rate yields approximately{' '}
                <span className="font-semibold">
                  {formatPercent(ecosystemInputs.graduatedRateAbovePercent / 100)}
                </span>
                .{' '}
                <span className="font-semibold">
                  {formatCurrency(
                    curriculumAnnual * (ecosystemInputs.graduatedRateAbovePercent / 100),
                  )}
                </span>{' '}
                annual share.
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-efece6)] [[data-theme=dark]_&]:border-[var(--c-e5e3dd)]">
            <h3 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
              Online Lesson Room
            </h3>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              <span className="font-semibold text-[var(--c-1f1f1d)]">
                Summary:
              </span>{' '}
              Optional add-on for virtual teaching and hybrid models.
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              <span className="font-semibold text-[var(--c-1f1f1d)]">
                Why It Is Profitable:
              </span>{' '}
              Subscription-style add-on. Scales with teacher adoption.
            </p>
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Show Strategic Talking Points
              </summary>
              <div className="mt-3 grid gap-3 text-sm text-[var(--c-6f6c65)]">
                <div>
                  <p className="font-semibold text-[var(--c-1f1f1d)]">
                    Key Talking Points for Simply Music
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>Enables remote flexibility.</li>
                    <li>Monetizes hybrid teaching.</li>
                    <li>Adds premium tier opportunity.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[var(--c-1f1f1d)]">
                    How It Helps Simply Music
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>Expands teacher reach.</li>
                    <li>Enables makeup lessons.</li>
                    <li>Protects revenue during illness/weather.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[var(--c-1f1f1d)]">
                    How It Helps CleanCommit / CC.CO
                  </p>
                  <ul className="mt-2 list-disc pl-5">
                    <li>Infrastructure monetization.</li>
                    <li>Higher platform stickiness.</li>
                  </ul>
                </div>
              </div>
            </details>
            <div className="mt-4 rounded-2xl border-l-4 border-[var(--c-c8102e)] bg-[var(--c-f7f7f5)] px-4 py-3 text-sm text-[var(--c-6f6c65)] [[data-theme=dark]_&]:bg-[var(--c-e7e4de)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Example
              </p>
              <p className="mt-2">
                If <span className="font-semibold">
                  {formatPercent(ecosystemInputs.percentTeachersUsingOnlineRoom / 100)}
                </span>{' '}
                of <span className="font-semibold">
                  {formatNumber(ecosystemInputs.teacherCount)}
                </span>{' '}
                teachers adopt{' '}
                <span className="font-semibold">
                  {formatCurrency(ecosystemInputs.onlineRoomMonthlyCost)}/month
                </span>
                :{' '}
                <span className="font-semibold">
                  {formatNumber(teachersUsingRoom)}
                </span>{' '}
                teachers.{' '}
                <span className="font-semibold">
                  {formatCurrency(onlineRoomMonthlyRevenue)}
                </span>{' '}
                monthly revenue. We receive{' '}
                <span className="font-semibold">
                  {formatPercent(ecosystemInputs.onlineRoomUsSharePercent / 100)}
                </span>{' '}
                infrastructure share (
                <span className="font-semibold">
                  {formatCurrency(onlineRoomCcMonthly)}
                </span>
                ).
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
