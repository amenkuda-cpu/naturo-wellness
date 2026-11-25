"use client";

import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PriceTag } from "@/components/product/price";
import { AddToCartButton } from "@/components/product/add-to-cart";
import { cn } from "@/lib/cn";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Motif, Product } from "@/lib/types";
import { siteConfig } from "@/config/site";
import "./hero.css";

const WHATSAPP_URL = `https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hi Naturo, I'd like to place an order.")}`;

/**
 * Product-carousel hero: a full-bleed colour per drink, a giant condensed
 * three-word headline, the bottle floating in front of it with its neighbours
 * blurred at the edges, real ingredients drifting at different depths and a
 * slowly turning brand ring. Autoplays (pausable), swipes, keys, tilts.
 */

type Group = "Shots" | "Maheu" | "Teas" | "Cans";

interface SlideDef {
  id: string;
  group: Group;
  words: [string, string, string];
  /** Background, arch behind the bottle, headline ink. */
  bg: string;
  arch: string;
  ink: string;
}

// Words stay at seven characters or fewer so each line fits a phone screen.
const SLIDES: SlideDef[] = [
  { id: "ginger-shot", group: "Shots", words: ["Warm.", "Zesty.", "Awake."], bg: "#F2AE3B", arch: "#F7C96C", ink: "#3B2205" },
  { id: "hibiscus-shot", group: "Shots", words: ["Tangy.", "Ruby.", "Floral."], bg: "#EC8194", arch: "#F3A8B5", ink: "#470A1B" },
  { id: "glow-shot", group: "Shots", words: ["Fresh.", "Green.", "Glow."], bg: "#BCD35E", arch: "#D3E48C", ink: "#1B3811" },
  { id: "pineapple-shot", group: "Shots", words: ["Sweet.", "Sunny.", "Golden."], bg: "#FFCF40", arch: "#FFE07E", ink: "#523400" },
  { id: "mens-vitality-shot", group: "Shots", words: ["Deep.", "Earthy.", "Bold."], bg: "#A6C398", arch: "#C1D7B6", ink: "#132E1E" },
  { id: "maheu-buttermilk", group: "Maheu", words: ["Smooth.", "Creamy.", "Home."], bg: "#94C4EB", arch: "#BBDBF4", ink: "#0E2C47" },
  { id: "maheu-traditional", group: "Maheu", words: ["Thick.", "Creamy.", "Local."], bg: "#F1D27A", arch: "#F7E3A6", ink: "#4A3610" },
  { id: "ginger-lemon-tea", group: "Teas", words: ["Warm.", "Bright.", "Calm."], bg: "#F5D04E", arch: "#F9E08C", ink: "#4A3508" },
  { id: "hibiscus-tea", group: "Teas", words: ["Ruby.", "Tangy.", "Bloom."], bg: "#E46A7E", arch: "#EE97A6", ink: "#43081A" },
  { id: "sunset-glow-tea", group: "Teas", words: ["Golden.", "Earthy.", "Glow."], bg: "#F39A45", arch: "#F7B977", ink: "#4A2306" },
  { id: "green-focus-tea", group: "Teas", words: ["Clean.", "Green.", "Focus."], bg: "#9FCB72", arch: "#BCDC98", ink: "#173A12" },
  { id: "indongo-bloom-tea", group: "Teas", words: ["Blue.", "Floral.", "Magic."], bg: "#8E97E6", arch: "#B2B8F1", ink: "#141A55" },
  { id: "muvheyi-tea", group: "Teas", words: ["Leafy.", "Calm.", "Roots."], bg: "#8FBF83", arch: "#AED3A4", ink: "#11331A" },
  { id: "carrot-tea", group: "Teas", words: ["Soft.", "Sweet.", "Earthy."], bg: "#F2A766", arch: "#F6C291", ink: "#4D2408" },
  { id: "cranberry-can", group: "Cans", words: ["Tart.", "Bright.", "Iced."], bg: "#E5557E", arch: "#EE88A5", ink: "#3F0A1F" },
  { id: "orange-can", group: "Cans", words: ["Juicy.", "Zesty.", "Shared."], bg: "#FF9B3F", arch: "#FFBA78", ink: "#3D1C02" },
  { id: "apple-can", group: "Cans", words: ["Crisp.", "Fresh.", "Iced."], bg: "#8ED25A", arch: "#B0E08A", ink: "#163A0E" },
];
const GROUPS: Group[] = ["Shots", "Maheu", "Teas", "Cans"];

