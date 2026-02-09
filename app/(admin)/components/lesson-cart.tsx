'use client';

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { makeLessonId, slugifyLessonValue } from './lesson-utils';
import {
  formatCurrency,
  getSectionPriceForRole,
  STUDENT_SECTION_PRICE,
  TEACHER_SECTION_PRICE,
} from './lesson-pricing';

const LESSON_CART_KEY = 'sm_lesson_section_cart_v1';
const LESSON_PURCHASED_KEY = 'sm_lesson_section_purchased_v1';
const LESSON_PURCHASED_ITEMS_KEY = 'sm_lesson_section_purchased_items_v1';
type LessonCartItem = {
  id: string;
  program: string;
  section: string;
  price: number;
};

type LessonCartState = {
  items: LessonCartItem[];
  purchasedIds: string[];
  purchasedItems: LessonCartItem[];
};

const safeParse = (value: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getScopedKey = (base: string, scope?: string | null) => {
  if (!scope) return base;
  return `${base}:${scope}`;
};

const readCartState = (scope?: string | null): LessonCartState => {
  if (typeof window === 'undefined') {
    return { items: [], purchasedIds: [], purchasedItems: [] };
  }
  const cartKey = getScopedKey(LESSON_CART_KEY, scope);
  const purchasedKey = getScopedKey(LESSON_PURCHASED_KEY, scope);
  const purchasedItemsKey = getScopedKey(LESSON_PURCHASED_ITEMS_KEY, scope);
  const rawItems = safeParse(window.localStorage.getItem(cartKey));
  const rawPurchased = safeParse(
    window.localStorage.getItem(purchasedKey),
  );
  const rawPurchasedItems = safeParse(
    window.localStorage.getItem(purchasedItemsKey),
  );
  const items = Array.isArray(rawItems)
    ? rawItems.filter(item => item && typeof item.id === 'string')
    : [];
  const purchasedIds = Array.isArray(rawPurchased)
    ? rawPurchased.filter(item => typeof item === 'string')
    : [];
  const purchasedItems = Array.isArray(rawPurchasedItems)
    ? rawPurchasedItems.filter(item => item && typeof item.id === 'string')
    : [];
  if (scope && items.length === 0 && purchasedItems.length === 0) {
    const fallbackItems = safeParse(
      window.localStorage.getItem(LESSON_CART_KEY),
    );
    const fallbackPurchased = safeParse(
      window.localStorage.getItem(LESSON_PURCHASED_KEY),
    );
    const fallbackPurchasedItems = safeParse(
      window.localStorage.getItem(LESSON_PURCHASED_ITEMS_KEY),
    );
    const itemsFallback = Array.isArray(fallbackItems)
      ? fallbackItems.filter(item => item && typeof item.id === 'string')
      : [];
    const purchasedIdsFallback = Array.isArray(fallbackPurchased)
      ? fallbackPurchased.filter(item => typeof item === 'string')
      : [];
    const purchasedItemsFallback = Array.isArray(fallbackPurchasedItems)
      ? fallbackPurchasedItems.filter(item => item && typeof item.id === 'string')
      : [];
    if (itemsFallback.length || purchasedItemsFallback.length) {
      return {
        items: itemsFallback,
        purchasedIds: purchasedIdsFallback,
        purchasedItems: purchasedItemsFallback,
      };
    }
  }
  return { items, purchasedIds, purchasedItems };
};

const writeCartState = (state: LessonCartState, scope?: string | null) => {
  const cartKey = getScopedKey(LESSON_CART_KEY, scope);
  const purchasedKey = getScopedKey(LESSON_PURCHASED_KEY, scope);
  const purchasedItemsKey = getScopedKey(LESSON_PURCHASED_ITEMS_KEY, scope);
  window.localStorage.setItem(cartKey, JSON.stringify(state.items));
  window.localStorage.setItem(purchasedKey, JSON.stringify(state.purchasedIds));
  window.localStorage.setItem(
    purchasedItemsKey,
    JSON.stringify(state.purchasedItems),
  );
};

export const getLessonCartState = (scope?: string | null) =>
  readCartState(scope);

export const setLessonCartState = (
  scope: string | null | undefined,
  state: LessonCartState,
) => {
  if (typeof window === 'undefined') return;
  writeCartState(state, scope);
  const key = scope ?? 'default';
  cachedStateByScope.set(key, state);
  listeners.forEach(listener => listener());
};

export const getAllPurchasedItems = () => {
  if (typeof window === 'undefined') return [] as LessonCartItem[];
  const results: LessonCartItem[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (key === LESSON_PURCHASED_ITEMS_KEY || key.startsWith(`${LESSON_PURCHASED_ITEMS_KEY}:`)) {
      const parsed = safeParse(window.localStorage.getItem(key));
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (item && typeof item.id === 'string' && !seen.has(item.id)) {
            seen.add(item.id);
            results.push(item as LessonCartItem);
          }
        });
      }
    }
  }
  return results;
};

