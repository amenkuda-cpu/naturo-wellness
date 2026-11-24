"use server";

import { z } from "zod";
import { verifyAccessToken } from "@/lib/orders/token";
import { getSystemOps } from "@/lib/ops/repository";
import { getRepository } from "@/lib/repositories";

export interface EnquiryState {
  ok: boolean;
  message: string | null;
}

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(100),
  phone: z.string().trim().max(20).optional().default(""),
  email: z.union([z.literal(""), z.email("Check your email address.")]).optional().default(""),
  topic: z.enum(["order", "wholesale", "feedback", "general"]).default("general"),
  orderNumber: z.string().trim().max(40).optional().default(""),
  message: z.string().trim().min(5, "Please write a short message.").max(2000),
  // Order page only: the private order id + token, so the query is linked to the order.
  orderId: z.string().max(40).optional().default(""),
  t: z.string().max(200).optional().default(""),
  website: z.string().max(0).optional().default(""), // honeypot: real people leave it empty
});

/** Customer query from the contact page or an order page. Lands in the admin's Queries inbox. */
export async function sendEnquiryAction(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: true, message: "Thanks! We'll be in touch soon." };
    return { ok: false, message: parsed.error.issues[0].message };
  }
  const d = parsed.data;
  if (!d.phone && !d.email) return { ok: false, message: "Add a phone number or email so we can reply." };

  let orderId: string | null = null;
  let orderNumber: string | null = d.orderNumber || null;
  if (d.orderId && /^[0-9a-f-]{36}$/i.test(d.orderId)) {
    const order = await getRepository().getOrder(d.orderId).catch(() => null);
    if (order && verifyAccessToken(d.t, order.accessTokenHash)) {
      orderId = order.id;
      orderNumber = order.orderNumber;
    }
  }
  try {
    await getSystemOps().createEnquiry({
      orderId,
      orderNumber,
      name: d.name,
      phone: d.phone || null,
      email: d.email || null,
      topic: orderId ? "order" : d.topic,
      message: d.message,
    });
  } catch (err) {
    console.error("[enquiry] could not save", err);
    return { ok: false, message: "Sorry, we couldn't send that just now. Please call or WhatsApp us instead." };
  }
  return { ok: true, message: "Thanks! Your message reached the Naturo team. We'll reply soon." };
}
