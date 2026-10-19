import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The small Naturo leaf-bowl mark, used as a decorative accent around the site
 * (eyebrows, footer). The official logo is <Logo /> below.
 */
export function NaturoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d="M8.5 22.5h9.2v3.2c0 9.1 6.1 15.4 14.3 15.4s14.3-6.3 14.3-15.4v-3.2h9.2v3.2C55.5 40 45.6 50 32 50S8.5 40 8.5 25.7Z" />
      <rect x="8.5" y="13.5" width="9.2" height="12" rx="4.6" />
      <path d="M30.6 30.5c-7.6-.6-11.6-6.4-10.9-14.8 7.4.8 11.5 6.1 10.9 14.8Z" />
      <path d="M33.4 30.5c7.6-.6 11.6-6.4 10.9-14.8-7.4.8-11.5 6.1-10.9 14.8Z" />
      <rect x="17.5" y="54" width="29" height="5.6" rx="2.8" />
    </svg>
  );
}

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
