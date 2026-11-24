import { Award, Banknote, ChartColumn, CircleDollarSign, Package, Receipt, Trash2, TrendingUp, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExpenseForm } from "@/components/admin/expense-form";
import { MoneyChart, StatCard, type ChartPoint } from "@/components/admin/live";
import { AdminTitle, Card, CardTitle, DevModeBanner, EmptyState, IconChip, SetupNotice, tones } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { formatMoney } from "@/lib/commerce/pricing";
import { bucket, dailySeries, dayKey, requestNow, startOfHarareDay, summarise, topProducts } from "@/lib/ops/metrics";
import { getStaffOps } from "@/lib/ops/repository";
import { getStaffRepository } from "@/lib/repositories";
import { deleteExpenseAction, setVariantCostAction } from "../../ops-actions";

export const metadata: Metadata = { title: "Profit" };
export const instant = false;

const PERIODS = { "7d": { days: 7, label: "7 days" }, "30d": { days: 30, label: "30 days" }, "90d": { days: 90, label: "90 days" }, "12m": { days: 365, label: "12 months" } } as const;
type PeriodId = keyof typeof PERIODS;

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const ctx = await requireStaff();
  const { p } = await searchParams;
  const period: PeriodId = p && p in PERIODS ? (p as PeriodId) : "30d";
  const days = PERIODS[period].days;
  const [repo, ops] = await Promise.all([getStaffRepository(ctx), getStaffOps(ctx)]);
  const now = requestNow();
  const from = startOfHarareDay(now) - (days - 1) * 86_400_000;
  const [orders, catalog, ready] = await Promise.all([repo.listOrders({ limit: 5000 }), repo.loadCatalog(), ops.ready()]);
  const [expenses, costs] = await Promise.all([ops.listExpenses(new Date(from).toISOString()).catch(() => []), ops.listVariantCosts().catch((): Record<string, number | null> => ({}))]);
  const isAdmin = ctx.role === "admin";
  const currency = orders[0]?.currency ?? "USD";
  const money = (v: number) => formatMoney(v, currency);

  const sum = summarise(orders, expenses, costs, from, now + 1);
  const prev = summarise(orders, [], costs, from - days * 86_400_000, from);
  const daily = dailySeries(orders, expenses, costs, days, now);
  const pts = days > 120 ? bucket(daily, "month") : days > 31 ? bucket(daily, "week") : daily;
  const chart: ChartPoint[] = pts.map((x) => {
    const d = new Date(x.ms + 2 * 3600_000);
    const fmt = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-GB", { ...o, timeZone: "UTC" });
    return {
      label: days > 120 ? fmt({ month: "short" }) : fmt({ day: "numeric", month: days > 31 ? "short" : undefined }),
      title: days > 120 ? fmt({ month: "long", year: "numeric" }) : days > 31 ? `Week of ${fmt({ day: "numeric", month: "short" })}` : fmt({ weekday: "short", day: "numeric", month: "short" }),
      revenue: x.revenue,
      profit: x.profit,
      orders: x.orders,
    };
  });
  const top = topProducts(orders, costs, from);
  const growth = prev.revenue > 0 ? Math.round(((sum.revenue - prev.revenue) / prev.revenue) * 100) : null;
  const byCategory = Object.entries(expenses.reduce<Record<string, number>>((acc, e) => ((acc[e.category] = (acc[e.category] ?? 0) + e.amount), acc), {})).sort((a, b) => b[1] - a[1]);
  const catColors = [tones.ember.base, tones.sky.base, tones.hibiscus.base, tones.violet.base, tones.teal.base, tones.sun.base, tones.green.base, tones.slate.base, "#A15C38"];

  return (
    <>
      <DevModeBanner ctx={ctx} />
      <AdminTitle title="Profit" subtitle="Money in from paid orders, minus what the products cost and what the business spent.">
        <nav aria-label="Period" className="flex gap-1 rounded-full bg-[var(--a-card)] p-1 ">
          {(Object.keys(PERIODS) as PeriodId[]).map((id) => (
            <Link key={id} href={`/admin/finance?p=${id}`} aria-current={period === id ? "page" : undefined} className="rounded-full px-3.5 py-1.5 text-sm font-semibold" style={{ backgroundColor: period === id ? tones.violet.base : "transparent", color: period === id ? "#fff" : "var(--a-muted)" }}>
              {PERIODS[id].label}
            </Link>
          ))}
        </nav>
      </AdminTitle>
      {!ready && <SetupNotice title="Costs and expenses need one database step">Revenue below is real. Apply the admin_ops migration to record costs and expenses for profit.</SetupNotice>}
      {sum.uncostedUnits > 0 && (
        <SetupNotice title="Profit is an estimate">
          {sum.uncostedUnits} item{sum.uncostedUnits === 1 ? "" : "s"} sold in this period {sum.uncostedUnits === 1 ? "has" : "have"} no unit cost yet, so they count as free. <a href="#costs" className="font-semibold underline">Add unit costs</a>.
        </SetupNotice>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard index={0} label="Revenue" value={sum.revenue} format="money" currency={currency} accent={tones.green.base} chip={<IconChip icon={CircleDollarSign} tone="green" />} hint={growth === null ? `${sum.paidOrders} paid orders` : `${growth >= 0 ? "▲" : "▼"} ${Math.abs(growth)}% vs previous ${PERIODS[period].label}`} />
        <StatCard index={1} label="Cost of goods" value={sum.cogs} format="money" currency={currency} accent={tones.ember.base} chip={<IconChip icon={Package} tone="ember" />} hint="What the products sold cost you" />
        <StatCard index={2} label="Expenses" value={sum.expenses} format="money" currency={currency} accent={tones.hibiscus.base} chip={<IconChip icon={Receipt} tone="hibiscus" />} hint={`${expenses.length} recorded`} />
        <StatCard index={3} label="Net profit" value={sum.netProfit} format="money" currency={currency} accent={tones.violet.base} chip={<IconChip icon={TrendingUp} tone="violet" />} hint={sum.margin === null ? "No paid orders yet" : `${Math.round(sum.margin * 100)}% of revenue · avg order ${money(sum.avgOrder)}`} />
      </div>

      <Card className="mb-5">
        <CardTitle icon={ChartColumn} tone="violet">Revenue and profit · {PERIODS[period].label}</CardTitle>
        <MoneyChart points={chart} currency={currency} height={240} />
      </Card>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle icon={Award} tone="sun">Best sellers</CardTitle>
          {top.length === 0 ? (
            <EmptyState icon={Award} tone="sun" title="No paid sales in this period" />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-[var(--a-muted)]"><tr><th className="pb-2 text-left font-semibold">Product</th><th className="pb-2 text-right font-semibold">Sold</th><th className="pb-2 text-right font-semibold">Revenue</th><th className="pb-2 text-right font-semibold">Profit</th></tr></thead>
              <tbody>
                {top.map((t, i) => (
                  <tr key={t.name} className="border-t border-[var(--a-line)]">
                    <td className="py-2.5"><span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full text-xs font-bold" style={{ backgroundColor: i === 0 ? tones.sun.tint : "var(--a-inset)", color: i === 0 ? tones.sun.ink : "var(--a-muted)" }}>{i + 1}</span>{t.name}</td>
                    <td className="py-2.5 text-right tabular-nums">{t.units}</td>
                    <td className="py-2.5 text-right tabular-nums">{money(t.revenue)}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums" style={{ color: tones.violet.ink }}>{t.profit === null ? "–" : money(t.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <CardTitle icon={Wallet} tone="hibiscus">Where the money went</CardTitle>
          {byCategory.length === 0 ? (
            <EmptyState icon={Receipt} tone="hibiscus" title="No expenses recorded">Add ingredients, packaging, transport and other costs below to see true profit.</EmptyState>
          ) : (
            <>
              <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label={byCategory.map(([c, v]) => `${c} ${money(v)}`).join(", ")}>
                {byCategory.map(([c, v], i) => <span key={c} className="admin-grow h-full" style={{ width: `${(v / sum.expenses) * 100}%`, backgroundColor: catColors[i % catColors.length] }} />)}
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {byCategory.map(([c, v], i) => (
                  <li key={c} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 capitalize text-[var(--a-muted)]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: catColors[i % catColors.length] }} />{c}</span>
                    <span className="font-semibold tabular-nums text-[var(--a-ink)]">{money(v)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <div id="expense" className="scroll-mt-24" />
          <CardTitle icon={Banknote} tone="ember">Record an expense</CardTitle>
          {isAdmin ? <ExpenseForm today={dayKey(now)} disabled={!ready} /> : <p className="text-sm text-[var(--a-muted)]">Only admins can record expenses.</p>}
          {expenses.length > 0 && (
            <ul className="relative mt-5 max-h-[340px] divide-y divide-[var(--a-line)] overflow-y-auto">
              {expenses.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-[var(--a-ink)]">{e.description}</span>
                    <span className="block text-xs capitalize text-[var(--a-muted)]">{e.category} · {new Date(`${e.spentOn}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{money(e.amount)}</span>
                  {isAdmin && (
                    <form action={deleteExpenseAction}>
                      <input type="hidden" name="id" value={e.id} />
                      <button className="grid h-8 w-8 place-items-center rounded-full text-[var(--c-bad)] hover:bg-[var(--c-bad-bg)]" aria-label={`Delete expense ${e.description}`}><Trash2 className="h-4 w-4" aria-hidden /></button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div id="costs" className="scroll-mt-24" />
          <CardTitle icon={Package} tone="sun">Unit costs</CardTitle>
          <p className="mb-3 text-sm text-[var(--a-muted)]">What one unit costs to make (ingredients + bottle + label). New orders remember the cost at the time of sale.</p>
          <ul className="relative max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {catalog.flatMap((prod) =>
              prod.variants.map((v) => {
                const c = costs[v.id] ?? null;
                const margin = v.price && c !== null ? Math.round(((v.price - c) / v.price) * 100) : null;
                return (
                  <li key={v.id}>
                    <form action={setVariantCostAction} className="flex items-center gap-2 rounded-[16px] bg-[var(--a-inset)] px-3 py-2">
                      <input type="hidden" name="variantId" value={v.id} />
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block truncate font-semibold text-[var(--a-ink)]">{prod.name}</span>
                        <span className="block text-xs text-[var(--a-muted)]">{v.size ?? v.label} · sells at {v.price !== null ? money(v.price) : "no price"}{margin !== null && <> · <strong style={{ color: margin >= 0 ? tones.green.ink : tones.hibiscus.ink }}>{margin}% margin</strong></>}</span>
                      </span>
                      <label className="sr-only" htmlFor={`cost-${v.id}`}>Unit cost for {prod.name} {v.label}</label>
                      <input id={`cost-${v.id}`} name="cost" inputMode="decimal" defaultValue={c !== null ? (c / 100).toFixed(2) : ""} placeholder="Cost" className="w-24 shrink-0 rounded-[12px] border border-[var(--a-line)] bg-[var(--a-card)] px-3 py-2 text-sm tabular-nums outline-none focus:border-[#9B7BF7] focus:ring-4 focus:ring-[#9B7BF7]/20 disabled:opacity-60" disabled={!isAdmin || !ready} />
                      <button className="rounded-full bg-[var(--a-accent)] px-3 py-2 text-xs font-semibold text-[#14151B] disabled:opacity-40" disabled={!isAdmin || !ready}>Save</button>
                    </form>
                  </li>
                );
              }),
            )}
          </ul>
        </Card>
      </div>
    </>
  );
}
