"use client";

import { Loader2, Mail } from "lucide-react";
import { useActionState } from "react";
import { ButtonLabel, buttonClasses } from "@/components/ui/button";
import { sendMagicLink, type LoginState } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, { ok: false, message: null });
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" aria-describedby="login-status" />
      </div>
      <button type="submit" disabled={pending} className={buttonClasses({ size: "lg", className: "w-full" })}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Mail className="h-4 w-4" aria-hidden />}
        <ButtonLabel>Email me a sign-in link</ButtonLabel>
      </button>
      <p id="login-status" aria-live="polite" className={state.ok ? "text-sm text-botanical" : "text-sm text-[#b42318]"}>
        {state.message}
      </p>
    </form>
  );
}
