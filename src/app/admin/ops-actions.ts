"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff, type StaffContext } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { generateAccessToken, hashAccessToken } from "@/lib/orders/token";
import { getStaffOps } from "@/lib/ops/repository";
import { geocode } from "@/lib/ops/tracking";
import { EXPENSE_CATEGORIES } from "@/lib/ops/types";
import { getStaffRepository } from "@/lib/repositories";

const actor = (ctx: StaffContext) => (ctx.mode === "dev" ? "dev-admin" : ctx.user.email ?? ctx.user.id);
const uuid = z.uuid();
/** True when emails go out from the server; otherwise the admin's email app is opened instead. */
const emailDirect = () => env.email.configured || !env.isProduction;

export interface RiderState {
  ok: boolean;
  message: string | null;
  link: string | null;
}

/** Assigns a rider and creates a fresh private rider link (any older link stops working). */
export async function assignRiderAction(_prev: RiderState, formData: FormData): Promise<RiderState> {
  const ctx = await requireStaff();
  const parsed = z
    .object({
      orderId: uuid,
      riderName: z.string().trim().min(2, "Enter the rider's name.").max(80),
      riderPhone: z.string().trim().max(20).optional().default(""),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message, link: null };
  const [repo, ops] = await Promise.all([getStaffRepository(ctx), getStaffOps(ctx)]);
  const order = await repo.getOrder(parsed.data.orderId);
  if (!order) return { ok: false, message: "Order not found.", link: null };

  const existing = await ops.getDelivery(order.id);
  let dest = existing?.dest ?? null;
  let destLabel = existing?.destLabel ?? null;
  if (!dest && order.fulfilment.address) {
    const a = order.fulfilment.address;
    const hit = (await geocode(`${a.line1}, ${a.suburb}, ${a.city}`)) ?? (await geocode(`${a.suburb}, ${a.city}`));
    if (hit) {
      dest = { lat: hit.lat, lng: hit.lng };
      destLabel = hit.label;
    }
  }
  const key = generateAccessToken();
  await ops.upsertDelivery(order.id, {
    riderName: parsed.data.riderName,
    riderPhone: parsed.data.riderPhone || null,
    riderTokenHash: hashAccessToken(key),
    dest,
    destLabel,
  });
  await repo.updateOrder(order.id, {}, { note: `Rider assigned: ${parsed.data.riderName}`, actor: actor(ctx) });
  revalidatePath(`/admin/orders/${order.id}`);
  return {
    ok: true,
    message: dest ? "Rider link ready. Send it to the rider." : "Rider link ready. Tap the map to set the drop-off pin.",
    link: `${env.siteUrl}/rider/${order.id}?k=${key}`,
  };
}

/** Sets the drop-off pin from a map click. */
export async function setDestinationAction(orderId: string, lat: number, lng: number) {
  const ctx = await requireStaff();
  const p = z.object({ orderId: uuid, lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).parse({ orderId, lat, lng });
  const ops = await getStaffOps(ctx);
  await ops.upsertDelivery(p.orderId, { dest: { lat: p.lat, lng: p.lng }, destLabel: "Pin set on the map" });
  revalidatePath(`/admin/orders/${p.orderId}`);
}

/** Looks the address (or a landmark typed by staff) up on OpenStreetMap. */
export async function findDestinationAction(_prev: RiderState, formData: FormData): Promise<RiderState> {
  const ctx = await requireStaff();
  const p = z.object({ orderId: uuid, query: z.string().trim().min(3, "Type an address or landmark.").max(200) }).safeParse(Object.fromEntries(formData));
  if (!p.success) return { ok: false, message: p.error.issues[0].message, link: null };
  const hit = await geocode(p.data.query);
  if (!hit) return { ok: false, message: "Couldn't find that place. Try a nearby landmark, or tap the map.", link: null };
  const ops = await getStaffOps(ctx);
  await ops.upsertDelivery(p.data.orderId, { dest: { lat: hit.lat, lng: hit.lng }, destLabel: hit.label });
  revalidatePath(`/admin/orders/${p.data.orderId}`);
  return { ok: true, message: `Pin set: ${hit.label}`, link: null };
}

export async function updateEnquiryAction(formData: FormData) {
  const ctx = await requireStaff();
  const p = z
    .object({ id: uuid, status: z.enum(["new", "open", "resolved"]), staffNote: z.string().trim().max(1000).optional() })
    .parse(Object.fromEntries(formData));
  const ops = await getStaffOps(ctx);
  await ops.updateEnquiry(p.id, { status: p.status, ...(p.staffNote !== undefined ? { staffNote: p.staffNote } : {}) });
  revalidatePath("/admin/enquiries");
}

const money = z
  .string()
  .trim()
  .transform((v, c) => {
    if (v === "") return null;
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(v)) {
      c.addIssue({ code: "custom", message: "Enter an amount like 12.50" });
      return z.NEVER;
    }
    return Math.round(Number(v) * 100);
  });

export interface FormState {
  ok: boolean;
  message: string | null;
}

export async function addExpenseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireStaff({ admin: true });
  const p = z
    .object({
      spentOn: z.iso.date("Pick a date."),
      category: z.enum(EXPENSE_CATEGORIES),
      description: z.string().trim().min(1, "Say what it was for.").max(200),
      amount: money.pipe(z.number({ error: "Enter the amount." }).int().positive("Enter the amount.")),
    })
    .safeParse(Object.fromEntries(formData));
  if (!p.success) return { ok: false, message: p.error.issues[0].message };
  const ops = await getStaffOps(ctx);
  await ops.addExpense({ ...p.data, createdBy: actor(ctx) });
  revalidatePath("/admin/finance");
  revalidatePath("/admin");
  return { ok: true, message: "Expense saved." };
}

