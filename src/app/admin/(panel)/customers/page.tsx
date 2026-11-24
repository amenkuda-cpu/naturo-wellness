import { ChevronDown, Search, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatCard } from "@/components/admin/live";
import { BulkEmail } from "@/components/admin/bulk-email";
import { MessageComposer } from "@/components/admin/message-composer";
import { siteConfig } from "@/config/site";
import { AdminTitle, DevModeBanner, EmptyState, IconChip, Pill, field, timeAgo, tones } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { formatMoney } from "@/lib/commerce/pricing";
import { env } from "@/lib/env";
import { isRevenue, performance, requestNow } from "@/lib/ops/metrics";
import { getStaffOps } from "@/lib/ops/repository";
import { QUERY_TEMPLATES } from "@/lib/ops/templates";
import { getStaffRepository } from "@/lib/repositories";
import { whatsappDigits } from "@/lib/phone";

export const metadata: Metadata = { title: "Customers" };
export const instant = false;

interface Customer {
  key: string;
  name: string;
  phone: string | null;
  email: string | null;
  orders: number;
  spent: number;
  lastAt: string;
  lastOrderId: string | null;
  queries: number;
}

const BULK_TEMPLATES = [
  {
    label: "Delivery prices",
    subject: "Our delivery prices",
    text: [
      "Hi {name},",
      "A quick update from Naturo Wellness on delivery. Delivery is now added to your order total as follows:",
      "- Harare CBD: $3\n- Everywhere else in Zimbabwe (including the Harare suburbs): $5\n- South Africa: $15",
      "You can still collect from us for free. Order any time at getnaturo.com.",
      "Thank you for choosing Naturo!",
    ].join("\n\n"),
  },
  {
    label: "New flavours",
    subject: "New Naturo flavours are in",
    text: [
      "Hi {name},",
      "Our new flavours are in! Order at getnaturo.com and we'll deliver across Zimbabwe and South Africa.",
      "The Naturo Wellness team",
    ].join("\n\n"),
  },
];

const keyOf = (phone: string | null, email: string | null) => (phone ? whatsappDigits(phone) : (email ?? "").toLowerCase());

