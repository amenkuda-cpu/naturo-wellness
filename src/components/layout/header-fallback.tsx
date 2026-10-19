import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { LOGO_COMPACT, Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import { mainNav } from "@/config/site";

/** Static header rendered in the prerendered shell until the live header hydrates. */
export function HeaderFallback() {
  return (
    <header className="fixed inset-x-0 top-0 z-[60]">
      <div className="container-x flex h-16 items-center justify-between gap-4 sm:h-20">
        {/* Over the homepage hero the logo starts large, matching the live header. */}
        <Link
          href="/"
          aria-label="Naturo Wellness home"
          className="flex items-center [body:has([data-hero])_&]:self-start [body:has([data-hero])_&]:pt-2"
        >
          <Logo
            className={cn(
              LOGO_COMPACT,
              "[body:has([data-hero])_&]:h-[84px] sm:[body:has([data-hero])_&]:h-[112px] lg:[body:has([data-hero])_&]:h-[132px]",
            )}
          />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-full px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-forest/90">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <span className="grid h-11 w-11 place-items-center text-forest" aria-hidden>
          <ShoppingBag className="h-5 w-5" />
        </span>
      </div>
    </header>
  );
}
