"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { NaturoMark } from "@/components/brand/logo";
import { cn } from "@/lib/cn";

const pillars = [
  {
    title: "Quality first",
    body: "Every blend is made to a consistent recipe, so the taste you love is the taste you get.",
  },
  {
    title: "Hygiene you can trust",
    body: "Clean preparation and careful bottling are non-negotiable parts of how we work.",
  },
  {
    title: "Ingredient transparency",
    body: "We publish ingredient lists exactly as they appear on our approved labels, never more and never less.",
  },
  {
    title: "Responsible descriptions",
    body: "We describe flavour, character and tradition. We don't make medical promises.",
  },
  {
    title: "Local where verified",
    body: "Where ingredients are locally sourced and we can confirm it, we'll tell you, product by product.",
  },
];

const hotspots = [
  { id: "name", x: "50%", y: "20%", title: "Clear product name", body: "What it is, in plain language, with no hidden marketing names." },
  { id: "ingredients", x: "22%", y: "52%", title: "Full ingredient list", body: "Listed in order, as printed on our approved label." },
  { id: "storage", x: "78%", y: "52%", title: "Storage & serving", body: "How to keep it fresh and how to enjoy it at its best." },
  { id: "batch", x: "50%", y: "82%", title: "Batch & best-before", body: "So every bottle can be traced and enjoyed while fresh." },
];

/** "Good ingredients. Honest labels.": commitments + an interactive label anatomy. */
export function Transparency() {
  const [active, setActive] = useState(hotspots[0].id);
  const current = hotspots.find((h) => h.id === active)!;

  return (
    <section aria-labelledby="honest-title" className="cv-auto relative overflow-hidden bg-warm py-24 lg:py-36">
      <div className="container-x grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="eyebrow text-botanical">Our standards</p>
          <h2 id="honest-title" className="display mt-4 text-[clamp(2.6rem,6.5vw,5.6rem)] text-forest">
            Good ingredients. <span className="serif-accent normal-case text-botanical">Honest</span> labels.
          </h2>
          <ol className="mt-12">
            {pillars.map((p, i) => (
              <li key={p.title} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-forest/15 py-6 last:border-b">
                <span className="eyebrow pt-1 text-ink/70 tabular-nums">0{i + 1}</span>
                <div>
                  <h3 className="font-display text-xl font-bold tracking-tight text-forest">{p.title}</h3>
                  <p className="mt-1.5 text-ink/70">{p.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow text-ink/70">Our label standard</p>
            <p className="mt-2 text-sm text-ink/75">
              Our labels are being finalised. Tap a point to see what we&apos;re committing to show on every product.
            </p>
            <div className="relative mx-auto mt-6 aspect-[4/5] max-w-md rounded-[2rem] bg-cream p-6 shadow-[inset_0_0_0_1px_rgba(24,49,38,0.08)]">
              {/* Stylised label */}
              <div className="relative flex h-full flex-col items-center rounded-2xl border-2 border-dashed border-forest/20 bg-warm px-6 py-8 text-center">
                <NaturoMark className="h-10 w-10 text-forest" />
                <p className="mt-2 text-sm font-semibold text-forest">Naturo</p>
                <p className="serif-accent mt-3 text-3xl text-forest">Product name</p>
                <div className="mt-6 grid w-full grid-cols-2 gap-4 text-left">
                  {[0, 1].map((c) => (
                    <div key={c} className="space-y-2">
                      {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="h-1.5 rounded-full bg-forest/15" style={{ width: `${90 - i * 14}%` }} />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-auto w-full space-y-2">
                  <div className="mx-auto h-1.5 w-2/3 rounded-full bg-forest/15" />
                  <div className="mx-auto h-1.5 w-1/2 rounded-full bg-forest/10" />
                </div>
              </div>

              {hotspots.map((h, i) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setActive(h.id)}
                  onMouseEnter={() => setActive(h.id)}
                  aria-pressed={active === h.id}
                  aria-label={h.title}
                  className="absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center"
                  style={{ left: h.x, top: h.y }}
                >
                  <span
                    className={cn(
                      "absolute inset-1.5 rounded-full transition-colors",
                      active === h.id ? "bg-forest" : "bg-sun",
                    )}
                  />
                  <span className="absolute inset-0 animate-ping rounded-full bg-sun/50 motion-reduce:hidden" style={{ animationDelay: `${i * 0.3}s`, animationDuration: "2.4s" }} />
                  <span className={cn("relative text-xs font-bold", active === h.id ? "text-warm" : "text-forest")}>{i + 1}</span>
                </button>
              ))}
            </div>
            <div className="relative mt-6 min-h-[5.5rem]" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="font-display text-xl font-bold text-forest">{current.title}</h3>
                  <p className="mt-1 text-ink/70">{current.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
