import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The official Naturo Wellness logo (round badge), from
 * /public/images/brand/naturo-wellness-logo.png (644 × 626, transparent
 * surround, so it stays sharp on retina screens at header sizes).
 * Shown at its original proportions; a soft drop shadow keeps the white badge
 * legible over the hero video and light backgrounds.
 */
export function Logo({ className, priority = true }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/images/brand/naturo-wellness-logo.png"
      alt="Naturo Wellness"
      width={644}
      height={626}
      preload={priority}
      sizes="(min-width: 1024px) 140px, 120px"
      // `className` replaces the default (compact header) sizing.
      className={cn("w-auto select-none [filter:drop-shadow(0_3px_10px_rgba(23,49,38,0.3))]", className ?? LOGO_COMPACT)}
    />
  );
}

/** Header logo sizes: compact on solid headers, large over the homepage hero video. */
export const LOGO_COMPACT = "h-14 sm:h-[68px]";
export const LOGO_HERO = "h-[84px] sm:h-[112px] lg:h-[132px]";
