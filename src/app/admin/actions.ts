"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff, type StaffContext } from "@/lib/auth";
import { emailReceipt, refreshPaymentStatus } from "@/lib/orders/service";
import { getStaffRepository } from "@/lib/repositories";
import { createServiceClient } from "@/lib/supabase/server";
import { isOnlinePayment } from "@/lib/types";

/**
 * Admin Server Actions. EVERY action re-checks staff access on the server;
 * with Supabase, writes also pass through RLS as the signed-in staff member.
 */

const actor = (ctx: StaffContext) => (ctx.mode === "dev" ? "dev-admin" : ctx.user.email ?? ctx.user.id);

const orderStatus = z.enum([
  "pending",
  "confirmed",
  "preparing",
  "ready_for_collection",
  "out_for_delivery",
  "completed",
  "cancelled",
]);

export async function updateOrderStatusAction(formData: FormData) {
  const ctx = await requireStaff();
  const parsed = z
    .object({ orderId: z.uuid(), status: orderStatus, note: z.string().trim().max(300).optional().default("") })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid order update.");
  const repo = await getStaffRepository(ctx);
  await repo.updateOrder(
    parsed.data.orderId,
    { status: parsed.data.status },
    { note: parsed.data.note || `Status changed to ${parsed.data.status.replace(/_/g, " ")}`, actor: actor(ctx) },
  );
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/admin/orders");
}

/**
 * Staff can confirm payment ONLY for offline methods (cash / manual transfer)
 * after checking it themselves. Online (Paynow) payments can only be marked
 * paid by server-side verification with the provider.
 */
export async function updatePaymentStatusAction(formData: FormData) {
  const ctx = await requireStaff();
  const parsed = z
    .object({ orderId: z.uuid(), paymentStatus: z.enum(["unpaid", "pending", "paid", "refunded", "cancelled"]) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid payment update.");
  const repo = await getStaffRepository(ctx);
  const order = await repo.getOrder(parsed.data.orderId);
  if (!order) throw new Error("Order not found.");
  if (isOnlinePayment(order.paymentMethod) && parsed.data.paymentStatus === "paid") {
    throw new Error("Online payments can only be confirmed by the payment provider.");
  }
  const updated = await repo.updateOrder(
    order.id,
    { paymentStatus: parsed.data.paymentStatus },
    { note: `Payment marked ${parsed.data.paymentStatus} by staff`, actor: actor(ctx) },
  );
  if (updated.becamePaid) await emailReceipt(updated, actor(ctx));
  revalidatePath(`/admin/orders/${order.id}`);
}

/** Emails the payment receipt again (paid orders only). */
export async function resendReceiptAction(formData: FormData) {
  const ctx = await requireStaff();
  const id = z.uuid().parse(formData.get("orderId"));
  const repo = await getStaffRepository(ctx);
  const order = await repo.getOrder(id);
  if (!order) throw new Error("Order not found.");
  if (order.paymentStatus !== "paid") throw new Error("Only paid orders have a receipt.");
  await emailReceipt(order, actor(ctx));
  revalidatePath(`/admin/orders/${id}`);
}

export async function recheckPaymentAction(formData: FormData) {
  const ctx = await requireStaff();
  const id = z.uuid().parse(formData.get("orderId"));
  const repo = await getStaffRepository(ctx);
  const order = await repo.getOrder(id);
  if (order) await refreshPaymentStatus(order);
  revalidatePath(`/admin/orders/${id}`);
}

/**
 * Permanently deletes an order (failed payments, test or duplicate orders). Admins only; the
 * form must repeat the order number. Paid orders are refused (refund or mark them first) so
 * money records are never lost. Tracked stock is put back unless the goods already left.
 */
export async function deleteOrderAction(formData: FormData) {
  const ctx = await requireStaff({ admin: true });
  const parsed = z
    .object({ orderId: z.uuid(), confirm: z.string().trim().max(40) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid delete request.");
  const repo = await getStaffRepository(ctx);
  const order = await repo.getOrder(parsed.data.orderId);
  if (!order) redirect("/admin/orders");
  if (parsed.data.confirm.toUpperCase() !== order.orderNumber.toUpperCase()) {
    redirect(`/admin/orders/${order.id}?delete=mismatch`);
  }
  if (order.paymentStatus === "paid") redirect(`/admin/orders/${order.id}?delete=paid`);

  const db = createServiceClient();
  const goodsLeft = order.status === "completed" || order.status === "out_for_delivery";
  let restocked = false;
  if (!goodsLeft) {
    const { data: moves, error } = await db
      .from("inventory_movements")
      .select("variant_id, change")
      .eq("order_id", order.id)
      .eq("reason", "order");
    if (error) throw new Error(error.message);
    for (const m of moves ?? []) {
      const qty = -m.change;
      if (qty <= 0) continue;
      const { data: v } = await db.from("product_variants").select("stock_quantity, stock_status").eq("id", m.variant_id).maybeSingle();
      if (!v || v.stock_quantity === null) continue;
      const next = v.stock_quantity + qty;
      await db
        .from("product_variants")
        .update({ stock_quantity: next, stock_status: v.stock_status === "out_of_stock" ? "in_stock" : v.stock_status })
        .eq("id", m.variant_id);
      await db.from("inventory_movements").insert({
        variant_id: m.variant_id,
        change: qty,
        reason: "cancellation",
        note: `Order ${order.orderNumber} deleted by ${actor(ctx)}`,
      });
      restocked = true;
    }
  }
  const { error } = await db.from("orders").delete().eq("id", order.id);
  if (error) throw new Error(error.message);
  if (restocked) updateTag("catalog");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  redirect(`/admin/orders?deleted=${encodeURIComponent(order.orderNumber)}`);
}

const priceInput = z
  .string()
  .trim()
  .transform((v, c) => {
    if (v === "") return null; // empty = "Price coming soon"
    if (!/^\d{1,5}(\.\d{1,2})?$/.test(v)) {
      c.addIssue({ code: "custom", message: "Enter a price like 2.50" });
      return z.NEVER;
    }
    const cents = Math.round(Number(v) * 100);
    return cents > 0 ? cents : null;
  });

export async function updateVariantAction(formData: FormData) {
  const ctx = await requireStaff({ admin: true });
  const parsed = z
    .object({
      productId: z.string().min(1).max(80),
      variantId: z.string().min(1).max(120),
      price: priceInput,
      stockStatus: z.enum(["in_stock", "low_stock", "out_of_stock", "unknown"]),
      stockQuantity: z
        .string()
        .trim()
        .transform((v) => (v === "" ? null : Number(v)))
        .pipe(z.number().int().min(0).max(1_000_000).nullable()),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid product update.");
  const repo = await getStaffRepository(ctx);
  await repo.updateVariant(parsed.data.productId, parsed.data.variantId, {
    price: parsed.data.price,
    stockStatus: parsed.data.stockStatus,
    stockQuantity: parsed.data.stockQuantity,
  });
  updateTag("catalog");
  revalidatePath("/admin/products");
}

export async function setProductEnabledAction(formData: FormData) {
  const ctx = await requireStaff({ admin: true });
  const productId = z.string().min(1).max(80).parse(formData.get("productId"));
  const enabled = formData.get("enabled") === "true";
  const repo = await getStaffRepository(ctx);
  await repo.setProductEnabled(productId, enabled);
  updateTag("catalog");
  revalidatePath("/admin/products");
}
