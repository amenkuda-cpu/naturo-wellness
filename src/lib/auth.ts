import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { env } from "@/lib/env";
import { createUserClient } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  email: string | null;
  /** Set (server-side only, in app_metadata) while the account still has a placeholder password. */
  mustChangePassword: boolean;
}

/** Returns the verified Supabase user (validated with the auth server), or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createUserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null, mustChangePassword: data.user.app_metadata?.must_change_password === true };
}

export type StaffContext =
  | { mode: "supabase"; user: SessionUser; role: "admin" | "staff" }
  | { mode: "dev"; user: null; role: "admin" };

/**
 * Resolves staff access on the server. Role membership is read through the
 * user's own RLS-scoped client from `staff_members`; database policies
 * independently enforce the same rule on every write.
 */
export async function getStaffContext(): Promise<StaffContext | null> {
  // Staff access is always decided per request, never prerendered.
  await connection();
  if (env.supabase.configured) {
    const user = await getSessionUser();
    if (!user) return null;
    const supabase = await createUserClient();
    const { data } = await supabase!.from("staff_members").select("role").eq("user_id", user.id).maybeSingle();
    if (!data) return null;
    return { mode: "supabase", user, role: data.role };
  }
  if (env.dev.admin) return { mode: "dev", user: null, role: "admin" };
  return null;
}

/** Use at the top of every admin page AND every admin Server Action. */
export async function requireStaff(opts: { admin?: boolean; allowPasswordSetup?: boolean } = {}): Promise<StaffContext> {
  const ctx = await getStaffContext();
  if (!ctx) redirect("/admin/login");
  // Placeholder password: nothing else is reachable until the admin picks their own.
  if (ctx.mode === "supabase" && ctx.user.mustChangePassword && !opts.allowPasswordSetup) redirect("/admin/account?setup=1");
  if (opts.admin && ctx.role !== "admin") redirect("/admin?error=forbidden");
  return ctx;
}
