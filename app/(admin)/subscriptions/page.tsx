export default function SubscriptionsPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Subscriptions
        </p>
        <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
          Plans + Billing
        </h1>
        <p className="text-sm text-[var(--c-6f6c65)] mt-2">
          Track subscription tiers, renewals, and payment health.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {[
          { label: 'Active Plans', value: '3', note: 'Student + Teacher tiers' },
          { label: 'Renewals This Week', value: '118', note: 'Auto-renew set' },
          { label: 'Past Due', value: '24', note: 'Follow-up required' },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              {item.label}
            </p>
            <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
              {item.value}
            </p>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">{item.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
