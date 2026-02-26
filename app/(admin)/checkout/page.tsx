'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createLessonCartItem,
  useLessonCart,
} from '../components/lesson-cart';
import { formatCurrency } from '../components/lesson-pricing';
import { useLessonCartScope } from '../components/lesson-cart-scope';
import { VIEW_ROLE_STORAGE_KEY } from '../components/auth';

export default function CheckoutPage() {
  const router = useRouter();
  const { scope } = useLessonCartScope();
  const {
    items,
    total,
    purchasedIds,
    checkout,
    clearCart,
    removeItem,
    addItem,
  } = useLessonCart(scope);
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

  const promoCards = [
    {
      id: 'piano-keys-foundations',
      program: 'Simply Music Gateway',
      section: 'Piano Keys Foundations',
      title: 'Piano Keys Foundations',
      description:
        'Build confident finger control, even tone, and smooth hand shifts with simple piano drills.',
      image: '/reference/students-program-card.png',
    },
    {
      id: 'piano-melody-lab',
      program: 'Simply Music Gateway',
      section: 'Piano Melody Lab',
      title: 'Piano Melody Lab',
      description:
        'Shape simple melodies with dynamics, clean hand balance, and relaxed articulation.',
      image: '/reference/makeup-lesson2.jpg',
    },
    {
      id: 'chords-and-colors',
      program: 'Simply Music Gateway',
      section: 'Chords and Colors',
      title: 'Chords and Colors',
      description:
        'Explore simple triads, inversions, and progressions to make your playing feel full and musical.',
      image: '/reference/students-program-card.png',
    },
  ];

  const promoItems = useMemo(() => {
    return promoCards
      .map(card => {
        const cartItem = createLessonCartItem(card.program, card.section);
        return {
          ...card,
          cartItem,
          inCart: items.some(item => item.id === cartItem.id),
          isUnlocked: purchasedIds.includes(cartItem.id),
        };
      })
      .filter(card => !card.isUnlocked && !card.inCart);
  }, [items, promoCards, purchasedIds]);

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
              <div className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-f7f7f5)] px-4 py-2 text-base font-extrabold uppercase tracking-[0.2em] text-[var(--c-1f1f1d)] [[data-theme=dark]_&]:border-[var(--c-ecebe7)] [[data-theme=dark]_&]:bg-[#22262c] [[data-theme=dark]_&]:text-white/90">
                Total {formatCurrency(total)}
              </div>
            </div>

            <div className="space-y-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-f7f7f5)] px-4 py-3 text-sm md:flex-row md:items-center md:justify-between [[data-theme=dark]_&]:border-[var(--c-ecebe7)] [[data-theme=dark]_&]:bg-[#22262c]"
                >
                  <div>
                    <p className="font-medium text-[var(--c-1f1f1d)] [[data-theme=dark]_&]:text-white/90">
                      {item.section}
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)] [[data-theme=dark]_&]:text-white/50">
                      {item.program}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-sm font-bold text-[var(--c-3a3935)] [[data-theme=dark]_&]:text-white/80">
                      {formatCurrency(item.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.section} from cart`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--c-e5e3dd)] text-base leading-none text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)] [[data-theme=dark]_&]:border-white/20 [[data-theme=dark]_&]:text-white/75 [[data-theme=dark]_&]:hover:border-white/50 [[data-theme=dark]_&]:hover:text-white"
                    >
                      ×
                    </button>
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

      {promoItems.length > 0 ? (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {promoItems.map(card => (
          <article
            key={card.id}
            className="overflow-hidden rounded-2xl border border-[var(--c-e5e3dd)] bg-[linear-gradient(165deg,var(--c-ffffff),var(--c-f7f7f5))] shadow-[0_20px_46px_-34px_rgba(24,29,35,0.4)] [[data-theme=dark]_&]:border-[rgba(95,121,150,0.35)] [[data-theme=dark]_&]:bg-[linear-gradient(160deg,#121923,#101722)] [[data-theme=dark]_&]:shadow-[0_20px_50px_-32px_rgba(0,0,0,0.65)]"
          >
            <div
              className="h-32 bg-cover bg-center"
              style={{ backgroundImage: `url(${card.image})` }}
            >
              <div className="flex h-full items-end bg-gradient-to-b from-black/5 via-black/20 to-black/35 px-4 pb-3 [[data-theme=dark]_&]:from-black/10 [[data-theme=dark]_&]:via-black/30 [[data-theme=dark]_&]:to-black/55">
                <span className="inline-flex rounded-full border border-black/25 bg-white/70 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[var(--c-1f1f1d)] backdrop-blur-sm [[data-theme=dark]_&]:border-white/45 [[data-theme=dark]_&]:bg-white/10 [[data-theme=dark]_&]:text-white/90">
                  New Pack
                </span>
              </div>
            </div>
            <div className="space-y-3 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                New Simply Music Lesson
              </p>
              <h3 className="text-3xl font-semibold text-[var(--c-1f1f1d)] [[data-theme=dark]_&]:text-white/90">
                {card.title}
              </h3>
              <p className="text-sm text-[var(--c-6f6c65)] [[data-theme=dark]_&]:text-white/65">{card.description}</p>
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => addItem(card.cartItem)}
                  className="inline-flex items-center rounded-full border border-[var(--c-1f1f1d)]/65 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--c-1f1f1d)] transition hover:bg-black/[0.04] [[data-theme=dark]_&]:border-white/80 [[data-theme=dark]_&]:text-white/90 [[data-theme=dark]_&]:hover:bg-white/10"
                >
                  Add To Your Order
                </button>
                <span className="inline-flex min-w-[68px] items-center justify-center rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-3 py-2 text-3xl font-semibold text-[var(--c-1f1f1d)] [[data-theme=dark]_&]:border-[rgba(94,125,162,0.55)] [[data-theme=dark]_&]:bg-[#1a2431] [[data-theme=dark]_&]:text-white/90">
                  {formatCurrency(card.cartItem.price)}
                </span>
              </div>
            </div>
          </article>
        ))}
      </section>
      ) : null}

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
