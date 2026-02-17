'use client';

import { useEffect, useMemo, useState } from 'react';
import { AUTH_STORAGE_KEY } from '../../components/auth';
import { useApiData } from '../../components/use-api-data';

type ParentRecord = {
  username: string;
  billing?: {
    status?: string;
    nextPaymentDue?: string;
    monthlyTotal?: number;
    lastPaid?: string;
  };
};

export default function ParentBillingPage() {
  const { data: parentsData } = useApiData<{ parents: ParentRecord[] }>(
    '/api/parents',
    { parents: [] },
  );
  const parents = useMemo(
    () => (parentsData.parents as ParentRecord[]) ?? [],
    [parentsData],
  );
  const [parent, setParent] = useState<ParentRecord | null>(null);

  useEffect(() => {
    if (parents.length === 0) {
      setParent(null);
      return;
    }
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { username?: string };
        if (parsed?.username) {
          const matched = parents.find(
            candidate => candidate.username.toLowerCase() === parsed.username!.toLowerCase(),
          );
          if (matched) {
            setParent(matched);
            return;
          }
        }
      } catch {
        // ignore
      }
    }
    setParent(parents[0]);
  }, [parents]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
          Parent Portal
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          Billing
        </h1>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
          Manage payment methods, auto-pay status, and recent charges.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Payment Overview
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Monthly total
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                ${parent?.billing?.monthlyTotal ?? 0}
              </p>
              <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                Auto-pay {parent?.billing?.status ?? 'enabled'}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Next charge
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                {parent?.billing?.nextPaymentDue ?? 'TBD'}
              </p>
              <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                Last paid {parent?.billing?.lastPaid ?? 'recently'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Payment Method
          </p>
          <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">Visa ending 2184</p>
            <p className="mt-2 text-xs text-[var(--c-6f6c65)]">Expires 07/28</p>
          </div>
          <button className="mt-4 w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)]">
            Update payment method
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Recent Charges
        </p>
        <div className="mt-4 space-y-3 text-sm text-[var(--c-6f6c65)]">
          <div className="flex items-center justify-between rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-4 py-3">
            <span>February tuition</span>
            <span className="font-semibold text-[var(--c-1f1f1d)]">$224.00</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-4 py-3">
            <span>January tuition</span>
            <span className="font-semibold text-[var(--c-1f1f1d)]">$224.00</span>
          </div>
        </div>
      </section>
    </div>
  );
}
