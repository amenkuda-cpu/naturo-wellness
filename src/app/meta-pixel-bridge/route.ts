import { metaPixel } from "@/config/meta";
import { ga4 } from "@/config/ga4";
import { ga4Snippet } from "@/lib/ga4";
import { pixelBaseCode } from "@/lib/meta-pixel-snippet";

/**
 * Tiny page loaded in a hidden, no-referrer iframe by the order page to send
 * the Meta Purchase event. The order page's own URL carries a private access
 * token, so the pixel never runs there; this page's URL holds only the order
 * id, total, product ids and item count.
 */
export function GET(request: Request) {
  const headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow",
  };
  if (!metaPixel.enabled && !ga4.enabled) return new Response("<!doctype html><title>off</title>", { headers });

  const q = new URL(request.url).searchParams;
  const eid = q.get("eid") ?? "";
  const value = Number(q.get("value"));
  const n = Number(q.get("n"));
  const ids = (q.get("ids") ?? "").split(",").filter((s) => /^[a-z0-9-]{1,80}$/.test(s)).slice(0, 50);
  const valid = /^[0-9a-f-]{36}$/i.test(eid) && Number.isFinite(value) && value >= 0 && value < 1e6 && Number.isInteger(n) && n > 0 && n < 1000 && ids.length > 0;
  if (!valid) return new Response("<!doctype html><title>invalid</title>", { status: 400, headers });

  const params = JSON.stringify({ content_ids: ids, content_type: "product", num_items: n, value: Math.round(value * 100) / 100, currency: metaPixel.currency });
  const meta = metaPixel.enabled
    ? `<script>${pixelBaseCode({ pageView: false, respectExcludedPaths: false })}
fbq('track','Purchase',${params},{eventID:${JSON.stringify(eid)}});</script>
<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${metaPixel.id}&ev=Purchase&noscript=1"></noscript>`
    : "";
  // GA4 purchase: the reported page is a clean "/order-complete", never the private order link.
  const origin = new URL(request.url).origin;
  const gaPurchase = JSON.stringify({ transaction_id: eid, value: Math.round(value * 100) / 100, currency: ga4.currency, items: ids.map((id) => ({ item_id: id })) });
  const google = ga4.enabled
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga4.id}"></script>
<script>${ga4Snippet({ pageView: false, pageLocation: `${origin}/order-complete` })}gtag('event','purchase',${gaPurchase});</script>`
    : "";
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Naturo</title></head><body>
${meta}
${google}
</body></html>`;
  return new Response(html, { headers });
}
