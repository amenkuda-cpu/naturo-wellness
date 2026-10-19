import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { AddToCartButton } from "@/components/product/add-to-cart";
import { PriceTag } from "@/components/product/price";
import { MotifImage, ProductImage } from "@/components/product/product-image";
import { ButtonLabel, buttonClasses } from "@/components/ui/button";
import { HangingBottle } from "@/components/visual/hanging-bottle";
import { isDevSamplePrice } from "@/config/commerce";
import { categoryById, isAgeRestricted } from "@/data/products";
import { cn } from "@/lib/cn";
import type { Motif, Product } from "@/lib/types";
import { ShowcaseMotion, type Choreography } from "./showcase-motion";

interface SceneDef {
  id: string;
  slugs: [string, ...string[]];
  style: Choreography;
  bg: string;
  dark?: boolean;
  ghost: string;
  accent: string;
  /** Short label for the progress rail. */
  label: string;
}

/** Art direction for each scene. Copy & prices always come from the catalogue. */
const SCENES: SceneDef[] = [
  { id: "ginger", label: "Ginger", slugs: ["ginger-shot"], style: "swing", bg: "#F6DFA6", ghost: "GINGER", accent: "#C9781A" },
  { id: "glow", label: "Glow", slugs: ["glow-shot"], style: "soft", bg: "#E7EFCB", ghost: "GLOW", accent: "#77A84A" },
  { id: "hibiscus", label: "Hibiscus", slugs: ["hibiscus-shot"], style: "drop", bg: "#5E0E22", dark: true, ghost: "HIBISCUS", accent: "#F26C83" },
  { id: "pineapple", label: "Pineapple", slugs: ["pineapple-shot"], style: "tropical", bg: "#F9D449", ghost: "TROPICAL", accent: "#E8A118" },
  { id: "vitality", label: "Vitality", slugs: ["mens-vitality-shot"], style: "rise", bg: "#173F2B", dark: true, ghost: "VITALITY", accent: "#C7832F" },
  { id: "tea", label: "Tea", slugs: ["ginger-lemon-tea", "hibiscus-tea"], style: "steam", bg: "#F3EAD6", ghost: "SLOW", accent: "#E9A62E" },
  { id: "heritage", label: "Heritage", slugs: ["maheu-traditional", "maheu-buttermilk"], style: "meet", bg: "#E6D2AA", ghost: "HERITAGE", accent: "#A86B2C" },
  { id: "cans", label: "Cans 18+", slugs: ["orange-can", "cranberry-can"], style: "drop", bg: "#1F2550", dark: true, ghost: "CHEERS", accent: "#F2711C" },
];

const ING_SLOTS = [
  "left-[2%] top-[8%] w-[24%] lg:left-[4%] lg:top-[10%] lg:w-[22%]",
  "right-[0%] top-[26%] w-[22%] lg:right-[2%] lg:top-[24%] lg:w-[20%]",
  "left-[6%] bottom-[6%] w-[28%] lg:left-[6%] lg:bottom-[8%] lg:w-[24%]",
  "right-[4%] bottom-[0%] w-[22%] lg:right-[8%] lg:bottom-[4%] lg:w-[18%]",
];

/* ─────────────────────────────── Component ─────────────────────────────── */

export function ProductShowcase({ catalog, samplePricing }: { catalog: Product[]; samplePricing: boolean }) {
  const scenes = SCENES.map((def) => ({
    def,
    products: def.slugs.map((s) => catalog.find((p) => p.slug === s)).filter(Boolean) as Product[],
  })).filter((s) => s.products.length > 0);
  const settings = { samplePricing };

  return (
    <ShowcaseMotion styles={scenes.map((s) => s.def.style)}>
      <header className="container-x relative pb-14 pt-24 lg:pb-20 lg:pt-36">
        <div className="grid items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="eyebrow text-botanical">The Naturo range · {catalog.length} blends</p>
            <h2 id="showcase-title" className="display mt-5 text-[clamp(3rem,10vw,8.5rem)] text-forest">
              Meet your <span className="serif-accent normal-case text-botanical">daily</span> goodness.
            </h2>
          </div>
          <p className="max-w-sm text-lg leading-relaxed text-ink/75 lg:col-span-4 lg:justify-self-end">
            Different blends. Different moments. One natural way to feel good.
          </p>
        </div>
        <nav aria-label="Products in this showcase" className="sr-only focus-within:not-sr-only focus-within:mt-6">
          <ul className="flex flex-wrap gap-2">
            {scenes.flatMap((s) =>
              s.products.map((p) => (
                <li key={p.id}>
                  <Link href={`/shop/${p.slug}`} className="rounded-full border px-3 py-1 text-sm">
                    {p.name}
                  </Link>
                </li>
              )),
            )}
          </ul>
        </nav>
      </header>

      <div data-stage className="relative lg:motion-safe:h-svh lg:motion-safe:overflow-hidden">
        {scenes.map((scene, i) => (
          <Scene
            key={scene.def.id}
            def={scene.def}
            products={scene.products}
            index={i}
            total={scenes.length}
            samplePricing={settings.samplePricing}
          />
        ))}

        {/* Progress rail (desktop pinned mode only) */}
        <div aria-hidden className="pointer-events-none absolute right-5 top-1/2 z-30 hidden -translate-y-1/2 lg:motion-safe:block">
          <ol className="flex flex-col gap-1 rounded-2xl bg-warm/80 p-3 shadow-lg backdrop-blur-md">
            {scenes.map((s, i) => (
              <li
                key={s.def.id}
                data-rail-item
                data-active={i === 0 ? "" : undefined}
                className="group flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink/40 transition-colors data-[active]:text-forest"
              >
                <span className="h-px w-3 bg-current transition-all duration-500 group-data-[active]:w-7" />
                {s.def.label}
              </li>
            ))}
          </ol>
        </div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 z-30 hidden h-1 bg-forest/10 lg:motion-safe:block">
          <div data-progress className="h-full origin-left scale-x-0 bg-sun" />
        </div>
      </div>
    </ShowcaseMotion>
  );
}

