import { ArrowUpRight, Truck, ChevronRight, MessageSquareText, Plus, ShoppingBag, Store, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { AutoRefresh, Donut, Gauge, RevenueFlow, StatCard } from "@/components/admin/live";
import { DevModeBanner, IconChip, PAYMENT_METHOD_LABEL, SetupNotice, StatusPill, harareTime, timeAgo, tones, type Tone } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { formatMoney } from "@/lib/commerce/pricing";
import { refreshPaymentStatus } from "@/lib/orders/service";
import { bucket, dailySeries, dayKey, isRevenue, needsAttention, performance, requestNow, startOfHarareDay, summarise } from "@/lib/ops/metrics";
import { getStaffOps } from "@/lib/ops/repository";
import type { EnquiryTopic } from "@/lib/ops/types";
import { getStaffRepository } from "@/lib/repositories";
import { isOnlinePayment } from "@/lib/types";

// Staff data is always read per request.
export const instant = false;

const DAY = 86_400_000;
const CATEGORY_COLORS: Record<string, string> = {
  ingredients: "#5FA832",
  packaging: "#9B7BF7",
  delivery: "#F07F36",
  marketing: "#E2457E",
  wages: "#3D9BEA",
  rent: "#1FB3A5",
  utilities: "#E9B10C",
  fees: "#CDBDFF",
  other: "#8A8B99",
};
const TOPIC_TONE: Record<EnquiryTopic, Tone> = { order: "ember", wholesale: "violet", feedback: "teal", general: "sky" };
const RIDER_CARDS = [
  "linear-gradient(135deg,#F7A35C 0%,#E2457E 100%)",
  "linear-gradient(135deg,#C7F06E 0%,#4CC9A4 100%)",
  "linear-gradient(135deg,#B9A2FF 0%,#7A5CF0 100%)",
];

function pct(now: number, before: number) {
  if (before <= 0) return null;
  return Math.round(((now - before) / before) * 100);
}

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ error?: string; flow?: string }> }) {
  const ctx = await requireStaff();
  const [{ error, flow }, repo, ops] = await Promise.all([searchParams, getStaffRepository(ctx), getStaffOps(ctx)]);
  const [loaded, opsReady] = await Promise.all([repo.listOrders({ limit: 2000 }), ops.ready()]);
  const [expenses, costs, enquiries] = await Promise.all([
    ops.listExpenses(new Date(requestNow() - 400 * DAY).toISOString()).catch(() => []),
    ops.listVariantCosts().catch((): Record<string, number | null> => ({})),
    ops.listEnquiries(200).catch(() => []),
  ]);

  // Pesepay never retries its callback, so reconcile a few waiting online payments on each visit.
  let orders = loaded;
  const waiting = orders.filter((o) => isOnlinePayment(o.paymentMethod) && o.paymentStatus === "pending" && requestNow() - Date.parse(o.createdAt) > 60_000).slice(0, 5);
  if (waiting.length) {
    const fresh = await Promise.all(waiting.map((o) => refreshPaymentStatus(o).catch(() => o)));
    const byId = new Map(fresh.map((o) => [o.id, o]));
    orders = orders.map((o) => byId.get(o.id) ?? o);
  }

  const now = requestNow();
  const today = startOfHarareDay(now);
  const key = dayKey(now);
  const monthStart = Date.parse(`${key.slice(0, 7)}-01T00:00:00+02:00`);
  const prevMonthStart = Date.parse(`${dayKey(monthStart - DAY).slice(0, 7)}-01T00:00:00+02:00`);
  const sameDayLastMonth = Math.min(monthStart, prevMonthStart + (now - monthStart));
  const month = summarise(orders, expenses, costs, monthStart, now + 1);
  const lastMonthToDate = summarise(orders, expenses, costs, prevMonthStart, sameDayLastMonth);
  const currency = orders[0]?.currency ?? "USD";
  const money = (v: number) => formatMoney(v, currency);

  const todays = orders.filter((o) => Date.parse(o.createdAt) >= today && o.status !== "cancelled");
  const yesterdays = orders.filter((o) => Date.parse(o.createdAt) >= today - DAY && Date.parse(o.createdAt) < now - DAY && o.status !== "cancelled");
  const ordersChange = pct(todays.length, yesterdays.length);
  const expenseChange = pct(month.expenses, lastMonthToDate.expenses);
  const revenueChange = month.revenue - lastMonthToDate.revenue;

  const attention = needsAttention(orders, now);
  const openQueries = enquiries.filter((e) => e.status !== "resolved");
  const onRoad = orders.filter((o) => o.status === "out_for_delivery");
  const deliveries = await ops.listDeliveries(onRoad.map((o) => o.id)).catch(() => []);
  const riderOf = new Map(deliveries.map((d) => [d.orderId, d]));

  // Gauges: how the shop is doing right now.
  const recentDeliveryIds = orders.filter((o) => o.fulfilment.method === "delivery" && Date.parse(o.createdAt) >= now - 14 * DAY).map((o) => o.id);
  const [recentDeliveries, messages] = await Promise.all([
    ops.listDeliveries(recentDeliveryIds).catch(() => []),
    ops.listMessages({ limit: 1000 }).catch(() => []),
  ]);
  const perf = performance(orders, enquiries, messages, recentDeliveries, now);
  const marginPct = month.margin === null ? null : Math.round(month.margin * 100);

  // Revenue flow: last 6 weeks (default) or last 6 months.
  const monthly = flow === "monthly";
  const daily = dailySeries(orders, [], costs, monthly ? 186 : 42, now);
  const flowPoints = bucket(daily, monthly ? "month" : "week")
    .slice(-6)
    .map((b) => {
      const d = new Date(b.ms + 2 * 3600_000);
      const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-GB", { ...o, timeZone: "UTC" });
      return { label: monthly ? f({ month: "short" }) : f({ day: "numeric", month: "short" }), title: monthly ? f({ month: "long", year: "numeric" }) : `Week of ${f({ day: "numeric", month: "short" })}`, value: b.revenue };
    });

  // Expense split: this month by category.
  const monthKey = key.slice(0, 7);
  const split = Object.entries(
    expenses.filter((e) => e.spentOn.startsWith(monthKey)).reduce<Record<string, number>>((acc, e) => ((acc[e.category] = (acc[e.category] ?? 0) + e.amount), acc), {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, color: CATEGORY_COLORS[label] ?? "#8A8B99" }));
  const splitTotal = split.reduce((s, x) => s + x.value, 0);
  const recent = orders.slice(0, 8);
  const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "Africa/Harare" }).format(new Date(now));

  return (
    <>
      <AutoRefresh seconds={45} />
      <DevModeBanner ctx={ctx} />
      {!opsReady && (
        <SetupNotice title="One database step is still needed">
          Live tracking, queries, expenses and product costs need the <code>20261120000000_admin_ops.sql</code> migration. Orders and revenue already work.
        </SetupNotice>
      )}
      {error === "forbidden" && <p role="alert" className="mb-6 rounded-[18px] bg-[var(--c-bad-bg)] p-4 text-sm text-[var(--c-bad)]">That action needs an administrator.</p>}

      <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[2.2rem] font-semibold leading-none tracking-[-0.035em] sm:text-[2.9rem]">My Dashboard</h1>
        {attention.length > 0 && (
          <Link href="/admin/orders?status=open" className="admin-rise inline-flex items-center gap-2 rounded-full bg-[var(--c-warn-bg)] py-1.5 pl-2 pr-4 text-sm font-semibold text-[var(--c-warn)] hover:brightness-110">
            <span className="relative grid h-7 w-7 place-items-center rounded-full bg-[#E9B10C] text-[#14151B]">
              <span className="admin-ping absolute inset-0 rounded-full bg-[#E9B10C]" aria-hidden />
              <TriangleAlert className="relative h-3.5 w-3.5" aria-hidden />
            </span>
            {attention.length} order{attention.length === 1 ? "" : "s"} need{attention.length === 1 ? "s" : ""} you
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Left area ── */}
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
          {/* Hero: the gradient "balance" card */}
          <section
            className="admin-rise relative min-h-[260px] overflow-hidden rounded-[28px] p-6 text-[#14151B] sm:p-7 md:col-span-2"
            style={{ background: "linear-gradient(125deg,#7FE3BC 0%,#B8EE78 45%,#E3F57A 100%)" }}
            aria-labelledby="hero-title"
          >
            <span className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rotate-12 rounded-[70px] bg-white/25" aria-hidden />
            <span className="pointer-events-none absolute -right-28 top-6 h-56 w-56 rotate-45 rounded-[60px] bg-white/15" aria-hidden />
            <p id="hero-title" className="relative text-lg font-medium">Revenue in {monthName}</p>
            <p className="relative mt-3 text-[2.6rem] font-semibold leading-none tracking-[-0.04em] tabular-nums sm:text-[3.4rem]">{money(month.revenue)}</p>
            <p className="relative mt-3 text-sm font-medium text-[#14151B]/75">
              {revenueChange >= 0 ? "+" : "−"}
              {money(Math.abs(revenueChange))} vs the same days last month · profit {money(month.netProfit)}
              {month.uncostedUnits ? " (estimate)" : ""}
            </p>
            <div className="relative mt-8 flex flex-wrap items-center gap-2">
              <Link href="/admin/orders" className="rounded-full bg-[#14151B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">Orders</Link>
              <Link href="/admin/finance#expense" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#14151B] hover:bg-white/80">Add expense</Link>
              <Link href="/admin/finance" className="grid h-10 w-10 place-items-center rounded-full bg-white/70 hover:bg-white" aria-label="Profit details">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </section>

          {/* Stacked small cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
            <MiniStat label="Orders today" value={`${todays.length}`} sub={`${attention.length} waiting on you`} change={ordersChange} goodWhenUp />
            <MiniStat label={`Spent in ${monthName}`} value={`−${money(month.expenses)}`} sub="ingredients, packaging, fuel…" change={expenseChange} goodWhenUp={false} />
          </div>

          {/* Performance gauges */}
          <section className="admin-rise min-w-0 rounded-[28px] border border-[var(--a-line)] bg-[var(--a-card)]/90 p-5 sm:p-6 md:col-span-3" style={{ animationDelay: "100ms" }} aria-labelledby="perf-title">
            <div className="mb-2 flex items-center justify-between">
              <h2 id="perf-title" className="text-lg font-medium">Performance</h2>
              <span className="text-xs text-[var(--a-muted)]">live · updates every 45 s</span>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
              <Gauge value={perf.fulfilment.pct} label="Delivered today" display={perf.fulfilment.pct === null ? "–" : `${perf.fulfilment.pct}%`} sub={`${perf.fulfilment.done}/${perf.fulfilment.total}`} />
              <Gauge value={perf.queryResponse.pct} label="Queries answered" display={perf.queryResponse.pct === null ? "–" : `${perf.queryResponse.pct}%`} sub="30 days" />
              <Gauge value={marginPct === null ? null : Math.max(0, marginPct)} label="Profit margin" display={marginPct === null ? "–" : `${marginPct}%`} sub={monthName} />
            </div>
          </section>

          {/* Revenue flow */}
          <section className="admin-rise min-w-0 rounded-[28px] border border-[var(--a-line)] bg-[var(--a-card)]/90 p-5 sm:p-6 md:col-span-2" style={{ animationDelay: "120ms" }}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">Revenue flow</h2>
              <div className="flex items-center gap-2">
                <nav aria-label="Revenue period" className="flex rounded-full bg-[var(--a-inset)] p-1 text-xs">
                  <Link href="/admin" aria-current={!monthly ? "page" : undefined} className={!monthly ? "rounded-full bg-[var(--a-hover)] px-3 py-1 font-semibold" : "px-3 py-1 text-[var(--a-muted)]"}>Weekly</Link>
                  <Link href="/admin?flow=monthly" aria-current={monthly ? "page" : undefined} className={monthly ? "rounded-full bg-[var(--a-hover)] px-3 py-1 font-semibold" : "px-3 py-1 text-[var(--a-muted)]"}>Monthly</Link>
                </nav>
                <Link href="/admin/finance" className="grid h-8 w-8 place-items-center rounded-full bg-[var(--a-pill)] text-[var(--a-pill-ink)]" aria-label="Open profit page"><ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
              </div>
            </div>
            <RevenueFlow points={flowPoints} currency={currency} height={250} />
          </section>

          {/* Expense split */}
          <section className="admin-rise min-w-0 rounded-[28px] border border-[var(--a-line)] bg-[var(--a-card)]/90 p-5 sm:p-6" style={{ animationDelay: "180ms" }}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">Expense split</h2>
              <span className="rounded-full bg-[var(--a-inset)] px-3 py-1 text-xs text-[var(--a-muted)]">{new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "Africa/Harare" }).format(new Date(now))}</span>
            </div>
            {splitTotal === 0 ? (
              <div className="grid h-[164px] place-items-center text-center text-sm text-[var(--a-muted)]">
                <span>No expenses yet this month.<br /><Link href="/admin/finance#expense" className="font-semibold text-[var(--a-ink)] underline underline-offset-4">Record one</Link></span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Donut segments={split} total={splitTotal} currency={currency} />
                <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {split.slice(0, 6).map((s) => (
                    <li key={s.label} className="flex items-center gap-2">
                      <span className="h-6 w-1 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                      <span>
                        <span className="block capitalize text-[var(--a-muted)]">{s.label}</span>
                        <span className="block font-semibold tabular-nums">{Math.round((s.value / splitTotal) * 100)}%</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Recent orders (the reference's "Recent transactions") */}
          <section className="admin-rise min-w-0 rounded-[28px] border border-[var(--a-line)] bg-[var(--a-card)]/90 p-5 sm:p-6 md:col-span-3" style={{ animationDelay: "240ms" }}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-medium">Recent orders <sup className="text-xs text-[var(--a-muted)]">{orders.length}</sup></h2>
              <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-[var(--a-muted)] hover:text-[var(--a-ink)]">See all <ChevronRight className="h-4 w-4" aria-hidden /></Link>
            </div>
            {recent.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--a-muted)]">No orders yet. They appear here the moment a customer checks out.</p>
            ) : (
              <ul className="divide-y divide-[var(--a-line)]">
                {recent.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] px-2 py-3 hover:bg-[var(--a-hover)] md:grid-cols-[auto_minmax(0,1.3fr)_auto_minmax(0,1fr)_minmax(0,0.8fr)_auto]">
                      <IconChip icon={o.fulfilment.method === "delivery" ? Truck : Store} tone={o.fulfilment.method === "delivery" ? "ember" : "teal"} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{o.customer.fullName}</span>
                        <span className="block truncate text-xs text-[var(--a-muted)]">{o.orderNumber}</span>
                      </span>
                      <span className="hidden md:block"><StatusPill status={o.status} /></span>
                      <span className="hidden text-sm text-[var(--a-muted)] md:block">{harareTime(o.createdAt, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="hidden truncate text-sm text-[var(--a-muted)] md:block">{PAYMENT_METHOD_LABEL[o.paymentMethod]}</span>
                      <span className={`text-right text-base font-semibold tabular-nums ${isRevenue(o) ? "" : "text-[var(--a-muted)]"}`}>
                        {money(o.total)}
                        <span className="block text-[0.7rem] font-normal text-[var(--a-muted)] md:hidden">{timeAgo(o.createdAt, now)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ── Right rail (the reference's "My cards" + "Subscriptions") ── */}
        <aside className="admin-rise grid min-w-0 grid-cols-1 content-start gap-4 rounded-[28px] border border-[var(--a-line)] bg-[var(--a-card)]/90 p-5" style={{ animationDelay: "90ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">On the road <sup className="text-xs text-[var(--a-muted)]">{onRoad.length}</sup></h2>
            <Link href="/admin/tracking" className="inline-flex items-center gap-1.5 rounded-full bg-[var(--a-pill)] py-1 pl-3 pr-1 text-sm font-semibold text-[var(--a-pill-ink)]">
              Live map <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--a-pill-ink)] text-[var(--a-pill)]"><ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></span>
            </Link>
          </div>

          {onRoad.length === 0 ? (
            <div className="grid h-40 place-items-center rounded-[22px] border border-dashed border-[var(--a-line)] text-center text-sm text-[var(--a-muted)]">
              <span><Truck className="mx-auto mb-2 h-6 w-6" aria-hidden />No riders out right now.</span>
            </div>
          ) : (
            <ol className="relative" style={{ height: 150 + Math.min(onRoad.length - 1, 2) * 38 }}>
              {onRoad.slice(0, 3).map((o, i, arr) => {
                const d = riderOf.get(o.id);
                const front = i === arr.length - 1;
                return (
                  <li key={o.id} className="absolute inset-x-0" style={{ top: i * 38, zIndex: i + 1 }}>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="block h-[150px] rounded-[22px] p-4 text-[#14151B] shadow-[0_-8px_24px_rgba(0,0,0,0.35)] transition hover:-translate-y-1"
                      style={{ background: RIDER_CARDS[i % RIDER_CARDS.length], marginInline: (arr.length - 1 - i) * 8 }}
                    >
                      <span className="flex items-start justify-between">
                        <span className="text-sm font-bold">{d?.riderName ?? "Rider"}</span>
                        <span className="rounded-full bg-black/15 px-2 py-0.5 text-[0.7rem] font-semibold">{o.orderNumber.slice(-6)}</span>
                      </span>
                      {front && (
                        <span className="mt-6 block">
                          <span className="block text-xl font-semibold tracking-[-0.02em]">{o.customer.fullName}</span>
                          <span className="mt-1 flex justify-between text-xs font-medium text-[#14151B]/75">
                            <span>{o.fulfilment.address?.suburb ?? "Delivery"}</span>
                            <span>{d?.startedAt ? `left ${timeAgo(d.startedAt, now)}` : "not started"}</span>
                          </span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-2 flex items-center justify-between">
            <h2 className="text-lg font-medium">Queries <sup className="text-xs text-[var(--a-muted)]">{openQueries.length}</sup></h2>
            <Link href="/admin/enquiries" className="inline-flex items-center gap-1 text-sm text-[var(--a-muted)] hover:text-[var(--a-ink)]">Manage <ChevronRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          {openQueries.length === 0 ? (
            <p className="rounded-[18px] bg-[var(--a-inset)] p-4 text-sm text-[var(--a-muted)]">No open questions. Contact-page and order-page messages land here.</p>
          ) : (
            <ul className="space-y-2">
              {openQueries.slice(0, 5).map((e) => (
                <li key={e.id}>
                  <Link href="/admin/enquiries" className="flex items-center gap-3 rounded-[18px] bg-[var(--a-inset)] p-3 hover:bg-[var(--a-hover)]">
                    <IconChip icon={MessageSquareText} tone={TOPIC_TONE[e.topic]} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{e.name}</span>
                      <span className="block truncate text-xs text-[var(--a-muted)]">{e.message}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      {e.status === "new" ? <span className="rounded-full bg-[#E2457E] px-2 py-0.5 text-[0.65rem] font-bold text-white">NEW</span> : null}
                      <span className="mt-1 block text-[0.7rem] text-[var(--a-muted)]">{timeAgo(e.createdAt, now)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 grid min-w-0 grid-cols-2 gap-2">
            <StatCard label="Profit this month" value={month.netProfit} format="money" currency={currency} accent={tones.violet.base} chip={<IconChip icon={Plus} tone="violet" size="sm" />} />
            <StatCard label="Average order" value={month.avgOrder} format="money" currency={currency} accent={tones.sky.base} chip={<IconChip icon={ShoppingBag} tone="sky" size="sm" />} index={1} />
          </div>
        </aside>
      </div>
    </>
  );
}

function MiniStat({ label, value, sub, change, goodWhenUp }: { label: string; value: string; sub: string; change: number | null; goodWhenUp: boolean }) {
  const good = change === null ? null : goodWhenUp ? change >= 0 : change <= 0;
  return (
    <section className="admin-rise flex min-h-[122px] flex-col justify-between rounded-[28px] border border-[var(--a-line)] bg-[var(--a-card)]/90 p-5" style={{ animationDelay: "60ms" }}>
      <h2 className="text-base font-medium text-[var(--a-muted)]">{label}</h2>
      <p className="mt-2 text-[1.9rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">{value}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-xs text-[var(--a-muted)]">{sub}</p>
        {change !== null && (
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-bold text-[#14151B]" style={{ backgroundColor: good ? "#B8EE78" : "#FF8FB1" }}>
            {change >= 0 ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
    </section>
  );
}
