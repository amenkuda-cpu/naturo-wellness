"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { btn, field } from "@/components/admin/ui";
import { adminChangePassword, type AuthState } from "../../auth-actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(adminChangePassword, { ok: false, message: null });
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-[var(--a-ink)]">New password</span>
        <input name="password" type="password" autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} minLength={10} required className={field} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-[var(--a-ink)]">Type it again</span>
        <input name="confirm" type="password" autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} minLength={10} required className={field} />
      </label>
      <button className={btn.primary} disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}Save password
      </button>
      <p aria-live="polite" className={state.ok ? "text-sm font-medium text-[var(--c-ok)]" : "text-sm font-medium text-[var(--c-bad)]"}>{state.message}</p>
    </form>
  );
}
