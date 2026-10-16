import type { Metadata } from "next";
import { ClosingCta } from "@/components/home/closing-cta";
import { Story } from "@/components/home/story";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "Naturo Wellness makes everyday wellness natural, affordable and proudly Zimbabwean, bringing plant-inspired blends and traditional favourites into modern life.",
  alternates: { canonical: "/our-story" },
};

const values = [
  { k: "Natural", v: "Real ingredients, no unnecessary additives, and flavours you can recognise." },
  { k: "Familiar", v: "Traditional favourites and ingredients that feel like home, made for modern routines." },
  { k: "Affordable", v: "Everyday wellness shouldn't be a luxury. We build our range to be enjoyed every day." },
  { k: "Proudly Zimbabwean", v: "Made in Zimbabwe, with ambitions to share our flavours far beyond it." },
];

export default function OurStoryPage() {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="A taste that feels"
        accent="like home."
        intro="Naturo began with a simple belief: everyday wellness should feel natural, familiar and within reach."
        motifs={["maize-kernels", "leaf"]}
        tone="forest"
      />
      <Story withLink={false} />
      <Reveal as="section" aria-labelledby="values-title" className="bg-warm py-24 lg:py-32">
        <div className="container-x">
          <h2 id="values-title" data-reveal className="display text-[clamp(2.4rem,6vw,5rem)] text-forest">
            What we <span className="serif-accent normal-case text-botanical">stand</span> for
          </h2>
          <ul className="mt-14 grid gap-px overflow-hidden rounded-[2rem] bg-forest/10 sm:grid-cols-2">
            {values.map((item, i) => (
              <li key={item.k} data-reveal className="bg-warm p-8 lg:p-12">
                <span className="eyebrow text-ink/70">0{i + 1}</span>
                <h3 className="mt-4 font-display text-3xl font-extrabold uppercase tracking-tight text-forest">{item.k}</h3>
                <p className="mt-3 max-w-sm text-lg text-ink/75">{item.v}</p>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
      <ClosingCta />
    </>
  );
}
