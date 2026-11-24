"use client";

import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { useActionState, useState } from "react";
import { adminRequestCode, adminSignIn, adminVerifyCode, type AuthState, type CodeState } from "../auth-actions";

const field =
  "w-full rounded-[14px] border border-[var(--a-line)] bg-[var(--a-inset)] py-3 pl-11 pr-3.5 text-[0.95rem] text-[var(--a-ink)] outline-none transition placeholder:text-[var(--a-muted)] focus:border-[#9B7BF7] focus:ring-4 focus:ring-[#9B7BF7]/20";
const primary =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--a-accent)] px-5 py-3 text-sm font-semibold text-[#14151B] transition hover:brightness-110 disabled:opacity-60";

/**
 * Admin sign in: email → 6-digit code. Password stays available as a fallback
 * (shown up front only while the server can't send email yet).
 */
export function AdminLoginForm({ linkError, emailReady }: { linkError: boolean; emailReady: boolean }) {
  const [usePassword, setUsePassword] = useState(!emailReady);
  const [showPw, setShowPw] = useState(false);
  const init: CodeState = { ok: false, message: null, step: "email", email: "" };
  const [req, reqAction, reqPending] = useActionState(adminRequestCode, init);
  const [ver, verAction, verPending] = useActionState(adminVerifyCode, init);
  const [pw, pwAction, pwPending] = useActionState<AuthState, FormData>(adminSignIn, { ok: false, message: null });
  const [back, setBack] = useState(0);
  const onCodeStep = req.step === "code" && back < 1;
  const codeState = ver.message ? ver : req;

  if (usePassword) {
    return (
      <div>
        {!emailReady && (
          <p className="mb-4 rounded-[14px] bg-[var(--c-warn-bg)] px-4 py-3 text-sm text-[var(--c-warn)]">
            Email codes switch on once the shop&apos;s email sender is connected. Until then, sign in with your password.
          </p>
        )}
        <form action={pwAction} className="space-y-4">
          <Field icon={<Mail className="h-4 w-4" aria-hidden />} label="Admin email">
            <input name="email" type="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required className={field} placeholder="you@example.com" />
          </Field>
          <Field icon={<Lock className="h-4 w-4" aria-hidden />} label="Password">
            <input
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              className={`${field} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              aria-pressed={showPw}
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-[var(--a-muted)] hover:text-[var(--a-ink)]"
            >
              {showPw ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </Field>
          <button type="submit" className={primary} disabled={pwPending}>
            {pwPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <KeyRound className="h-4 w-4" aria-hidden />} Sign in
          </button>
          <Status state={pw} />
        </form>
        {emailReady && (
          <button type="button" onClick={() => setUsePassword(false)} className="mx-auto mt-2 block text-sm font-semibold text-[var(--a-ink)] underline underline-offset-4">
            Email me a code instead
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {linkError && <p role="alert" className="mb-4 rounded-[14px] bg-[var(--c-bad-bg)] px-4 py-3 text-sm text-[var(--c-bad)]">That link has expired. Ask for a code instead.</p>}
      {!onCodeStep ? (
        <form action={(fd) => { setBack(0); reqAction(fd); }} className="space-y-4">
          <Field icon={<Mail className="h-4 w-4" aria-hidden />} label="Admin email">
            <input name="email" type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required defaultValue={req.email} className={field} placeholder="you@example.com" />
          </Field>
          <button type="submit" className={primary} disabled={reqPending}>
            {reqPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Mail className="h-4 w-4" aria-hidden />} Email me a sign-in code
          </button>
          <Status state={req} />
        </form>
      ) : (
        <form action={verAction} className="space-y-4">
          <input type="hidden" name="email" value={req.email} />
          <p className="text-sm text-[var(--a-muted)]">We sent a 6-digit code to <strong className="text-[var(--a-ink)]">{req.email}</strong>.</p>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Code</span>
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]{6,7}"
              maxLength={7}
              required
              autoFocus
              placeholder="••••••"
              className="w-full rounded-[14px] border border-[var(--a-line)] bg-[var(--a-inset)] px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-[var(--a-ink)] outline-none focus:border-[#9B7BF7] focus:ring-4 focus:ring-[#9B7BF7]/20"
            />
          </label>
          <button type="submit" className={primary} disabled={verPending}>
            {verPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ShieldCheck className="h-4 w-4" aria-hidden />} Verify and sign in
          </button>
          <Status state={codeState} />
          <button type="button" onClick={() => setBack(1)} className="mx-auto flex items-center gap-1.5 text-sm font-semibold text-[var(--a-muted)] hover:text-[var(--a-ink)]">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Use another email or send a new code
          </button>
        </form>
      )}
      <button type="button" onClick={() => setUsePassword(true)} className="mx-auto mt-3 block text-xs text-[var(--a-muted)] underline underline-offset-4">
        Use password instead
      </button>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--a-muted)]">{icon}</span>
        {children}
      </span>
    </label>
  );
}

function Status({ state }: { state: AuthState }) {
  return (
    <p aria-live="polite" className={state.ok ? "text-sm font-medium text-[var(--c-ok)]" : "text-sm font-medium text-[var(--c-bad)]"}>
      {state.message}
    </p>
  );
}
