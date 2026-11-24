/**
 * Meta (Facebook) Pixel settings. The ONLY place the Pixel ID lives.
 * Set NEXT_PUBLIC_META_PIXEL_ID (digits) and, optionally,
 * NEXT_PUBLIC_META_DOMAIN_VERIFICATION (the `content` value, or the whole
 * <meta name="facebook-domain-verification" ...> tag). Empty = pixel off.
 */
const rawId = (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "").trim();
const rawVerification = (process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION ?? "").trim();

export const metaPixel = {
  id: /^\d{6,20}$/.test(rawId) ? rawId : "",
  enabled: /^\d{6,20}$/.test(rawId),
  /** Accepts the bare token or the full meta tag pasted from Events Manager. */
  domainVerification: /content=["']([^"']+)["']/.exec(rawVerification)?.[1] ?? (rawVerification.includes("<") ? "" : rawVerification),
  currency: "USD",
} as const;

/**
 * Paths where the main-window pixel never runs:
 * - /order/* carries a private access token in its URL (customer name, phone,
 *   address); the pixel would report that URL to Meta. Purchase is sent from
 *   the clean /meta-pixel-bridge page instead.
 * - /admin and /rider are staff tools.
 */
export const META_EXCLUDED_PATH = /^\/(order|admin|rider|meta-pixel-bridge)(\/|$)/;
