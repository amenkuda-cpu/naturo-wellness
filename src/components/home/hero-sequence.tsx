"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "@/lib/gsap";

/**
 * Every frame of the original product film (24fps, first 0.7s and the closing
 * fade-to-black trimmed): public/frames/hero/{desktop,mobile}/f001..f206.webp.
 */
const FRAME_COUNT = 206;
const frameSrc = (set: "desktop" | "mobile", i: number) => `/frames/hero/${set}/f${String(i + 1).padStart(3, "0")}.webp`;

/** Decoded frames kept either side of the playhead (~3.7MB each at 1280x720). */
const AHEAD = 14;
const KEEP = 24;
const MAX_DECODES = 3;

type RGB = [number, number, number];

/**
 * The hero product film as a scroll-scrubbed image sequence drawn on a canvas.
 * Each frame is a still pulled from the original high-bitrate film, so it stays
 * sharp. The visitor's scroll through `track` drives the playhead: bottles drift
 * in, burst open, and settle into the Naturo line-up.
 *
 * Smoothness:
 * - Frames are fetched once as compressed blobs, then decoded off the main
 *   thread into ImageBitmaps for a window around the playhead, so drawing never
 *   waits on a synchronous decode (the cause of mid-scroll hitches).
 * - Neighbouring frames are cross-faded for sub-frame positions.
 * - The playhead eases toward the scroll position (scrub), on top of Lenis.
 *
 * Layout: desktop/landscape draws 1280x720 frames cover-fit; phones/portrait
 * draw a 960x720 crop that keeps all five bottles in view, blended into the
 * matching yellow backdrop. Reduced motion: only the final line-up is shown.
 */
