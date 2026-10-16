import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrderStatusView } from "@/components/checkout/order-status";
import { env } from "@/lib/env";
import { refreshPaymentStatus } from "@/lib/orders/service";
import { verifyAccessToken } from "@/lib/orders/token";
import { toPublicOrder } from "@/lib/orders/types";
import { getRepository } from "@/lib/repositories";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> };

async function OrderContent({ params, searchParams }: Props) {
  const [{ id }, { t }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const found = await getRepository().getOrder(id);
  if (!found || !verifyAccessToken(t, found.accessTokenHash)) notFound();
  // Server-to-server verification only; never trust the redirect itself.
  const order = await refreshPaymentStatus(found).catch(() => found);

  return (
    <>
      <p className="eyebrow text-botanical">Order {order.orderNumber}</p>
      <h1 className="display mt-4 text-[clamp(2.6rem,7vw,5.5rem)] text-forest">
        Thank you, <span className="serif-accent normal-case text-botanical">{order.customer.fullName.split(" ")[0]}.</span>
      </h1>
      <p className="mt-4 max-w-xl text-lg text-ink/75">
        We&apos;ve received your order. Our team will be in touch on {order.customer.phone} to confirm it. Keep this page
        bookmarked to check its status.
      </p>
      <div className="mt-12">
        <OrderStatusView
          initial={toPublicOrder(order)}
          token={t!}
          manualInstructions={order.paymentMethod === "manual" ? env.payments.manualInstructions : null}
        />
      </div>
      <Link href="/shop" className="mt-12 inline-block text-sm font-semibold uppercase tracking-[0.16em] text-forest underline underline-offset-4">
        Continue shopping
      </Link>
    </>
  );
}

export default function OrderPage(props: Props) {
  return (
    <div className="bg-warm pb-24 pt-28 lg:pt-36">
      <div className="container-x">
        <Suspense fallback={<p className="py-20 text-ink/70">Loading your order…</p>}>
          <OrderContent {...props} />
        </Suspense>
      </div>
    </div>
  );
}
