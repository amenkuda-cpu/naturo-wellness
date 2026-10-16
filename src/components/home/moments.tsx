"use client";

import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { MotifImage, ProductImage } from "@/components/product/product-image";
import { useStore } from "@/components/providers/store-provider";
import { moments, type Moment } from "@/data/moments";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

/** Shop by moment: descriptive groupings with an interactive preview stage. */
export function Moments() {
  const { catalog } = useStore();
  const [active, setActive] = useState(0);
  const productsFor = (m: Moment) =>
    m.productSlugs.map((s) => catalog.find((p) => p.slug === s)).filter(Boolean) as Product[];
  const current = moments[active];

  return (
    <section aria-labelledby="moments-title" className="cv-auto relative bg-cream py-24 lg:py-36">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow text-botanical">Shop by moment</p>
            <h2 id="moments-title" className="display mt-4 text-[clamp(2.6rem,7vw,6rem)] text-forest">
              Find <span className="serif-accent normal-case text-botanical">your</span> ritual.
            </h2>
          </div>
          <p className="max-w-sm text-lg text-ink/70">
            However your day unfolds, there&apos;s a Naturo blend that fits the moment.
          </p>
        </div>

        <div className="mt-14 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-16">
          <ul className="min-w-0 lg:col-span-6" role="list">
            {moments.map((m, i) => {
              const isActive = i === active;
              const prods = productsFor(m);
              return (
                <li key={m.id} className="border-t border-forest/15 last:border-b">
                  <Link
                    href={`/shop?moment=${m.id}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    className="group flex items-center gap-4 py-5 lg:py-7"
                    aria-describedby={`moment-${m.id}-line`}
                  >
                    <span aria-hidden className="eyebrow w-8 shrink-0 text-ink/70 tabular-nums">0{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block font-display text-[clamp(1.7rem,4vw,3.2rem)] font-extrabold uppercase leading-none tracking-tight transition-[color,transform] duration-500 ease-[var(--ease-expo)]",
                          isActive ? "text-forest lg:translate-x-3" : "text-forest/65 group-hover:text-forest",
                        )}
                      >
                        {m.title}
                      </span>
                      <span id={`moment-${m.id}-line`} className="mt-2 block text-sm text-ink/75">
                        {m.line}
                        <span className="sr-only">. Products: {prods.map((p) => p.name).join(", ")}</span>
                      </span>
                    </span>
                    <span
                      className={cn(
                        "grid h-12 w-12 shrink-0 place-items-center rounded-full border border-forest/20 transition-all duration-500",
                        isActive ? "rotate-45 bg-forest text-warm" : "text-forest group-hover:bg-forest group-hover:text-warm",
                      )}
                      aria-hidden
                    >
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                  </Link>
                  {/* Mobile: inline preview of products */}
                  <div className="-mt-1 flex gap-3 overflow-x-auto pb-5 no-scrollbar lg:hidden">
                    {prods.map((p) => (
                      <Link
                        key={p.id}
                        href={`/shop/${p.slug}`}
                        className="flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-4 text-sm font-medium"
                        style={{ backgroundColor: p.theme.tint }}
                      >
                        <span className="relative h-10 w-10 overflow-hidden rounded-full bg-warm/60">
                          <ProductImage product={p} sizes="40px" className="absolute inset-0.5" />
                        </span>
                        {p.name}
                      </Link>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop preview stage */}
          <div className="relative hidden lg:col-span-6 lg:block">
            <div className="sticky top-28 aspect-[5/6] overflow-hidden rounded-[2.5rem]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={current.id}
                  className="absolute inset-0"
                  style={{ backgroundColor: current.color }}
                  initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
                  animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                >
                  <div className="grain absolute inset-0" />
                  {current.motifs.map((m, i) => (
                    <motion.div
                      key={m + i}
                      className={cn(
                        "absolute",
                        ["right-[6%] top-[5%] w-[26%]", "left-[3%] top-[40%] w-[20%]", "right-[6%] bottom-[8%] w-[22%]"][i],
                      )}
                      initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ delay: 0.25 + i * 0.08, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <MotifImage motif={m} sizes="14vw" />
                    </motion.div>
                  ))}
                  <div className="absolute inset-x-[8%] bottom-[10%] top-[16%] flex items-end justify-center">
                    {productsFor(current).map((p, i, arr) => (
                      <motion.div
                        key={p.id}
                        className="relative h-full flex-1"
                        style={{ zIndex: arr.length - Math.abs(i - (arr.length - 1) / 2) }}
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: i === Math.floor(arr.length / 2) && arr.length > 2 ? -20 : 0, opacity: 1 }}
                        transition={{ delay: 0.15 + i * 0.08, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <ProductImage
                          product={p}
                          sizes="20vw"
                          className="absolute inset-0"
                          imgClassName="[filter:drop-shadow(0_26px_24px_rgba(23,49,38,0.28))]"
                        />
                      </motion.div>
                    ))}
                  </div>
                  <p
                    className="serif-accent absolute left-8 top-8 max-w-[14rem] text-2xl"
                    style={{ color: current.ink }}
                  >
                    {current.line}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
