import { NaturoMark } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { MotifImage, ProductImage } from "@/components/product/product-image";
import { ButtonLink } from "@/components/ui/button";
import { productBySlug } from "@/data/products";

/** Brand story: arch-framed composition + editorial copy. */
export function Story({ withLink = true }: { withLink?: boolean }) {
  const maheu = productBySlug("maheu-traditional")!;
  const ginger = productBySlug("ginger-shot")!;
  return (
    <Reveal as="section" aria-labelledby="story-title" className="cv-auto relative overflow-hidden bg-forest py-24 text-warm lg:py-36">
      <svg aria-hidden className="absolute -right-40 top-10 h-[560px] w-[560px] text-warm/[0.05]" viewBox="0 0 200 200">
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx="100" cy="100" r={12 + i * 11} fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="10 6" />
        ))}
      </svg>

      <div className="container-x relative grid items-center gap-16 lg:grid-cols-12">
        {/* Arch composition */}
        <div className="relative mx-auto w-full max-w-[30rem] lg:col-span-5">
          <div data-reveal-clip className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] bg-[linear-gradient(180deg,#77A84A_0%,#367A45_55%,#1F5534_100%)]">
            <div className="grain absolute inset-0" />
            <div className="absolute left-1/2 top-[14%] aspect-square w-[70%] -translate-x-1/2 rounded-full bg-sun/90 shadow-[0_0_120px_rgba(245,216,78,0.45)]" />
            <MotifImage motif="leaf" className="absolute -left-[8%] top-[34%] w-[44%] -rotate-[20deg]" sizes="20vw" />
            <MotifImage motif="tea-leaf" className="absolute -right-[4%] top-[20%] w-[30%] rotate-[30deg]" sizes="14vw" />
            <ProductImage
              product={maheu}
              sizes="(min-width: 1024px) 18vw, 40vw"
              className="absolute bottom-[4%] left-[10%] h-[66%] w-[46%]"
              imgClassName="[filter:drop-shadow(0_30px_26px_rgba(0,0,0,0.35))]"
            />
            <ProductImage
              product={ginger}
              sizes="(min-width: 1024px) 16vw, 36vw"
              className="absolute bottom-[3%] right-[8%] h-[56%] w-[44%]"
              imgClassName="[filter:drop-shadow(0_30px_26px_rgba(0,0,0,0.35))]"
            />
          </div>
          <div data-parallax="0.25" className="absolute -bottom-10 -right-6 w-[34%] sm:-right-12">
            <MotifImage motif="maize-kernels" sizes="16vw" className="[filter:drop-shadow(0_20px_20px_rgba(0,0,0,0.3))]" />
          </div>
          <div data-parallax="0.4" className="absolute -left-8 top-6 w-[22%]">
            <MotifImage motif="ginger-slice" sizes="10vw" className="[filter:drop-shadow(0_16px_16px_rgba(0,0,0,0.3))]" />
          </div>
        </div>

        {/* Copy */}
        <div className="lg:col-span-6 lg:col-start-7">
          <p data-reveal className="eyebrow flex items-center gap-3 text-sun">
            <NaturoMark className="h-5 w-5" /> Our story
          </p>
          <h2 id="story-title" data-reveal className="display mt-6 text-[clamp(2.6rem,6.5vw,5.6rem)]">
            Rooted in nature. <span className="serif-accent normal-case text-citrus">Proudly</span> Zimbabwean.
          </h2>
          <div className="mt-10 space-y-5 text-lg leading-relaxed text-warm/80">
            <p data-reveal>
              At Naturo Wellness, we believe everyday wellness should feel natural, familiar and accessible.
            </p>
            <p data-reveal>
              We bring together plant-inspired blends, traditional favourites and the convenience modern life demands.
            </p>
            <p data-reveal>
              From a quick wellness shot to a comforting cup of herbal tea, our range celebrates ingredients, flavours and
              traditions that feel close to home.
            </p>
          </div>
          <blockquote data-reveal className="mt-10 border-l-2 border-sun pl-6">
            <p className="serif-accent text-2xl leading-snug text-warm lg:text-3xl">
              Our mission is simple: to make everyday wellness natural, affordable and proudly Zimbabwean.
            </p>
          </blockquote>
          {withLink && (
            <div data-reveal className="mt-10">
              <ButtonLink href="/our-story" variant="sun" size="lg">
                Discover our story
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}
