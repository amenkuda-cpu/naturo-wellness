import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { articles } from "@/data/journal";
import { breadcrumbLd } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: { absolute: "Naturo Wellness Journal | Wellness Tips from Zimbabwe" },
  description:
    "The Naturo Wellness Journal: honest, practical reads on wellness shots, daily routines and fresh, natural drinks, written in Harare, Zimbabwe.",
  alternates: { canonical: "/journal" },
  openGraph: { url: "/journal", title: "Naturo Wellness Journal | Wellness Tips from Zimbabwe" },
};

export default function JournalPage() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Journal", path: "/journal" }])} />
      <PageHero
        eyebrow="Naturo Wellness Journal"
        title="Notes from"
        accent="our kitchen."
        intro="Practical, honest reads on wellness shots, everyday routines and fresh, natural drinks."
        motifs={["leaf", "ginger"]}
      />
      <div className="bg-warm py-16 lg:py-24">
        <ul className="container-x grid gap-8 md:grid-cols-3">
          {articles.map((a) => (
            <li key={a.slug}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-cream">
                <div className="relative aspect-[4/3] bg-[#F3E7C4]">
                  <Image src={a.image} alt={a.imageAlt} fill sizes="(min-width: 768px) 30vw, 90vw" className="object-contain p-6" loading="lazy" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="eyebrow text-ink/60">{a.readMinutes} min read</p>
                  <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-forest">
                    <Link href={`/journal/${a.slug}`} className="after:absolute after:inset-0">{a.title}</Link>
                  </h2>
                  <p className="mt-3 text-ink/75">{a.description}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
