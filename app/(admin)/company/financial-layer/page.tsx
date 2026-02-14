'use client';

import {
  Bar,
  BarChart,
  Cell,
  Area,
  AreaChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
} from 'recharts';
import { useMemo, useState } from 'react';

const keyMetrics = [
  {
    label: 'Net vs Gross',
    value: '$412k / $552k',
    note: 'Last 6 months',
    trend: '+4.1%',
  },
  {
    label: 'Refund Rate',
    value: '1.8%',
    note: 'Rolling 90 days',
    trend: '-0.4%',
  },
  {
    label: 'Company Margin',
    value: '28.6%',
    note: 'After royalties',
    trend: '+1.2%',
  },
  {
    label: 'Royalty Liability',
    value: '$74,900',
    note: 'Outstanding',
    trend: '+2.8%',
  },
];

const performanceCards = [
  {
    title: 'Revenue by Region',
    value: '$212k',
    note: 'Top: West (34%)',
    chart: 'region',
  },
  {
    title: 'Revenue by Teacher',
    value: '$96k',
    note: 'Top 5 teachers',
    chart: 'teacher',
  },
  {
    title: 'Subscription Tier Breakdown',
    value: 'Core 62%',
    note: 'Plus 23% · Pro 15%',
    chart: 'tiers',
    legend: [
      { label: 'Core', value: '62%', color: 'var(--c-c8102e)' },
      { label: 'Plus', value: '23%', color: 'var(--c-7a4a17)' },
      { label: 'Pro', value: '15%', color: 'var(--c-28527a)' },
    ],
  },
  {
    title: 'Forecast Next 90 Days',
    value: '$298k',
    note: 'Projected +5.4%',
    chart: 'forecast',
  },
];

const operations = [
  {
    title: 'Payment Processor Reconciliation',
    status: 'Balanced',
    detail: 'Last sync 12 hours ago',
  },
  {
    title: 'Split Model (Company vs Teacher)',
    status: '65% / 35%',
    detail: 'Current default split',
  },
  {
    title: 'Per-Teacher Payout Preview',
    status: '$46,200',
    detail: 'Next cycle estimate',
  },
  {
    title: 'Franchise Reporting',
    status: '14 regions',
    detail: '3 reports pending',
  },
  {
    title: 'Royalty Aging',
    status: '8% 60+ days',
    detail: 'Watch Region 3',
  },
  {
    title: 'Automated Statement Generation',
    status: 'Scheduled',
    detail: 'Next run: Monday 7:00 AM',
  },
];

const regionSeries = [
  { name: 'West', value: 72000 },
  { name: 'South', value: 54000 },
  { name: 'Midwest', value: 41000 },
  { name: 'Northeast', value: 35000 },
  { name: 'Canada', value: 22000 },
];

const teacherSeries = [
  { name: 'Top 1', value: 22000 },
  { name: 'Top 2', value: 20000 },
  { name: 'Top 3', value: 19000 },
  { name: 'Top 4', value: 18000 },
  { name: 'Top 5', value: 17000 },
];

const tierSeries = [
  { name: 'Core', value: 62, color: 'var(--c-c8102e)' },
  { name: 'Plus', value: 23, color: 'var(--c-7a4a17)' },
  { name: 'Pro', value: 15, color: 'var(--c-28527a)' },
];

const forecastSeries = [
  { name: 'M1', value: 46000 },
  { name: 'M2', value: 49500 },
  { name: 'M3', value: 47200 },
  { name: 'M4', value: 51500 },
  { name: 'M5', value: 53000 },
  { name: 'M6', value: 50500 },
];

const horizonSeries = [
  { name: 'Jan', subscriptions: 26000, curriculum: 11000, royalties: 5000 },
  { name: 'Feb', subscriptions: 28000, curriculum: 12000, royalties: 5500 },
  { name: 'Mar', subscriptions: 29000, curriculum: 12500, royalties: 6000 },
  { name: 'Apr', subscriptions: 31500, curriculum: 13500, royalties: 7000 },
  { name: 'May', subscriptions: 33000, curriculum: 14500, royalties: 7300 },
  { name: 'Jun', subscriptions: 34500, curriculum: 15000, royalties: 7700 },
  { name: 'Jul', subscriptions: 36200, curriculum: 15800, royalties: 8400 },
  { name: 'Aug', subscriptions: 38200, curriculum: 16500, royalties: 9100 },
  { name: 'Sep', subscriptions: 40000, curriculum: 17500, royalties: 9700 },
  { name: 'Oct', subscriptions: 41800, curriculum: 18500, royalties: 10200 },
  { name: 'Nov', subscriptions: 44000, curriculum: 19500, royalties: 11300 },
  { name: 'Dec', subscriptions: 46800, curriculum: 20800, royalties: 11600 },
];

type TooltipPayload = { name?: string; value?: number };

function ChartTooltip({
  active,
  payload,
  label,
  valuePrefix,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  valuePrefix?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const value = typeof item.value === 'number' ? item.value : 0;
  const formattedValue =
    valuePrefix === '$'
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(value)
      : value;
  return (
    <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-base text-[var(--c-6f6c65)] shadow-md">
      <div className="text-sm uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
        {item.name ?? label ?? 'Value'}
      </div>
      <div className="mt-1 text-base font-semibold text-[var(--c-1f1f1d)]">
        {valuePrefix ? formattedValue : value}
      </div>
    </div>
  );
}

function DonutActiveShape(props: {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
}) {
  const { cx = 0, cy = 0, innerRadius = 0, outerRadius = 0, startAngle, endAngle, fill } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} r={outerRadius + 6} fill={fill} opacity={0.12} />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="none"
      />
    </g>
  );
}

