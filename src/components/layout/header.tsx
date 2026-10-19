"use client";

import { Menu, ShoppingBag, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LOGO_COMPACT, LOGO_HERO, Logo } from "@/components/brand/logo";
import { cart, useCart } from "@/components/cart/cart-store";
import { mainNav, siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";
import { smoothScroll } from "@/lib/smooth-scroll";

export function Header({ showAccount }: { showAccount: boolean }) {
  const pathname = usePathname();
  const { count, pulse } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const overHero = pathname === "/";

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      // Read the position here, in the scroll event, while layout is clean.
      // Reading it inside the rAF (after GSAP's per-frame style writes) forced
      // a full style recalculation on every scroll frame.
      const y = window.scrollY;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setScrolled(y > 24);
        setHidden(y > 480 && y > lastY.current + 4);
        if (y < lastY.current - 4 || y < 480) setHidden(false);
        lastY.current = y;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Close the menu when the route changes (render-time state adjustment).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    smoothScroll.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      smoothScroll.start();
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const solid = scrolled || !overHero;

  return (
    <>
      <a
        href="#main"
        className="fixed left-4 top-3 z-[90] -translate-y-24 rounded-full bg-forest px-4 py-2 text-sm text-warm transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      {siteConfig.announcement && (
        <div className="relative z-[61] bg-forest px-4 py-2 text-center text-xs font-medium tracking-wide text-warm">
          {siteConfig.announcement}
        </div>
      )}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[60] transition-[transform,background-color,box-shadow] duration-500 ease-[var(--ease-expo)]",
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0",
          solid && !menuOpen ? "bg-warm/85 shadow-[0_1px_0_rgba(24,49,38,0.08)] backdrop-blur-xl" : "bg-transparent",
        )}
      >
        <div className="container-x flex h-16 items-center justify-between gap-4 sm:h-20">
          <Link
            href="/"
            aria-label="Naturo Wellness home"
            className={cn("relative z-[71] flex items-center", !solid && !menuOpen && "self-start pt-2")}
          >
            <Logo
              className={cn(
                "transition-[height] duration-500 ease-[var(--ease-expo)]",
                !solid && !menuOpen ? LOGO_HERO : LOGO_COMPACT,
              )}
            />
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {mainNav.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative rounded-full px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] transition-colors",
                        active ? "text-forest" : solid ? "text-ink/70 hover:text-forest" : "text-forest/90 hover:text-forest",
                        !solid && "[text-shadow:0_1px_10px_rgba(255,253,245,0.7)]",
                      )}
                    >
                      {item.label}
                      {active && (
                        <motion.span
                          layoutId="nav-dot"
                          className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-botanical"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div
            className={cn(
              "relative z-[71] flex items-center gap-1 sm:gap-2",
              !solid && !menuOpen && "[filter:drop-shadow(0_1px_6px_rgba(255,253,245,0.7))]",
            )}
          >
            {showAccount && (
              <Link
                href="/account"
                aria-label="Your account"
                className={cn(
                  "hidden h-11 w-11 place-items-center rounded-full transition-colors sm:grid",
                  menuOpen ? "text-warm hover:bg-warm/10" : "text-forest hover:bg-forest/5",
                )}
              >
                <User className="h-5 w-5" />
              </Link>
            )}
            <button
              type="button"
              onClick={() => cart.open()}
              aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
              className={cn(
                "relative grid h-11 w-11 place-items-center rounded-full transition-colors",
                menuOpen ? "text-warm hover:bg-warm/10" : "text-forest hover:bg-forest/5",
              )}
            >
              <ShoppingBag className="h-5 w-5" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={pulse}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: [1.35, 1], opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-sun px-1 text-[0.65rem] font-bold text-forest ring-2 ring-warm"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              type="button"
              className={cn(
                "grid h-11 w-11 place-items-center rounded-full transition-colors lg:hidden",
                menuOpen ? "text-warm hover:bg-warm/10" : "text-forest hover:bg-forest/5",
              )}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-[65] flex flex-col overflow-y-auto bg-forest text-warm lg:hidden"
            initial={{ clipPath: "circle(0% at calc(100% - 2.5rem) 2.5rem)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 2.5rem) 2.5rem)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 2.5rem) 2.5rem)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav aria-label="Mobile" className="container-x flex flex-1 flex-col justify-center pb-10 pt-24">
              <ul className="space-y-1">
                {mainNav.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.18 + i * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={item.href}
                      className="group flex items-baseline gap-4 py-2 font-display text-[clamp(2.4rem,11vw,4rem)] font-extrabold uppercase leading-none tracking-tight"
                    >
                      <span aria-hidden className="font-sans text-xs font-medium tracking-[0.2em] text-sun">
                        0{i + 1}
                      </span>
                      <span className="transition-colors group-hover:text-sun">{item.label}</span>
                    </Link>
                  </motion.li>
                ))}
                {showAccount && (
                  <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <Link href="/account" className="mt-6 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-warm/80">
                      <User className="h-4 w-4" /> Your account
                    </Link>
                  </motion.li>
                )}
              </ul>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="serif-accent mt-12 max-w-xs text-2xl text-citrus"
              >
                Rooted in nature. Made for everyday.
              </motion.p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
