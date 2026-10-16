"use client";

import { useSyncExternalStore } from "react";
import { addLine, countItems, removeLine, sanitiseLines, setLineQuantity } from "@/lib/commerce/cart";
import type { CartLine } from "@/lib/types";

/**
 * Guest cart persisted in localStorage. Prices are never stored here; they
 * always come from the catalogue (display) and the server (authoritative).
 */

const KEY = "naturo.cart.v1";

interface CartState {
  lines: CartLine[];
  open: boolean;
  /** Increments on every add, so UI can play feedback animations. */
  pulse: number;
  hydrated: boolean;
}

const SERVER_STATE: CartState = { lines: [], open: false, pulse: 0, hydrated: false };
let state: CartState = SERVER_STATE;
const listeners = new Set<() => void>();
let initialised = false;

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state.lines));
  } catch {
    // Storage unavailable (private mode): cart still works for this visit.
  }
}

function init() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  let lines: CartLine[] = [];
  try {
    lines = sanitiseLines(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
  } catch {
    lines = [];
  }
  state = { ...state, lines, hydrated: true };
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    try {
      state = { ...state, lines: sanitiseLines(JSON.parse(e.newValue ?? "[]")) };
    } catch {
      state = { ...state, lines: [] };
    }
    emit();
  });
}

function update(patch: Partial<CartState>, save = true) {
  state = { ...state, ...patch };
  if (save) persist();
  emit();
}

export const cart = {
  add(line: CartLine, opts: { open?: boolean } = {}) {
    update({ lines: addLine(state.lines, line), pulse: state.pulse + 1, open: opts.open ?? state.open });
  },
  setQuantity(variantId: string, quantity: number) {
    update({ lines: setLineQuantity(state.lines, variantId, quantity) });
  },
  remove(variantId: string) {
    update({ lines: removeLine(state.lines, variantId) });
  },
  /** Drop lines the catalogue no longer knows about. */
  prune(validVariantIds: Set<string>) {
    const lines = state.lines.filter((l) => validVariantIds.has(l.variantId));
    if (lines.length !== state.lines.length) update({ lines });
  },
  clear() {
    update({ lines: [] });
  },
  open() {
    update({ open: true }, false);
  },
  close() {
    update({ open: false }, false);
  },
};

function subscribe(listener: () => void) {
  init();
  listeners.add(listener);
  // Notify once so subscribers pick up the hydrated state.
  queueMicrotask(listener);
  return () => listeners.delete(listener);
}

export function useCart() {
  const s = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  return { ...s, count: countItems(s.lines) };
}
