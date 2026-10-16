import { ChevronRight, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/product/product-card";
import { ProductStage } from "@/components/product/product-stage";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import { categoryById, products as localProducts } from "@/data/products";
import { getCatalog, getProductBySlug, getStoreSettings } from "@/lib/commerce/catalog";
import { isVariantPurchasable } from "@/lib/commerce/pricing";
import type { Product } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return localProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: `${product.shortDescription} Naturo Wellness, proudly made in Zimbabwe.`,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      title: `${product.name} | Naturo Wellness`,
      description: product.shortDescription,
      images: product.images[0] ? [{ url: product.images[0].src, alt: product.images[0].alt }] : undefined,
    },
  };
}

function productJsonLd(product: Product) {
  const priced = product.variants.filter((v) => v.price !== null);
  const availability = (p: Product, v: Product["variants"][number]) =>
    v.stockStatus === "out_of_stock"
      ? "https://schema.org/OutOfStock"
      : isVariantPurchasable(p, v)
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder";
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: product.images.map((i) => `${siteConfig.url}${i.src}`),
    brand: { "@type": "Brand", name: "Naturo" },
    category: categoryById(product.category).name,
    // Offers are only published when a real price exists.
    ...(priced.length
      ? {
          offers: priced.map((v) => ({
            "@type": "Offer",
            price: (v.price! / 100).toFixed(2),
            priceCurrency: product.currency,
            availability: availability(product, v),
            url: `${siteConfig.url}/shop/${product.slug}`,
          })),
        }
      : {}),
  };
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-warm pb-20 pt-24 sm:pt-28 lg:pt-32" aria-busy="true">
      <div className="container-x grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="aspect-[4/5] animate-pulse rounded-[2rem] bg-cream lg:col-span-7" />
        <div className="space-y-4 lg:col-span-5 lg:pt-6">
          <div className="h-4 w-32 rounded bg-cream" />
          <div className="h-20 w-3/4 rounded bg-cream" />
          <div className="h-6 w-1/2 rounded bg-cream" />
        </div>
      </div>
    </div>
  );
}

async function ProductContent({ params }: Props) {
  const { slug } = await params;
  const [product, catalog, settings] = await Promise.all([getProductBySlug(slug), getCatalog(), getStoreSettings()]);
  if (!product) notFound();

  const category = categoryById(product.category);
  const related = product.relatedSlugs
    .map((s) => catalog.find((p) => p.slug === s))
    .filter((p): p is Product => Boolean(p))
    .slice(0, 3);

  const details: { title: string; body: React.ReactNode }[] = [
    {
      title: "Ingredients",
      body: product.ingredients?.length ? (
        <p>{product.ingredients.join(", ")}.</p>
      ) : (
        <p>
          Our full ingredient list will be published here once it has been verified against the approved label. Until
          then, please refer to the bottle or <Link href="/contact" className="underline underline-offset-4">contact us</Link>.
        </p>
      ),
    },
    {
      title: "How to enjoy",
      body: <p>{product.preparation ?? "Serving suggestions will be shared here with the final label."}</p>,
    },
    {
      title: "Storage",
      body: <p>{product.storage ?? "Please follow the storage instructions printed on the label."}</p>,
    },
    {
      title: "Allergens",
      body: <p>{product.allergens ?? "Allergen information will be confirmed on the final label. If you have an allergy, please check the label or contact us before ordering."}</p>,
    },
  ];

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <div className="bg-warm pb-20 pt-24 sm:pt-28 lg:pt-32">
        <div className="container-x">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink/70">
            <ol className="flex flex-wrap items-center gap-1.5">
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
              <p className="eyebrow text-botanical">{category.name}</p>
              <h1 className="display mt-4 text-[clamp(2.8rem,7vw,5.4rem)] text-forest">{product.name}</h1>
              <p className="serif-accent mt-3 text-2xl" style={{ color: product.theme.deep }}>{product.mood}</p>
              <p className="mt-5 text-lg leading-relaxed text-ink/80">{product.shortDescription}</p>

              <div className="mt-8 border-t border-forest/10 pt-8">
                <PurchasePanel slug={product.slug} />
              </div>

              <div className="mt-8 flex items-start gap-3 rounded-2xl bg-cream p-5 text-sm">
                <Truck className="mt-0.5 h-5 w-5 shrink-0 text-botanical" aria-hidden />
                <p className="text-ink/75">
                  Delivery and collection options are shown at checkout. Our team confirms every order before dispatch.{" "}
                  <Link href="/delivery" className="font-medium text-forest underline underline-offset-4">Delivery information</Link>
                </p>
              </div>

              <div className="mt-10 space-y-4 text-ink/80">
                {product.fullDescription.map((para) => <p key={para} className="leading-relaxed">{para}</p>)}
              </div>

              <div className="mt-10 divide-y divide-forest/10 border-y border-forest/10">
                {details.map((d, i) => (
                  <details key={d.title} className="group py-1" open={i === 0}>
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
            </div>
          </div>
        </div>
      </div>

      {product.faqs.length > 0 && (
        <Reveal as="section" aria-labelledby="faq-title" className="bg-cream py-20 lg:py-28">
          <div className="container-x grid gap-10 lg:grid-cols-12">
            <h2 id="faq-title" data-reveal className="display text-[clamp(2.2rem,5vw,4rem)] text-forest lg:col-span-4">
              Good <span className="serif-accent normal-case text-botanical">to</span> know
            </h2>
            <div className="divide-y divide-forest/10 border-y border-forest/10 lg:col-span-7 lg:col-start-6">
              {product.faqs.map((f) => (
                <details key={f.question} data-reveal className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-semibold text-forest [&::-webkit-details-marker]:hidden">
                    {f.question}
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-forest/20 transition-transform duration-300 group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="pb-6 text-ink/75">{f.answer}</p>
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
