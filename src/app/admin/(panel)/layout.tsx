import Link from "next/link";
import { Suspense } from "react";
import { AdminActions, AdminTabs } from "@/components/admin/admin-nav";
import { Logo } from "@/components/brand/logo";
import { requireStaff } from "@/lib/auth";
import { getStaffOps } from "@/lib/ops/repository";
import { getStaffRepository } from "@/lib/repositories";
import { adminSignOut } from "../auth-actions";

async function Shell({ children }: { children: React.ReactNode }) {
  // Pages enforce the placeholder-password rule themselves; the frame must render on the password screen too.
  const ctx = await requireStaff({ allowPasswordSetup: true });
  const [repo, ops] = await Promise.all([getStaffRepository(ctx), getStaffOps(ctx)]);
  const [newOrders, enquiries] = await Promise.all([
    repo.listOrders({ status: "pending", limit: 99 }).catch(() => []),
    ops.listEnquiries(200).catch(() => []),
  ]);
  const newQueries = enquiries.filter((e) => e.status === "new").length;
  const badges = { "/admin/orders": newOrders.length, "/admin/enquiries": newQueries };
  const who = ctx.mode === "dev" ? "Development preview" : ctx.user.email ?? "Admin";

  return (
    <div className="mx-auto min-h-screen max-w-[1440px] px-4 pb-10 sm:px-6 lg:px-8">
      <header className="sticky top-0 z-40 -mx-4 mb-2 bg-[var(--a-bg)]/80 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/admin" className="flex shrink-0 items-center gap-2.5" aria-label="Naturo admin home">
            <Logo className="h-11" />
            <span className="hidden text-lg font-semibold tracking-[-0.02em] text-[var(--a-ink)] sm:block">naturo<span className="text-[var(--a-muted)]"> admin</span></span>
          </Link>
          <div className="hidden min-w-0 lg:block">
            <AdminTabs badges={badges} />
          </div>
          <AdminActions who={who} initial={who[0] ?? "A"} alerts={newOrders.length + newQueries} signOut={ctx.mode === "supabase" ? adminSignOut : undefined} />
        </div>
        <div className="mt-3 lg:hidden">
          <AdminTabs badges={badges} />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function ShellFallback() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-24 sm:px-8" aria-busy="true" aria-label="Loading the dashboard">
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="h-56 animate-pulse rounded-[28px] bg-[var(--a-card)] lg:col-span-2" />
        <div className="h-56 animate-pulse rounded-[28px] bg-[var(--a-card)]" />
        <div className="h-56 animate-pulse rounded-[28px] bg-[var(--a-card)]" />
      </div>
    </div>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
