import { MotifImage } from "@/components/product/product-image";
import type { Motif } from "@/lib/types";

const items: { word: string; motif: Motif }[] = [
  { word: "Ginger", motif: "ginger" },
  { word: "Hibiscus", motif: "hibiscus" },
  { word: "Pineapple", motif: "pineapple-chunk" },
  { word: "Lemon", motif: "lemon-slice" },
  { word: "Maheu", motif: "maize-kernels" },
  { word: "Tea leaves", motif: "tea-leaf" },
  { word: "Carrot", motif: "carrot" },
];

/** Ingredient marquee: pure CSS animation, paused for reduced motion. */
export function Marquee() {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((it) => (
        <li key={it.word} className="flex items-center gap-6 px-6">
          <span className="font-display text-[clamp(2.2rem,5vw,4.5rem)] font-extrabold uppercase leading-none tracking-tight text-forest">
            {it.word}
          </span>
          <MotifImage motif={it.motif} className="w-[clamp(2.8rem,5vw,4.5rem)]" sizes="80px" />
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Ingredients we love" className="relative overflow-hidden border-y border-forest/10 bg-sun py-6">
      <div className="marquee-track flex w-max motion-reduce:[animation:none]">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
