"use client";

import { Loader2, Plus } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { addExpenseAction, type FormState } from "@/app/admin/ops-actions";
import { EXPENSE_CATEGORIES } from "@/lib/ops/types";
import { btn, field } from "./ui";

export function ExpenseForm({ today, disabled }: { today: string; disabled?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addExpenseAction, { ok: false, message: null });
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);
  return (
    <form ref={form} action={action} className="grid gap-2 sm:grid-cols-2">
      <label className="text-sm">
        <span className="mb-1 block font-semibold text-[var(--a-ink)]">Date</span>
        <input type="date" name="spentOn" defaultValue={today} max={today} required className={field} disabled={disabled} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-semibold text-[var(--a-ink)]">Type</span>
        <select name="category" className={field} defaultValue="ingredients" disabled={disabled}>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
        </select>
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="mb-1 block font-semibold text-[var(--a-ink)]">What for</span>
        <input name="description" maxLength={200} required placeholder="e.g. 20 kg ginger from Mbare" className={field} disabled={disabled} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-semibold text-[var(--a-ink)]">Amount (USD)</span>
        <input name="amount" inputMode="decimal" required placeholder="0.00" className={field} disabled={disabled} />
      </label>
      <div className="flex items-end">
        <button className={`${btn.primary} w-full`} disabled={pending || disabled}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />} Add expense
        </button>
      </div>
      {state.message && <p aria-live="polite" className={`sm:col-span-2 text-sm font-medium ${state.ok ? "text-[var(--c-ok)]" : "text-[var(--c-bad)]"}`}>{state.message}</p>}
    </form>
  );
}
