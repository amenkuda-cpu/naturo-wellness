import { Truck, MapPinned, Route, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminTitle, Card, CardTitle, DevModeBanner, EmptyState, IconChip, SetupNotice, StatusPill } from "@/components/admin/ui";
import { LiveMap } from "@/components/tracking/live-map";
import { requireStaff } from "@/lib/auth";
import { getStaffOps } from "@/lib/ops/repository";
import { getStaffRepository } from "@/lib/repositories";

export const metadata: Metadata = { title: "Live map" };
export const instant = false;

export default async function TrackingPage() {
  const ctx = await requireStaff();
  const [repo, ops] = await Promise.all([getStaffRepository(ctx), getStaffOps(ctx)]);
  const [orders, ready] = await Promise.all([repo.listOrders({ limit: 300 }), ops.ready()]);
  const toDispatch = orders.filter((o) => o.fulfilment.method === "delivery" && ["confirmed", "preparing"].includes(o.status));
  const onRoad = orders.filter((o) => o.status === "out_for_delivery");

  return (
    <>
      <DevModeBanner ctx={ctx} />
      <AdminTitle title="Live map" subtitle="Where every delivery is right now. Rider positions update every few seconds." />
      {!ready && <SetupNotice title="Live tracking needs one database step">Apply the admin_ops migration to switch on rider GPS.</SetupNotice>}

      <Card className="mb-5 p-3 sm:p-3">
        <LiveMap endpoint="/api/admin/tracking" height={520} showList dark />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle icon={Truck} tone="ember">Ready to send out</CardTitle>
          {toDispatch.length === 0 && onRoad.length === 0 ? (
            <EmptyState icon={MapPinned} tone="sky" title="No deliveries in progress">Confirmed delivery orders appear here so you can assign a rider.</EmptyState>
          ) : (
            <ul className="divide-y divide-[var(--a-line)]">
              {[...onRoad, ...toDispatch].map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-3 rounded-[14px] px-2 py-3 hover:bg-[var(--a-inset)]">
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-[var(--a-ink)]">{o.orderNumber} · {o.customer.fullName}</span>
                      <span className="block truncate text-sm text-[var(--a-muted)]">{o.fulfilment.address ? `${o.fulfilment.address.suburb}, ${o.fulfilment.address.city}` : "No address"}</span>
                    </span>
                    <StatusPill status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardTitle icon={Route} tone="sky">How tracking works</CardTitle>
          <ol className="space-y-3 text-sm text-[var(--a-muted)]">
            <li className="flex gap-3"><IconChip icon={Truck} tone="ember" size="sm" /><span>Open an order and <strong>create a rider link</strong>. Send it on WhatsApp.</span></li>
            <li className="flex gap-3"><IconChip icon={Smartphone} tone="violet" size="sm" /><span>The rider opens it and taps <strong>Start delivery</strong>. Their phone shares GPS.</span></li>
            <li className="flex gap-3"><IconChip icon={MapPinned} tone="sky" size="sm" /><span>You and the customer watch the bike move, with the road route and an ETA.</span></li>
          </ol>
        </Card>
      </div>
    </>
  );
}
