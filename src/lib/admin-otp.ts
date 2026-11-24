import "server-only";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { createServiceClient, createUserClient } from "@/lib/supabase/server";
import {
  OTP_MAX_PER_WINDOW,
  OTP_TTL_MS,
  OTP_WINDOW_MS,
  checkCode,
  generateCode,
  hashCode,
  normaliseEmail,
  type CodeRow,
} from "./otp-code";

/**
 * Email one-time-code sign in for staff.
 * 1. requestAdminCode: if the email belongs to a staff member, store an HMAC of a
 *    fresh 6-digit code (10 minutes, 5 tries) and email the code.
 * 2. verifyAdminCode: check the code, then mint a Supabase session for that user
 *    (admin generateLink → verifyOtp with the hashed token) so normal RLS applies.
 * The answer to step 1 is the same whether or not the address is staff.
 */

const secret = () => env.supabase.serviceRoleKey;

async function findStaffUser(email: string): Promise<{ id: string; email: string } | null> {
  const db = createServiceClient();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email && normaliseEmail(u.email) === email);
    if (user) {
      const { data: staff } = await db.from("staff_members").select("role").eq("user_id", user.id).maybeSingle();
      return staff ? { id: user.id, email: user.email! } : null;
    }
    if (data.users.length < 200) break;
  }
  return null;
}

export async function requestAdminCode(rawEmail: string): Promise<{ ok: boolean; message: string }> {
  const email = normaliseEmail(rawEmail);
  const generic = { ok: true, message: `If ${email} is an admin, a 6-digit code is on its way. It works for 10 minutes.` };
  const db = createServiceClient();

  const since = new Date(Date.now() - OTP_WINDOW_MS).toISOString();
  const { count, error: countErr } = await db.from("admin_login_codes").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since);
  if (countErr) return { ok: false, message: "Sign-in codes aren't set up on the server yet. Use your password for now." };
  if ((count ?? 0) >= OTP_MAX_PER_WINDOW) return { ok: false, message: "Too many codes asked for. Wait 15 minutes and try again." };

  const user = await findStaffUser(email);
  if (!user) return generic;

  const code = generateCode();
  const { error } = await db.from("admin_login_codes").insert({ email, code_hash: hashCode(code, email, secret()), expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString() });
  if (error) return { ok: false, message: "Couldn't create a code. Please try again." };

  const sent = await sendEmail({
    from: "noreply",
    to: user.email,
    subject: `${code} is your Naturo admin code`,
    text: `Your Naturo admin sign-in code is:\n\n${code}\n\nIt works for 10 minutes. If you didn't ask for it, ignore this email: nobody can sign in without the code.`,
  });
  if (!sent.ok) return { ok: false, message: sent.error };
  return generic;
}

export async function verifyAdminCode(rawEmail: string, code: string): Promise<{ ok: boolean; message: string }> {
  const email = normaliseEmail(rawEmail);
  const db = createServiceClient();
  const { data: row } = await db
    .from("admin_login_codes")
    .select("id, code_hash, attempts, used, expires_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const verdict = checkCode(row as (CodeRow & { id: number }) | null, code.trim(), email, secret());
  if (verdict !== "ok") {
    if (row && verdict === "wrong") await db.from("admin_login_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    const msg = { none: "Ask for a new code first.", expired: "That code has expired. Ask for a new one.", locked: "Too many wrong tries. Ask for a new code.", wrong: "That code isn't right. Check the latest email." }[verdict];
    return { ok: false, message: msg };
  }
  await db.from("admin_login_codes").update({ used: true }).eq("id", row!.id);

  const user = await findStaffUser(email);
  if (!user) return { ok: false, message: "This account doesn't have admin access." };
  const { data: link, error } = await db.auth.admin.generateLink({ type: "magiclink", email: user.email });
  const tokenHash = link?.properties?.hashed_token;
  if (error || !tokenHash) return { ok: false, message: "Couldn't start your session. Please try again." };
  const client = await createUserClient();
  const { error: vErr } = await client!.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (vErr) return { ok: false, message: "Couldn't start your session. Please try again." };
  return { ok: true, message: "Signed in." };
}