const CUSTOMER_TEMPLATES = [
  { label: "New flavours", text: "Hi {name}, it's Naturo Wellness! Our new flavours are in. Order at getnaturo.com and we'll deliver across Zimbabwe and South Africa." },
  { label: "Thank you", text: "Hi {name}, thank you for being a loyal Naturo customer. We really appreciate you!" },
  ...QUERY_TEMPLATES.slice(0, 1),
];

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string }> }) {
  const ctx = await requireStaff();
  const { q, sort } = await searchParams;
  const [repo, ops] = await Promise.all([getStaffRepository(ctx), getStaffOps(ctx)]);
  const [orders, enquiries, messages] = await Promise.all([repo.listOrders({ limit: 5000 }), ops.listEnquiries(1000).catch(() => []), ops.listMessages({ limit: 2000 }).catch(() => [])]);
  const now = requestNow();

  const map = new Map<string, Customer>();
  for (const o of [...orders].reverse()) {
    const k = keyOf(o.customer.phone, o.customer.email);
    const c = map.get(k) ?? { key: k, name: o.customer.fullName, phone: o.customer.phone, email: o.customer.email, orders: 0, spent: 0, lastAt: o.createdAt, lastOrderId: o.id, queries: 0 };
    if (o.status !== "cancelled") c.orders += 1;
    if (isRevenue(o)) c.spent += o.total;
    c.name = o.customer.fullName;
    c.email = o.customer.email ?? c.email;
    c.lastAt = o.createdAt;
    c.lastOrderId = o.id;
    map.set(k, c);
  }
  for (const e of enquiries) {
    const k = keyOf(e.phone, e.email);
    const c = map.get(k) ?? { key: k, name: e.name, phone: e.phone, email: e.email, orders: 0, spent: 0, lastAt: e.createdAt, lastOrderId: null, queries: 0 };
    c.queries += 1;
    c.email = c.email ?? e.email;
    if (e.createdAt > c.lastAt) c.lastAt = e.createdAt;
    map.set(k, c);
  }

  const query = (q ?? "").trim().toLowerCase();
  const sortBy = sort === "spent" || sort === "orders" ? sort : "recent";
  const customers = [...map.values()]
    .filter((c) => !query || [c.name, c.phone ?? "", c.email ?? ""].some((v) => v.toLowerCase().includes(query)))
    .sort((a, b) => (sortBy === "spent" ? b.spent - a.spent : sortBy === "orders" ? b.orders - a.orders : a.lastAt < b.lastAt ? 1 : -1));
  const perf = performance(orders, [], [], [], now);
  const currency = orders[0]?.currency ?? "USD";
  const totalSpent = [...map.values()].reduce((s, c) => s + c.spent, 0);
  const lifetime = map.size ? Math.round(totalSpent / map.size) : 0;
  const threadFor = (c: Customer) => messages.filter((m) => keyOf(m.toPhone, m.toEmail) === c.key).slice(0, 5);

  return (
    <>
      <DevModeBanner ctx={ctx} />
      <AdminTitle title="Customers" subtitle="Everyone who has ordered or written to Naturo. Message anyone by email, WhatsApp or SMS.">
        <form className="relative w-full sm:w-80" role="search">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--a-muted)]" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Name, phone or email" className={`${field} pl-10`} aria-label="Search customers" />
        </form>
      </AdminTitle>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard label="Customers" value={map.size} accent={tones.sky.base} chip={<IconChip icon={UsersRound} tone="sky" />} hint={`${customers.length} shown`} />
        <StatCard label="Average lifetime spend" value={lifetime} format="money" currency={currency} accent={tones.violet.base} chip={<IconChip icon={UsersRound} tone="violet" />} index={1} />
        <StatCard label="Come back for more (90 days)" value={perf.repeatRate.pct ?? 0} format="percent" accent={tones.green.base} chip={<IconChip icon={UsersRound} tone="green" />} index={2} hint={`${perf.repeatRate.repeat} of ${perf.repeatRate.customers} customers ordered twice or more`} />
      </div>

      {ctx.role === "admin" && (
        <BulkEmail
          recipients={[...map.values()].filter((c) => c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)).map((c) => ({ name: c.name, email: c.email!.trim().toLowerCase(), phone: c.phone })).filter((r, i, a) => a.findIndex((x) => x.email === r.email) === i)}
          emailReady={env.email.configured || !env.isProduction}
          ownAddress={siteConfig.contact.email}
          templates={BULK_TEMPLATES}
        />
      )}

      <nav aria-label="Sort customers" className="mb-4 flex gap-1 text-sm">
        {(["recent", "spent", "orders"] as const).map((s) => (
          <Link key={s} href={`/admin/customers?sort=${s}${query ? `&q=${encodeURIComponent(query)}` : ""}`} aria-current={sortBy === s ? "page" : undefined} className={sortBy === s ? "rounded-full bg-[var(--a-pill)] px-4 py-1.5 font-semibold text-[var(--a-pill-ink)]" : "rounded-full px-4 py-1.5 text-[var(--a-muted)] hover:bg-[var(--a-hover)]"}>
            {s === "recent" ? "Most recent" : s === "spent" ? "Top spenders" : "Most orders"}
          </Link>
        ))}
      </nav>

      {customers.length === 0 ? (
        <EmptyState icon={UsersRound} tone="sky" title="No customers yet">They appear here after their first order or message.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {customers.slice(0, 300).map((c) => (
            <li key={c.key}>
              <details className="group rounded-[22px] border border-[var(--a-line)] bg-[var(--a-card)]/90 open:pb-4">
                <summary className="grid cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto_auto_auto]">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#9B7BF7] to-[#3D9BEA] text-sm font-bold uppercase text-white" aria-hidden>
                    {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-[var(--a-muted)]">{[c.phone, c.email].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="hidden text-sm text-[var(--a-muted)] md:block">Last seen {timeAgo(c.lastAt, now)}</span>
                  <span className="hidden md:block">{c.queries > 0 ? <Pill tone="hibiscus">{c.queries} {c.queries === 1 ? "query" : "queries"}</Pill> : <span />}</span>
                  <span className="hidden text-right text-sm md:block"><span className="block font-semibold tabular-nums">{formatMoney(c.spent, currency)}</span><span className="block text-xs text-[var(--a-muted)]">{c.orders} order{c.orders === 1 ? "" : "s"}</span></span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--a-inset)] px-3 py-1.5 text-xs font-semibold">
                    Message <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" aria-hidden />
                  </span>
                </summary>
                <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                  <div className="text-sm text-[var(--a-muted)]">
                    <p><strong className="text-[var(--a-ink)]">{c.orders}</strong> orders · <strong className="text-[var(--a-ink)]">{formatMoney(c.spent, currency)}</strong> paid</p>
                    {c.lastOrderId && <Link href={`/admin/orders/${c.lastOrderId}`} className="mt-1 inline-block font-semibold text-[var(--a-ink)] underline underline-offset-4">Latest order</Link>}
                  </div>
                  <MessageComposer to={{ name: c.name, email: c.email, phone: c.phone }} templates={CUSTOMER_TEMPLATES} history={threadFor(c)} emailReady={env.email.configured || !env.isProduction} defaultSubject="A message from Naturo Wellness" />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
