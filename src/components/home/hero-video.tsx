"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * The hero product film: muted, looping, inline. It pauses itself while
 * off-screen (saves battery and CPU), never autoplays for visitors who prefer
 * reduced motion, and always offers a pause/play control.
 */
export function HeroVideo({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  // Set when the visitor pauses it themselves, so scrolling back doesn't resume it.
  const userPaused = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
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
    <div className={cn("relative overflow-hidden rounded-[1.5rem] bg-sun shadow-[0_30px_80px_-30px_rgba(23,49,38,0.45)] sm:rounded-[2rem]", className)}>
      <video
        ref={ref}
        className="block aspect-video h-auto w-full object-cover"
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
        aria-label={playing ? "Pause video" : "Play video"}
        className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-forest/70 text-warm backdrop-blur transition-colors hover:bg-forest sm:bottom-4 sm:right-4"
      >
        {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}
