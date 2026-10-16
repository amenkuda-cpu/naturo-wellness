import type { Metadata } from "next";
import { Transparency } from "@/components/home/transparency";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { MotifImage } from "@/components/product/product-image";
import type { Motif } from "@/lib/types";

export const metadata: Metadata = {
  title: "Our ingredients",
  description:
    "The familiar, plant-based flavours that inspire Naturo, and our commitment to honest, clearly presented labels.",
  alternates: { canonical: "/ingredients" },
};

/**
 * A celebration of flavours that inspire the range: descriptive only.
 * Exact ingredients per product live on each (verified) product label.
 */
const flavours: { name: string; motif: Motif; tint: string; note: string }[] = [
  { name: "Ginger", motif: "ginger", tint: "#F8E7BF", note: "Warming, zesty and unmistakable." },
  { name: "Hibiscus", motif: "hibiscus", tint: "#F6D6D9", note: "A striking flower with a deep ruby colour and a tangy, refreshing taste." },
  { name: "Pineapple", motif: "pineapple-chunk", tint: "#FCEFB4", note: "Sweet and tropical, with naturally occurring vitamin C." },
  { name: "Lemon", motif: "lemon-slice", tint: "#FBEA91", note: "Bright citrus that lifts every blend it touches." },
  { name: "Carrot", motif: "carrot", tint: "#F9DCC4", note: "Earthy, gently sweet and comforting in a warm cup." },
  { name: "Tea leaves", motif: "tea-leaf", tint: "#E7EFCB", note: "The heart of a slow, calming moment." },
  { name: "Grains", motif: "maize-kernels", tint: "#F1E7CF", note: "The foundation of beloved traditional drinks like Maheu." },
];

export default function IngredientsPage() {
  return (
    <>
      <PageHero
        eyebrow="Our ingredients"
        title="Flavours that feel"
        accent="close to home."
        intro="Naturo celebrates familiar, plant-based ingredients. Each product's exact ingredient list is published from its approved label."
        motifs={["hibiscus", "ginger-slice"]}
      />
      <Reveal as="section" aria-labelledby="flavours-title" className="bg-warm py-20 lg:py-28">
        <div className="container-x">
          <h2 id="flavours-title" data-reveal className="display text-[clamp(2.4rem,6vw,5rem)] text-forest">
            The <span className="serif-accent normal-case text-botanical">flavours</span> we love
          </h2>
          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {flavours.map((f) => (
              <li key={f.name} data-reveal className="group relative overflow-hidden rounded-[2rem] p-8" style={{ backgroundColor: f.tint }}>
                <MotifImage
                  motif={f.motif}
                  sizes="200px"
                  className="absolute -right-6 -top-6 w-40 transition-transform duration-700 ease-[var(--ease-expo)] group-hover:rotate-12 group-hover:scale-110"
                />
                <h3 className="relative mt-24 font-display text-3xl font-extrabold uppercase tracking-tight text-forest">{f.name}</h3>
                <p className="relative mt-2 max-w-xs text-ink/75">{f.note}</p>
              </li>
            ))}
          </ul>
          <p data-reveal className="mt-10 max-w-2xl text-sm text-ink/70">
            This list describes flavours that inspire our range. It is not a list of every product&apos;s contents. Always check
            the individual product page and label.
          </p>
        </div>
      </Reveal>
      <Transparency />
    </>
  );
}
