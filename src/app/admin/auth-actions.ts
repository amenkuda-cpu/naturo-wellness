"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requestAdminCode, verifyAdminCode } from "@/lib/admin-otp";
import { requireStaff } from "@/lib/auth";
import { env } from "@/lib/env";
import { createServiceClient, createUserClient } from "@/lib/supabase/server";

export interface AuthState {
  ok: boolean;
  message: string | null;
}

const email = z.email("Enter a valid email address.");

export interface CodeState extends AuthState {
  step: "email" | "code";
  email: string;
}

/** Step 1 of email-code sign in: send a 6-digit code to a staff email. */
export async function adminRequestCode(_prev: CodeState, formData: FormData): Promise<CodeState> {
  const parsed = email.safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message, step: "email", email: "" };
  if (!env.supabase.configured) return { ok: false, message: "Sign in is not configured on this server.", step: "email", email: parsed.data };
  const r = await requestAdminCode(parsed.data);
  return { ok: r.ok, message: r.message, step: r.ok ? "code" : "email", email: parsed.data };
}

/** Step 2: check the code and start the session. */
export async function adminVerifyCode(prev: CodeState, formData: FormData): Promise<CodeState> {
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  const addr = String(formData.get("email") ?? prev.email);
  if (code.length !== 6) return { ...prev, ok: false, message: "Enter the 6 digits from the email." };
  const r = await verifyAdminCode(addr, code);
  if (!r.ok) return { ...prev, ok: false, message: r.message, step: "code", email: addr };
  redirect("/admin");
}

/** Email + password sign in for staff. Non-staff accounts are signed straight back out. */
export async function adminSignIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({ email, password: z.string().min(1, "Enter your password.").max(200) })
    .safeParse({ email: String(formData.get("email") ?? "").trim().toLowerCase(), password: String(formData.get("password") ?? "") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const supabase = await createUserClient();
  if (!supabase) return { ok: false, message: "Sign in is not configured on this server." };

  let { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  // Copy-pasted passwords often carry a stray space at either end.
  const trimmed = parsed.data.password.trim();
  if ((error || !data.user) && trimmed && trimmed !== parsed.data.password && !/rate limit/i.test(error?.message ?? "")) {
    ({ data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: trimmed }));
  }
  if (error && /rate limit|too many/i.test(error.message)) {
    return { ok: false, message: "Too many attempts in a row. Wait a few minutes, then try again." };
  }
  if (error || !data.user) {
    return { ok: false, message: "That email and password don't match. Passwords are case-sensitive: tap the eye to check what you typed." };
  }

  const { data: staff } = await supabase.from("staff_members").select("role").eq("user_id", data.user.id).maybeSingle();
  if (!staff) {
    await supabase.auth.signOut();
    return { ok: false, message: "This account doesn't have admin access." };
  }
  redirect("/admin");
}

/** Passwordless option: a one-time sign-in link to the admin's inbox. */
export async function adminMagicLink(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = email.safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const supabase = await createUserClient();
  if (!supabase) return { ok: false, message: "Sign in is not configured on this server." };
  const mode = String(formData.get("mode") ?? "link");
  const { error } =
    mode === "reset"
      ? await supabase.auth.resetPasswordForEmail(parsed.data, {
          redirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent("/admin/account?reset=1")}`,
        })
      : await supabase.auth.signInWithOtp({
          email: parsed.data,
          options: { shouldCreateUser: false, emailRedirectTo: `${env.siteUrl}/auth/callback?next=/admin` },
        });
  // Same answer whether or not the address exists, so the form can't be used to probe accounts.
  if (error && !/not found|signups not allowed/i.test(error.message)) {
    return { ok: false, message: "We couldn't send the email just now. Please try again in a few minutes." };
  }
  return {
    ok: true,
    message: mode === "reset" ? "If that's an admin account, a password reset link is on its way." : "If that's an admin account, a sign-in link is on its way.",
  };
}

export async function adminChangePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const ctx = await requireStaff({ allowPasswordSetup: true });
  const parsed = z
    .object({
      password: z.string().min(10, "Use at least 10 characters.").max(200),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { message: "The two passwords don't match.", path: ["confirm"] })
    .safeParse({ password: String(formData.get("password") ?? ""), confirm: String(formData.get("confirm") ?? "") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const supabase = await createUserClient();
  if (!supabase) return { ok: false, message: "Not available in development mode." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: error.message };
  if (ctx.mode === "supabase" && ctx.user.mustChangePassword) {
    // Placeholder replaced: clear the flag (server-only metadata) and open the dashboard.
    await createServiceClient().auth.admin.updateUserById(ctx.user.id, { app_metadata: { must_change_password: false } });
    redirect("/admin");
  }
  return { ok: true, message: "Password updated. Use it next time you sign in." };
}

export async function adminSignOut() {
  const supabase = await createUserClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}