const AUTOPLAY_MS = 6500;
const RING_TEXT = "Naturo Wellness · Rooted in nature · Made for everyday · Proudly Zimbabwean · ";

/** Circular distance from the active slide, e.g. -2..3 for six slides. */
function slotOf(i: number, active: number, n: number) {
  let d = (((i - active) % n) + n) % n;
  if (d > n / 2) d -= n;
  return d;
}

const ingredientSrc = (m: Motif) => `/images/ingredients/real/${m}.webp`;

export function Hero({ catalog, samplePricing = false }: { catalog: Product[]; samplePricing?: boolean }) {
  const slides = useMemo(
    () =>
      SLIDES.flatMap((def) => {
        const product = catalog.find((p) => p.id === def.id);
        return product ? [{ def, product }] : [];
      }),
    [catalog],
  );
  const n = slides.length;

  const root = useRef<HTMLElement>(null);
  // `from` drives which bottles skip their transition on wrap-around; `leaving` is the outgoing headline.
  const [{ active, from, leaving }, setPos] = useState<{ active: number; from: number; leaving: number | null }>({
    active: 0,
    from: 0,
    leaving: null,
  });
  const [userPaused, setUserPaused] = useState(false);
  const [autoBlocked, setAutoBlocked] = useState(true);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [announce, setAnnounce] = useState(false);

  const go = useCallback(
    (next: number, byUser = false) => {
      if (n < 2) return;
      const target = ((next % n) + n) % n;
      setPos((p) => (target === p.active ? p : { active: target, from: p.active, leaving: p.active }));
      if (byUser) setAnnounce(true);
    },
    [n],
  );

  // The outgoing headline only needs to live for its exit animation.
  useEffect(() => {
    if (leaving === null) return;
    const t = window.setTimeout(() => setPos((p) => ({ ...p, leaving: null })), 700);
    return () => window.clearTimeout(t);
  }, [leaving, active]);

  // Autoplay only while the hero is on screen, the tab is visible and motion is welcome.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = true;
    const sync = () => setAutoBlocked(reduce.matches || !onScreen || document.visibilityState !== "visible");
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    reduce.addEventListener("change", sync);
    sync();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduce.removeEventListener("change", sync);
    };
  }, []);
  const playing = !userPaused && !autoBlocked && !hoverPaused;

  // Pointer tilt (fine pointers only): two CSS variables, written once per frame.
  useEffect(() => {
    const el = root.current;
    if (!el || !window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    let raf = 0;
    let mx = 0;
    let my = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width) * 2 - 1;
      my = ((e.clientY - r.top) / r.height) * 2 - 1;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", mx.toFixed(3));
        el.style.setProperty("--my", my.toFixed(3));
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--mx", "0");
      el.style.setProperty("--my", "0");
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Swipe / drag between drinks.
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) go(active + (dx < 0 ? 1 : -1), true);
  };

  // Scrolling away: the headline lifts and fades, the bottles sink a little slower (depth).
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 },
        });
        tl.to("[data-nh-head]", { yPercent: -18, autoAlpha: 0.15 }, 0)
          .to("[data-nh-stage]", { yPercent: 9 }, 0)
          .to("[data-nh-ui]", { autoAlpha: 0, y: -30 }, 0);
      });
    },
    { scope: root },
  );

  if (n === 0) return null;
  const current = slides[active];
  const { def, product } = current;
  const index = String(active + 1).padStart(2, "0");
  const total = String(n).padStart(2, "0");

  return (
    <section
      ref={root}
      data-hero
      data-ready="true"
      aria-roledescription="carousel"
      aria-labelledby="hero-title"
      className="nh-hero relative isolate h-[100svh] min-h-[38rem] w-full touch-pan-y select-none overflow-hidden lg:min-h-[44rem]"
      style={{ "--nh-bg": def.bg, "--nh-arch": def.arch, "--nh-ink": def.ink } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(active + 1, true);
        if (e.key === "ArrowLeft") go(active - 1, true);
      }}
    >
      {/* Visible H1 and the two main actions, above the fold on every screen size. */}
      <div className="nh-intro container-x absolute inset-x-0 z-[70] flex flex-col items-center text-center" style={{ color: "var(--nh-ink)" }}>
        <h1 id="hero-title" className="max-w-[34rem] font-sans text-[0.72rem] font-bold uppercase leading-snug tracking-[0.16em] sm:text-sm">
          Natural Wellness Shots, Made Fresh in Zimbabwe
          <span className="sr-only"> by Naturo Wellness</span>
        </h1>
        <div className="mt-2.5 flex items-center gap-2">
          <Link
            href="/shop"
            className="inline-flex h-10 items-center rounded-full bg-[var(--nh-ink)] px-5 font-sans text-xs font-bold uppercase tracking-[0.14em] text-[var(--nh-bg)] transition hover:brightness-125 sm:h-11 sm:px-6"
          >
            Shop now
          </Link>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener"
            className="inline-flex h-10 items-center rounded-full border border-current/40 px-4 font-sans text-xs font-bold uppercase tracking-[0.14em] transition hover:bg-black/10 sm:h-11 sm:px-5"
          >
            Order on WhatsApp
          </a>
        </div>
      </div>

      {/* Light falls from above; a fine grain keeps the flat colour from looking digital. */}
      <div aria-hidden className="nh-light pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[60] bg-[url('/images/brand/grain.png')] opacity-[0.16] mix-blend-overlay" />

      {/* Explicit layer order (the scroll effect transforms these, which would otherwise flatten them). */}
      <div data-nh-stage aria-hidden className="absolute inset-0 z-[1]">
        <div className="nh-arch absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full" />
        <svg className="nh-ring absolute left-1/2" viewBox="0 0 500 500">
          <defs>
            <path id="nh-ring-path" d="M250,250 m-218,0 a218,218 0 1,1 436,0 a218,218 0 1,1 -436,0" />
          </defs>
          <text className="nh-ring-text">
            <textPath href="#nh-ring-path" textLength="1365" lengthAdjust="spacing">
              {RING_TEXT}
            </textPath>
          </text>
        </svg>
      </div>

      {/* Headline: the incoming words rise letter by letter as the old ones lift away. */}
      <div data-nh-head aria-hidden className="nh-head-layer pointer-events-none absolute inset-x-0 z-[8]">
        {leaving !== null && leaving !== active && <Headline key={`out-${leaving}-${active}`} words={slides[leaving].def.words} leave />}
        <Headline key={`in-${active}`} words={def.words} />
      </div>

      <div data-nh-stage aria-hidden className="absolute inset-0 z-[20]">
        <div className="nh-shadow absolute left-1/2" />
        {slides.map((s, i) => {
          const slot = slotOf(i, active, n);
          const was = slotOf(i, from, n);
          const jump = Math.abs(slot - was) > 2;
          const near = Math.abs(slot) <= 3;
          return (
            <div
              key={s.product.id}
              className="nh-item"
              data-slot={Math.abs(slot) <= 2 ? slot : slot > 0 ? "far" : "-far"}
              data-jump={jump || undefined}
            >
              <div className="nh-tilt h-full w-full">
                <div className="nh-bottle relative h-full w-full" style={{ "--d": `${-i * 0.9}s` } as React.CSSProperties}>
                  {s.product.images[0] && near && (
                    <Image
                      src={s.product.images[0].src}
                      alt=""
                      fill
                      draggable={false}
                      preload={i === 0}
                      fetchPriority={i === 0 ? "high" : "auto"}
                      sizes={slot === 0 ? "(min-width: 1024px) 34vw, 70vw" : "(min-width: 1024px) 22vw, 40vw"}
                      className="object-contain"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Ingredients for the active drink (neighbours stay mounted so they're already loaded). */}
        {slides.map((s, i) => {
          const slot = slotOf(i, active, n);
          if (Math.abs(slot) > 1) return null;
          return s.product.motifs.slice(0, 4).map((m, k) => (
            <div key={`${s.product.id}-${m}`} className="nh-ing" data-k={k} data-on={slot === 0 || undefined}>
              <div className="nh-ing-par">
                <div className="nh-ing-float relative" style={{ "--d": `${-k * 1.3}s` } as React.CSSProperties}>
                  <Image src={ingredientSrc(m)} alt="" width={600} height={600} sizes="22vw" loading="lazy" draggable={false} />
                </div>
              </div>
            </div>
          ));
        })}
      </div>

      {/* Controls and product details. Phones: name + buttons, then categories, then progress. */}
      <div
        data-nh-ui
        className="nh-ui container-x absolute inset-x-0 z-[70]"
        style={{ color: "var(--nh-ink)" }}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHoverPaused(true)}
        onPointerLeave={() => setHoverPaused(false)}
        onFocus={() => setHoverPaused(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setHoverPaused(false)}
      >
        <div key={product.id} className="nh-meta [grid-area:meta]" aria-live={announce ? "polite" : "off"}>
          <Link
            href={`/shop/${product.slug}`}
            className="display block text-[1.35rem] leading-none tracking-[-0.02em] underline-offset-4 hover:underline lg:text-[1.6rem]"
          >
            {product.name}
          </Link>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 text-sm">
            <PriceTag product={product} sample={samplePricing} />
            <span className="serif-accent hidden text-base opacity-80 sm:inline">{product.mood}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 [grid-area:chips]">
          <div role="group" aria-label="Jump to a range" className="flex min-w-0 flex-1 items-center gap-1">
            {GROUPS.map((g) => {
              const first = slides.findIndex((s) => s.def.group === g);
              if (first < 0) return null;
              const on = def.group === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => go(first, true)}
                  aria-pressed={on}
                  className={cn(
                    "h-7 rounded-full px-2.5 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition sm:px-3",
                    on ? "bg-[var(--nh-ink)] text-[var(--nh-bg)]" : "hover:bg-black/10",
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>
          <span className="whitespace-nowrap font-sans text-[0.68rem] font-semibold tabular-nums tracking-[0.14em]">
            {index} <span className="opacity-55">/ {total}</span>
          </span>
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-label={userPaused ? "Play the drink slideshow" : "Pause the drink slideshow"}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-current/30 transition hover:bg-black/10"
          >
            {userPaused ? <Play className="h-3 w-3" aria-hidden /> : <Pause className="h-3 w-3" aria-hidden />}
          </button>
        </div>

        <div className="flex gap-1 [grid-area:bars]" role="group" aria-label="Choose a drink">
          {slides.map((s, i) => (
            <button
              key={s.product.id}
              type="button"
              onClick={() => go(i, true)}
              aria-label={s.product.name}
              aria-current={i === active ? "true" : undefined}
              className="group relative h-6 min-w-0 flex-1"
            >
              <span
                className={cn(
                  "absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-current/20 transition group-hover:bg-current/35",
                  // A slightly wider gap between ranges.
                  i > 0 && slides[i - 1].def.group !== s.def.group && "ml-1.5",
                )}
              >
                <span
                  key={i === active ? `p-${active}` : undefined}
                  className="nh-progress absolute inset-0 origin-left rounded-full bg-current"
                  data-state={i < active ? "done" : i === active ? "run" : "todo"}
                  style={{ animationDuration: `${AUTOPLAY_MS}ms`, animationPlayState: playing ? "running" : "paused" }}
                  onAnimationEnd={() => i === active && go(active + 1)}
                />
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 [grid-area:ctrl] sm:gap-3">
          <button
            type="button"
            onClick={() => go(active - 1, true)}
            aria-label="Previous drink"
            className="grid h-11 w-11 place-items-center rounded-full border border-current/35 transition hover:bg-[var(--nh-ink)] hover:text-[var(--nh-bg)] sm:h-12 sm:w-12"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(active + 1, true)}
            aria-label="Next drink"
            className="grid h-11 w-11 place-items-center rounded-full border border-current/35 transition hover:bg-[var(--nh-ink)] hover:text-[var(--nh-bg)] sm:h-12 sm:w-12"
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
          <span className="sm:hidden">
            <AddToCartButton product={product} compact />
          </span>
          <span className="hidden sm:block">
            <AddToCartButton product={product} size="lg" />
          </span>
        </div>
      </div>

      {/* A slow liquid edge into the next section. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[-1px] z-[65] h-7 overflow-hidden sm:h-9">
        <svg className="nh-wave absolute bottom-0 left-0 h-full w-[200%]" viewBox="0 0 2400 40" preserveAspectRatio="none">
          <path
            fill="var(--color-warm)"
            d="M0 22 C100 6 200 6 300 22 S500 38 600 22 S800 6 900 22 S1100 38 1200 22 S1400 6 1500 22 S1700 38 1800 22 S2000 6 2100 22 S2300 38 2400 22 V40 H0 Z"
          />
        </svg>
      </div>
    </section>
  );
}

function Headline({ words, leave = false }: { words: readonly string[]; leave?: boolean }) {
  let i = 0;
  return (
    <div className={cn("nh-head", leave && "nh-leave absolute inset-x-0 top-0")}>
      {words.map((w, l) => (
        <span key={l} className="nh-line block overflow-hidden">
          {[...w].map((ch, c) => (
            <span key={c} className="nh-ch" style={{ "--i": i++, "--l": l } as React.CSSProperties}>
              {ch}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
