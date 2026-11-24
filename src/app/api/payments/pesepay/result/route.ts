import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { refreshPaymentStatus } from "@/lib/orders/service";
import { pesepayAuthMatches } from "@/lib/payments/pesepay-protocol";
import { getRepository } from "@/lib/repositories";

/**
 * Pesepay result callback. Pesepay POSTs plain JSON once a transaction ends,
 * with our integration key in the Authorization header.
 * 1. Check the Authorization header matches our key.
 * 2. Find the order by OUR merchant reference (the order number).
 * 3. Re-query Pesepay server-to-server and check the amount before recording
 *    anything. The posted body alone is never trusted.
 */
export async function POST(request: Request) {
  if (!env.payments.pesepay.enabled) return new NextResponse("Not enabled", { status: 404 });
  if (!pesepayAuthMatches(request.headers.get("authorization"), env.payments.pesepay.integrationKey)) {
    return new NextResponse("Unauthorised", { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { merchantReference?: string; referenceNumber?: string };
  const reference = typeof body.merchantReference === "string" ? body.merchantReference : null;
  const order = reference ? await getRepository().getOrderByNumber(reference) : null;
  if (!order || order.paymentMethod !== "pesepay") return new NextResponse("Unknown reference", { status: 404 });

  try {
    await refreshPaymentStatus(order);
  } catch (err) {
    console.error("[pesepay] verification failed", err);
    return new NextResponse("Verification failed", { status: 502 });
  }
  return new NextResponse("OK", { status: 200 });
}
