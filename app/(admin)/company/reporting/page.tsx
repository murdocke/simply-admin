'use client';

import Link from 'next/link';
import {
  calculateEcosystemModel,
  defaultEcosystemInputs,
  formatCurrency,
  formatPercent,
} from '@/lib/ecosystem-model';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const inputs = defaultEcosystemInputs;
const model = calculateEcosystemModel(inputs);

const activeTeachers = Math.round(inputs.teacherCount * 0.91);
const activeStudents = Math.round(model.totalStudents * 0.86);
const inquiriesMonth = 108;
const inquiriesWeek = 26;
const registrationsMonth = 47;
const registrationsWeek = 12;

const totalEcosystemRevenue =
  model.annualSubscriptionRevenue +
  model.annualPackRevenue +
  inputs.annualCurriculumEstimate +
  model.annualRoomRevenue +
  model.annualDayPassRevenue +
  inputs.teacherCount * inputs.teacherLicenseFee * 12;

const topCards = [
  {
    label: 'Active Teachers',
    value: activeTeachers.toLocaleString(),
    note: 'Estimated active in last 30 days',
  },
  {
    label: 'Active Students',
    value: activeStudents.toLocaleString(),
    note: 'Enrollment baseline from ecosystem model',
  },
  {
    label: 'Teacher Inquiries (Month)',
    value: inquiriesMonth.toLocaleString(),
    note: `${inquiriesWeek} this week`,
  },
  {
    label: 'Teacher Registrations (Month)',
    value: registrationsMonth.toLocaleString(),
    note: `${registrationsWeek} this week`,
  },
  {
    label: 'Total Ecosystem Revenue',
    value: formatCurrency(totalEcosystemRevenue),
    note: 'Annualized estimate',
  },
  {
    label: 'US Revenue Share',
    value: formatCurrency(model.totalUsAnnualIncome),
    note: 'Annualized estimate',
  },
];

const inquiriesTrend = [
  { month: 'Mar', value: 72 },
  { month: 'Apr', value: 79 },
  { month: 'May', value: 76 },
  { month: 'Jun', value: 90 },
  { month: 'Jul', value: 98 },
  { month: 'Aug', value: 102 },
  { month: 'Sep', value: 108 },
  { month: 'Oct', value: 114 },
  { month: 'Nov', value: 110 },
  { month: 'Dec', value: 105 },
  { month: 'Jan', value: 97 },
  { month: 'Feb', value: 108 },
];

const registrationsTrend = [
  { month: 'Mar', value: 32 },
  { month: 'Apr', value: 34 },
  { month: 'May', value: 33 },
  { month: 'Jun', value: 38 },
  { month: 'Jul', value: 41 },
  { month: 'Aug', value: 44 },
  { month: 'Sep', value: 46 },
  { month: 'Oct', value: 50 },
  { month: 'Nov', value: 48 },
  { month: 'Dec', value: 45 },
  { month: 'Jan', value: 43 },
  { month: 'Feb', value: 47 },
];

const retentionRows = [
  { label: '1 year', value: 0.76 },
  { label: '2 years', value: 0.62 },
  { label: '3 years', value: 0.49 },
  { label: '5 years', value: 0.36 },
  { label: '10 years', value: 0.21 },
];

const studentSizeBins = [
  { label: '1-10 students', value: 0.22 },
  { label: '11-15 students', value: 0.24 },
  { label: '16-20 students', value: 0.19 },
  { label: '21-30 students', value: 0.18 },
  { label: '31-40 students', value: 0.11 },
  { label: '41-50+ students', value: 0.06 },
];

const pipelineRows = [
  {
    stage: 'Inquiry → Registration',
    rate: 0.43,
    avgDays: 10,
  },
  {
    stage: 'Registration → ITTP Start',
    rate: 0.78,
    avgDays: 14,
  },
  {
    stage: 'ITTP Start → Teaching',
    rate: 0.62,
    avgDays: 45,
  },
];

const teacherLifecycleStats = [
  { label: 'Avg ITTP completion time', value: '94 days' },
  { label: 'ITTP → Next purchase', value: '21 days' },
  { label: 'ITTP → Teaching students', value: '45 days' },
  { label: 'Avg teacher tenure', value: '6.8 years' },
  { label: 'Trainees who never complete ITTP', value: '28%' },
  { label: 'Stop point (most common)', value: 'Module 3' },
  { label: 'ITTP material completion', value: '76%' },
  { label: 'Teacher LTV (est.)', value: formatCurrency(18600) },
];

const sourceRegions = [
  { label: 'United States', value: '52%' },
  { label: 'Canada', value: '14%' },
  { label: 'United Kingdom', value: '12%' },
  { label: 'Australia', value: '9%' },
  { label: 'New Zealand', value: '5%' },
  { label: 'Other', value: '8%' },
];

const purchaseTrajectory = [
  {
    stage: 'ITTP Enrollment',
    medianDays: 0,
    adoption: 0.82,
  },
  {
    stage: 'Foundation Level 1',
    medianDays: 18,
    adoption: 0.71,
  },
  {
    stage: 'Foundation Level 2',
    medianDays: 36,
    adoption: 0.63,
  },
  {
    stage: 'Development Level 1',
    medianDays: 62,
    adoption: 0.48,
  },
  {
    stage: 'Supplementals',
    medianDays: 84,
    adoption: 0.39,
  },
];

const popupQuestions = [
  'How many lessons per year do you teach?',
  'What social media platform do you visit most?',
  'What % of your classes are private? Shared?',
  'How much do you charge per lesson?',
  'What % of your students are in ____ age group?',
  'What is the average time students stay with you?',
];

