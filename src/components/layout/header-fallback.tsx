import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { mainNav } from "@/config/site";

/** Static header rendered in the prerendered shell until the live header hydrates. */
export function HeaderFallback() {
  return (
    <header className="fixed inset-x-0 top-0 z-[60]">
      <div className="container-x flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link href="/" aria-label="Naturo Wellness home" className="flex items-center">
          <Logo />
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
