import { ChevronRight, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/product/product-card";
import { ProductStage } from "@/components/product/product-stage";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { JsonLd } from "@/components/seo/json-ld";
import { brand } from "@/config/brand";
import { categoryById, products as localProducts } from "@/data/products";
import { getCatalog, getProductBySlug, getStoreSettings } from "@/lib/commerce/catalog";
import { formatMoney } from "@/lib/commerce/pricing";
import { productCopy, SHOT_SLUGS } from "@/data/product-copy";
import { pageMeta } from "@/lib/seo/meta";
import { breadcrumbLd, faqLd, productLd } from "@/lib/seo/schema";
import type { Product } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return localProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };
  const copy = productCopy[product.slug];
  const title = copy?.seoTitle ?? `Naturo Wellness ${product.name} | Made in Zimbabwe`;
  const description = copy?.seoDescription ?? `${product.shortDescription} By Naturo Wellness, made in Zimbabwe.`;
  const image = product.images[0];
  return pageMeta({
    title,
    description,
    path: `/shop/${product.slug}`,
    image: image ? { url: image.src, width: image.width, height: image.height, alt: `Naturo Wellness ${product.name}` } : undefined,
  });
}

/**
 * The slug is read OUTSIDE any <Suspense> boundary on purpose: without Partial Prefetching,
 * Next.js only stores a fully rendered page per product (title, H1, copy all in the HTML that
 * search engines receive) when params are awaited at the top of the page.
 */
export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  return <ProductContent slug={slug} />;
}

