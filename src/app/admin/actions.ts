"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireStaff, type StaffContext } from "@/lib/auth";
import { refreshPaymentStatus } from "@/lib/orders/service";
import { getStaffRepository } from "@/lib/repositories";

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
  if (order.paymentMethod === "paynow" && parsed.data.paymentStatus === "paid") {
    throw new Error("Online payments can only be confirmed by the payment provider.");
  }
  await repo.updateOrder(
    order.id,
    { paymentStatus: parsed.data.paymentStatus },
    { note: `Payment marked ${parsed.data.paymentStatus} by staff`, actor: actor(ctx) },
  );
  revalidatePath(`/admin/orders/${order.id}`);
}

export async function recheckPaymentAction(formData: FormData) {
  const ctx = await requireStaff();
  const id = z.uuid().parse(formData.get("orderId"));
  const repo = await getStaffRepository(ctx);
  const order = await repo.getOrder(id);
  if (order) await refreshPaymentStatus(order);
  revalidatePath(`/admin/orders/${id}`);
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
