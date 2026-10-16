import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth";
import { formatMoney } from "@/lib/commerce/pricing";
import { env } from "@/lib/env";
import { getRepository } from "@/lib/repositories";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

async function AccountContent() {
  if (!env.supabase.authConfigured) redirect("/account/login");
  const user = await getSessionUser();
  if (!user) redirect("/account/login?next=/account");
  // Server-side: only this user's orders are queried.
  const orders = await getRepository().listOrdersForCustomer(user.id);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-botanical">Signed in as {user.email}</p>
          <h1 className="display mt-4 text-[clamp(2.6rem,7vw,4.5rem)] text-forest">Your orders</h1>
        </div>
        <form action={signOut}>
          <button className="rounded-full border border-forest px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-forest hover:bg-forest hover:text-warm">
            Sign out
          </button>
        </form>
      </div>
      {orders.length === 0 ? (
        <p className="mt-10 text-ink/70">
          No orders yet. <Link href="/shop" className="font-semibold text-forest underline underline-offset-4">Start shopping</Link>
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-forest/10 border-y border-forest/10">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div>
                <p className="font-semibold text-forest">{o.orderNumber}</p>
                <p className="text-sm text-ink/70">
                  {new Date(o.createdAt).toLocaleDateString("en-ZW", { dateStyle: "medium" })} · {o.lines.length} item(s)
                </p>
              </div>
              <span className="rounded-full bg-cream px-3 py-1 text-sm capitalize">{o.status.replace(/_/g, " ")}</span>
              <span className="font-semibold tabular-nums">{formatMoney(o.total, o.currency)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function AccountPage() {
  return (
    <div className="bg-warm pb-24 pt-32 lg:pt-40">
      <div className="container-x max-w-4xl">
        <Suspense fallback={<p className="text-ink/70">Loading your account…</p>}>
          <AccountContent />
        </Suspense>
      </div>
    </div>
  );
}
