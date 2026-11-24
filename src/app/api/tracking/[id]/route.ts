import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/orders/token";
import { getSystemOps } from "@/lib/ops/repository";
import { buildTracking } from "@/lib/ops/tracking";
import { getRepository } from "@/lib/repositories";

/** Customer map feed. Needs the private order token; only shows the delivery while it's on the way. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("t");
  const order = /^[0-9a-f-]{36}$/i.test(id) ? await getRepository().getOrder(id) : null;
  if (!order || !verifyAccessToken(token, order.accessTokenHash)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  const ops = getSystemOps();
  const visible = order.fulfilment.method === "delivery" && ["out_for_delivery", "completed"].includes(order.status);
  const payload = await buildTracking(ops, visible ? [order] : [], { includeCustomer: false, trailLimit: 200 }).catch(() =>
    buildTracking(ops, [], { includeCustomer: false }),
  );
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
