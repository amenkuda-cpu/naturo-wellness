"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The hero product film, shown full-bleed behind the hero: muted, looping,
 * inline (iOS needs all three to autoplay). It pauses itself while off-screen
 * (saves battery and CPU), never autoplays for visitors who prefer reduced
 * motion, and offers a small pause/play control.
 */
export function HeroVideo({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  // Set when the visitor pauses it themselves, so scrolling back doesn't resume it.
  const userPaused = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // React doesn't reflect `muted` as an attribute; iOS Safari checks it before autoplaying.
    v.muted = true;
    v.defaultMuted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      userPaused.current = true;
      v.pause();
    }
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) v.pause();
      else if (!userPaused.current) void v.play().catch(() => {});
    });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      void v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  return (
    <>
      <video
        ref={ref}
        className={cn("absolute inset-0 -z-10 h-full w-full bg-sun object-cover", className)}
        src="/videos/naturo-hero.mp4"
        poster="/videos/naturo-hero-poster.webp"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-label="Naturo wellness shots: Ginger, Pineapple, Hibiscus, Men's Vitality and Glow, with fresh ingredients"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause background video" : "Play background video"}
        className="absolute bottom-4 left-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-forest/35 text-warm/90 opacity-70 backdrop-blur-sm transition hover:bg-forest/70 hover:opacity-100 focus-visible:opacity-100 sm:bottom-5 sm:left-5"
      >
        {playing ? <Pause className="h-3 w-3" aria-hidden /> : <Play className="h-3 w-3" aria-hidden />}
      </button>
    </>
  );
}
