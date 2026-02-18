'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  buildProjectionData,
  buildGraduatedTierBreakdown,
  calculateGraduatedRevenueCut,
  calculateEcosystemModel,
  defaultEcosystemInputs,
  formatCurrency,
  formatPercent,
  type EcosystemInputs,
  type ProjectionPoint,
} from '@/lib/ecosystem-model';

const STORAGE_KEY = 'ecosystem_model_inputs';

function InputField({
  label,
  value,
  onChange,
  helper,
  step = '1',
  min,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helper?: string;
  step?: string;
  min?: number;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-[var(--c-3a3935)]">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
        {label}
      </span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        step={step}
        onChange={event => onChange(Number(event.target.value))}
        className="rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2.5 text-sm text-[var(--c-1f1f1d)] shadow-sm focus:border-[var(--sidebar-accent-border)] focus:outline-none [[data-theme=dark]_&]:bg-[var(--c-efece6)] [[data-theme=dark]_&]:border-[var(--c-e5e3dd)]"
      />
      {helper ? (
        <span className="text-xs text-[var(--c-7a776f)]">{helper}</span>
      ) : null}
    </label>
  );
}

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
    <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
        {title}
      </p>
      <p className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
        {value}
      </p>
      {description ? (
        <p className="mt-2 text-xs text-[var(--c-7a776f)]">{description}</p>
      ) : null}
    </div>
  );
}

