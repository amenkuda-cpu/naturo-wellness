import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { getStaffContext } from "@/lib/auth";
import { env } from "@/lib/env";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in" };

async function Gate({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const ctx = await getStaffContext();
  if (ctx) redirect("/admin");
  const { error } = await searchParams;
  if (!env.supabase.authConfigured) {
    return <p className="text-sm text-[var(--a-muted)]">Admin sign in needs Supabase to be configured on this server.</p>;
  }
  return <AdminLoginForm linkError={error === "link"} emailReady={env.email.configured} />;
}

export default function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      {/* Soft colour fields, like the Amey sky. */}
      <span className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[var(--c-warn-bg)] blur-3xl" aria-hidden />
      <span className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-[var(--c-ok-bg)] blur-3xl" aria-hidden />
      <span className="pointer-events-none absolute right-1/4 top-10 h-56 w-56 rounded-full bg-[var(--c-bad-bg)] blur-3xl" aria-hidden />

      <div className="admin-rise relative w-full max-w-[420px] rounded-[30px] border border-[var(--a-line)] bg-[var(--a-card)] p-7  sm:p-9">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="h-16" />
          <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.02em] text-[var(--a-ink)]">Naturo admin</h1>
          <p className="mt-1 text-sm text-[var(--a-muted)]">Orders, deliveries, queries and profit in one place.</p>
        </div>
        <Suspense fallback={<div className="h-56" />}>
          <Gate searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
