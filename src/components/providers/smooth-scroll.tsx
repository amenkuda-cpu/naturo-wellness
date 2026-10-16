"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { smoothScroll } from "@/lib/smooth-scroll";

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger and Lenis
 * share one clock. Disabled for reduced-motion visitors and touch devices
 * (native momentum scrolling is better there).
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const firstRender = useRef(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || coarse) return;

    // Loaded lazily so phones and reduced-motion visitors never download it.
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95, autoRaf: false });
      smoothScroll.set(lenis);
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      cleanup = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
        smoothScroll.set(null);
      };
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  // On client-side route changes: reset scroll & recalculate triggers once the
  // new layout settles. Skipped on first load (ScrollTrigger measures itself),
  // where a forced full-page layout would only compete with hydration.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!window.location.hash) smoothScroll.toTop();
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