function Chart({ type }: { type: string }) {
  const [activeSlice, setActiveSlice] = useState(0);
  const tierPayload = useMemo(
    () => tierSeries.map(item => ({ ...item })),
    [],
  );

  if (type === 'region') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={regionSeries}
          margin={{ top: 6, right: 8, left: 8, bottom: 4 }}
          barCategoryGap="28%"
        >
          <Bar
            dataKey="value"
            radius={[8, 8, 8, 8]}
            fill="var(--c-c8102e)"
            barSize={18}
          />
          <Tooltip
            cursor={{ fill: 'rgba(200, 16, 46, 0.08)' }}
            content={<ChartTooltip valuePrefix="$" />}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (type === 'teacher') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={teacherSeries}
          margin={{ top: 6, right: 8, left: 8, bottom: 4 }}
          barCategoryGap="32%"
        >
          <Bar
            dataKey="value"
            radius={[8, 8, 8, 8]}
            fill="var(--c-c8102e)"
            barSize={16}
          />
          <Tooltip
            cursor={{ fill: 'rgba(200, 16, 46, 0.08)' }}
            content={<ChartTooltip valuePrefix="$" />}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (type === 'tiers') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={tierPayload}
            dataKey="value"
            innerRadius={38}
            outerRadius={58}
            paddingAngle={3}
            cx="50%"
            cy="50%"
            startAngle={90}
            endAngle={-270}
            stroke="var(--c-ffffff)"
            strokeWidth={2}
            activeIndex={activeSlice}
            activeShape={DonutActiveShape}
            onMouseEnter={(_, index) => setActiveSlice(index)}
          >
            {tierPayload.map(entry => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={<ChartTooltip />}
            formatter={(value: number) => [`${value}%`, '']}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={forecastSeries}
        margin={{ top: 8, right: 10, left: 10, bottom: 0 }}
      >
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--c-c8102e)"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 5 }}
        />
        <Tooltip content={<ChartTooltip valuePrefix="$" />} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function FinancialLayerPage() {
  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 rounded-3xl border border-[var(--c-ecebe7)] bg-[linear-gradient(135deg,var(--c-ffffff),var(--c-f7f7f5))] p-8 shadow-sm">
        <p className="text-base uppercase tracking-[0.4em] text-[var(--c-c8102e)]">
          Leadership Dashboard
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)]">
              Financial Layer
            </h1>
            <p className="mt-2 text-base text-[var(--c-6f6c65)]">
              Net performance, royalties, and payout health at a glance.
            </p>
          </div>
          <div className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-base uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            Last refreshed 2 hours ago
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {keyMetrics.map(metric => (
            <div
              key={metric.label}
              className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm"
            >
              <p className="text-base uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                {metric.label}
              </p>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {metric.value}
                </p>
                <span className="rounded-full bg-[var(--c-fff7e8)] px-2 py-1 text-sm font-semibold text-[var(--c-7a4a17)]">
                  {metric.trend}
                </span>
              </div>
              <p className="mt-2 text-base text-[var(--c-6f6c65)]">{metric.note}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Revenue Signals
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                Performance & Forecasting
              </h2>
            </div>
            <p className="text-base uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Last 6 months
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {performanceCards.map(card => (
              <div
                key={card.title}
                className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                      {card.title}
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
                      {card.value}
                    </p>
                    <p className="mt-1 text-base text-[var(--c-6f6c65)]">
                      {card.note}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--c-ecebe7)] px-2 py-1 text-sm uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Live
                  </span>
                </div>
                <div className="mt-4 h-32 w-full">
                  <Chart type={card.chart} />
                </div>
                {card.legend ? (
                  <div className="mt-3 flex flex-wrap gap-3 text-sm uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    {card.legend.map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>
                          {item.label} {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-base uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Operational Lens
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Payouts, Royalties, Compliance
            </h2>
          </div>
          <div className="space-y-3">
            {operations.map(item => (
              <div
                key={item.title}
                className="flex flex-col gap-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-semibold text-[var(--c-1f1f1d)]">
                    {item.title}
                  </p>
                  <span className="rounded-full bg-[var(--c-f7f7f5)] px-2 py-1 text-sm font-semibold text-[var(--c-6f6c65)]">
                    {item.status}
                  </span>
                </div>
                <p className="text-base text-[var(--c-6f6c65)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[linear-gradient(135deg,var(--c-ffffff),var(--c-f7f7f5))] p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-base uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Forecast Horizon
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              12-Month Revenue Trajectory
            </h2>
            <p className="mt-2 text-base text-[var(--c-6f6c65)]">
              Scenario-weighted outlook blending subscriptions, curriculum,
              and retention trends.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-5 py-3 text-right shadow-sm">
            <p className="text-base uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              Expected Run Rate
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
              <span className="text-[var(--c-3f4f3b)]">+ </span>$792k
            </p>
            <p className="mt-1 text-base text-[var(--c-6f6c65)]">
              +12.4% forecasted growth
            </p>
          </div>
        </div>
        <div className="mt-6 h-60 w-full overflow-hidden rounded-b-2xl">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={horizonSeries}
              margin={{ top: 10, right: 24, left: 8, bottom: 0 }}
            >
              <Area
                type="monotone"
                dataKey="subscriptions"
                stackId="total"
                stroke="var(--c-c8102e)"
                fill="rgba(200, 16, 46, 0.35)"
                fillOpacity={1}
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="curriculum"
                stackId="total"
                stroke="var(--c-7a4a17)"
                fill="rgba(122, 74, 23, 0.28)"
                fillOpacity={1}
              />
              <Area
                type="monotone"
                dataKey="royalties"
                stackId="total"
                stroke="var(--c-28527a)"
                fill="rgba(40, 82, 122, 0.24)"
                fillOpacity={1}
              />
              <Tooltip content={<ChartTooltip valuePrefix="$" />} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
