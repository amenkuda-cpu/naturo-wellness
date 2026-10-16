import { cn } from "@/lib/cn";

/**
 * Naturo mark + wordmark, redrawn as a vector from the supplied brand
 * reference (bowl, sprouting leaves, base bar). Swap in the official vector
 * artwork when available: keep the same component API.
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

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-sans font-semibold tracking-[-0.03em]",
        tone === "dark" ? "text-forest" : "text-warm",
        className,
      )}
    >
      <NaturoMark className="h-[1.35em] w-[1.35em] -translate-y-[0.06em]" />
      <span className="text-[1.15em] leading-none">Naturo</span>
    </span>
  );
}
