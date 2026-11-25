/**
 * Google Analytics 4 settings. The ONLY place the GA4 Measurement ID lives.
 * TODO(Naturo): set NEXT_PUBLIC_GA4_ID (looks like G-XXXXXXXXXX) in wrangler.jsonc "vars"
 * or Cloudflare → Workers → naturo-wellness → Settings → Variables. Empty = GA4 off.
 */
const raw = (process.env.NEXT_PUBLIC_GA4_ID ?? "").trim();

export const ga4 = {
  id: /^G-[A-Z0-9]{4,20}$/.test(raw) ? raw : "",
  enabled: /^G-[A-Z0-9]{4,20}$/.test(raw),
  currency: "USD",
} as const;
