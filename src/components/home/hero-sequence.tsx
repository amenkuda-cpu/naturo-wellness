"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "@/lib/gsap";

/** Frames extracted from the original product film (public/frames/hero/{desktop,mobile}/f001..f103.webp; first 0.7s and the closing fade-to-black trimmed). */
const FRAME_COUNT = 103;
const frameSrc = (set: "desktop" | "mobile", i: number) => `/frames/hero/${set}/f${String(i + 1).padStart(3, "0")}.webp`;

type RGB = [number, number, number];
type Frame = { img: HTMLImageElement; top: RGB; bottom: RGB };

/**
 * The hero product film as a scroll-scrubbed image sequence drawn on a canvas.
 * Every frame is a still pulled from the original high-bitrate film, so it stays
 * sharp (no video re-compression). The visitor's scroll through `track` drives
 * the frame: bottles drop in, burst open, and settle into the Naturo line-up.
 *
 * - Desktop/landscape: full 1280x720 frames, cover-fit.
 * - Phones/portrait: a 960x720 crop that keeps all five bottles in view, drawn
 *   near the top and blended into the matching yellow backdrop.
 * - Frames stream in coarse-to-fine (every 8th first), so scrubbing works early.
 * - Reduced motion: only the final line-up frame is loaded and shown.
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

    const frames: (Frame | undefined)[] = new Array(FRAME_COUNT);
    const state = { frame: reduced ? FRAME_COUNT - 1 : 0 };
    let drawn = -1;
    let disposed = false;

    // Backdrop colour at the top/bottom edge of each frame: the per-channel median
    // of 64 samples across the row, so a stray flower or splash doesn't skew it.
    const SAMPLES = 64;
    const sampler = document.createElement("canvas");
    sampler.width = SAMPLES;
    sampler.height = 1;
    const sctx = sampler.getContext("2d", { willReadFrequently: true });
    const sample = (img: HTMLImageElement, y: number): RGB => {
      if (!sctx) return [246, 215, 60];
      sctx.imageSmoothingEnabled = false;
      sctx.drawImage(img, 0, y, img.naturalWidth, 1, 0, 0, SAMPLES, 1);
      const d = sctx.getImageData(0, 0, SAMPLES, 1).data;
      const median = (c: number) => {
        const v: number[] = [];
        for (let k = 0; k < SAMPLES; k++) v.push(d[k * 4 + c]);
        v.sort((a, b) => a - b);
        return v[SAMPLES >> 1];
      };
      return [median(0), median(1), median(2)];
    };

    const nearestLoaded = (i: number) => {
      for (let d = 0; d < FRAME_COUNT; d++) {
        if (frames[i - d]) return i - d;
        if (frames[i + d]) return i + d;
      }
      return -1;
    };

    const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    let drawnAt = -1;
    const draw = (force = false) => {
      const pos = state.frame;
      // Skip redundant paints (sub-1% of a frame apart).
      if (!force && Math.abs(pos - drawnAt) < 0.01) return;
      const base = Math.floor(pos);
      const frac = pos - base;
      // Cross-fade between the two neighbouring frames when both are in, so
      // motion glides instead of stepping; otherwise fall back to the nearest.
      let idx = base;
      let next = -1;
      if (frames[base] && frac > 0.02 && frames[base + 1]) next = base + 1;
      else if (!frames[base]) idx = nearestLoaded(Math.round(pos));
      if (idx < 0) return;
      const { img, top, bottom } = frames[idx]!;
      const paint = (x: number, y: number, w: number, h: number) => {
        ctx.globalAlpha = 1;
        ctx.drawImage(img, x, y, w, h);
        if (next >= 0) {
          ctx.globalAlpha = frac;
          ctx.drawImage(frames[next]!.img, x, y, w, h);
          ctx.globalAlpha = 1;
        }
      };
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const cover = Math.max(cw / iw, ch / ih);

      if (!portrait) {
        const dw = iw * cover;
        const dh = ih * cover;
        paint((cw - dw) / 2, (ch - dh) / 2, dw, dh);
      } else {
        // Fit ~83% of the crop's width so every bottle stays visible, sit it in the
        // upper part of the screen (copy lives below), and blend the edges away.
        // Once the copy has faded (first ~35% of the scrub), drift to centre and grow a touch.
        const t = Math.min(1, state.frame / ((FRAME_COUNT - 1) * 0.35));
        const s = Math.min(cover, (cw * (1.2 + 0.12 * t)) / iw);
        const dw = iw * s;
        const dh = ih * s;
        const dx = (cw - dw) / 2;
        const dy = Math.max(0, ch * (0.4 + 0.1 * t) - dh / 2);
        const mid = dy + dh / 2;
        ctx.fillStyle = rgba(top, 1);
        ctx.fillRect(0, 0, cw, mid);
        ctx.fillStyle = rgba(bottom, 1);
        ctx.fillRect(0, mid, cw, ch - mid);
        paint(dx, dy, dw, dh);
        if (dh < ch) {
          const band = dh * 0.2;
          let g = ctx.createLinearGradient(0, dy, 0, dy + band);
          g.addColorStop(0, rgba(top, 1));
          g.addColorStop(1, rgba(top, 0));
          ctx.fillStyle = g;
          ctx.fillRect(0, dy, cw, band);
          g = ctx.createLinearGradient(0, dy + dh - band, 0, dy + dh);
          g.addColorStop(0, rgba(bottom, 0));
          g.addColorStop(1, rgba(bottom, 1));
          ctx.fillStyle = g;
          ctx.fillRect(0, dy + dh - band, cw, band + 1);
        }
      }
      drawn = idx;
      drawnAt = pos;
      canvas.dataset.ready = "true";
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (w && h && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
        ctx.imageSmoothingQuality = "high";
        draw(true);
      }
    };

    // Load order: the frame we need now, then coarse-to-fine passes.
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
      push(FRAME_COUNT - 1);
      for (const step of saveData ? [8, 4, 2] : [8, 4, 2, 1]) {
        for (let i = 0; i < FRAME_COUNT; i += step) push(i);
      }
    }

    let cursor = 0;
    const loadNext = () => {
      if (disposed || cursor >= order.length) return;
      const i = order[cursor++];
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (disposed) return;
        const done = () => {
          if (disposed) return;
          frames[i] = { img, top: sample(img, 1), bottom: sample(img, 1) };
          // Redraw if this frame is closer to where the scroll is than what's on screen.
          const target = Math.round(state.frame);
          if (drawn < 0 || Math.abs(i - target) < Math.abs(drawn - target)) draw(true);
          loadNext();
        };
        if (img.decode) void img.decode().then(done, done);
        else done();
      };
      img.onerror = loadNext;
      img.src = frameSrc(set, i);
    };
    // A few parallel lanes; the first frame goes first on its own.
    loadNext();
    for (let k = 0; k < 4; k++) setTimeout(loadNext, 60);

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let tween: gsap.core.Tween | undefined;
    if (!reduced) {
      tween = gsap.to(state, {
        frame: FRAME_COUNT - 1,
        ease: "none",
        onUpdate: () => draw(),
        // A soft catch-up (1.2s) on top of Lenis so the film eases after the scroll.
        scrollTrigger: { trigger: trackEl, start: "top top", end: "bottom bottom", scrub: 1.2 },
      });
    }

    return () => {
      disposed = true;
      ro.disconnect();
      tween?.scrollTrigger?.kill();
      tween?.kill();
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
