import { chromium } from "playwright";

const url = process.argv[2] ?? "https://getnaturo.com/";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const page = await ctx.newPage();
const byType = {};
const all = [];
page.on("response", async (res) => {
  try {
    const req = res.request();
    const len = Number(res.headers()["content-length"] ?? 0);
    const type = req.resourceType();
    byType[type] = byType[type] ?? { count: 0, bytes: 0 };
    byType[type].count++;
    byType[type].bytes += len;
    all.push({ type, url: req.url(), status: res.status(), len });
  } catch {}
});
await page.addInitScript(() => {
  window.__lcp = 0;
  window.__long = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__lcp = e.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__long.push(e.duration);
  }).observe({ type: "longtask", buffered: true });
});
const start = Date.now();
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(4000);
const data = await page.evaluate(() => {
  const n = performance.getEntriesByType("navigation")[0];
  const paint = performance.getEntriesByType("paint");
  const res = performance.getEntriesByType("resource");
  return {
    ttfb: n.responseStart,
    domContentLoaded: n.domContentLoadedEventEnd,
    load: n.loadEventEnd,
    fcp: paint.find((p) => p.name === "first-contentful-paint")?.startTime ?? null,
    lcp: window.__lcp || null,
    longTasks: window.__long.length,
    longTaskMs: Math.round(window.__long.reduce((a, b) => a + b, 0)),
    maxLongTask: Math.round(Math.max(0, ...window.__long)),
    resources: res.length,
    transfer: res.reduce((a, r) => a + (r.transferSize || 0), 0),
    decoded: res.reduce((a, r) => a + (r.decodedBodySize || 0), 0),
    video: (() => {
      const v = document.querySelector("video");
      return v ? { readyState: v.readyState, networkState: v.networkState, duration: v.duration, paused: v.paused } : null;
    })(),
    lenis: document.documentElement.classList.contains("lenis"),
  };
});
console.log("WALL_MS", Date.now() - start);
console.log("METRICS", JSON.stringify(data, null, 2));
console.log("BY_TYPE", JSON.stringify(byType, null, 2));
all
  .filter((r) => r.len === 0 || r.len > 200000)
  .sort((a, b) => b.len - a.len)
  .slice(0, 12)
  .forEach((r) => console.log("BIG", r.len, r.type, r.status, r.url));
await browser.close();
