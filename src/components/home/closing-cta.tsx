import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { HangingBottle } from "@/components/visual/hanging-bottle";
import { productBySlug } from "@/data/products";

/** Final call to action with gently swaying bottles (CSS-only motion). */
export function ClosingCta() {
  const items = [
    { p: productBySlug("glow-shot")!, cls: "left-[12%] [--h:30vh] [--len:10vh] sm:left-[10%] [animation-delay:-1.2s]" },
    { p: productBySlug("ginger-shot")!, cls: "left-[50%] [--h:40vh] [--len:6vh] [animation-delay:-0.4s]" },
    { p: productBySlug("hibiscus-shot")!, cls: "left-[88%] [--h:30vh] [--len:14vh] sm:left-[90%] [animation-delay:-2s]" },
  ];
  return (
    <Reveal as="section" aria-labelledby="cta-title" className="grain relative isolate overflow-hidden bg-sun">
      <div className="relative h-[52vh] min-h-[360px] lg:h-[58vh]" aria-hidden>
        {items.map(({ p, cls }) => (
          <HangingBottle key={p.id} product={p} className={`sway ${cls}`} sizes="(min-width: 1024px) 18vw, 30vw" />
        ))}
      </div>
      <div className="container-x relative pb-24 text-center lg:pb-32">
        <h2 id="cta-title" data-reveal className="display text-[clamp(2.8rem,9vw,8rem)] text-forest">
          Feel good. <span className="serif-accent normal-case text-botanical">Naturally.</span>
        </h2>
        <p data-reveal className="mx-auto mt-6 max-w-md text-lg text-forest/80">
          Your daily goodness is ready when you are.
        </p>
        <div data-reveal className="mt-9 flex justify-center">
          <ButtonLink href="/shop" size="lg" icon={<ArrowRight className="h-4 w-4" aria-hidden />}>
            Shop Naturo
          </ButtonLink>
        </div>
      </div>
    </Reveal>
  );
}
