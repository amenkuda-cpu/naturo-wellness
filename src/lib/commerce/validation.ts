import { z } from "zod";
import { commerceConfig } from "@/config/commerce";

/** Normalises Zimbabwean & international phone numbers to a compact form. */
export function normalisePhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, "");
}

export function isValidPhone(raw: string): boolean {
  const p = normalisePhone(raw);
  // Zimbabwe mobile (07X XXX XXXX / +263 7X XXX XXXX) or any E.164 number.
  return /^(?:\+?263|0)7\d{8}$/.test(p) || /^\+[1-9]\d{8,14}$/.test(p);
}

const cartLineSchema = z.object({
  productId: z.string().min(1).max(80),
  variantId: z.string().min(1).max(120),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1.")
    .max(commerceConfig.maxQuantityPerLine, `You can order up to ${commerceConfig.maxQuantityPerLine} of each item.`),
});

export const cartLinesSchema = z
  .array(cartLineSchema)
  .min(1, "Your cart is empty.")
  .max(commerceConfig.maxLinesPerOrder, "Too many different items in one order.");

const customerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(100, "Name is too long."),
  phone: z
    .string()
    .trim()
    .refine(isValidPhone, "Enter a valid phone number, e.g. 077 123 4567 or +263 77 123 4567.")
    .transform(normalisePhone),
  email: z
    .union([z.literal(""), z.email("Enter a valid email address.").max(200)])
    .optional()
    .transform((v) => (v ? v.toLowerCase() : null)),
});

const addressSchema = z.object({
  line1: z.string().trim().min(3, "Please enter your street address.").max(160),
  suburb: z.string().trim().min(2, "Please enter your suburb.").max(80),
  city: z.string().trim().min(2, "Please enter your town or city.").max(80),
  instructions: z.string().trim().max(300, "Keep delivery notes under 300 characters.").optional().default(""),
});

export const fulfilmentSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("delivery"),
    zoneId: z.string().min(1, "Choose a delivery area."),
    address: addressSchema,
  }),
  z.object({ method: z.literal("collection") }),
]);

export const paymentMethodSchema = z.enum(["cash_on_delivery", "manual", "paynow"], {
  error: "Choose a payment method.",
});

export const checkoutSchema = z.object({
  items: cartLinesSchema,
  customer: customerSchema,
  fulfilment: fulfilmentSchema,
  paymentMethod: paymentMethodSchema,
  promoCode: z.string().trim().max(32).optional().default(""),
  notes: z.string().trim().max(500, "Keep order notes under 500 characters.").optional().default(""),
  acceptTerms: z.literal(true, { error: "Please accept the terms to place your order." }),
  /** Required (checked on the server) when the cart contains an 18+ product. */
  ageConfirmed: z.boolean().optional().default(false),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;

export const quoteRequestSchema = z.object({
  items: z.array(cartLineSchema).max(commerceConfig.maxLinesPerOrder),
  fulfilment: z
    .object({ method: z.enum(["delivery", "collection"]), zoneId: z.string().optional() })
    .optional(),
  promoCode: z.string().trim().max(32).optional(),
});

/** Flattens Zod issues into `{ "customer.phone": "message" }`. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
