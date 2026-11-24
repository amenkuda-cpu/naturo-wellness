"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { ButtonLabel, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { gsap, useGSAP } from "@/lib/gsap";
import { HeroSequence } from "./hero-sequence";

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

/** Previous hero (scroll-scrubbed film). Kept for easy rollback; not used. */
export function HeroFilm() {
  const track = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      el.dataset.ready = "true";
      const mm = gsap.matchMedia();

      // While the film scrubs, the copy and scroll cue step aside so the
      // product line-up lands clean.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({
            scrollTrigger: { trigger: track.current, start: "top top", end: () => `+=${window.innerHeight * 0.8}`, scrub: 0.8 },
          })
          .to(el.querySelector("[data-scroll-cue]"), { autoAlpha: 0, duration: 0.3, ease: "none" }, 0)
          .to(copy.current, { autoAlpha: 0, y: -48, duration: 1, ease: "power1.in" }, 0);
      });

      // Desktop only, and only when motion is welcome: a short typography reveal.
      // On phones (and for reduced motion) everything paints immediately.
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
        const q = gsap.utils.selector(el);
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .fromTo(q("[data-line-mask] span span"), { yPercent: 115, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.026 }, 0.15)
          .fromTo(q("[data-fade]"), { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.08 }, 0.5)
          .fromTo(q("[data-cta]"), { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08 }, 0.65);
      });
    },
    { scope: root },
  );

  return (
    // The track gives the pinned hero room to scrub through the film.
    <div ref={track} className="relative h-[100svh] min-h-[34rem] motion-safe:h-[340svh] lg:motion-safe:h-[380svh]">
    <section
      ref={root}
      data-hero
      aria-labelledby="hero-title"
      className="sticky top-0 isolate flex h-[100svh] min-h-[34rem] w-full items-end overflow-hidden bg-sun"
    >
      {/* Full-bleed product film, scrubbed by scroll. No overlay: it stays sharp and bright. */}
      <HeroSequence track={track} />

      <div
        aria-hidden
        data-scroll-cue
        className="pointer-events-none absolute bottom-5 right-5 hidden flex-col items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-forest/80 motion-reduce:hidden sm:flex lg:bottom-8 lg:right-8"
      >
        Scroll
        <span className="block h-10 w-px origin-top animate-pulse bg-forest/50" />
      </div>

      <div className="container-x relative w-full pb-16 pt-24 sm:pb-20 lg:pb-[clamp(3rem,8vh,6rem)]">
        <div ref={copy} className="relative max-w-[34rem] lg:max-w-[38rem]">
          {/* A soft, light glow behind the copy only, for contrast. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-16 -inset-y-14 -z-10 bg-[radial-gradient(closest-side,rgba(255,253,245,0.86),rgba(255,253,245,0.6)_55%,rgba(255,253,245,0)_100%)] sm:-inset-x-24"
          />
          <p data-fade className="hero-pre-lg eyebrow text-forest">
            Rooted in nature. Made for everyday.
          </p>
          <h1 id="hero-title" className="mt-3 text-forest [text-shadow:0_1px_18px_rgba(255,253,245,0.55)] lg:mt-4">
            <span className="sr-only">Feel good. Naturally.</span>
            <SplitLine text="FEEL GOOD." className="hero-pre-lg display text-[clamp(3.2rem,14vw,6rem)] lg:text-[clamp(3.6rem,5.6vw,7rem)]" />
            <SplitLine
              text="NATURALLY."
              className="hero-pre-lg serif-accent -mt-[0.08em] text-[clamp(3.3rem,14.3vw,6.2rem)] leading-[0.9] text-botanical lg:text-[clamp(3.7rem,5.8vw,7.2rem)]"
            />
          </h1>
          <p data-fade className="hero-pre-lg mt-3 max-w-[28rem] text-[0.95rem] font-medium leading-relaxed text-ink sm:text-lg lg:mt-5">
            Everyday wellness, rooted in nature. Discover natural shots, traditional favourites and herbal blends, proudly
            made in Zimbabwe.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-1 sm:gap-3 lg:mt-7">
            <div data-cta className="hero-pre-lg">
              <ButtonLink href="/shop" size="lg" icon={<ArrowRight className="h-4 w-4" aria-hidden />}>
                Shop Naturo
              </ButtonLink>
            </div>
            <div data-cta className="hero-pre-lg">
              <Link
                href="/our-story"
                className="group/btn inline-flex h-14 items-center gap-2 rounded-full px-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-forest transition-colors hover:bg-warm/40 sm:px-5 sm:text-[0.76rem]"
              >
                <ButtonLabel>Discover our story</ButtonLabel>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
    </div>
  );
}
