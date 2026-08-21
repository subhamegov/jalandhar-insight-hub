// User controlled prioritisation.
//
// The computed ranking (value, delay, risk, evidence conflict) stays the
// default. A senior reviewer can move any item up or down, and that order is
// remembered on this device so the same review order is presented next time.
// No underlying record or score is changed by reordering.

import { useCallback, useEffect, useMemo, useState } from "react";

const PREFIX = "jci.priority.";

function read(key: string): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return null;
  }
}

function write(key: string, order: string[] | null) {
  if (typeof window === "undefined") return;
  try {
    if (order === null) window.localStorage.removeItem(PREFIX + key);
    else window.localStorage.setItem(PREFIX + key, JSON.stringify(order));
  } catch {
    // Storage can be unavailable; the order simply falls back to computed.
  }
}

/** Applies a saved order to the current id list, keeping unknown ids at the end. */
function apply(saved: string[] | null, defaults: string[]): string[] {
  if (!saved) return defaults;
  const known = saved.filter((id) => defaults.includes(id));
  const rest = defaults.filter((id) => !known.includes(id));
  return [...known, ...rest];
}

export interface PriorityOrder {
  /** Ordered ids to render. */
  order: string[];
  /** True when the reviewer has moved something away from the computed order. */
  isCustom: boolean;
  /** Move an item by one position, or to an explicit index. */
  move: (id: string, direction: -1 | 1) => void;
  moveTo: (id: string, index: number) => void;
  reset: () => void;
  /** Rank in the computed order, 1 based, for showing what changed. */
  computedRank: (id: string) => number;
}

export function usePriorityOrder(key: string, defaults: string[]): PriorityOrder {
  const defaultsKey = defaults.join("|");
  const [saved, setSaved] = useState<string[] | null>(null);

  // Read after mount so server and client markup match.
  useEffect(() => {
    setSaved(read(key));
  }, [key]);

  const order = useMemo(() => apply(saved, defaults), [saved, defaultsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = useCallback(
    (next: string[]) => {
      setSaved(next);
      write(key, next);
    },
    [key],
  );

  const moveTo = useCallback(
    (id: string, index: number) => {
      const from = order.indexOf(id);
      if (from === -1) return;
      const target = Math.max(0, Math.min(order.length - 1, index));
      if (target === from) return;
      const next = [...order];
      next.splice(from, 1);
      next.splice(target, 0, id);
      commit(next);
    },
    [order, commit],
  );

  const move = useCallback(
    (id: string, direction: -1 | 1) => moveTo(id, order.indexOf(id) + direction),
    [order, moveTo],
  );

  const reset = useCallback(() => {
    setSaved(null);
    write(key, null);
  }, [key]);

  const computedRank = useCallback((id: string) => defaults.indexOf(id) + 1, [defaultsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    order,
    isCustom: saved !== null && saved.join("|") !== defaults.join("|"),
    move,
    moveTo,
    reset,
    computedRank,
  };
}

/** Sorts records into the reviewer's order. */
export function sortByOrder<T>(items: T[], order: string[], idOf: (item: T) => string): T[] {
  const index = new Map(order.map((id, i) => [id, i]));
  return [...items].sort(
    (a, b) => (index.get(idOf(a)) ?? 9999) - (index.get(idOf(b)) ?? 9999),
  );
}
