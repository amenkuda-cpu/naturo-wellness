import { MotifImage } from "@/components/product/product-image";
import { cn } from "@/lib/cn";
import type { Motif } from "@/lib/types";

/** Shared editorial header for inner pages. */
export function PageHero({
  eyebrow,
  title,
  accent,
  intro,
  motifs = ["leaf", "lemon-slice"],
  tone = "cream",
  children,
}: {
  eyebrow: string;
  title: string;
  /** Optional word(s) set in the serif accent, appended to the title. */
  accent?: string;
  intro?: string;
  motifs?: Motif[];
  tone?: "cream" | "sun" | "forest";
  children?: React.ReactNode;
}) {
  const bg = { cream: "bg-cream text-forest", sun: "bg-sun text-forest", forest: "bg-forest text-warm" }[tone];
  return (
    <header className={cn("grain relative isolate overflow-hidden pb-14 pt-32 sm:pt-36 lg:pb-20 lg:pt-44", bg)}>
      <MotifImage motif={motifs[0]} className="absolute -right-10 top-20 -z-10 w-40 rotate-12 opacity-90 sm:w-56 lg:right-[6%] lg:w-72" sizes="300px" />
      {motifs[1] && (
        <MotifImage motif={motifs[1]} className="absolute -bottom-10 right-[30%] -z-10 hidden w-28 -rotate-12 opacity-80 sm:block lg:w-40" sizes="200px" />
      )}
      <div className="container-x">
        <p className={cn("eyebrow", tone === "forest" ? "text-sun" : "text-botanical")}>{eyebrow}</p>
        <h1 className="display mt-5 max-w-5xl text-[clamp(2.8rem,9vw,7.5rem)]">
          {title}
          {accent && (
            <>
              {" "}
              <span className={cn("serif-accent normal-case", tone === "forest" ? "text-citrus" : "text-botanical")}>{accent}</span>
            </>
          )}
        </h1>
        {intro && <p className="mt-6 max-w-xl text-lg leading-relaxed opacity-80">{intro}</p>}
        {children}
      </div>
    </header>
  );
}
