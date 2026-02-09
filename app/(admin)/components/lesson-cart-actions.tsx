'use client';

import Link from 'next/link';
import { useLessonCart } from './lesson-cart';
import { formatCurrency } from './lesson-pricing';
import { useLessonCartScope } from './lesson-cart-scope';

type LessonCartPurchaseButtonProps = {
  className?: string;
};

export default function LessonCartPurchaseButton({
  className = '',
}: LessonCartPurchaseButtonProps) {
  const { scope } = useLessonCartScope();
  const { items, total } = useLessonCart(scope);

  if (items.length === 0) return null;

  return (
    <Link
      href="/checkout"
      className={`inline-flex items-center justify-center rounded-full bg-[#2f8f5b] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:brightness-110 ${className}`}
    >
      PURCHASE {items.length} SELECTED SECTIONS - {formatCurrency(total)}
    </Link>
  );
}
