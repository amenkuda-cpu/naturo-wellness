"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/lib/env";
import { createUserClient } from "@/lib/supabase/server";

export interface LoginState {
  ok: boolean;
  message: string | null;
}

const emailSchema = z.email("Enter a valid email address.");

/** Sends a passwordless sign-in link (Supabase magic link). */
export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const supabase = await createUserClient();
  if (!supabase) return { ok: false, message: "Accounts are not available yet." };

  const next = String(formData.get("next") ?? "/account");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent(safeNext)}` },
  });
  if (error) return { ok: false, message: "We couldn't send the link. Please try again shortly." };
  return { ok: true, message: "Check your email for a secure sign-in link." };
}

export async function signOut() {
  const supabase = await createUserClient();
  await supabase?.auth.signOut();
  redirect("/");
}