export function HeroSequence({ track }: { track: RefObject<HTMLElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const trackEl = track.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !trackEl || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const portrait = window.matchMedia("(max-aspect-ratio: 1/1), (max-width: 767px)").matches;
    const set = portrait ? "mobile" : "desktop";
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const saveData = !!conn?.saveData;

    const blobs: (Blob | undefined)[] = new Array(FRAME_COUNT);
    const bitmaps = new Map<number, ImageBitmap>();
    const decoding = new Set<number>();
    let backdrop: RGB = [246, 215, 60];
    let backdropSampled = false;
    const state = { frame: reduced ? FRAME_COUNT - 1 : 0 };
    let drawnAt = -1;
    let disposed = false;

    // Backdrop colour along the top edge: per-channel median of 64 samples, so a
    // stray leaf or splash doesn't skew it. Sampled once (it barely changes).
    const sampleBackdrop = (bmp: ImageBitmap) => {
      const SAMPLES = 64;
      const c = document.createElement("canvas");
      c.width = SAMPLES;
      c.height = 1;
      const sctx = c.getContext("2d", { willReadFrequently: true });
      if (!sctx) return;
      sctx.imageSmoothingEnabled = false;
      sctx.drawImage(bmp, 0, 1, bmp.width, 1, 0, 0, SAMPLES, 1);
      const d = sctx.getImageData(0, 0, SAMPLES, 1).data;
      const median = (ch: number) => {
        const v: number[] = [];
        for (let k = 0; k < SAMPLES; k++) v.push(d[k * 4 + ch]);
        v.sort((a, b) => a - b);
        return v[SAMPLES >> 1];
      };
      backdrop = [median(0), median(1), median(2)];
      backdropSampled = true;
    };

    const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    const nearestBitmap = (i: number) => {
      for (let d = 0; d < FRAME_COUNT; d++) {
        if (bitmaps.has(i - d)) return i - d;
        if (bitmaps.has(i + d)) return i + d;
      }
      return -1;
    };

    // ---- Decode window -------------------------------------------------------
    const decode = (i: number) => {
      const blob = blobs[i];
      if (!blob || bitmaps.has(i) || decoding.has(i) || decoding.size >= MAX_DECODES) return;
      decoding.add(i);
      createImageBitmap(blob).then(
        (bmp) => {
          decoding.delete(i);
          if (disposed) return bmp.close();
          bitmaps.set(i, bmp);
          if (!backdropSampled) sampleBackdrop(bmp);
          const target = state.frame;
          if (Math.abs(i - target) <= 1.5 || drawnAt < 0) draw(true);
          pump();
        },
        () => {
          decoding.delete(i);
          pump();
        },
      );
    };

    // Decode outward from the playhead (forward first), drop frames far behind.
    const pump = () => {
      if (disposed) return;
      const c = Math.round(state.frame);
      for (const [i, bmp] of bitmaps) {
        if (Math.abs(i - c) > KEEP) {
          bmp.close();
          bitmaps.delete(i);
        }
      }
      // Scrolled into a stretch that hasn't downloaded yet: show the nearest frame we have.
      if (!blobs[c]) {
        for (let d = 1; d < FRAME_COUNT; d++) {
          if (blobs[c - d]) {
            decode(c - d);
            break;
          }
          if (blobs[c + d]) {
            decode(c + d);
            break;
          }
        }
      }
      for (let d = 0; d <= AHEAD && decoding.size < MAX_DECODES; d++) {
        if (c + d < FRAME_COUNT) decode(c + d);
        if (d && c - d >= 0 && d <= AHEAD / 2) decode(c - d);
      }
    };

    // ---- Paint -----------------------------------------------------------------
    const draw = (force = false) => {
      const pos = state.frame;
      if (!force && Math.abs(pos - drawnAt) < 0.01) return;
      const base = Math.floor(pos);
      const frac = pos - base;
      let idx = base;
      let next = -1;
      if (bitmaps.has(base)) {
        if (frac > 0.02 && bitmaps.has(base + 1)) next = base + 1;
      } else {
        idx = nearestBitmap(Math.round(pos));
      }
      if (idx < 0) return;
      const a = bitmaps.get(idx)!;
      const b = next >= 0 ? bitmaps.get(next)! : null;
      const paint = (x: number, y: number, w: number, h: number) => {
        ctx.globalAlpha = 1;
        ctx.drawImage(a, x, y, w, h);
        if (b) {
          ctx.globalAlpha = frac;
          ctx.drawImage(b, x, y, w, h);
          ctx.globalAlpha = 1;
        }
      };
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = a.width;
      const ih = a.height;
      const cover = Math.max(cw / iw, ch / ih);

      if (!portrait) {
        const dw = iw * cover;
        const dh = ih * cover;
        paint((cw - dw) / 2, (ch - dh) / 2, dw, dh);
      } else {
        // Fit ~83% of the crop's width so every bottle stays visible, in the upper
        // part of the screen (copy lives below); once the copy has faded (first
        // ~35% of the scrub) drift to centre and grow a touch. Edges blend away.
        const t = Math.min(1, pos / ((FRAME_COUNT - 1) * 0.35));
        const s = Math.min(cover, (cw * (1.2 + 0.12 * t)) / iw);
        const dw = iw * s;
        const dh = ih * s;
        const dx = (cw - dw) / 2;
        const dy = Math.max(0, ch * (0.4 + 0.1 * t) - dh / 2);
        ctx.fillStyle = rgba(backdrop, 1);
        ctx.fillRect(0, 0, cw, ch);
        paint(dx, dy, dw, dh);
        if (dh < ch) {
          const band = dh * 0.2;
          let g = ctx.createLinearGradient(0, dy, 0, dy + band);
          g.addColorStop(0, rgba(backdrop, 1));
          g.addColorStop(1, rgba(backdrop, 0));
          ctx.fillStyle = g;
          ctx.fillRect(0, dy, cw, band);
          g = ctx.createLinearGradient(0, dy + dh - band, 0, dy + dh);
          g.addColorStop(0, rgba(backdrop, 0));
          g.addColorStop(1, rgba(backdrop, 1));
          ctx.fillStyle = g;
          ctx.fillRect(0, dy + dh - band, cw, band + 1);
        }
      }
      drawnAt = pos;
      canvas.dataset.ready = "true";
    };

    const resize = () => {
      // Frames are 1280px wide; past 1.5x DPR only the fill cost grows.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (w && h && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
        ctx.imageSmoothingQuality = "high";
        draw(true);
      }
    };

    // ---- Fetch (compressed) ------------------------------------------------------
    // The frame we need now first, then coarse-to-fine passes so scrubbing works
    // early at lower density and fills in.
    const order: number[] = [];
    const seen = new Set<number>();
    const push = (i: number) => {
      if (i >= 0 && i < FRAME_COUNT && !seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    };
    if (reduced) {
      push(FRAME_COUNT - 1);
    } else {
      push(0);
      for (let i = 1; i <= AHEAD; i++) push(i);
      for (const step of saveData ? [16, 8, 4] : [16, 8, 4, 2, 1]) {
        for (let i = 0; i < FRAME_COUNT; i += step) push(i);
      }
    }

    const abort = new AbortController();
    let cursor = 0;
    const fetchNext = async (): Promise<void> => {
      while (!disposed && cursor < order.length) {
        const i = order[cursor++];
        try {
          const res = await fetch(frameSrc(set, i), { signal: abort.signal });
          if (!res.ok) continue;
          blobs[i] = await res.blob();
          if (Math.abs(i - state.frame) <= AHEAD || bitmaps.size === 0) pump();
        } catch {
          if (disposed) return;
        }
      }
    };
    for (let k = 0; k < 4; k++) void fetchNext();

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let tween: gsap.core.Tween | undefined;
    if (!reduced) {
      tween = gsap.to(state, {
        frame: FRAME_COUNT - 1,
        ease: "none",
        onUpdate: () => {
          draw();
          pump();
        },
        // The playhead glides toward the scroll position instead of snapping to it.
        scrollTrigger: { trigger: trackEl, start: "top top", end: "bottom bottom", scrub: 0.9 },
      });
    }

    return () => {
      disposed = true;
      abort.abort();
      ro.disconnect();
      tween?.scrollTrigger?.kill();
      tween?.kill();
      for (const bmp of bitmaps.values()) bmp.close();
      bitmaps.clear();
    };
  }, [track]);

  return (
    <>
      {/* First paint (and no-JS) fallback, under the canvas. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frameSrc("desktop", 0)}
        alt=""
        aria-hidden
        fetchPriority="high"
        className="absolute inset-0 -z-20 h-full w-full bg-sun object-cover motion-reduce:hidden"
      />
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Naturo wellness shots: Ginger, Pineapple, Hibiscus, Men's Vitality and Glow, with fresh ingredients"
        className="absolute inset-0 -z-10 h-full w-full opacity-0 transition-opacity duration-300 data-[ready=true]:opacity-100"
      />
    </>
  );
}