async function ProductContent({ slug }: { slug: string }) {
  const [product, catalog, settings] = await Promise.all([getProductBySlug(slug), getCatalog(), getStoreSettings()]);
  if (!product) notFound();

  const category = categoryById(product.category);
  const copy = productCopy[product.slug];
  const related = product.relatedSlugs
    .map((s) => catalog.find((p) => p.slug === s))
    .filter((p): p is Product => Boolean(p))
    .slice(0, 3);
  // Every product page links to all the wellness shots (internal linking, one tap to compare).
  const otherShots = SHOT_SLUGS.filter((s) => s !== product.slug)
    .map((s) => catalog.find((p) => p.slug === s))
    .filter((p): p is Product => Boolean(p));
  const priced = product.variants.find((v) => v.price !== null);
  const priceLine = priced ? `${formatMoney(priced.price!, product.currency)}${priced.size ? ` per ${priced.size} ${priced.label.toLowerCase()}` : ""}` : null;
  const intro = copy?.intro ?? product.fullDescription;
  const description = copy?.intro[0] ?? product.shortDescription;
  const faqs = [
    ...(copy?.faqs ?? []),
    ...product.faqs.filter((f) => !/delivered/i.test(f.question)).map((f) => ({ q: f.question, a: f.answer })),
  ];

  const details: { title: string; body: React.ReactNode }[] = [
    {
      title: "Ingredients",
      body: (
        <>
          {copy && <p><strong className="text-forest">Star ingredient:</strong> {copy.star}.</p>}
          {product.ingredients?.length ? (
            <p className="mt-2">{product.ingredients.join(", ")}.</p>
          ) : (
            <p className="mt-2">
              The full ingredient list is printed on every label. We&apos;ll publish it here once it&apos;s confirmed
              against the approved label. Questions in the meantime?{" "}
              <a href={brand.whatsappUrl} target="_blank" rel="noopener" className="underline underline-offset-4">Ask us on WhatsApp</a>.
            </p>
          )}
        </>
      ),
    },
    { title: "How to enjoy", body: <p>{product.preparation ?? copy?.howToEnjoy ?? "Please follow the serving suggestion on the label."}</p> },
    { title: "Storage", body: <p>{product.storage ?? copy?.storage ?? "Please follow the storage instructions printed on the label."}</p> },
    {
      title: "Allergens",
      body: <p>{product.allergens ?? "If you have an allergy, please check the label before drinking, or message us on WhatsApp and we'll help."}</p>,
    },
  ];

  return (
    <>
      <JsonLd data={productLd(product, description, category.name)} />
      <JsonLd data={breadcrumbLd([{ name: "Shop", path: "/shop" }, { name: product.name, path: `/shop/${product.slug}` }])} />
      {faqs.length > 0 && <JsonLd data={faqLd(faqs)} />}
      <div className="bg-warm pb-20 pt-24 sm:pt-28 lg:pt-32">
        <div className="container-x">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink/70">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/" className="hover:text-forest">Home</Link></li>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <li><Link href="/shop" className="hover:text-forest">Shop</Link></li>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <li><Link href={`/shop?category=${category.id}`} className="hover:text-forest">{category.name}</Link></li>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <li aria-current="page" className="font-medium text-forest">{product.name}</li>
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <div className="lg:sticky lg:top-28">
                <ProductStage product={product} />
              </div>
            </div>

            <div className="lg:col-span-5 lg:pt-6">
              <h1 className="text-forest">
                <span className="eyebrow block text-botanical">Naturo Wellness · {category.name}</span>
                <span className="display mt-4 block text-[clamp(2.8rem,7vw,5.4rem)]">{product.name}</span>
              </h1>
              <p className="serif-accent mt-3 text-2xl" style={{ color: product.theme.deep }}>{product.mood}</p>
              <p className="mt-5 text-lg leading-relaxed text-ink/80">{product.shortDescription}</p>
              {priceLine && <p className="mt-3 text-sm font-semibold text-forest">{priceLine} · Made fresh in Zimbabwe</p>}

              <div className="mt-8 border-t border-forest/10 pt-8">
                <PurchasePanel slug={product.slug} />
              </div>

              <div className="mt-8 flex items-start gap-3 rounded-2xl bg-cream p-5 text-sm">
                <Truck className="mt-0.5 h-5 w-5 shrink-0 text-botanical" aria-hidden />
                <p className="text-ink/75">
                  Delivery in Harare and collection options are shown at checkout. Prefer to chat?{" "}
                  <a href={brand.whatsappUrl} target="_blank" rel="noopener" className="font-medium text-forest underline underline-offset-4">Order on WhatsApp</a>.{" "}
                  <Link href="/delivery" className="font-medium text-forest underline underline-offset-4">Delivery information</Link>
                </p>
              </div>

              <section aria-labelledby="about-title" className="mt-10">
                <h2 id="about-title" className="font-display text-2xl font-bold text-forest">About the {product.name}</h2>
                <div className="mt-4 space-y-4 text-ink/80">
                  {intro.map((para) => <p key={para} className="leading-relaxed">{para}</p>)}
                </div>
                {copy && copy.highlights.length > 0 && (
                  <>
                    <h3 className="mt-8 font-display text-lg font-bold text-forest">Why people love it</h3>
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink/80">
                      {copy.highlights.map((h) => <li key={h}>{h}</li>)}
                    </ul>
                  </>
                )}
              </section>

              <div className="mt-10 divide-y divide-forest/10 border-y border-forest/10">
                {details.map((d, i) => (
                  <details key={d.title} className="group py-1" open={i < 2}>
                    <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-display text-lg font-bold text-forest [&::-webkit-details-marker]:hidden">
                      {d.title}
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-forest/20 text-lg leading-none transition-transform duration-300 group-open:rotate-45" aria-hidden>+</span>
                    </summary>
                    <div className="pb-5 text-ink/75">{d.body}</div>
                  </details>
                ))}
                {product.nutrition && (
                  <details className="group py-1">
                    <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-display text-lg font-bold text-forest [&::-webkit-details-marker]:hidden">
                      Nutrition
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-forest/20 text-lg leading-none transition-transform duration-300 group-open:rotate-45" aria-hidden>+</span>
                    </summary>
                    <table className="mb-5 w-full text-sm">
                      <thead><tr className="text-left text-ink/70"><th className="py-1 font-medium">Typical values</th><th className="py-1 font-medium">Per 100 ml</th></tr></thead>
                      <tbody>
                        {product.nutrition.map((r) => (
                          <tr key={r.label} className="border-t border-forest/10"><td className="py-1.5">{r.label}</td><td className="py-1.5">{r.per100}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                )}
              </div>
              {product.verifiedBenefits.length > 0 && (
                <ul className="mt-6 list-disc space-y-1 pl-5 text-sm text-ink/75">
                  {product.verifiedBenefits.map((b) => <li key={b}>{b}</li>)}
                </ul>
              )}
              <p className="mt-6 text-xs text-ink/75">
                Naturo Wellness drinks are foods, not medicines, and are not intended to diagnose, treat, cure or prevent any disease.
              </p>
            </div>
          </div>
        </div>
      </div>

      {otherShots.length > 0 && (
        <section aria-labelledby="shots-title" className="border-t border-forest/10 bg-warm py-12">
          <div className="container-x">
            <h2 id="shots-title" className="font-display text-xl font-bold text-forest">More Naturo Wellness shots</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {otherShots.map((p) => (
                <li key={p.id}>
                  <Link href={`/shop/${p.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-forest/20 px-4 text-sm font-semibold text-forest hover:bg-cream">
                    {p.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop" className="inline-flex min-h-11 items-center rounded-full bg-forest px-4 text-sm font-semibold text-warm">Shop all</Link>
              </li>
            </ul>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <Reveal as="section" aria-labelledby="faq-title" className="bg-cream py-20 lg:py-28">
          <div className="container-x grid gap-10 lg:grid-cols-12">
            <h2 id="faq-title" data-reveal className="display text-[clamp(2.2rem,5vw,4rem)] text-forest lg:col-span-4">
              Good <span className="serif-accent normal-case text-botanical">to</span> know
            </h2>
            <div className="divide-y divide-forest/10 border-y border-forest/10 lg:col-span-7 lg:col-start-6">
              {faqs.map((f) => (
                <details key={f.q} data-reveal className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-semibold text-forest [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-forest/20 transition-transform duration-300 group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="pb-6 text-ink/75">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {related.length > 0 && (
        <Reveal as="section" aria-labelledby="related-title" className="bg-warm py-20 lg:py-28">
          <div className="container-x">
            <div className="flex items-end justify-between gap-6">
              <h2 id="related-title" data-reveal className="display text-[clamp(2.2rem,5vw,4rem)] text-forest">
                You may <span className="serif-accent normal-case text-botanical">also</span> love
              </h2>
              <Link href="/shop" data-reveal className="hidden text-sm font-semibold uppercase tracking-[0.16em] text-forest underline-offset-4 hover:underline sm:block">
                Back to shop
              </Link>
            </div>
            <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.id} data-reveal>
                  <ProductCard product={p} samplePricing={settings.samplePricing} />
                </li>
              ))}
            </ul>
            <Link href="/shop" className="mt-12 inline-flex text-sm font-semibold uppercase tracking-[0.16em] text-forest underline underline-offset-4 sm:hidden">
              Back to shop
            </Link>
          </div>
        </Reveal>
      )}
    </>
  );
}
