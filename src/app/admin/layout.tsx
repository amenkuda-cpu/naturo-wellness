import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Naturo Admin" },
  robots: { index: false, follow: false },
};

// Every admin view reads the session at request time.
export const instant = false;

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F5EE]">
      <header className="sticky top-0 z-40 border-b border-forest/10 bg-warm/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link href="/admin" className="text-lg" aria-label="Admin home">
            <Logo className="h-11" />
          </Link>
          <span className="rounded-full bg-forest px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-warm">Admin</span>
          <nav aria-label="Admin" className="no-scrollbar ml-auto flex gap-1 overflow-x-auto">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-full px-3 py-2 text-sm font-medium text-ink/70 hover:bg-forest/5 hover:text-forest">
                {n.label}
              </Link>
            ))}
            <Link href="/" className="rounded-full px-3 py-2 text-sm text-ink/70 hover:text-forest">
              View site ↗
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <Suspense fallback={<p className="text-ink/70">Loading…</p>}>{children}</Suspense>
      </main>
    </div>
  );
}
