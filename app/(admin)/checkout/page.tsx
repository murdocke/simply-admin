'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLessonCart } from '../components/lesson-cart';
import { formatCurrency } from '../components/lesson-pricing';
import { useLessonCartScope } from '../components/lesson-cart-scope';
import { VIEW_ROLE_STORAGE_KEY } from '../components/auth';

export default function CheckoutPage() {
  const router = useRouter();
  const { scope } = useLessonCartScope();
  const { items, total, checkout, clearCart } = useLessonCart(scope);
  const [didCheckout, setDidCheckout] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [purchasedSnapshot, setPurchasedSnapshot] = useState<typeof items>([]);
  const [backHref, setBackHref] = useState('/students/lesson-library');
  const countLabel = useMemo(
    () => `${items.length} section${items.length === 1 ? '' : 's'}`,
    [items.length],
  );

  const handleCheckout = () => {
    setPurchasedSnapshot(items);
    checkout();
    setDidCheckout(true);
    setShowConfirmation(true);
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    router.push(backHref);
  };

  const handleClear = () => {
    clearCart();
    setDidCheckout(false);
  };

  useEffect(() => {
    const stored = window.localStorage.getItem('sm_user');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { role?: string };
      const role = parsed?.role;
      if (role === 'teacher') {
        setBackHref('/teachers?mode=training');
        return;
      }
      if (role === 'company') {
        const viewRole = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
        if (viewRole === 'teacher') {
          setBackHref('/teachers?mode=training');
          return;
        }
      }
      setBackHref('/students/lesson-library');
    } catch {
      setBackHref('/students/lesson-library');
    }
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Checkout
        </p>
        <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)]">
          Selected Sections
        </h1>
        <p className="text-sm text-[var(--c-6f6c65)]">
          Review and complete your free checkout to unlock sections.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        {items.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--c-6f6c65)]">
              Your cart is empty.
            </p>
            {didCheckout ? (
              <p className="text-sm text-[var(--c-6f6c65)]">
                Checkout complete. Your selected sections are now unlocked.
              </p>
            ) : null}
            <Link
              href="/students/lesson-library"
              className="inline-flex items-center justify-center rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
            >
              Back to library
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base font-semibold text-[var(--c-1f1f1d)]">
                {`${items.length} Sections In Cart`}
              </p>
              <div className="rounded-full border border-[var(--c-ecebe7)] bg-[#22262c] px-4 py-2 text-base font-extrabold uppercase tracking-[0.2em] text-white/90">
                Total {formatCurrency(total)}
              </div>
            </div>

            <div className="space-y-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-[var(--c-ecebe7)] bg-[#22262c] px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-white/90">
                      {item.section}
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                      {item.program}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-white/80">
                    
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Customer Details
                </p>
                <div className="mt-4 space-y-6">
                  <label className="block text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    <span className="block mb-2">Full name</span>
                    <input
                      type="text"
                      placeholder="Alex Morgan"
                      className="w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    <span className="block mb-2">Email</span>
                    <input
                      type="email"
                      placeholder="alex@email.com"
                      className="w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    <span className="block mb-2">Phone</span>
                    <input
                      type="tel"
                      placeholder="(555) 123-9021"
                      className="w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Payment Details
                </p>
                <div className="mt-4 space-y-6">
                  <label className="block text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    <span className="block mb-2">Card number</span>
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      className="w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                      <span className="block mb-2">Expiration</span>
                      <input
                        type="text"
                        placeholder="10 / 28"
                        className="w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                      />
                    </label>
                    <label className="block text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                      <span className="block mb-2">CVC</span>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                      />
                    </label>
                  </div>
                  <label className="block text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    <span className="block mb-2">Billing zip</span>
                    <input
                      type="text"
                      placeholder="90210"
                      className="w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Terms &amp; Agreement
                </p>
                <div className="mt-4 space-y-3 text-sm text-[var(--c-6f6c65)]">
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1" defaultChecked />
                    <span>
                      I agree to the terms of service and acknowledge that this
                      is a trial checkout for unlocking materials.
                    </span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1" defaultChecked />
                    <span>
                      I understand purchases are tied to this account and
                      cannot be transferred.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={backHref}
                onClick={handleClear}
                className="rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
              >
                Clear cart
              </Link>
              <button
                type="button"
                onClick={handleCheckout}
                className="rounded-full bg-[#2f8f5b] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </section>

      {showConfirmation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCloseConfirmation}
          />
          <div className="relative w-full max-w-xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Checkout Complete
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  Unlocked! Congrats!
                </h2>
                <p className="mt-2 text-base text-[var(--c-6f6c65)]">
                  What you purchased has been unlocked.
                  <br />
                  Enjoy the new lesson content!
                </p>
              </div>
              <button
                onClick={handleCloseConfirmation}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Close
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {purchasedSnapshot.map(item => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-[var(--c-ecebe7)] bg-[#22262c] px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-white/90">{item.section}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                      {item.program}
                    </p>
                  </div>
                  <div />
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={handleCloseConfirmation}
                className="rounded-full bg-[#2f8f5b] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