const dataQuestionAverages = [
  { label: 'Avg lessons per year', value: '36' },
  { label: 'Most-visited social platform', value: 'Instagram' },
  { label: 'Avg class mix', value: '68% private / 32% shared' },
  { label: 'Avg lesson price', value: '$48' },
  { label: 'Top age group', value: '8-12 yrs (42%)' },
  { label: 'Avg student tenure', value: '18 months' },
];

function Card({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="grid h-full min-h-[168px] grid-rows-[40px_1fr_32px] rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
        {label}
      </p>
      <div className="flex items-center pt-4">
        <p className="text-3xl font-semibold tabular-nums text-[var(--c-1f1f1d)]">
          {value}
        </p>
      </div>
      <p className="text-xs text-[var(--c-6f6c65)]">{note ?? ''}</p>
    </div>
  );
}

function TrendChart({
  title,
  values,
  highlight,
}: {
  title: string;
  values: { month: string; value: number }[];
  highlight: string;
}) {
  const latest = values[values.length - 1]?.value ?? 0;
  const previous = values[values.length - 2]?.value ?? 0;
  const delta = latest - previous;
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta}`;
  return (
    <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
          {title}
        </p>
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
          {highlight}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
            Latest Month
          </p>
          <p className="text-lg font-semibold tabular-nums text-[var(--c-1f1f1d)]">
            {latest}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
            MoM Change
          </p>
          <p className="text-lg font-semibold tabular-nums text-[var(--c-1f1f1d)]">
            {deltaLabel}
          </p>
        </div>
      </div>
      <div className="mt-4 h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={values}>
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              tickMargin={8}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: 'rgba(200, 16, 46, 0.08)' }}
              contentStyle={{
                borderRadius: 12,
                borderColor: 'var(--c-ecebe7)',
                fontSize: 12,
              }}
              formatter={(value: number) => [value, title]}
            />
            <Bar
              dataKey="value"
              radius={[10, 10, 10, 10]}
              fill="var(--c-c8102e)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Table({ title, headers, rows }: { title: string; headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">{title}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
            <tr>
              {headers.map(header => (
                <th key={header} className="pb-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[var(--c-1f1f1d)]">
            {rows.map((row, index) => (
              <tr key={`${title}-${index}`} className="border-t border-[var(--c-ecebe7)]">
                {row.map((cell, cellIndex) => (
                  <td key={`${title}-${index}-${cellIndex}`} className="py-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--c-1f1f1d)]">{label}</span>
        <span className="text-[var(--c-6f6c65)]">{formatPercent(value)}</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-[var(--c-ecebe7)]">
        <div
          className="h-2 rounded-full bg-[var(--c-c8102e)]"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function ReportingHubPage() {
  return (
    <div className="space-y-8">
      <header className="relative flex flex-col gap-6 rounded-3xl border border-[var(--c-ecebe7)] bg-[linear-gradient(135deg,var(--c-ffffff),var(--c-f7f7f5))] p-8 shadow-sm">
        <div className="absolute right-6 top-6 flex flex-wrap gap-3">
          <Link
            href="/royalties"
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-1f1f1d)] hover:text-[var(--c-1f1f1d)]"
          >
            Royalties
          </Link>
          <Link
            href="/subscriptions"
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-1f1f1d)] hover:text-[var(--c-1f1f1d)]"
          >
            Subscriptions
          </Link>
        </div>
        <div className="pr-6 pt-8">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--c-c8102e)]">
            Reporting Hub
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)]">
            Reporting & Analytics
          </h1>
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
            Live-style reporting view using ecosystem model baselines. This is the starting point
            for deeper analytics and drill-down routes.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {topCards.map(card => (
            <Card key={card.label} {...card} />
          ))}
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-2">
        <TrendChart title="Teacher Inquiries" values={inquiriesTrend} highlight="Last 12 months" />
        <TrendChart
          title="Teacher Registrations"
          values={registrationsTrend}
          highlight="Last 12 months"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Table
            title="Teacher Funnel"
            headers={['Stage', 'Conversion', 'Avg Days']}
            rows={pipelineRows.map(row => [row.stage, formatPercent(row.rate), row.avgDays])}
          />
          <Table
            title="Teacher Purchase Trajectory"
            headers={['Stage', 'Median Days', 'Adoption']}
            rows={purchaseTrajectory.map(row => [row.stage, row.medianDays, formatPercent(row.adoption)])}
          />
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Teacher Lifecycle
            </p>
            <div className="mt-4 grid gap-3 text-sm text-[var(--c-1f1f1d)]">
              {teacherLifecycleStats.map(stat => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-[var(--c-6f6c65)]">{stat.label}</span>
                  <span className="font-semibold">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Teacher Sources
            </p>
            <div className="mt-4 grid gap-3">
              {sourceRegions.map(region => (
                <div key={region.label} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--c-6f6c65)]">{region.label}</span>
                  <span className="font-semibold text-[var(--c-1f1f1d)]">{region.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Student Retention
          </p>
          <div className="mt-4 grid gap-3">
            {retentionRows.map(row => (
              <Meter key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Teacher Student Counts
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              Total Avg 18
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {studentSizeBins.map(bin => (
              <Meter key={bin.label} label={bin.label} value={bin.value} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Table
          title="Student Analytics"
          headers={['Metric', 'Value']}
          rows={[
            ['Active Students', activeStudents.toLocaleString()],
            ['Avg lessons per year', '36'],
            ['Student LTV (est.)', formatCurrency(1420)],
            ['Retention rate (2 years)', formatPercent(0.62)],
          ]}
        />
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Data Questions
          </p>
          <div className="mt-4 grid gap-3">
            {dataQuestionAverages.map(item => (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-4 py-3"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-semibold tabular-nums text-[var(--c-1f1f1d)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
