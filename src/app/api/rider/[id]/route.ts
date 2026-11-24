import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAccessToken } from "@/lib/orders/token";
import { getSystemOps } from "@/lib/ops/repository";
import { getRepository } from "@/lib/repositories";

/**
 * Rider phone → server. The rider link carries a secret key (?k=) whose hash
 * is stored on the delivery. Actions: start the trip, send a GPS point, finish.
 */
const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), k: z.string().min(10).max(200) }),
  z.object({ action: z.literal("delivered"), k: z.string().min(10).max(200) }),
  z.object({
    action: z.literal("ping"),
    k: z.string().min(10).max(200),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracy: z.number().min(0).max(100000).nullable().optional(),
    heading: z.number().min(0).max(360).nullable().optional(),
    speed: z.number().min(0).max(100).nullable().optional(),
  }),
]);

// Simple per-instance throttle: at most one ping per order every 3 seconds.
const lastPing = new Map<string, number>();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const ops = getSystemOps();
  const delivery = await ops.getDelivery(id);
  if (!delivery?.riderTokenHash || !verifyAccessToken(parsed.data.k, delivery.riderTokenHash)) {
    return NextResponse.json({ error: "This rider link is no longer valid." }, { status: 403 });
  }
  const repo = getRepository();
  const order = await repo.getOrder(id);
  if (!order || order.status === "cancelled") return NextResponse.json({ error: "This order was cancelled." }, { status: 410 });
  const who = delivery.riderName ? `rider ${delivery.riderName}` : "rider";

  switch (parsed.data.action) {
    case "start": {
      if (!delivery.startedAt || delivery.deliveredAt) {
        await ops.upsertDelivery(id, { startedAt: new Date().toISOString(), deliveredAt: null });
      }
      if (order.status !== "out_for_delivery") {
        await repo.updateOrder(id, { status: "out_for_delivery" }, { note: "Out for delivery (rider started the trip)", actor: who });
      }
      return NextResponse.json({ ok: true });
    }
    case "ping": {
      if (delivery.deliveredAt) return NextResponse.json({ ok: true, done: true });
      const now = Date.now();
      if (now - (lastPing.get(id) ?? 0) < 3000) return NextResponse.json({ ok: true, throttled: true });
      lastPing.set(id, now);
      const { lat, lng, accuracy, heading, speed } = parsed.data;
      if (!delivery.startedAt) await ops.upsertDelivery(id, { startedAt: new Date().toISOString() });
      await ops.addPing(id, { lat, lng, accuracy: accuracy ?? null, heading: heading ?? null, speed: speed ?? null });
      return NextResponse.json({ ok: true });
    }
    case "delivered": {
      await ops.upsertDelivery(id, { deliveredAt: new Date().toISOString() });
      if (order.status !== "completed") {
        await repo.updateOrder(id, { status: "completed" }, { note: "Delivered (confirmed by rider)", actor: who });
      }
      return NextResponse.json({ ok: true });
    }
  }
}
