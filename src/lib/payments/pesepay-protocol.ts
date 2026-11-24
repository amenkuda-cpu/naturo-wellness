import { createCipheriv, createDecipheriv, timingSafeEqual } from "node:crypto";
import type { PaymentStatus } from "@/lib/types";

/**
 * Pesepay REST protocol (https://developers.pesepay.com).
 * Request and response bodies are {"payload": base64(AES-256-CBC(JSON))}, where
 * the key is the 32-character encryption key and the IV its first 16 characters.
 * The result callback is plain JSON with the integration key in Authorization.
 */

export const PESEPAY_BASE = {
  live: "https://api.pesepay.com/api/payments-engine/v1",
  sandbox: "https://api.test.sandbox.pesepay.com/payments-engine/v1",
} as const;

export function pesepayEncrypt(data: unknown, encryptionKey: string): string {
  const key = Buffer.from(encryptionKey, "utf8");
  const iv = Buffer.from(encryptionKey.slice(0, 16), "utf8");
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]).toString("base64");
}

export function pesepayDecrypt<T = Record<string, unknown>>(payload: string, encryptionKey: string): T {
  const key = Buffer.from(encryptionKey, "utf8");
  const iv = Buffer.from(encryptionKey.slice(0, 16), "utf8");
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  const text = Buffer.concat([decipher.update(Buffer.from(payload, "base64")), decipher.final()]).toString("utf8");
  return JSON.parse(text) as T;
}

export interface PesepayTransaction {
  referenceNumber?: string;
  merchantReference?: string;
  transactionStatus?: string;
  pollUrl?: string;
  redirectUrl?: string;
  amountDetails?: { amount?: number; currencyCode?: string };
}

const IN_PROGRESS = new Set(["INITIATED", "PROCESSING", "PENDING", "PARTIALLY_PAID"]);

/** Only SUCCESS means Naturo was paid. */
export function mapPesepayStatus(status: string | undefined): PaymentStatus {
  const s = (status ?? "").toUpperCase();
  if (s === "SUCCESS") return "paid";
  if (s === "REVERSED") return "refunded";
  if (s === "CANCELLED" || s === "TERMINATED") return "cancelled";
  if (IN_PROGRESS.has(s) || s === "") return "pending";
  return "failed";
}

/** Pesepay amounts are major units (10.5); orders store cents. */
export function pesepayAmountMatches(amount: number | undefined, totalMinor: number): boolean {
  return typeof amount === "number" && Math.round(amount * 100) === totalMinor;
}

/** Constant-time comparison of the callback's Authorization header with our key. */
export function pesepayAuthMatches(header: string | null, integrationKey: string): boolean {
  if (!header || !integrationKey) return false;
  const a = Buffer.from(header.replace(/^Bearer\s+/i, "").trim());
  const b = Buffer.from(integrationKey);
  return a.length === b.length && timingSafeEqual(a, b);
}
