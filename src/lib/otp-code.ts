import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/** 6-digit one-time codes for admin sign in. Only an HMAC of the code is stored. */

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_PER_WINDOW = 5;
export const OTP_WINDOW_MS = 15 * 60 * 1000;

export const normaliseEmail = (e: string) => e.trim().toLowerCase();

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashCode(code: string, email: string, secret: string): string {
  return createHmac("sha256", secret).update(`${normaliseEmail(email)}:${code}`).digest("hex");
}

export function codeMatches(code: string, email: string, secret: string, storedHash: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const a = Buffer.from(hashCode(code, email, secret), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface CodeRow {
  code_hash: string;
  attempts: number;
  used: boolean;
  expires_at: string;
}

/** Decides what to do with a submitted code against the newest stored row. */
export function checkCode(row: CodeRow | null, code: string, email: string, secret: string, now = Date.now()): "ok" | "wrong" | "expired" | "locked" | "none" {
  if (!row || row.used) return "none";
  if (Date.parse(row.expires_at) < now) return "expired";
  if (row.attempts >= OTP_MAX_ATTEMPTS) return "locked";
  return codeMatches(code, email, secret, row.code_hash) ? "ok" : "wrong";
}
