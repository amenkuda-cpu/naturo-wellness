"use client";

import { useRef } from "react";
import { MOTION, gsap, useGSAP } from "@/lib/gsap";
import type { Product } from "@/lib/types";
import { MotifImage, ProductImage } from "./product-image";

const SLOTS = [
  "left-[4%] top-[8%] w-[22%]",
  "right-[4%] top-[18%] w-[20%]",
  "left-[8%] bottom-[8%] w-[24%]",
  "right-[8%] bottom-[4%] w-[18%]",
];

/** Large, art-directed product image with a reveal, floating motifs and pointer tilt. */
export function ProductStage({ product }: { product: Product }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // Desktop only: on phones the product image is the LCP element and must
      // paint immediately, so it is never hidden for an entrance.
      mm.add(MOTION.desktop, () => {
        const q = gsap.utils.selector(root);
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          // Transform-only for the product itself: it is never hidden, so there is
          // no flash between the server-rendered image and hydration.
          .fromTo(q("[data-bottle]"), { y: 40, rotation: -3 }, { y: 0, rotation: 0, duration: 1.4 })
          .fromTo(q("[data-motif]"), { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.2, stagger: 0.08, ease: "back.out(1.6)" }, 0.2);
        q("[data-float]").forEach((el, i) =>
          gsap.to(el, { y: i % 2 ? 14 : -14, rotation: i % 2 ? 6 : -6, duration: 3 + i * 0.4, yoyo: true, repeat: -1, ease: "sine.inOut" }),
        );
      });
      mm.add(`${MOTION.desktop} and (pointer: fine)`, () => {
        const q = gsap.utils.selector(root);
        const rx = gsap.quickTo(q("[data-tilt]"), "rotationY", { duration: 0.9, ease: "power3.out" });
        const ry = gsap.quickTo(q("[data-tilt]"), "rotationX", { duration: 0.9, ease: "power3.out" });
        const el = root.current!;
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          rx(((e.clientX - r.left) / r.width - 0.5) * 10);
          ry(-((e.clientY - r.top) / r.height - 0.5) * 8);
        };
        const leave = () => {
          rx(0);
          ry(0);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        return () => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        };
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative [perspective:1200px]">
      <div
        data-panel
        className="grain relative isolate aspect-[4/5] overflow-hidden rounded-[2rem]"
        style={{ backgroundColor: product.theme.tint }}
      >
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 -z-10 aspect-square w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: `radial-gradient(circle, ${product.theme.accent}66 0%, transparent 68%)` }}
        />
        {product.motifs.slice(0, 4).map((m, i) => (
          <div key={m + i} data-motif className={`absolute ${SLOTS[i]}`}>
            <div data-float>
              <MotifImage motif={m} sizes="14vw" className="[filter:drop-shadow(0_16px_16px_rgba(23,49,38,0.2))]" />
            </div>
          </div>
        ))}
        <div data-tilt className="absolute inset-[7%] [transform-style:preserve-3d]">
          <div data-bottle className="absolute inset-0">
            <ProductImage
              product={product}
              priority
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="h-full w-full"
              imgClassName="[filter:drop-shadow(0_40px_34px_rgba(23,49,38,0.3))]"
              showPlaceholderNotice
            />
          </div>
        </div>
      </div>
    </div>
  );
}
