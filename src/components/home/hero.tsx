"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { NaturoMark } from "@/components/brand/logo";
import { ButtonLabel, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { gsap, useGSAP } from "@/lib/gsap";
import { HeroVideo } from "./hero-video";

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

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      el.dataset.ready = "true";
      const mm = gsap.matchMedia();

      // Desktop only, and only when motion is welcome: a short typography reveal.
      // On phones (and for reduced motion) everything paints immediately.
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
        const q = gsap.utils.selector(el);
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .fromTo(q("[data-line-mask] span span"), { yPercent: 115, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.026 }, 0.15)
          .fromTo(q("[data-fade]"), { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.08 }, 0.5)
          .fromTo(q("[data-cta]"), { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08 }, 0.65)
          .fromTo(q("[data-video]"), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2 }, 0.2);
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      data-hero
      aria-labelledby="hero-title"
      className="grain relative isolate overflow-hidden bg-[#F7EFD6] lg:flex lg:min-h-[100svh] lg:items-center"
    >
      {/* Ambient colour field */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(120%_80%_at_70%_30%,#FBF2C9_0%,#F7EFD6_45%,#EFE3C0_100%)]"
      />

      <div className="container-x grid w-full items-center gap-8 pb-12 pt-24 sm:pt-28 lg:grid-cols-12 lg:gap-12 lg:pb-20 lg:pt-28">
        {/* ── Copy ── */}
        <div className="lg:col-span-5">
          <p data-fade className="hero-pre-lg eyebrow flex items-center gap-3 text-forest/80">
            <NaturoMark className="h-5 w-5 text-botanical" />
            Rooted in nature. Made for everyday.
          </p>
          <h1 id="hero-title" className="mt-4 text-forest lg:mt-5">
            <span className="sr-only">Feel good. Naturally.</span>
            <SplitLine text="FEEL GOOD." className="hero-pre-lg display text-[clamp(3.6rem,15.5vw,10.5rem)] lg:text-[clamp(3.6rem,6.4vw,8rem)]" />
            <SplitLine
              text="NATURALLY."
              className="hero-pre-lg serif-accent -mt-[0.08em] text-[clamp(3.7rem,15.8vw,10.8rem)] leading-[0.9] text-botanical lg:text-[clamp(3.7rem,6.6vw,8.3rem)]"
            />
          </h1>
          <p data-fade className="hero-pre-lg mt-4 max-w-[28rem] text-[0.95rem] leading-relaxed text-ink/80 sm:text-lg lg:mt-6">
            Everyday wellness, rooted in nature. Discover natural shots, traditional favourites and herbal blends, proudly
            made in Zimbabwe.
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
                className="group/btn inline-flex h-14 items-center gap-2 rounded-full px-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-forest transition-colors hover:bg-forest/5 sm:px-5 sm:text-[0.76rem]"
              >
                <ButtonLabel>Discover our story</ButtonLabel>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Product film ── */}
        <div data-video className="hero-pre-lg lg:col-span-7">
          <HeroVideo />
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
