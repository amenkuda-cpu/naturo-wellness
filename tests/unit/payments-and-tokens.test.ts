import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { generateAccessToken, generateOrderNumber, hashAccessToken, verifyAccessToken } from "@/lib/orders/token";
import {
  amountMatches,
  buildInitiateBody,
  mapPaynowStatus,
  parsePaynowMessage,
  paynowHash,
  verifyPaynowHash,
} from "@/lib/payments/paynow-protocol";

const KEY = "test-integration-key";

describe("Paynow protocol", () => {
  it("hashes concatenated values + key with SHA-512 (uppercase)", () => {
    const values: Array<[string, string]> = [
      ["id", "1201"],
      ["reference", "NW-1"],
      ["amount", "2.50"],
    ];
    const expected = createHash("sha512").update(`1201NW-12.50${KEY}`).digest("hex").toUpperCase();
    expect(paynowHash(values, KEY)).toBe(expected);
    expect(paynowHash([...values, ["hash", "IGNORED"]], KEY)).toBe(expected);
  });

  it("builds an initiation body whose hash verifies, and detects tampering", () => {
    const body = buildInitiateBody({
      integrationId: "1201",
      integrationKey: KEY,
      reference: "NW-261014-ABCDEF",
      amountMinor: 1150,
      additionalInfo: "Naturo order",
      returnUrl: "https://naturo.example/order/x?t=y",
      resultUrl: "https://naturo.example/api/payments/paynow/result",
    });
    const values = parsePaynowMessage(body);
    expect(Object.fromEntries(values).amount).toBe("11.50");
    expect(Object.fromEntries(values).status).toBe("Message");
    expect(verifyPaynowHash(values, KEY)).toBe(true);
    expect(verifyPaynowHash(values, "wrong-key")).toBe(false);
    const tampered = parsePaynowMessage(body.replace("11.50", "0.01"));
    expect(verifyPaynowHash(tampered, KEY)).toBe(false);
    expect(verifyPaynowHash(values.filter(([k]) => k !== "hash"), KEY)).toBe(false);
  });

  it("maps statuses conservatively", () => {
    expect(mapPaynowStatus("Paid")).toBe("paid");
    expect(mapPaynowStatus("Awaiting Delivery")).toBe("paid");
    expect(mapPaynowStatus("Cancelled")).toBe("cancelled");
    expect(mapPaynowStatus("Failed")).toBe("failed");
    expect(mapPaynowStatus("Sent")).toBe("pending");
    expect(mapPaynowStatus(undefined)).toBe("pending");
  });

  it("compares amounts in minor units", () => {
    expect(amountMatches("11.50", 1150)).toBe(true);
    expect(amountMatches("11.49", 1150)).toBe(false);
    expect(amountMatches(undefined, 1150)).toBe(false);
    expect(amountMatches("abc", 1150)).toBe(false);
  });
});

describe("order access tokens", () => {
  it("verifies only the matching token", () => {
    const token = generateAccessToken();
    const hash = hashAccessToken(token);
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(verifyAccessToken(token, hash)).toBe(true);
    expect(verifyAccessToken(`${token}x`, hash)).toBe(false);
    expect(verifyAccessToken("", hash)).toBe(false);
    expect(verifyAccessToken(null, hash)).toBe(false);
    expect(verifyAccessToken("a".repeat(500), hash)).toBe(false);
  });

  it("generates readable, unique order numbers", () => {
    const n = generateOrderNumber(new Date("2026-10-14T00:00:00Z"));
    expect(n).toMatch(/^NW-261014-[A-HJ-NP-Z2-9]{6}$/);
    const set = new Set(Array.from({ length: 500 }, () => generateOrderNumber()));
    expect(set.size).toBe(500);
  });
});
