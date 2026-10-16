import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Pure helpers for Paynow Zimbabwe's HTTP integration protocol
 * (https://developers.paynow.co.zw). Kept free of I/O so they can be tested.
 *
 * Hash rule: concatenate every field VALUE (in message order, excluding
 * "hash"), append the integration key, SHA-512, uppercase hex.
 */

export const PAYNOW_INITIATE_URL = "https://www.paynow.co.zw/interface/initiatetransaction";

export function paynowHash(values: Array<[string, string]>, integrationKey: string): string {
  const payload = values
    .filter(([k]) => k.toLowerCase() !== "hash")
    .map(([, v]) => v)
    .join("");
  return createHash("sha512")
    .update(payload + integrationKey, "utf8")
    .digest("hex")
    .toUpperCase();
}

/** Parses an x-www-form-urlencoded Paynow message, preserving field order. */
export function parsePaynowMessage(body: string): Array<[string, string]> {
  return [...new URLSearchParams(body).entries()];
}

export function verifyPaynowHash(values: Array<[string, string]>, integrationKey: string): boolean {
  const received = values.find(([k]) => k.toLowerCase() === "hash")?.[1];
  if (!received) return false;
  const expected = paynowHash(values, integrationKey);
  const a = Buffer.from(received.toUpperCase());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function buildInitiateBody(input: {
  integrationId: string;
  integrationKey: string;
  reference: string;
  amountMinor: number;
  additionalInfo: string;
  returnUrl: string;
  resultUrl: string;
  authEmail?: string;
}): string {
  const values: Array<[string, string]> = [
    ["id", input.integrationId],
    ["reference", input.reference],
    ["amount", (input.amountMinor / 100).toFixed(2)],
    ["additionalinfo", input.additionalInfo],
    ["returnurl", input.returnUrl],
    ["resulturl", input.resultUrl],
  ];
  if (input.authEmail) values.push(["authemail", input.authEmail]);
  values.push(["status", "Message"]);
  values.push(["hash", paynowHash(values, input.integrationKey)]);
  return new URLSearchParams(values).toString();
}

export type PaynowMappedStatus = "paid" | "pending" | "failed" | "cancelled" | "refunded";

export function mapPaynowStatus(status: string | undefined): PaynowMappedStatus {
  switch ((status ?? "").toLowerCase()) {
    case "paid":
    case "awaiting delivery":
    case "delivered":
      return "paid";
    case "cancelled":
      return "cancelled";
    case "failed":
    case "disputed":
      return "failed";
    case "refunded":
      return "refunded";
    default:
      return "pending"; // created, sent, unknown
  }
}

export function getField(values: Array<[string, string]>, name: string): string | undefined {
  return values.find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1];
}

/** Paynow amounts are decimal strings; compare in minor units. */
export function amountMatches(paynowAmount: string | undefined, expectedMinor: number): boolean {
  if (!paynowAmount) return false;
  const minor = Math.round(Number.parseFloat(paynowAmount) * 100);
  return Number.isFinite(minor) && minor === expectedMinor;
}