/* ─────────────────────────────── Scene ─────────────────────────────── */

function Scene({
  def,
  products,
  index,
  total,
  samplePricing,
}: {
  def: SceneDef;
  products: Product[];
  index: number;
  total: number;
  samplePricing: boolean;
}) {
  const [primary, secondary] = products;
  const flip = index % 2 === 1;
  const motifs = primary.motifs.slice(0, 4) as Motif[];
  const words = primary.name.split(" ");
  const labels = primary.mood.split(".").map((s) => s.trim()).filter(Boolean);
  const textTone = def.dark ? "text-warm" : "text-forest";
  const variant = primary.variants[0];

  return (
    <article
      data-scene
      aria-labelledby={`scene-${def.id}`}
      className={cn(
        "relative overflow-hidden max-lg:cv-auto max-lg:[contain-intrinsic-size:auto_1050px] lg:motion-safe:absolute lg:motion-safe:inset-0",
        index > 0 && "lg:motion-safe:invisible",
        textTone,
      )}
    >
      <div data-s="bg" className="absolute inset-0" style={{ backgroundColor: def.bg }}>
        <div className="grain absolute inset-0" />
        {def.style === "meet" && (
          <svg data-s="pattern" aria-hidden className="absolute inset-0 h-full w-full opacity-[0.13]">
            <defs>
              <pattern id="weave" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <path d="M0 11h44M0 33h44M11 0v44M33 0v44" stroke="#4A2D10" strokeWidth="9" fill="none" strokeDasharray="22 22" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#weave)" />
          </svg>
        )}
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.09]">
        <p
          data-s="ghost"
          className="select-none whitespace-nowrap font-display text-[30vw] font-extrabold leading-none tracking-[-0.06em] lg:text-[22vw]"
        >
          {def.ghost}
        </p>
      </div>

      <div className="container-x relative grid items-center gap-4 py-16 lg:h-full lg:min-h-svh lg:grid-cols-12 lg:gap-10 lg:py-0">
        {/* Visual */}
        <div className={cn("relative h-[58svh] min-h-[380px] lg:col-span-6 lg:h-[82svh]", flip && "lg:order-2 lg:col-start-7")}>
          {def.style === "rise" &&
            [0, 1, 2].map((r) => (
              <span
                key={r}
                data-s="ring"
                aria-hidden
                className="absolute left-1/2 top-1/2 aspect-square rounded-full border"
                style={{
                  width: `${46 + r * 20}%`,
                  borderColor: `${def.accent}${["66", "44", "22"][r]}`,
                  marginLeft: `-${(46 + r * 20) / 2}%`,
                  marginTop: `-${(46 + r * 20) / 2}%`,
                }}
              />
            ))}
          {def.style !== "rise" && (
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 aspect-square w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: `radial-gradient(circle, ${def.accent}${def.dark ? "55" : "40"} 0%, transparent 68%)` }}
            />
          )}

          {motifs.map((m, i) => (
            <div key={`${m}-${i}`} data-s="ing" className={cn("absolute z-20", ING_SLOTS[i])}>
              <MotifImage
                motif={m}
                sizes="(min-width: 1024px) 12vw, 25vw"
                className="[filter:drop-shadow(0_16px_16px_rgba(0,0,0,0.18))]"
              />
            </div>
          ))}

          {def.style === "swing" ? (
            <div data-s="bottle" className="absolute inset-0 z-10">
              <HangingBottle
                product={primary}
                className="left-1/2 [--h:46svh] [--len:9svh] lg:[--h:64svh] lg:[--len:10svh]"
                sizes="(min-width: 1024px) 30vw, 60vw"
              />
            </div>
          ) : def.style === "meet" && secondary ? (
            <>
              <div data-s="bottle" className="absolute inset-y-[6%] left-[6%] z-10 w-[46%]">
                <ProductImage product={primary} className="h-full w-full" imgClassName="[filter:drop-shadow(0_30px_30px_rgba(0,0,0,0.25))]" />
              </div>
              <div data-s="bottle2" className="absolute inset-y-[10%] right-[6%] z-10 w-[42%]">
                <ProductImage product={secondary} className="h-full w-full" imgClassName="[filter:drop-shadow(0_30px_30px_rgba(0,0,0,0.25))]" />
              </div>
            </>
          ) : (
            <>
              {def.style === "steam" && (
                <svg data-s="steam" aria-hidden viewBox="0 0 120 160" className="absolute left-[38%] top-[-2%] z-0 w-[24%] text-forest/35" fill="none">
                  {[20, 60, 100].map((x, k) => (
                    <path
                      key={x}
                      d={`M${x} 160 C ${x - 18} 130, ${x + 18} 105, ${x} 80 S ${x - 16} 35, ${x + 4} ${8 + k * 6}`}
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray="1"
                      strokeDashoffset="0"
                    />
                  ))}
                </svg>
              )}
              <div data-s="bottle" className={cn("absolute z-10", secondary ? "inset-y-[8%] left-[4%] w-[60%]" : "inset-[6%]")}>
                <ProductImage
                  product={primary}
                  className="h-full w-full"
                  sizes="(min-width: 1024px) 34vw, 70vw"
                  imgClassName="[filter:drop-shadow(0_34px_30px_rgba(0,0,0,0.25))]"
                />
              </div>
              {secondary && (
                <div data-s="bottle2" className="absolute bottom-[6%] right-[2%] z-10 h-[62%] w-[42%]">
                  <ProductImage product={secondary} className="h-full w-full" imgClassName="[filter:drop-shadow(0_24px_24px_rgba(0,0,0,0.22))]" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Copy */}
        <div className={cn("relative z-20 lg:col-span-5", flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-8")}>
          <p data-s="copy" className="eyebrow flex items-center gap-3 opacity-80">
            <span className="tabular-nums">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <span className="h-px w-8 bg-current opacity-40" />
            {categoryById(primary.category).name}
          </p>
          <h3 id={`scene-${def.id}`} className="display mt-5 text-[clamp(3rem,12vw,6.4rem)] lg:text-[clamp(3.4rem,6vw,6.8rem)]">
            {words.map((w, i) => (
              <span key={i} className="mr-[0.18em] inline-block overflow-hidden pb-[0.04em] align-top last:mr-0">
                <span data-s="name" className="block">
                  {w}
                </span>
              </span>
            ))}
          </h3>
          <p data-s="copy" className="serif-accent mt-4 text-2xl lg:text-3xl" style={{ color: def.dark ? "#FBEA91" : primary.theme.deep }}>
            {primary.mood}
          </p>
          <p data-s="copy" className="mt-4 max-w-md text-base leading-relaxed opacity-85 lg:text-lg">
            {primary.shortDescription}
          </p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Character">
            {labels.map((l) => (
              <li
                key={l}
                data-s="tag"
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em]",
                  def.dark ? "border-warm/30" : "border-forest/20",
                )}
              >
                {l}
              </li>
            ))}
          </ul>
          <div data-s="copy" className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-4">
            <Link
              href={`/shop/${primary.slug}`}
              className={buttonClasses({ variant: def.dark ? "sun" : "primary", size: "lg" })}
            >
              <ButtonLabel>{isAgeRestricted(primary) ? "Explore the cans" : "Explore this blend"}</ButtonLabel>
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <div className="flex items-center gap-3">
              <PriceTag product={primary} className="text-lg" sample={samplePricing && isDevSamplePrice(variant?.id)} />
              <AddToCartButton product={primary} compact tone={def.dark ? "light" : "dark"} />
            </div>
          </div>
          {isAgeRestricted(primary) && (
            <p data-s="copy" className="mt-6 text-sm font-semibold opacity-90">
              Contains alcohol (5.2% alc./vol.). 18+ only. Please enjoy responsibly.
            </p>
          )}
          {secondary && (
            <p data-s="copy" className="mt-6 text-sm opacity-80">
              Also in this family:{" "}
              <Link href={`/shop/${secondary.slug}`} className="font-semibold underline decoration-1 underline-offset-4">
                {secondary.name}
              </Link>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
