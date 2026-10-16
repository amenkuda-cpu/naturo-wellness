"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import { MOTION, ScrollTrigger, gsap, useGSAP, whenIdle } from "@/lib/gsap";

/**
 * Scroll-reveal scope. Children marked with:
 *   data-reveal        fade + rise
 *   data-reveal-clip   clip-path wipe (images)
 *   data-parallax="n"  gentle scroll parallax (n = strength, e.g. 0.15)
 * Content is fully visible without JavaScript or with reduced motion.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "ul" | "aside";
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      return whenIdle(() => {
        mm.add("(prefers-reduced-motion: no-preference)", () => {
          const q = gsap.utils.selector(ref.current);
          const items = q("[data-reveal]");
          if (items.length) {
            gsap.set(items, { y: 44, autoAlpha: 0 });
            ScrollTrigger.batch(items, {
              start: "top 90%",
              once: true,
              onEnter: (batch) =>
                gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1.1, stagger: 0.09, ease: "expo.out", overwrite: true }),
            });
          }
          q("[data-reveal-clip]").forEach((el) => {
            gsap.fromTo(
              el,
              { clipPath: "inset(100% 0% 0% 0%)" },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                duration: 1.4,
                ease: "expo.inOut",
                scrollTrigger: { trigger: el, start: "top 85%", once: true },
              },
            );
          });
        });
        mm.add(MOTION.desktop, () => {
          const q = gsap.utils.selector(ref.current);
          q("[data-parallax]").forEach((el) => {
            const strength = Number((el as HTMLElement).dataset.parallax) || 0.15;
            gsap.fromTo(
              el,
              { yPercent: strength * 100 },
              {
                yPercent: -strength * 100,
                ease: "none",
                scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
              },
            );
          });
        });
      });
    },
    { scope: ref },
  );

  const Component = Tag as React.ElementType;
  return (
    <Component ref={ref} className={cn(className)} {...rest}>
      {children}
    </Component>
  );
}