const listeners = new Set<() => void>();
const cachedStateByScope = new Map<string, LessonCartState>();

const getCachedState = (scope?: string | null) => {
  const key = scope ?? 'default';
  const cached = cachedStateByScope.get(key);
  if (cached) return cached;
  const next = readCartState(scope);
  cachedStateByScope.set(key, next);
  return next;
};

const setCachedState = (
  next: LessonCartState,
  options: { persist: boolean } = { persist: true },
  scope?: string | null,
) => {
  const key = scope ?? 'default';
  cachedStateByScope.set(key, next);
  if (options.persist && typeof window !== 'undefined') {
    writeCartState(next, scope);
  }
  listeners.forEach(listener => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getServerSnapshot = (): LessonCartState => ({
  items: [],
  purchasedIds: [],
  purchasedItems: [],
});


export const createLessonCartItem = (
  program: string,
  section: string,
  role?: string | null,
) => ({
  id: makeLessonId(program, section),
  program,
  section,
  price: getSectionPriceForRole(role, program, section),
});

export const useLessonCart = (scope?: string | null) => {
  const state = useSyncExternalStore(
    subscribe,
    () => getCachedState(scope),
    getServerSnapshot,
  );
  const { items, purchasedIds } = state;
  const purchasedItems = state.purchasedItems ?? [];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event: StorageEvent) => {
      const cartKey = getScopedKey(LESSON_CART_KEY, scope);
      const purchasedKey = getScopedKey(LESSON_PURCHASED_KEY, scope);
      const purchasedItemsKey = getScopedKey(LESSON_PURCHASED_ITEMS_KEY, scope);
      if (
        event.key === cartKey ||
        event.key === purchasedKey ||
        event.key === purchasedItemsKey
      ) {
        setCachedState(readCartState(scope), { persist: false }, scope);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items],
  );

  const hasDevelopmentUnlock = useMemo(() => {
    const developmentSlug = slugifyLessonValue('Development Program');
    const count = purchasedItems.filter(
      item => slugifyLessonValue(item.program) === developmentSlug,
    ).length;
    return count >= 4;
  }, [purchasedItems]);

  const addItem = useCallback((item: LessonCartItem) => {
    const current = getCachedState(scope);
    setCachedState({
      ...current,
      items: current.items.some(existing => existing.id === item.id)
        ? current.items
        : [...current.items, item],
    }, { persist: true }, scope);
  }, [scope]);

  const removeItem = useCallback((id: string) => {
    const current = getCachedState(scope);
    setCachedState({
      ...current,
      items: current.items.filter(item => item.id !== id),
    }, { persist: true }, scope);
  }, [scope]);

  const toggleItem = useCallback((item: LessonCartItem) => {
    const current = getCachedState(scope);
    const exists = current.items.some(existing => existing.id === item.id);
    const nextItems = exists
      ? current.items.filter(existing => existing.id !== item.id)
      : [...current.items, item];
    setCachedState({ ...current, items: nextItems }, { persist: true }, scope);
  }, [scope]);

  const isInCart = useCallback(
    (id: string) => items.some(item => item.id === id),
    [items],
  );

  const isPurchased = useCallback(
    (id: string) => purchasedIds.includes(id),
    [purchasedIds],
  );

  const clearCart = useCallback(() => {
    const current = getCachedState(scope);
    setCachedState({ ...current, items: [] }, { persist: true }, scope);
  }, [scope]);

  const checkout = useCallback(() => {
    const current = getCachedState(scope);
    const nextPurchased = Array.from(
      new Set([...current.purchasedIds, ...current.items.map(item => item.id)]),
    );
    const nextPurchasedItems = [
      ...current.purchasedItems,
      ...current.items.filter(
        item => !current.purchasedItems.some(prev => prev.id === item.id),
      ),
    ];
    setCachedState({
      items: [],
      purchasedIds: nextPurchased,
      purchasedItems: nextPurchasedItems,
    }, { persist: true }, scope);
  }, [scope]);

  return {
    items,
    purchasedIds,
    purchasedItems,
    total,
    addItem,
    removeItem,
    toggleItem,
    isInCart,
    isPurchased,
    hasDevelopmentUnlock,
    clearCart,
    checkout,
  };
};
