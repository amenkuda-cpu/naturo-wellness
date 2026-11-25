import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/meta";
import { ClosingCta } from "@/components/home/closing-cta";
import { Story } from "@/components/home/story";
import { PageHero } from "@/components/layout/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { brand } from "@/config/brand";
import { siteConfig } from "@/config/site";
import { breadcrumbLd, ORG_ID } from "@/lib/seo/schema";

export const metadata: Metadata = pageMeta({
  title: "About Naturo Wellness | Wellness Brand in Zimbabwe",
  description:
    "Naturo Wellness is a Harare wellness brand founded by Sharon Ndoro Nyazema, making natural wellness shots fresh in Zimbabwe. Our story and vision.",
  path: "/our-story",
});

const values = [
  { k: "Natural", v: "Real ingredients, no unnecessary additives, and flavours you can recognise." },
  { k: "Familiar", v: "Traditional favourites and ingredients that feel like home, made for modern routines." },
  { k: "Affordable", v: "Everyday wellness shouldn't be a luxury. We build our range to be enjoyed every day." },
  { k: "Proudly Zimbabwean", v: "Made in Zimbabwe, with ambitions to share our flavours far beyond it." },
];

export default function OurStoryPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "About", path: "/our-story" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About Naturo Wellness",
          url: `${siteConfig.url}/our-story`,
          about: { "@id": ORG_ID },
          mainEntity: { "@type": "Person", name: brand.founder.name, jobTitle: brand.founder.jobTitle, worksFor: { "@id": ORG_ID } },
        }}
      />
      <PageHero
        eyebrow="About Naturo Wellness"
        title="A taste that feels"
        accent="like home."
        intro="Naturo Wellness is a Harare-based wellness brand making natural wellness shots, fresh in Zimbabwe. It began with a simple belief: everyday wellness should feel natural, familiar and within reach."
        motifs={["maize-kernels", "leaf"]}
        tone="forest"
      />
      <Story withLink={false} />
      <section aria-labelledby="founder-title" className="bg-cream py-20 lg:py-28">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow text-botanical">Founder and Director</p>
            <h2 id="founder-title" className="display mt-4 text-[clamp(2.2rem,5vw,4rem)] text-forest">{brand.founder.name}</h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-ink/80 lg:col-span-7">
            <p>
              {brand.founder.name} founded Naturo Wellness in Harare. Every recipe began in her kitchen, tested and
              tasted with her family until it was right, and she still leads the business today.
            </p>
            <p>
              Naturo Wellness is a Harare-based business, currently being registered as a private limited company. We make our wellness shots fresh,
              we publish ingredients exactly as they appear on our labels, and we describe our drinks honestly: as natural
              foods for everyday routines, never as medicines.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-[2rem] bg-forest/10 sm:grid-cols-2 lg:col-span-12">
            <div className="bg-warm p-8 lg:p-12">
              <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-forest">Our mission</h3>
              <p className="mt-3 text-lg text-ink/75">{siteConfig.mission}</p>
            </div>
            <div className="bg-warm p-8 lg:p-12">
              <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-forest">Our vision</h3>
              <p className="mt-3 text-lg text-ink/75">{brand.vision}</p>
            </div>
          </div>
        </div>
      </section>
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
