import { Leaf, MessageCircle, Sparkles, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { brand } from "@/config/brand";
import { SHOT_SLUGS } from "@/data/product-copy";
import { formatMoney } from "@/lib/commerce/pricing";
import type { Product } from "@/lib/types";

/**
 * Server-rendered brand intro right under the hero: who we are, the five shots (with links),
 * trust signals and the two main actions. This is the copy search engines read first.
 */
export function HomeIntro({ catalog }: { catalog: Product[] }) {
  const shots = SHOT_SLUGS.map((s) => catalog.find((p) => p.slug === s)).filter((p): p is Product => Boolean(p));
  const trust = [
    { icon: UserRound, title: "Founder-led", body: `Created by ${brand.founder.name} in Harare, and still made with her recipes.` },
    { icon: Sparkles, title: "Made fresh", body: "Every shot is made fresh in Zimbabwe, so it tastes the way it should." },
    { icon: Leaf, title: "Natural ingredients", body: "Real ginger, hibiscus, pineapple and botanicals. Every label tells you what's inside." },
    { icon: MessageCircle, title: "Order your way", body: "Check out online in a minute, or send us your order on WhatsApp." },
  ];
  return (
    <section aria-labelledby="intro-title" className="bg-warm py-16 lg:py-24">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="eyebrow text-botanical">Naturo Wellness Zimbabwe</p>
            <h2 id="intro-title" className="display mt-4 text-[clamp(2.2rem,5vw,4rem)] text-forest">
              Wellness shots, <span className="serif-accent normal-case text-botanical">made</span> in Harare
            </h2>
          </div>
          <div className="space-y-4 text-lg leading-relaxed text-ink/80 lg:col-span-6">
            <p>
              Naturo Wellness is a Zimbabwean wellness brand making natural wellness shots, fresh in Harare. Our ginger
              shots, hibiscus shot, men&apos;s wellness shot, Glow and Pineapple shots come in handy 100 ml bottles, made
              for real routines: the school run, the commute, the gym and the long day at work.
            </p>
            <p>
              It started in a home kitchen with founder {brand.founder.name}, a handful of ingredients she trusted and a
              lot of patient testing. Today our vision is simple: to become a trusted African wellness brand, rooted in
              Zimbabwe. <Link href="/our-story" className="font-semibold text-forest underline underline-offset-4">Read our story</Link>.
            </p>
          </div>
        </div>

        <h2 className="sr-only">Our wellness shots</h2>
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {shots.map((p) => {
            const v = p.variants.find((x) => x.price !== null);
            return (
              <li key={p.id}>
                <Link
                  href={`/shop/${p.slug}`}
                  className="group flex h-full flex-col items-center rounded-[1.5rem] p-4 text-center transition hover:-translate-y-0.5"
                  style={{ background: p.theme.tint }}
                >
                  <span className="relative block aspect-[2/3] w-full max-w-[9rem]">
                    <Image
                      src={p.images[0].src}
                      alt={`Naturo Wellness ${p.name} bottle, 100 ml`}
                      fill
                      sizes="(min-width: 1024px) 12vw, 40vw"
                      className="object-contain"
                      loading="lazy"
                    />
                  </span>
                  <span className="mt-3 font-display text-lg font-bold leading-tight text-forest">{p.name}</span>
                  {v && <span className="mt-1 text-sm font-semibold text-ink/70">{formatMoney(v.price!, p.currency)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trust.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream text-botanical">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block font-display text-lg font-bold text-forest">{title}</span>
                <span className="mt-1 block text-ink/75">{body}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/shop" className="inline-flex h-12 items-center rounded-full bg-forest px-7 text-sm font-bold uppercase tracking-[0.14em] text-warm hover:bg-botanical">
            Shop now
          </Link>
          <a
            href={brand.whatsappUrl}
            target="_blank"
            rel="noopener"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-forest/30 px-6 text-sm font-bold uppercase tracking-[0.14em] text-forest hover:bg-cream"
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> Order on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