export async function deleteExpenseAction(formData: FormData) {
  const ctx = await requireStaff({ admin: true });
  const id = uuid.parse(formData.get("id"));
  const ops = await getStaffOps(ctx);
  await ops.deleteExpense(id);
  revalidatePath("/admin/finance");
}

export async function setVariantCostAction(formData: FormData) {
  const ctx = await requireStaff({ admin: true });
  const p = z.object({ variantId: z.string().min(1).max(120), cost: money }).parse(Object.fromEntries(formData));
  const ops = await getStaffOps(ctx);
  await ops.setVariantCost(p.variantId, p.cost);
  revalidatePath("/admin/finance");
  revalidatePath("/admin/products");
}

export interface SendState {
  ok: boolean;
  message: string | null;
  /** Bumps after each success so the composer can clear itself. */
  sentAt: number;
}

const sendSchema = z.object({
  channel: z.enum(["email", "whatsapp", "sms"]),
  customerName: z.string().trim().max(100).default(""),
  toEmail: z.string().trim().max(200).optional().default(""),
  toPhone: z.string().trim().max(20).optional().default(""),
  subject: z.string().trim().max(200).optional().default(""),
  body: z.string().trim().min(2, "Write a message first.").max(4000),
  enquiryId: z.string().optional().default(""),
  orderId: z.string().optional().default(""),
  resolve: z.string().optional().default(""),
});

/**
 * Reply to a customer. Email is sent from the server (Resend) and logged.
 * WhatsApp / SMS are opened on the admin's own device with the text filled in
 * (the composer does that), and logged here as "handed off".
 */
