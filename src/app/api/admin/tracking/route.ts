import { NextResponse } from "next/server";
import { getStaffContext } from "@/lib/auth";
import { getStaffOps } from "@/lib/ops/repository";
import { buildTracking, isTrackable } from "@/lib/ops/tracking";
import { getStaffRepository } from "@/lib/repositories";

/** Staff map feed: one order (?order=<id>) or every delivery currently in motion. */
export async function GET(request: Request) {
  const ctx = await getStaffContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("order");
  const [repo, ops] = await Promise.all([getStaffRepository(ctx), getStaffOps(ctx)]);

  let orders;
  if (id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Bad id." }, { status: 400 });
    const o = await repo.getOrder(id);
    orders = o ? [o] : [];
  } else {
    const active = (await repo.listOrders({ limit: 300 })).filter((o) => !["completed", "cancelled", "pending"].includes(o.status));
    const deliveries = await ops.listDeliveries(active.map((o) => o.id)).catch(() => []);
    const byId = new Map(deliveries.map((d) => [d.orderId, d]));
    orders = active.filter((o) => isTrackable(o, byId.get(o.id) ?? null));
  }
  const payload = await buildTracking(ops, orders, { includeCustomer: true }).catch(() => buildTracking(ops, [], { includeCustomer: true }));
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
