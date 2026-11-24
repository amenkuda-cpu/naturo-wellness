import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { verifyAccessToken } from "@/lib/orders/token";
import { getSystemOps } from "@/lib/ops/repository";
import { getRepository } from "@/lib/repositories";
import { RiderConsole } from "./rider-console";

export const metadata: Metadata = { title: "Naturo delivery", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ k?: string }> };

async function Content({ params, searchParams }: Props) {
  const [{ id }, { k }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !k) notFound();
  const delivery = await getSystemOps().getDelivery(id).catch(() => null);
  if (!delivery?.riderTokenHash || !verifyAccessToken(k, delivery.riderTokenHash)) notFound();
  const order = await getRepository().getOrder(id);
  if (!order) notFound();
  const a = order.fulfilment.address;
  const address = a ? [a.line1, a.suburb, a.city].filter(Boolean).join(", ") : delivery.destLabel ?? "";
  return (
    <RiderConsole
      orderId={order.id}
      riderKey={k}
      orderNumber={order.orderNumber}
      riderName={delivery.riderName}
      customerName={order.customer.fullName}
      customerPhone={order.customer.phone}
      address={address}
      instructions={a?.instructions ?? ""}
      dest={delivery.dest}
      items={order.lines.map((l) => `${l.quantity} × ${l.name}`)}
      cashToCollect={order.paymentStatus === "paid" ? null : order.total}
      currency={order.currency}
      initialState={order.status === "cancelled" ? "cancelled" : delivery.deliveredAt ? "done" : delivery.startedAt ? "riding" : "ready"}
    />
  );
}

export default function RiderPage(props: Props) {
  return (
    <div className="min-h-screen bg-[#F7F5EE] px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <Logo className="h-11" />
          <span className="rounded-full bg-forest px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white">Delivery</span>
        </div>
        <Suspense fallback={<p className="text-[#5E6B60]">Loading the delivery…</p>}>
          <Content {...props} />
        </Suspense>
      </div>
    </div>
  );
}
