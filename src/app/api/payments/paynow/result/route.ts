import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getField, parsePaynowMessage, verifyPaynowHash } from "@/lib/payments/paynow-protocol";
import { refreshPaymentStatus } from "@/lib/orders/service";
import { getRepository } from "@/lib/repositories";

/**
 * Paynow status-update callback ("resulturl").
 * 1. Verify the message hash with our integration key.
 * 2. Find the order by OUR reference.
 * 3. Re-query Paynow via the poll URL we stored at initiation and verify the
 *    amount before recording any status. The posted body alone is never trusted.
 */
export async function POST(request: Request) {
  if (!env.payments.paynow.enabled) return new NextResponse("Not enabled", { status: 404 });

  const values = parsePaynowMessage(await request.text());
  if (!verifyPaynowHash(values, env.payments.paynow.integrationKey)) {
    return new NextResponse("Invalid hash", { status: 400 });
  }
  const reference = getField(values, "reference");
  const order = reference ? await getRepository().getOrderByNumber(reference) : null;
  if (!order) return new NextResponse("Unknown reference", { status: 404 });

  try {
    await refreshPaymentStatus(order);
  } catch (err) {
    console.error("[paynow] verification failed", err);
    return new NextResponse("Verification failed", { status: 502 });
  }
  return new NextResponse("OK", { status: 200 });
}
