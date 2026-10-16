import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/orders/token";
import { refreshPaymentStatus } from "@/lib/orders/service";
import { toPublicOrder } from "@/lib/orders/types";
import { getRepository } from "@/lib/repositories";

/**
 * Order status for the confirmation page. Requires the order's access token.
 * For Paynow orders this re-verifies with Paynow server-to-server; a browser
 * redirect alone can never mark an order paid.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("t");
  const order = /^[0-9a-f-]{36}$/i.test(id) ? await getRepository().getOrder(id) : null;
  if (!order || !verifyAccessToken(token, order.accessTokenHash)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  const fresh = await refreshPaymentStatus(order).catch(() => order);
  return NextResponse.json(
    { order: toPublicOrder(fresh) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
