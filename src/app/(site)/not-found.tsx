import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { HangingBottle } from "@/components/visual/hanging-bottle";
import { productBySlug } from "@/data/products";

export default function NotFound() {
  const p = productBySlug("glow-shot")!;
  return (
    <section className="grain relative isolate overflow-hidden bg-cream pb-24 pt-32">
      <div className="relative mx-auto h-[38vh] min-h-[260px] w-full max-w-md" aria-hidden>
        <HangingBottle product={p} className="sway left-1/2 [--h:30vh] [--len:6vh]" />
      </div>
      <div className="container-x text-center">
        <p className="eyebrow text-botanical">Error 404</p>
        <h1 className="display mt-4 text-[clamp(2.6rem,8vw,6rem)] text-forest">
          This page went <span className="serif-accent normal-case text-botanical">wandering.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-ink/70">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/shop">Shop wellness shots</ButtonLink>
          <ButtonLink href="/" variant="outline">Back home</ButtonLink>
        </div>
        <p className="mt-8 text-ink/70">
          Popular right now:{" "}
          <Link href="/shop/ginger-shot" className="font-semibold text-forest underline underline-offset-4">Ginger Shot</Link>,{" "}
          <Link href="/shop/hibiscus-shot" className="font-semibold text-forest underline underline-offset-4">Hibiscus Shot</Link> and{" "}
          <Link href="/shop/mens-vitality-shot" className="font-semibold text-forest underline underline-offset-4">Men&apos;s Vitality Shot</Link>.
        </p>
      </div>
    </section>
  );
}
