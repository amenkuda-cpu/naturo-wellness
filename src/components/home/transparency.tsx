"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
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

/** A box on the pack photo, in source-image pixels (photos are 900 × 1350). */
type Box = [x0: number, y0: number, x1: number, y1: number];

interface Spot {
  title: string;
  body: string;
  /** Where the numbered dot sits. */
  dot: [number, number];
  /** The label element it explains (outlined when selected). */
  box: Box;
}

interface Pack {
  id: string;
  label: string;
  src: string;
  alt: string;
  /** Visible crop, 4:5, so every pack fills the same frame. */
  view: Box;
  spots: Spot[];
}

const seal = (dot: [number, number], box: Box): Spot => ({
  title: "The Naturo Wellness seal",
  body: "On the front of every genuine Naturo pack. If it's missing, it isn't ours.",
  dot,
  box,
});

const packs: Pack[] = [
  {
    id: "shot",
    label: "Shot",
    src: "/images/products/ginger-shot.webp",
    alt: "Front label of the Naturo Wellness Ginger Shot, 100 ml",
    view: [190, 480, 710, 1130],
    spots: [
      seal([548, 548], [350, 505, 548, 705]),
      { title: "Clear product name", body: "What it is, in plain words: Ginger Shot. No invented marketing names.", dot: [572, 790], box: [342, 758, 562, 872] },
      {
        title: "Real ingredients, stated",
        body: "“Made with real ingredients” on the front, and each product page lists ingredients exactly as printed on the approved label.",
        dot: [580, 1048],
        box: [343, 1034, 566, 1062],
      },
      { title: "Exact quantity", body: "100 ml in every shot, printed where you can see it.", dot: [515, 1096], box: [410, 1079, 501, 1113] },
    ],
  },
  {
    id: "tea",
    label: "Tea",
    src: "/images/products/ginger-lemon-tea.webp",
    alt: "Front of the Naturo Wellness Ginger Lemon Herbal Tea pouch, 20 tea bags, 40 g",
    view: [114, 380, 786, 1220],
    spots: [
      seal([612, 452], [290, 385, 624, 727]),
      { title: "Clear product name", body: "Ginger Lemon Herbal Tea: the blend and what kind of drink it is.", dot: [664, 772], box: [254, 740, 652, 850] },
      { title: "What's inside, up front", body: "The key botanicals are named on the front: ginger and lemon.", dot: [618, 876], box: [296, 858, 606, 894] },
      { title: "Exact quantity", body: "20 tea bags, 40 g net, in every pouch.", dot: [338, 1158], box: [182, 1138, 326, 1207] },
    ],
  },
  {
    id: "can",
    label: "Can",
    src: "/images/products/orange-can.webp",
    alt: "Naturo Wellness Orange flavour can, 330 ml",
    view: [162, 320, 738, 1040],
    spots: [
      seal([578, 382], [306, 335, 580, 604]),
      { title: "Clear product name", body: "Naturo Orange: named for the flavour, in big friendly letters.", dot: [606, 680], box: [326, 624, 598, 752] },
      { title: "Flavour, said plainly", body: "“Orange flavour”: it tells you exactly what kind of drink it is.", dot: [532, 812], box: [378, 788, 522, 842] },
      { title: "Exact quantity", body: "330 ml in every can.", dot: [508, 890], box: [406, 873, 496, 907] },
    ],
  },
];

const IMG_W = 900;
const IMG_H = 1350;
const pct = (v: number) => `${v}%`;

/** "Good ingredients. Honest labels.": commitments + the anatomy of a real Naturo label. */
export function Transparency() {
  const [packId, setPackId] = useState(packs[0].id);
  const [spotIndex, setSpotIndex] = useState(0);
  const pack = packs.find((p) => p.id === packId)!;
  const spot = pack.spots[spotIndex];

  // Position the full photo inside the frame so that `view` fills it.
  const [vx0, vy0, vx1, vy1] = pack.view;
  const vw = vx1 - vx0;
  const vh = vy1 - vy0;
  const photo = {
    left: pct((-vx0 / vw) * 100),
    top: pct((-vy0 / vh) * 100),
    width: pct((IMG_W / vw) * 100),
    height: pct((IMG_H / vh) * 100),
  };
  const at = (x: number, y: number) => ({ left: pct((x / IMG_W) * 100), top: pct((y / IMG_H) * 100) });
  const [bx0, by0, bx1, by1] = spot.box;
  const pad = 10;

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
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow text-ink/70">Our label standard</p>
                <p className="mt-2 max-w-sm text-sm text-ink/75">Tap a number on a real Naturo pack to see what every label tells you.</p>
              </div>
              <div role="tablist" aria-label="Choose a pack" className="flex rounded-full bg-cream p-1 shadow-[inset_0_0_0_1px_rgba(24,49,38,0.08)]">
                {packs.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={p.id === packId}
                    onClick={() => {
                      setPackId(p.id);
                      setSpotIndex(0);
                    }}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors",
                      p.id === packId ? "bg-forest text-warm" : "text-forest hover:bg-forest/10",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mx-auto mt-6 aspect-[4/5] max-w-md overflow-hidden rounded-[2rem] bg-cream shadow-[inset_0_0_0_1px_rgba(24,49,38,0.08)]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={pack.id}
                  className="absolute"
                  style={photo}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <Image src={pack.src} alt={pack.alt} fill sizes="(min-width: 1024px) 42rem, 140vw" className="object-contain" draggable={false} />

                  {/* Outline on the label element being explained. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute rounded-xl border-2 border-forest shadow-[0_0_0_9999px_rgba(255,253,245,0.28),0_0_0_6px_rgba(245,216,78,0.45)] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                    style={{
                      ...at(bx0 - pad, by0 - pad),
                      width: pct(((bx1 - bx0 + pad * 2) / IMG_W) * 100),
                      height: pct(((by1 - by0 + pad * 2) / IMG_H) * 100),
                    }}
                  />

                  {pack.spots.map((s, i) => (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => setSpotIndex(i)}
                      onMouseEnter={() => setSpotIndex(i)}
                      aria-pressed={i === spotIndex}
                      aria-label={`${i + 1}. ${s.title}`}
                      className="absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center"
                      style={at(...s.dot)}
                    >
                      {i !== spotIndex && (
                        <span
                          className="absolute inset-0 animate-ping rounded-full bg-sun/60 motion-reduce:hidden"
                          style={{ animationDelay: `${i * 0.3}s`, animationDuration: "2.4s" }}
                        />
                      )}
                      <span
                        className={cn(
                          "absolute inset-1.5 rounded-full shadow-[0_4px_14px_rgba(23,63,43,0.35)] ring-2 ring-warm transition-colors",
                          i === spotIndex ? "bg-forest" : "bg-sun",
                        )}
                      />
                      <span className={cn("relative text-xs font-bold", i === spotIndex ? "text-warm" : "text-forest")}>{i + 1}</span>
                    </button>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative mt-6 min-h-[6.5rem]" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${pack.id}-${spotIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-[2.25rem_1fr] gap-3"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-forest text-sm font-bold text-warm">{spotIndex + 1}</span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-forest">{spot.title}</h3>
                    <p className="mt-1 text-ink/70">{spot.body}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
