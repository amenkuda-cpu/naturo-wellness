import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Guest orders are protected by an unguessable access token. Only its
 * SHA-256 hash is stored; the raw token lives in the customer's order link.
 */
export function generateAccessToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashAccessToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function verifyAccessToken(token: string | null | undefined, storedHash: string): boolean {
  if (!token || token.length > 128) return false;
  const a = Buffer.from(hashAccessToken(token), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

/** Human-friendly order number, e.g. NW-261014-K7Q2MX. */
export function generateOrderNumber(now = new Date()): string {
  const d = now.toISOString().slice(2, 10).replace(/-/g, "");
  const bytes = randomBytes(6);
  const suffix = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
  return `NW-${d}-${suffix}`;
}