function RevenueStreamCard({
  title,
  ccCoMonthly,
  smMonthly,
  heat,
}: {
  title: string;
  ccCoMonthly: number;
  smMonthly: number;
  heat: number;
}) {
  const clampedHeat = Math.min(1, Math.max(0, heat));
  const mix = (from: number, to: number) =>
    Math.round(from + (to - from) * clampedHeat);
  const heatColor = `rgba(${mix(239, 34)}, ${mix(68, 197)}, ${mix(68, 94)}, ${
    0.12 + clampedHeat * 0.22
  })`;

  return (
    <div
      className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4 shadow-sm transition-colors [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)]"
      style={{ backgroundColor: heatColor }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
        {title}
      </p>
      <div className="mt-3 grid gap-2 text-sm text-[var(--c-1f1f1d)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
            CC.CO
          </span>
          <span className="text-lg font-semibold">
            {formatCurrency(ccCoMonthly)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
            SM
          </span>
          <span className="text-lg font-semibold">
            {formatCurrency(smMonthly)}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-[var(--c-7a776f)]">Monthly totals</p>
    </div>
  );
}

export default function EcosystemModelPage() {
  const [inputs, setInputs] = useState<EcosystemInputs>(defaultEcosystemInputs);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        setInputs({ ...defaultEcosystemInputs, ...parsed });
      }
    } catch {
      // ignore invalid stored values
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  const model = useMemo(() => calculateEcosystemModel(inputs), [inputs]);
  const projectionData = useMemo(() => buildProjectionData(inputs), [inputs]);
  const yearOneSubscriptionLicenseCurriculum = useMemo(() => {
    const annualTeacherLicense =
      inputs.teacherCount * inputs.teacherLicenseFee * 12;
    const companyTotal =
      model.annualSubscriptionRevenue +
      annualTeacherLicense +
      inputs.annualCurriculumEstimate;
    const softwareFeesMonthly =
      model.annualSubscriptionRevenue / 12 +
      inputs.annualCurriculumEstimate / 12 +
      inputs.teacherCount * inputs.teacherLicenseFee;
    const ccCoMonthly = calculateGraduatedRevenueCut(softwareFeesMonthly, {
      firstPercent: inputs.graduatedRateFirstPercent,
      secondPercent: inputs.graduatedRateSecondPercent,
      thirdPercent: inputs.graduatedRateThirdPercent,
      abovePercent: inputs.graduatedRateAbovePercent,
    }).totalUsCut;
    const usTotal = ccCoMonthly * 12;
    return { companyTotal, usTotal };
  }, [
    inputs.teacherCount,
    inputs.teacherLicenseFee,
    inputs.annualCurriculumEstimate,
    model.annualSubscriptionRevenue,
  ]);
  const graduatedTierBreakdown = useMemo(() => {
    const subscriptionGrossMonthly = model.annualSubscriptionRevenue / 12;
    const curriculumGrossMonthly = inputs.annualCurriculumEstimate / 12;
    const licenseMonthly = inputs.teacherCount * inputs.teacherLicenseFee;
    const baseRevenue =
      subscriptionGrossMonthly + curriculumGrossMonthly + licenseMonthly;
    return buildGraduatedTierBreakdown(baseRevenue, {
      firstPercent: inputs.graduatedRateFirstPercent,
      secondPercent: inputs.graduatedRateSecondPercent,
      thirdPercent: inputs.graduatedRateThirdPercent,
      abovePercent: inputs.graduatedRateAbovePercent,
    });
  }, [
    model.annualSubscriptionRevenue,
    inputs.annualCurriculumEstimate,
    inputs.teacherCount,
    inputs.teacherLicenseFee,
    inputs.graduatedRateFirstPercent,
    inputs.graduatedRateSecondPercent,
    inputs.graduatedRateThirdPercent,
    inputs.graduatedRateAbovePercent,
  ]);

  const handleNumberChange = (key: keyof EcosystemInputs) => (value: number) => {
    setInputs(prev => ({
      ...prev,
      [key]: Number.isFinite(value) ? value : 0,
    }));
  };

  const licenseMonthly = inputs.teacherCount * inputs.teacherLicenseFee;
  const subscriptionMonthly = model.annualSubscriptionRevenue / 12;
  const curriculumMonthly = inputs.annualCurriculumEstimate / 12;
  const softwareFeesMonthly =
    subscriptionMonthly + curriculumMonthly + licenseMonthly;
  const graduatedSoftwareMonthly = calculateGraduatedRevenueCut(softwareFeesMonthly, {
    firstPercent: inputs.graduatedRateFirstPercent,
    secondPercent: inputs.graduatedRateSecondPercent,
    thirdPercent: inputs.graduatedRateThirdPercent,
    abovePercent: inputs.graduatedRateAbovePercent,
  });
  const ccCoSubscriptionMonthly =
    subscriptionMonthly * graduatedSoftwareMonthly.effectiveRate;
  const ccCoLicenseMonthly =
    licenseMonthly * graduatedSoftwareMonthly.effectiveRate;
  const ccCoCurriculumMonthly =
    curriculumMonthly * graduatedSoftwareMonthly.effectiveRate;
  const revenueStreams = [
    {
      title: 'Lesson Packs',
      ccCoMonthly: model.usPackShare / 12,
      smMonthly: model.annualPackRevenue / 12,
    },
    {
      title: 'Subscription %',
      ccCoMonthly: model.subscriptionGraduatedCut / 12,
      smMonthly: model.annualSubscriptionRevenue / 12,
    },
    {
      title: 'Stripe Share',
      ccCoMonthly: model.usStripeShare / 12,
      smMonthly: model.usStripeShare / 12,
    },
    {
      title: 'Online Room',
      ccCoMonthly: model.usRoomShare / 12,
      smMonthly: model.annualRoomRevenue / 12,
    },
    {
      title: 'Curriculum %',
      ccCoMonthly:
        (model.curriculumIncludedInGraduated ? 0 : model.annualCurriculumUsShare) /
        12,
      smMonthly: inputs.annualCurriculumEstimate / 12,
    },
    {
      title: 'Lesson Fees',
      ccCoMonthly: ccCoLicenseMonthly,
      smMonthly: licenseMonthly,
    },
  ];
  const revenueTotals = revenueStreams.map(
    stream => stream.ccCoMonthly + stream.smMonthly,
  );
  const minRevenue = Math.min(...revenueTotals);
  const maxRevenue = Math.max(...revenueTotals);

  return (
    <div className="space-y-10 text-[1.3rem] leading-relaxed [&_p]:text-[1.3rem] [&_span]:text-[1.3rem] [&_label]:text-[1.3rem] [&_th]:text-[0.95rem] [&_td]:text-[1.2rem] [&_input]:text-[1.2rem] [&_h1]:text-[1.3rem] [&_h2]:text-[0.9rem]">
      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-white/90 p-6 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)]">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-7a776f)]">
            /ecosystem-model
          </p>
          <h1 className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
            Simply Music Ecosystem Revenue Model
          </h1>
          <p className="text-sm text-[var(--c-7a776f)]">
            Adjust the assumptions below to model subscription, tuition, lesson pack,
            curriculum, and online room revenue. Calculations update instantly.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-5 [[data-theme=dark]_&]:bg-[var(--c-efece6)]">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Core Network Inputs
            </h2>
            <div className="mt-4 grid gap-4">
              <InputField
                label="Teacher Count"
                value={inputs.teacherCount}
                onChange={handleNumberChange('teacherCount')}
              />
              <InputField
                label="Avg Students/Teacher"
                value={inputs.avgStudentsPerTeacher}
                onChange={handleNumberChange('avgStudentsPerTeacher')}
                step="0.1"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-5 [[data-theme=dark]_&]:bg-[var(--c-efece6)]">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Subscription Pricing
            </h2>
            <div className="mt-4 grid gap-4">
              <InputField
                label="Teacher Per Student"
                value={inputs.studentFeeNine}
                onChange={handleNumberChange('studentFeeNine')}
                step="0.01"
              />
              <InputField
                label="Student Monthly"
                value={inputs.studentFeeFour}
                onChange={handleNumberChange('studentFeeFour')}
                step="0.01"
              />
              <InputField
                label="Teacher License Fee"
                value={inputs.teacherLicenseFee}
                onChange={handleNumberChange('teacherLicenseFee')}
                step="0.01"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-5 [[data-theme=dark]_&]:bg-[var(--c-efece6)]">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Graduated Tier Rates
            </h2>
            <div className="mt-4 grid gap-4">
              <InputField
                label="First $250K %"
                value={inputs.graduatedRateFirstPercent}
                onChange={handleNumberChange('graduatedRateFirstPercent')}
                step="0.01"
              />
              <InputField
                label="Next $250K %"
                value={inputs.graduatedRateSecondPercent}
                onChange={handleNumberChange('graduatedRateSecondPercent')}
                step="0.01"
              />
              <InputField
                label="Next $500K %"
                value={inputs.graduatedRateThirdPercent}
                onChange={handleNumberChange('graduatedRateThirdPercent')}
                step="0.01"
              />
              <InputField
                label="Above $1M %"
                value={inputs.graduatedRateAbovePercent}
                onChange={handleNumberChange('graduatedRateAbovePercent')}
                step="0.01"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-5 [[data-theme=dark]_&]:bg-[var(--c-efece6)]">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Tuition Assumptions
            </h2>
            <div className="mt-4 grid gap-4">
              <InputField
                label="Avg Student Tuition"
                value={inputs.avgStudentTuitionMonthly}
                onChange={handleNumberChange('avgStudentTuitionMonthly')}
                step="0.01"
              />
              <InputField
                label="Tuition Adoption Rate %"
                value={inputs.avgStudentTuitionAdoptionRatePercent}
                onChange={handleNumberChange('avgStudentTuitionAdoptionRatePercent')}
                step="0.1"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-5 [[data-theme=dark]_&]:bg-[var(--c-efece6)]">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Lesson Pack Inputs
            </h2>
            <div className="mt-4 grid gap-4">
              <InputField
                label="Lesson Pack Price"
                value={inputs.lessonPackPrice}
                onChange={handleNumberChange('lessonPackPrice')}
                step="0.01"
              />
              <InputField
                label="Pack Adoption Rate %"
                value={inputs.lessonPackAdoptionRatePercent}
                onChange={handleNumberChange('lessonPackAdoptionRatePercent')}
                step="0.1"
              />
              <InputField
                label="Packs Created / Month"
                value={inputs.packsCreatedPerMonth}
                onChange={handleNumberChange('packsCreatedPerMonth')}
                step="0.1"
                min={0}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-5 [[data-theme=dark]_&]:bg-[var(--c-efece6)]">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Lesson Pack Split
            </h2>
            <div className="mt-4 grid gap-4">
              <InputField
                label="Company %"
                value={inputs.packCompanyPercent}
                onChange={handleNumberChange('packCompanyPercent')}
                step="0.1"
              />
              <InputField
                label="CC.CO %"
                value={inputs.packUsPercent}
                onChange={handleNumberChange('packUsPercent')}
                step="0.1"
              />
              <InputField
                label="Creator %"
                value={inputs.packCreatorPercent}
                onChange={handleNumberChange('packCreatorPercent')}
                step="0.1"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-5 [[data-theme=dark]_&]:bg-[var(--c-efece6)]">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Curriculum
            </h2>
            <div className="mt-4 grid gap-4">
              <InputField
                label="Curriculum Estimate"
                value={inputs.annualCurriculumEstimate}
                onChange={handleNumberChange('annualCurriculumEstimate')}
                step="1"
              />
              <div className="rounded-xl border border-[var(--c-ecebe7)] bg-white/80 p-3 text-[0.9rem] text-[var(--c-6f6c65)] [[data-theme=dark]_&]:bg-[var(--c-efece6)] [[data-theme=dark]_&]:border-[var(--c-e5e3dd)]">
                <p className="font-semibold text-[var(--c-3a3935)]">
                  Curriculum Estimate Summary
                </p>
                <p className="mt-2">
                  Teachers: 800. Major content $125, smaller modules $9. Assumed 60%
                  buy 1 major, 30% buy 2, 10% buy 3. ~ $150K major + 800 × 4
                  small × $9 ≈ $28K. Teacher side ≈ $175–180K.
                </p>
                <p className="mt-2">
                  Students: 20,000 at ~$35. Adoption tests: 20% = $140K, 35% =
                  $245K, 50% = $350K. Picked moderate/conservative.
                </p>
                <p className="mt-2">
                  Combined: Teacher ≈ $180K + Student ≈ $250K → ~$430K, rounded to
                  $450K for modeling.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-5 [[data-theme=dark]_&]:bg-[var(--c-efece6)]">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Online Room
            </h2>
            <div className="mt-4 grid gap-4">
              <InputField
                label="% Teachers Online Room"
                value={inputs.percentTeachersUsingOnlineRoom}
                onChange={handleNumberChange('percentTeachersUsingOnlineRoom')}
                step="0.1"
              />
              <InputField
                label="Online Room Monthly"
                value={inputs.onlineRoomMonthlyCost}
                onChange={handleNumberChange('onlineRoomMonthlyCost')}
                step="0.01"
              />
              <InputField
                label="% Teachers Day Pass"
                value={inputs.percentTeachersUsingDayPass}
                onChange={handleNumberChange('percentTeachersUsingDayPass')}
                step="0.1"
              />
              <InputField
                label="Avg Day Passes / Month"
                value={inputs.avgDayPassesPerMonth}
                onChange={handleNumberChange('avgDayPassesPerMonth')}
                step="0.1"
                min={0}
              />
              <InputField
                label="Day Pass Cost"
                value={inputs.dayPassCost}
                onChange={handleNumberChange('dayPassCost')}
                step="0.01"
                min={0}
              />
              <InputField
                label="CC.CO Share %"
                value={inputs.onlineRoomUsSharePercent}
                onChange={handleNumberChange('onlineRoomUsSharePercent')}
                step="0.1"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-5 [[data-theme=dark]_&]:bg-[var(--c-efece6)]">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Growth
            </h2>
            <div className="mt-4 grid gap-4">
              <InputField
                label="Annual Growth Rate %"
                value={inputs.annualGrowthRatePercent}
                onChange={handleNumberChange('annualGrowthRatePercent')}
                step="0.1"
              />
              <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-[0.95rem] text-[var(--c-6f6c65)] [[data-theme=dark]_&]:bg-[var(--c-efece6)] [[data-theme=dark]_&]:border-[var(--c-e5e3dd)]">
                <span>Use Variable Growth</span>
                <input
                  type="checkbox"
                  checked={inputs.useVariableGrowthRates}
                  onChange={event =>
                    setInputs(prev => ({
                      ...prev,
                      useVariableGrowthRates: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[var(--sidebar-accent-bg)]"
                />
              </label>
              <InputField
                label="Projection Years"
                value={inputs.projectionYears}
                onChange={handleNumberChange('projectionYears')}
                step="1"
                min={1}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--c-7a776f)]">
            Summary
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            title="Total Students"
            value={Math.round(model.totalStudents).toLocaleString('en-US')}
            description="Based on teacher count and average students per teacher."
          />
          <SummaryCard
            title="SM Subscriptions Monthly"
            value={formatCurrency(model.annualSubscriptionRevenue / 12)}
            description="Monthly total"
          />
          <SummaryCard
            title="SM Licenses Monthly"
            value={formatCurrency(inputs.teacherCount * inputs.teacherLicenseFee)}
            description="Monthly total"
          />
          <SummaryCard
            title="SM Curriculum Monthly"
            value={formatCurrency(inputs.annualCurriculumEstimate / 12)}
            description="Monthly total"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--c-7a776f)]">
            Revenue Streams
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {revenueStreams.map(stream => {
            const total = stream.ccCoMonthly + stream.smMonthly;
            const heat =
              maxRevenue === minRevenue
                ? 0.5
                : (total - minRevenue) / (maxRevenue - minRevenue);
            return (
              <RevenueStreamCard
                key={stream.title}
                title={stream.title}
                ccCoMonthly={stream.ccCoMonthly}
                smMonthly={stream.smMonthly}
                heat={heat}
              />
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-6 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--c-7a776f)]">
            Clean Snapshot
          </h2>
          <p className="text-xs text-[var(--c-7a776f)]">
            Monthly equivalent: {formatCurrency(model.totalUsAnnualIncome / 12)}
          </p>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--c-ecebe7)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--c-fafafa)] text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)] [[data-theme=dark]_&]:bg-[var(--c-efece6)]">
              <tr>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Annual</th>
                <th className="px-4 py-3">Monthly</th>
              </tr>
            </thead>
            <tbody className="text-[var(--c-1f1f1d)]">
              {[
                {
                  label: 'Subscription %',
                  annual: model.subscriptionGraduatedCut,
                },
                {
                  label: 'Stripe Share',
                  annual: model.usStripeShare,
                },
                {
                  label: 'Lesson Packs',
                  annual: model.usPackShare,
                },
                {
                  label: 'Lesson Fees',
                  annual: ccCoLicenseMonthly * 12,
                },
                {
                  label: 'Curriculum %',
                  annual: model.curriculumIncludedInGraduated
                    ? 0
                    : model.annualCurriculumUsShare,
                },
                {
                  label: 'Online Room',
                  annual: model.usRoomShare,
                },
              ]
                .map(item => ({ ...item, monthly: item.annual / 12 }))
                .sort((a, b) => b.monthly - a.monthly)
                .map(item => {
                  const highlight =
                    item.label === 'Online Room' ||
                    item.label === 'Lesson Packs' ||
                    item.label === 'Stripe Share';
                  const textClass = highlight
                    ? 'font-semibold text-emerald-700'
                    : 'text-[var(--c-1f1f1d)]';
                  return (
                  <tr key={item.label} className="border-t border-[var(--c-ecebe7)]">
                    <td className={`px-4 py-3 ${textClass}`}>{item.label}</td>
                    <td className={`px-4 py-3 ${textClass}`}>
                      {formatCurrency(item.annual)}
                    </td>
                    <td className={`px-4 py-3 ${textClass}`}>
                      {formatCurrency(item.monthly)}
                    </td>
                  </tr>
                );
                })}
              <tr className="border-t border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] [[data-theme=dark]_&]:bg-[var(--c-efece6)]">
                <td className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                  Total
                </td>
                <td className="px-4 py-3 font-semibold">
                  {formatCurrency(model.totalUsAnnualIncome)}
                </td>
                <td className="px-4 py-3 font-semibold">
                  {formatCurrency(model.totalUsAnnualIncome / 12)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-6 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--c-7a776f)]">
            Projection Table
          </h2>
          <div className="flex items-center gap-3 text-xs text-[var(--c-7a776f)]">
            <span>Growth Rate Applied:</span>
            <input
              type="number"
              value={inputs.annualGrowthRatePercent}
              onChange={event =>
                handleNumberChange('annualGrowthRatePercent')(
                  Number(event.target.value),
                )
              }
              step="0.1"
              className="w-24 rounded-full border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-[1.1rem] font-semibold text-[var(--c-1f1f1d)] shadow-sm focus:border-[var(--sidebar-accent-border)] focus:outline-none [[data-theme=dark]_&]:bg-[var(--c-efece6)] [[data-theme=dark]_&]:border-[var(--c-e5e3dd)]"
            />
            <span>%</span>
          </div>
        </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-[var(--c-ecebe7)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--c-fafafa)] text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)] [[data-theme=dark]_&]:bg-[var(--c-efece6)]">
                <tr>
                  <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">CC.CO Annual</th>
                  <th className="px-4 py-3">CC.CO Monthly</th>
                  <th className="px-4 py-3">SM Annual</th>
                  <th className="px-4 py-3">SM Monthly</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] text-[var(--c-1f1f1d)] [[data-theme=dark]_&]:bg-[var(--c-efece6)]">
                  <td className="px-4 py-3 font-semibold">
                    Year 1 Subscriptions + Licenses + Curriculum
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(yearOneSubscriptionLicenseCurriculum.usTotal)}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(yearOneSubscriptionLicenseCurriculum.usTotal / 12)}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(
                      yearOneSubscriptionLicenseCurriculum.companyTotal,
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(
                      yearOneSubscriptionLicenseCurriculum.companyTotal / 12,
                    )}
                  </td>
                </tr>
                {projectionData.map(point => (
                  <tr
                    key={point.year}
                    className="border-t border-[var(--c-ecebe7)] text-[var(--c-1f1f1d)]"
                  >
                    <td className="px-4 py-3 font-semibold">Year {point.year}</td>
                    <td className="px-4 py-3">
                      {formatCurrency(point.totalUsIncome)}
                      <span className="ml-2 font-semibold text-emerald-700">
                        {(() => {
                          const previous = projectionData[point.year - 2];
                          if (!previous) return '(+0%)';
                          const delta =
                            previous.totalUsIncome === 0
                              ? 0
                              : point.totalUsIncome / previous.totalUsIncome - 1;
                          return `(${formatPercent(delta)})`;
                        })()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(point.totalUsIncome / 12)}
                      <span className="ml-2 font-semibold text-emerald-700">
                        {(() => {
                          const previous = projectionData[point.year - 2];
                          if (!previous) return '(+0%)';
                          const delta =
                            previous.totalUsIncome === 0
                              ? 0
                              : point.totalUsIncome / previous.totalUsIncome - 1;
                          return `(${formatPercent(delta)})`;
                        })()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(point.totalEcosystemRevenue ?? 0)}
                      <span className="ml-2 font-semibold text-emerald-700">
                        {(() => {
                          const previous = projectionData[point.year - 2];
                          if (!previous) return '(+0%)';
                          const currentRevenue = point.totalEcosystemRevenue ?? 0;
                          const previousRevenue = previous.totalEcosystemRevenue ?? 0;
                          const delta =
                            previousRevenue === 0
                              ? 0
                              : currentRevenue / previousRevenue - 1;
                          return `(${formatPercent(delta)})`;
                        })()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency((point.totalEcosystemRevenue ?? 0) / 12)}
                      <span className="ml-2 font-semibold text-emerald-700">
                        {(() => {
                          const previous = projectionData[point.year - 2];
                          if (!previous) return '(+0%)';
                          const currentRevenue = point.totalEcosystemRevenue ?? 0;
                          const previousRevenue = previous.totalEcosystemRevenue ?? 0;
                          const delta =
                            previousRevenue === 0
                              ? 0
                              : currentRevenue / previousRevenue - 1;
                          return `(${formatPercent(delta)})`;
                        })()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </section>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-6 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)]">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--c-7a776f)]">
            Graduated Percentage Model
          </h2>
          <p className="text-[var(--c-7a776f)]">
            Subscription + Curriculum + Licenses total (monthly):
            <span className="ml-2 font-semibold text-[var(--c-1f1f1d)]">
              {formatCurrency(
                model.annualSubscriptionRevenue / 12 +
                  inputs.annualCurriculumEstimate / 12 +
                  inputs.teacherCount * inputs.teacherLicenseFee,
              )}
            </span>
          </p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Simply Music Total"
            value={formatCurrency(model.annualSubscriptionRevenue / 12)}
            description={`Subscription Monthly · CC.CO ${formatCurrency(
              ccCoSubscriptionMonthly,
            )}`}
          />
          <SummaryCard
            title="Simply Music Total"
            value={formatCurrency(inputs.annualCurriculumEstimate / 12)}
            description={`Curriculum Monthly · CC.CO ${formatCurrency(
              ccCoCurriculumMonthly,
            )}`}
          />
          <SummaryCard
            title="Simply Music Total"
            value={formatCurrency(
              inputs.teacherCount * inputs.teacherLicenseFee,
            )}
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
                <tr key={tier.label} className="border-t border-[var(--c-ecebe7)]">
                  <td className="px-4 py-3 font-semibold">{tier.label}</td>
                  <td className="px-4 py-3">
                    {formatPercent(tier.rate)}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(tier.revenueInTier)}</td>
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
                    model.annualSubscriptionRevenue / 12 +
                      inputs.annualCurriculumEstimate / 12 +
                      inputs.teacherCount * inputs.teacherLicenseFee,
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-700">
                  {formatCurrency(graduatedTierBreakdown.totalCcCoCut)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