export async function sendMessageAction(_prev: SendState, formData: FormData): Promise<SendState> {
  const ctx = await requireStaff();
  const p = sendSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) return { ok: false, message: p.error.issues[0].message, sentAt: 0 };
  const d = p.data;
  const enquiryId = uuid.safeParse(d.enquiryId).success ? d.enquiryId : null;
  const orderId = uuid.safeParse(d.orderId).success ? d.orderId : null;
  const ops = await getStaffOps(ctx);

  if (d.channel === "email") {
    if (!z.email().safeParse(d.toEmail).success) return { ok: false, message: "This customer has no valid email address.", sentAt: 0 };
    const subject = d.subject || "A message from Naturo Wellness";
    if (!emailDirect()) {
      // No sending service yet: the composer opened the admin's own email app (mailto).
      await ops
        .addMessage({
          enquiryId,
          orderId,
          customerName: d.customerName,
          toEmail: d.toEmail,
          toPhone: d.toPhone || null,
          channel: "email",
          subject,
          body: d.body,
          status: "handed_off",
          error: null,
          sentBy: actor(ctx),
        })
        .catch(() => undefined);
      if (enquiryId) {
        await ops.updateEnquiry(enquiryId, { status: d.resolve === "on" ? "resolved" : "open" }).catch(() => undefined);
        revalidatePath("/admin/enquiries");
      }
      if (orderId) revalidatePath(`/admin/orders/${orderId}`);
      revalidatePath("/admin/customers");
      return { ok: true, message: "Opened your email app with the message filled in: press send there. Logged here.", sentAt: Date.now() };
    }
    const sent = await sendEmail({ to: d.toEmail, subject, text: d.body });
    await ops
      .addMessage({
        enquiryId,
        orderId,
        customerName: d.customerName,
        toEmail: d.toEmail,
        toPhone: d.toPhone || null,
        channel: "email",
        subject,
        body: d.body,
        status: sent.ok ? "sent" : "failed",
        error: sent.ok ? null : sent.error,
        sentBy: actor(ctx),
      })
      .catch(() => undefined);
    if (!sent.ok) return { ok: false, message: sent.error, sentAt: 0 };
  } else {
    if (!d.toPhone) return { ok: false, message: "This customer has no phone number.", sentAt: 0 };
    await ops
      .addMessage({
        enquiryId,
        orderId,
        customerName: d.customerName,
        toEmail: d.toEmail || null,
        toPhone: d.toPhone,
        channel: d.channel,
        subject: "",
        body: d.body,
        status: "handed_off",
        error: null,
        sentBy: actor(ctx),
      })
      .catch(() => undefined);
  }

  if (enquiryId) {
    await ops.updateEnquiry(enquiryId, { status: d.resolve === "on" ? "resolved" : "open" }).catch(() => undefined);
    revalidatePath("/admin/enquiries");
  }
  if (orderId) revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/customers");
  return {
    ok: true,
    message: d.channel === "email" ? `Email sent to ${d.toEmail}.` : `Opened ${d.channel === "whatsapp" ? "WhatsApp" : "SMS"}: press send there. Logged here.`,
    sentAt: Date.now(),
  };
}

export interface BulkEmailState {
  ok: boolean;
  message: string | null;
  sentAt: number;
}

const bulkSchema = z.object({
  subject: z.string().trim().min(2, "Add a subject.").max(200),
  body: z.string().trim().min(2, "Write a message first.").max(4000),
  recipients: z.string().max(200_000),
  /** "server" = send from getnaturo.com; "handoff" = opened in the admin's email app. */
  mode: z.enum(["server", "handoff"]),
});

/**
 * Email many customers at once. With a sending service connected each customer
 * gets their own copy (with their first name); otherwise the composer opened the
 * admin's email app with everyone in Bcc and this just logs it.
 */
export async function bulkEmailAction(_prev: BulkEmailState, formData: FormData): Promise<BulkEmailState> {
  const ctx = await requireStaff({ admin: true });
  const p = bulkSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) return { ok: false, message: p.error.issues[0].message, sentAt: 0 };
  const list = z
    .array(z.object({ name: z.string().max(100), email: z.email(), phone: z.string().max(20).nullish() }))
    .max(500)
    .safeParse(JSON.parse(p.data.recipients || "[]"));
  if (!list.success || list.data.length === 0) return { ok: false, message: "Choose at least one customer with an email address.", sentAt: 0 };
  const ops = await getStaffOps(ctx);
  const direct = p.data.mode === "server" && emailDirect();
  let sent = 0;
  const failed: string[] = [];
  for (const r of list.data) {
    const first = r.name.split(" ")[0] || "there";
    const text = p.data.body.replace(/\{name\}/g, first);
    const res = direct ? await sendEmail({ to: r.email, toName: r.name, subject: p.data.subject, text }) : ({ ok: true } as const);
    if (res.ok) sent += 1;
    else failed.push(r.email);
    await ops
      .addMessage({
        enquiryId: null,
        orderId: null,
        customerName: r.name,
        toEmail: r.email,
        toPhone: r.phone || null,
        channel: "email",
        subject: p.data.subject,
        body: text,
        status: !direct ? "handed_off" : res.ok ? "sent" : "failed",
        error: res.ok ? null : res.error,
        sentBy: actor(ctx),
      })
      .catch(() => undefined);
  }
  revalidatePath("/admin/customers");
  if (!direct) return { ok: true, message: `Opened your email app with ${sent} customer${sent === 1 ? "" : "s"} in Bcc: press send there. Logged here.`, sentAt: Date.now() };
  if (failed.length) return { ok: false, message: `Sent ${sent}, failed ${failed.length}: ${failed.slice(0, 5).join(", ")}${failed.length > 5 ? "…" : ""}`, sentAt: Date.now() };
  return { ok: true, message: `Email sent to ${sent} customer${sent === 1 ? "" : "s"}.`, sentAt: Date.now() };
}
