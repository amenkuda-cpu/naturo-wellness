import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { articleBySlug, articles } from "@/data/journal";
import { productBySlug } from "@/data/products";
import { articleLd, breadcrumbLd } from "@/lib/seo/schema";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = articleBySlug(slug);
  if (!a) return { title: "Article not found", robots: { index: false } };
  return {
    title: { absolute: a.seoTitle },
    description: a.description,
    alternates: { canonical: `/journal/${a.slug}` },
    openGraph: { type: "article", url: `/journal/${a.slug}`, title: a.seoTitle, description: a.description, publishedTime: a.datePublished },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const a = articleBySlug(slug);
  if (!a) notFound();
  const product = productBySlug(a.productSlug);
  const more = articles.filter((x) => x.slug !== a.slug);
  return (
    <>
      <JsonLd data={articleLd({ title: a.title, description: a.description, path: `/journal/${a.slug}`, image: a.image, datePublished: a.datePublished })} />
      <JsonLd data={breadcrumbLd([{ name: "Journal", path: "/journal" }, { name: a.title, path: `/journal/${a.slug}` }])} />
      <PageHero eyebrow={`Naturo Wellness Journal · ${a.readMinutes} min read`} title={a.title} motifs={a.motifs} />
      <div className="bg-warm py-16 lg:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <article className="max-w-3xl space-y-6 text-lg leading-relaxed text-ink/80 lg:col-span-8 [&_a]:font-medium [&_a]:text-forest [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-forest [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
            <p className="text-sm text-ink/60">
              By Naturo Wellness · <time dateTime={a.datePublished}>{new Date(a.datePublished).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</time>
            </p>
            {a.body}
            <p className="border-t border-forest/10 pt-6 text-sm text-ink/60">
              This article is general information, not medical advice. Naturo Wellness drinks are foods, not medicines.
            </p>
          </article>
          <aside className="space-y-8 lg:col-span-4">
            {product && (
              <Link href={`/shop/${product.slug}`} className="block rounded-[1.75rem] p-6 text-center" style={{ background: product.theme.tint }}>
                <span className="relative mx-auto block aspect-[2/3] w-32">
                  <Image src={product.images[0].src} alt={`Naturo Wellness ${product.name} bottle`} fill sizes="128px" className="object-contain" loading="lazy" />
                </span>
                <span className="mt-4 block font-display text-xl font-bold text-forest">{product.name}</span>
                <span className="mt-2 inline-flex h-11 items-center rounded-full bg-forest px-6 text-sm font-bold uppercase tracking-[0.14em] text-warm">Shop now</span>
              </Link>
            )}
            <nav aria-label="More from the journal">
              <h2 className="font-display text-lg font-bold text-forest">More from the journal</h2>
              <ul className="mt-3 space-y-3">
                {more.map((m) => (
                  <li key={m.slug}><Link href={`/journal/${m.slug}`} className="font-medium text-forest underline underline-offset-4">{m.title}</Link></li>
                ))}
                <li><Link href="/shop" className="font-medium text-forest underline underline-offset-4">Shop all Naturo Wellness shots</Link></li>
              </ul>
            </nav>
          </aside>
        </div>
      </div>
    </>
  );
}
