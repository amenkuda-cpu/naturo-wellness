import { metaPixel } from "@/config/meta";
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
  if (!metaPixel.enabled) return new Response("<!doctype html><title>off</title>", { headers });

  const q = new URL(request.url).searchParams;
  const eid = q.get("eid") ?? "";
  const value = Number(q.get("value"));
  const n = Number(q.get("n"));
  const ids = (q.get("ids") ?? "").split(",").filter((s) => /^[a-z0-9-]{1,80}$/.test(s)).slice(0, 50);
  const valid = /^[0-9a-f-]{36}$/i.test(eid) && Number.isFinite(value) && value >= 0 && value < 1e6 && Number.isInteger(n) && n > 0 && n < 1000 && ids.length > 0;
  if (!valid) return new Response("<!doctype html><title>invalid</title>", { status: 400, headers });

  const params = JSON.stringify({ content_ids: ids, content_type: "product", num_items: n, value: Math.round(value * 100) / 100, currency: metaPixel.currency });
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Naturo</title></head><body>
<script>${pixelBaseCode({ pageView: false, respectExcludedPaths: false })}
fbq('track','Purchase',${params},{eventID:${JSON.stringify(eid)}});</script>
<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${metaPixel.id}&ev=Purchase&noscript=1"></noscript>
</body></html>`;
  return new Response(html, { headers });
}
