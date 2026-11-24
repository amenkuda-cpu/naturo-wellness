import { KeyRound, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { AdminTitle, Card, CardTitle, DevModeBanner } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ reset?: string; setup?: string }> }) {
  const ctx = await requireStaff({ allowPasswordSetup: true });
  const { reset } = await searchParams;
  const mustChange = ctx.mode === "supabase" && ctx.user.mustChangePassword;
  return (
    <>
      <DevModeBanner ctx={ctx} />
      <AdminTitle title={mustChange ? "Choose your password" : "My account"} subtitle={ctx.mode === "supabase" ? ctx.user.email : "Development preview"} />
      {mustChange && (
        <div role="alert" className="mb-5 max-w-4xl rounded-[20px] bg-[var(--c-warn-bg)] px-5 py-4 text-sm text-[var(--c-warn)]">
          <p className="font-bold">You signed in with a temporary password.</p>
          <p className="mt-1">Choose your own password below (at least 10 characters). The dashboard opens as soon as it&apos;s saved.</p>
        </div>
      )}
      <div className="grid max-w-4xl gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle icon={KeyRound} tone="violet">{reset || mustChange ? "Choose a new password" : "Change password"}</CardTitle>
          {ctx.mode === "supabase" ? <PasswordForm /> : <p className="text-sm text-[var(--a-muted)]">Not available in the development preview.</p>}
        </Card>
        <Card>
          <CardTitle icon={ShieldCheck} tone="green">Access</CardTitle>
          <ul className="space-y-2 text-sm text-[var(--a-muted)]">
            <li>Role: <strong className="capitalize">{ctx.role}</strong></li>
            <li>The admin works on any network and any device. Just open <strong>getnaturo.com/admin</strong>.</li>
            <li>Only accounts listed as staff in the database can open it. Everyone else is turned away, even with a valid login.</li>
            <li>Sign out on shared computers.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
