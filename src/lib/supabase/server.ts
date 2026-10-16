import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Service-role client: bypasses RLS. Server-only, used for catalogue reads,
 * order creation, guest order lookups and verified payment updates.
 * NEVER import this from client code.
 */
export function createServiceClient() {
  if (!env.supabase.configured) throw new Error("Supabase is not configured.");
  return createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Per-request client acting as the signed-in user (RLS applies). */
export async function createUserClient() {
  if (!env.supabase.authConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component; the proxy refreshes the session.
        }
      },
    },
  });
}
