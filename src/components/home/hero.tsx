"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { NaturoMark } from "@/components/brand/logo";
import { MotifImage } from "@/components/product/product-image";
import { ButtonLabel, ButtonLink } from "@/components/ui/button";
import { HangingBottle } from "@/components/visual/hanging-bottle";
import { productBySlug } from "@/data/products";
import { cn } from "@/lib/cn";
import { ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import type { Motif } from "@/lib/types";
import { HeroVine, VINE_ARCH_SWAY, VINE_GROWN_AT, VINE_HANGS, VINE_PIVOT, VINE_VIEWBOX } from "./hero-vine";

/** Split a line into masked characters for the headline reveal. */
function SplitLine({ text, className }: { text: string; className?: string }) {
  return (
    <span data-line-mask aria-hidden className={cn("block overflow-hidden pb-[0.06em] pr-[0.08em]", className)}>
      {text.split(" ").map((word, w, words) => (
        <span key={w} className="inline-block whitespace-nowrap">
          {[...word].map((ch, i) => (
            <span key={i} className="inline-block will-change-transform">
              {ch}
            </span>
          ))}
          {w < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

interface Floating {
  motif: Motif;
  className: string;
  /** Static rotation / blur, applied to the non-animated image layer. */
  img?: string;
}

// Coordinates are relative to the composition box (full hero on desktop,
// lower portrait stage on mobile).
const far: Floating[] = [
  {
    motif: "lemon-slice",
    className: "left-[6%] top-[6%] w-[11vw] lg:left-[47%] lg:top-[24%] lg:w-[4.5vw]",
    img: "blur-[1.5px]",
  },
  {
    motif: "leaf",
    className: "-left-[3%] top-[52%] w-[14vw] lg:left-[95%] lg:top-[14%] lg:w-[6vw]",
    img: "rotate-[30deg] blur-[1px]",
  },
  { motif: "droplet", className: "left-[74%] top-[3%] w-[5vw] lg:left-[72%] lg:top-[8%] lg:w-[2vw]" },
  {
    motif: "hibiscus-petal",
    className: "left-[91%] top-[36%] w-[8vw] lg:left-[54%] lg:top-[64%] lg:w-[3.2vw]",
    img: "blur-[1px]",
  },
];

const near: Floating[] = [
  { motif: "ginger", className: "left-[1%] top-[76%] w-[24vw] lg:left-[46%] lg:top-[79%] lg:w-[10vw]" },
  {
    motif: "lemon-slice",
    className: "max-lg:hidden left-[82%] top-[52%] w-[15vw] lg:left-[89%] lg:top-[56%] lg:w-[5.5vw]",
  },
  { motif: "ginger-slice", className: "left-[4%] top-[30%] w-[11vw] lg:left-[49%] lg:top-[42%] lg:w-[4vw]" },
  {
    motif: "pineapple-chunk",
    className: "max-lg:hidden left-[83%] top-[80%] w-[15vw] lg:left-[89%] lg:top-[82%] lg:w-[5.5vw]",
  },
  {
    motif: "leaf",
    className: "left-[86%] top-[14%] w-[12vw] lg:left-[92%] lg:top-[34%] lg:w-[5vw]",
    img: "-rotate-[40deg]",
  },
];

/** Intro beats (seconds): the vine grows, then the products drop in, then ingredients. */
const T = { bottles: VINE_GROWN_AT + 0.2, ingredients: VINE_GROWN_AT + 0.95 };

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const hangs = VINE_HANGS.map((h) => ({ ...h, product: productBySlug(h.slug)! }));

  useGSAP(
    (_, contextSafe) => {
      const el = root.current!;
      el.dataset.ready = "true";
      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          desktop: "(min-width: 1024px)",
          finePointer: "(pointer: fine)",
        },
        (ctx) => {
          const { motion, desktop, finePointer } = ctx.conditions as Record<string, boolean>;
          // Reduced motion: the markup already shows the fully grown tree.
          if (!motion) return;
          const q = gsap.utils.selector(el);
          const vineBox = q("[data-vine-box]")[0] as HTMLElement;

          // ── Ambient loops (after the intro). ctx.add() keeps them in this
          // matchMedia context so they are reverted on cleanup.
          const ambient = () => {
            const tweens: gsap.core.Tween[] = [];
            // Each stem layer pivots on the corner with its own amplitude and period,
            // so the cluster moves slightly out of sync. The phase is derived from the
            // period, so the bottles (which share the arch's values) stay in step with it.
            q("[data-stem-sway]").forEach((s) => {
              const amp = Number(s.getAttribute("data-amp"));
              const period = Number(s.getAttribute("data-period"));
              const t = gsap.fromTo(
                s,
                { rotation: -amp },
                { rotation: amp, duration: period, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: VINE_PIVOT },
              );
              t.progress((period * 0.37) % 1);
              tweens.push(t);
            });
            q("[data-sway]").forEach((s, i) => {
              const amp = [2.2, 1.6, 2.6][i] ?? 2;
              tweens.push(
                gsap.fromTo(
                  s,
                  { rotation: -amp },
                  { rotation: amp, duration: 2.6 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1 },
                ),
              );
            });
            q("[data-float]").forEach((f) => {
              tweens.push(
                gsap.to(f, {
                  y: gsap.utils.random(-14, 14),
                  rotation: gsap.utils.random(-8, 8),
                  duration: gsap.utils.random(3, 5.2),
                  ease: "sine.inOut",
                  yoyo: true,
                  repeat: -1,
                }),
              );
            });
            // Pause every loop while the hero is off-screen.
            ScrollTrigger.create({
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              onToggle: (self) => tweens.forEach((t) => (self.isActive ? t.resume() : t.pause())),
            });
          };

          const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

          // 1 · Sun glow.
          tl.fromTo(
            q("[data-sun]"),
            { scale: 0.6, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 2.4, ease: "expo.out" },
            0,
          );

          // 2 · Seven stems burst from the corner on staggered starts and grow at
          //     their own speeds; branches, sub-branches and tendrils spawn off them
          //     in waves. Each segment's start time and duration (data-at/-dur) comes
          //     from the growth model, with each stem's easing baked in.
          const at = (e: Element) => Number(e.getAttribute("data-at"));
          const shown = (e: Element) => e.getClientRects().length > 0;
          // ~1,000 vine pieces animate here, so every DOM read happens up front and
          // every write after it. Segment start states go in one batched set and the
          // per-segment tweens are plain .to()s (no re-reads). Building them as
          // individual fromTo()s interleaved a read with a write for every piece,
          // forcing ~2,500 full style recalculations during the intro.
          const segs = q("[data-grow-seg]").filter(shown);
          const leaves = [...el.querySelectorAll<SVGGElement>("[data-leaf]")].filter(shown);
          gsap.set(segs, { strokeDashoffset: 1 });
          gsap.set(leaves, { scale: 0, rotation: -40, transformOrigin: "0% 50%", smoothOrigin: false });
          segs.forEach((p) =>
            tl.to(p, { strokeDashoffset: 0, duration: Number(p.getAttribute("data-dur")), ease: "none" }, at(p)),
          );
          q("[data-shade]").forEach((p) =>
            tl.fromTo(p, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, at(p)),
          );

          // 3 · Leaves unfurl just behind the growing tips. Short tweens keep the number
          //     of leaves animating at any moment (the main cost) low.
          leaves.forEach((l) => tl.to(l, { scale: 1, rotation: 0, duration: 0.32, ease: "back.out(2)" }, at(l)));
          tl.fromTo(
            q("[data-knot]"),
            { scale: 0 },
            { scale: 1, duration: 0.3, transformOrigin: "50% 50%", smoothOrigin: false, stagger: 0.1 },
            T.bottles - 0.2,
          );
          // Growth done: background stems can now take their depth-of-field blur.
          tl.call(() => el.setAttribute("data-grown", "true"), undefined, T.bottles - 0.2);

          // 4 · The products drop in and hang from the branches on strings.
          q("[data-pendulum]").forEach((p, i) => {
            const amp = [12, 9, 14][i] ?? 10;
            const at = T.bottles + i * 0.18;
            tl.fromTo(
              p,
              { y: () => -vineBox.offsetHeight * 0.6, rotation: amp, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: 0.9, ease: "back.out(1.3)" },
              at,
            );
            const swing = gsap.timeline();
            [-0.6, 0.36, -0.18, 0.07, 0].forEach((k, j) =>
              swing.to(p, { rotation: amp * k, duration: 0.6 - j * 0.04, ease: "sine.inOut" }),
            );
            tl.add(swing, at + 0.45);
          });

          // 5 · Ingredients drift in.
          tl.fromTo(
            q("[data-far] [data-item]"),
            { autoAlpha: 0, scale: 0.7, y: 30 },
            { autoAlpha: 1, scale: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.08 },
            T.ingredients,
          )
            .fromTo(
              q("[data-near] [data-item]"),
              { autoAlpha: 0, scale: 0.5, y: 40, rotate: -20 },
              { autoAlpha: 1, scale: 1, y: 0, rotate: 0, duration: 1.3, ease: "back.out(1.5)", stagger: 0.09 },
              T.ingredients + 0.1,
            )
            .add(() => ctx.add(ambient));

          if (!desktop) return;

          // Desktop typography reveal (on phones the copy paints immediately).
          tl.fromTo(
            q("[data-line-mask] span span"),
            { yPercent: 115, rotate: 6 },
            { yPercent: 0, rotate: 0, duration: 1.15, stagger: 0.028, ease: "expo.out" },
            0.55,
          )
            .fromTo(
              q("[data-fade]"),
              { y: 26, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: 1, stagger: 0.08, ease: "expo.out" },
              0.95,
            )
            .fromTo(
              q("[data-cta]"),
              { y: 22, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08, ease: "expo.out" },
              1.1,
            );

          // Scroll parallax (depth layers).
          gsap
            .timeline({
              scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 },
              defaults: { ease: "none" },
            })
            .to(q("[data-scroll-far]"), { yPercent: 10 }, 0)
            .to(q("[data-scroll-near]"), { yPercent: -18 }, 0)
            .to(q("[data-scroll-vine]"), { yPercent: -5 }, 0)
            .to(q("[data-scroll-copy]"), { y: 80, autoAlpha: 0.25 }, 0);

          // Pointer depth (fine pointers only).
          if (finePointer) {
            const layers = [
              { sel: "[data-far]", depth: -10 },
              { sel: "[data-near]", depth: 24 },
              { sel: "[data-sun]", depth: -6 },
            ].map(({ sel, depth }) => ({
              x: gsap.quickTo(q(sel), "x", { duration: 1.1, ease: "power3.out" }),
              y: gsap.quickTo(q(sel), "y", { duration: 1.1, ease: "power3.out" }),
              depth,
            }));
            const tilts = q("[data-tilt]").map((t) =>
              gsap.quickTo(t, "rotation", { duration: 1.4, ease: "power3.out" }),
            );
            const onMove = contextSafe!((e: PointerEvent) => {
              const nx = (e.clientX / window.innerWidth) * 2 - 1;
              const ny = (e.clientY / window.innerHeight) * 2 - 1;
              layers.forEach((l) => {
                l.x(nx * l.depth);
                l.y(ny * l.depth * 0.6);
              });
              tilts.forEach((t, i) => t(-nx * (2 + i * 0.5)));
            });
            el.addEventListener("pointermove", onMove);
            return () => el.removeEventListener("pointermove", onMove);
          }
        },
      );
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      data-hero
      aria-labelledby="hero-title"
      className="grain relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#F7EFD6] lg:block lg:h-[100svh] lg:min-h-[680px]"
    >
      {/* Ambient colour field */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(120%_80%_at_70%_30%,#FBF2C9_0%,#F7EFD6_45%,#EFE3C0_100%)]"
      />

      {/* ── Composition: sun glow, vine, hanging products, ingredients ── */}
      <div className="relative order-2 h-[max(320px,min(56svh,calc(100svh-380px)))] w-full sm:h-[max(340px,min(48svh,calc(100svh-520px)))] lg:absolute lg:inset-0 lg:h-auto lg:min-h-0">
        <div aria-hidden className="absolute inset-0 -z-10" data-scroll-far>
          <div data-far className="absolute inset-0">
            {far.map((f, i) => (
              <div key={i} data-item className={cn("hero-pre absolute", f.className)}>
                <div data-float>
                  <MotifImage motif={f.motif} className={f.img} sizes="(min-width: 1024px) 6vw, 14vw" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div data-scroll-vine className="absolute inset-0">
          {/* The vine box is anchored bottom-right at a fixed 4:3 ratio. On phones it is
              wider than the screen, so the left-sweeping tips run off the edge. */}
          <div
            data-vine-box
            className="absolute bottom-0 right-0 h-full [container-type:size]"
            style={{ aspectRatio: `${VINE_VIEWBOX.w} / ${VINE_VIEWBOX.h}` }}
          >
            <div
              aria-hidden
              className="absolute left-[62%] top-[44%] aspect-square w-[60%] -translate-x-1/2 -translate-y-1/2"
            >
              <div
                data-sun
                className="hero-pre absolute inset-0 rounded-full bg-[radial-gradient(circle,#FCEFA2_0%,#F5D84E_42%,rgba(245,216,78,0.45)_60%,rgba(245,216,78,0)_71%)]"
              />
            </div>
            {/* Stem layers, back to front (each one sways on its own). */}
            <HeroVine className="hero-pre" />
            {/* Desktop: a static cream veil softens the stems behind the headline & copy. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-[40%] hidden w-[88%] bg-[linear-gradient(to_right,rgba(247,239,214,0.74)_0%,rgba(247,239,214,0.68)_77%,rgba(247,239,214,0)_100%)] lg:block"
            />
            {/* The bottles hang from the arch stem, so they share its sway exactly. */}
            <div
              data-stem-sway
              data-amp={VINE_ARCH_SWAY[0]}
              data-period={VINE_ARCH_SWAY[1]}
              className="absolute inset-0"
              style={{ willChange: "transform" }}
            >
              {hangs.map((h, i) => (
                <HangingBottle
                  key={h.slug}
                  product={h.product}
                  priority={i === 1}
                  lineFromAnchor
                  lineClassName="bg-[#2F6B36]/60"
                  className="hero-pre"
                  style={{
                    left: `${(h.x / VINE_VIEWBOX.w) * 100}%`,
                    top: `${(h.y / VINE_VIEWBOX.h) * 100}%`,
                    ["--len" as string]: `${h.len}cqh`,
                    ["--h" as string]: `${h.h}cqh`,
                  }}
                  sizes="(min-width: 1024px) 14vw, 30vw"
                />
              ))}
            </div>
          </div>
        </div>

        <div aria-hidden className="pointer-events-none absolute inset-0" data-scroll-near>
          <div data-near className="absolute inset-0">
            {near.map((f, i) => (
              <div key={i} data-item className={cn("hero-pre absolute", f.className)}>
                <div data-float className="[filter:drop-shadow(0_16px_16px_rgba(23,49,38,0.2))]">
                  <MotifImage motif={f.motif} className={f.img} sizes="(min-width: 1024px) 10vw, 24vw" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Copy ── */}
      <div className="relative z-10 order-1 lg:absolute lg:inset-0 lg:flex lg:items-end lg:pointer-events-none">
        <div data-scroll-copy className="container-x pb-2 pt-20 sm:pt-28 lg:pb-[13vh] lg:pt-0">
          <div className="max-w-[40rem] lg:pointer-events-auto lg:max-w-[42vw]">
            <p data-fade className="hero-pre-lg eyebrow flex items-center gap-3 text-forest/80">
              <NaturoMark className="h-5 w-5 text-botanical" />
              Rooted in nature. Made for everyday.
            </p>
            <h1 id="hero-title" className="mt-4 text-forest lg:mt-5">
              <span className="sr-only">Feel good. Naturally.</span>
              <SplitLine
                text="FEEL GOOD."
                className="hero-pre-lg display text-[clamp(3.6rem,15.5vw,10.5rem)] lg:text-[clamp(4rem,8.2vw,10rem)]"
              />
              <SplitLine
                text="NATURALLY."
                className="hero-pre-lg serif-accent -mt-[0.08em] text-[clamp(3.7rem,15.8vw,10.8rem)] leading-[0.9] text-botanical lg:text-[clamp(4.1rem,8.4vw,10.3rem)]"
              />
            </h1>
            <p
              data-fade
              className="hero-pre-lg mt-4 max-w-[28rem] text-[0.95rem] leading-relaxed text-ink/80 sm:text-lg lg:mt-6"
            >
              Everyday wellness, rooted in nature. Discover natural shots, traditional favourites and herbal blends,
              proudly made in Zimbabwe.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-1 sm:gap-3 lg:mt-8">
              <div data-cta className="hero-pre-lg">
                <ButtonLink href="/shop" size="lg" icon={<ArrowRight className="h-4 w-4" aria-hidden />}>
                  Shop Naturo
                </ButtonLink>
              </div>
              <div data-cta className="hero-pre-lg">
                <Link
                  href="/our-story"
                  className="group/btn inline-flex h-14 items-center gap-2 rounded-full px-3 text-[0.72rem] sm:px-5 sm:text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-forest transition-colors hover:bg-forest/5"
                >
                  <ButtonLabel>Discover our story</ButtonLabel>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom rail */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden lg:block">
        <div className="container-x flex items-center pb-6 text-forest/70">
          <span data-fade className="hero-pre-lg eyebrow flex items-center gap-3">
            <ArrowDown className="h-3.5 w-3.5 animate-bounce motion-reduce:animate-none" /> Scroll to explore
          </span>
        </div>
      </div>
    </section>
  );
}
