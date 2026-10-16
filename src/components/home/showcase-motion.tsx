"use client";

import { useRef } from "react";
import { MOTION, ScrollTrigger, gsap, useGSAP, whenIdle } from "@/lib/gsap";

export type Choreography = "swing" | "soft" | "drop" | "tropical" | "rise" | "steam" | "meet";

/* ─────────────────────────────── Choreography ─────────────────────────────── */

function enterScene(tl: gsap.core.Timeline, scene: Element, style: Choreography, at: number, flip: boolean) {
  const q = gsap.utils.selector(scene);
  const dir = flip ? -1 : 1;
  const bottle = q('[data-s="bottle"]');
  const bottle2 = q('[data-s="bottle2"]');
  const ings = q('[data-s="ing"]');

  tl.fromTo(q('[data-s="ghost"]'), { xPercent: 18 * dir, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 1.4, ease: "power2.out" }, at);

  switch (style) {
    case "swing": {
      tl.fromTo(bottle, { x: "-60vw" }, { x: 0, duration: 1, ease: "power2.out" }, at);
      const p = q("[data-pendulum]");
      tl.fromTo(p, { rotation: 42 }, { rotation: -16, duration: 0.7, ease: "sine.out" }, at)
        .to(p, { rotation: 7, duration: 0.35, ease: "sine.inOut" })
        .to(p, { rotation: -2.5, duration: 0.3, ease: "sine.inOut" })
        .to(p, { rotation: 0, duration: 0.25, ease: "sine.inOut" });
      tl.fromTo(ings, { x: "-30vw", autoAlpha: 0, rotate: -40 }, { x: 0, autoAlpha: 1, rotate: 0, duration: 1.1, stagger: 0.06, ease: "power3.out" }, at + 0.15);
      break;
    }
    case "soft":
      tl.fromTo(bottle, { scale: 0.8, y: 50, autoAlpha: 0, filter: "blur(16px)" }, { scale: 1, y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 1.2, ease: "power2.out" }, at);
      tl.fromTo(ings, { y: 80, autoAlpha: 0, rotate: 25 }, { y: 0, autoAlpha: 1, rotate: 0, duration: 1.3, stagger: 0.1, ease: "sine.out" }, at + 0.2);
      break;
    case "drop":
      tl.fromTo(bottle, { y: "-115vh", rotation: -6 }, { y: 0, rotation: 0, duration: 0.65, ease: "power2.in" }, at)
        .to(bottle, { keyframes: { y: [0, -46, 0, -14, 0], rotation: [0, 2, -1, 0.5, 0] }, duration: 0.6, ease: "none" });
      tl.fromTo(
        ings,
        { x: (i: number) => [140, -140, 160, -120][i % 4], y: (i: number) => [140, 120, -120, -140][i % 4], autoAlpha: 0, scale: 0.3 },
        { x: 0, y: 0, autoAlpha: 1, scale: 1, duration: 0.9, stagger: 0.05, ease: "back.out(1.7)" },
        at + 0.62,
      );
      break;
    case "tropical":
      tl.fromTo(bottle, { x: "62vw", rotation: 28 }, { x: 0, rotation: -7, duration: 0.85, ease: "power3.out" }, at)
        .to(bottle, { rotation: 3, duration: 0.3, ease: "sine.inOut" })
        .to(bottle, { rotation: 0, duration: 0.25, ease: "sine.inOut" });
      tl.fromTo(ings, { scale: 0, autoAlpha: 0, rotate: 90 }, { scale: 1, autoAlpha: 1, rotate: 0, duration: 0.8, stagger: 0.07, ease: "back.out(2.2)" }, at + 0.45);
      break;
    case "rise":
      tl.fromTo(bottle, { y: "75vh" }, { y: 0, duration: 1.2, ease: "power4.out" }, at);
      tl.fromTo(q('[data-s="ring"]'), { scale: 0.2, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.2, stagger: 0.12, ease: "power2.out" }, at + 0.3);
      tl.fromTo(ings, { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08, ease: "power3.out" }, at + 0.5);
      break;
    case "steam":
      tl.fromTo(bottle, { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.5, ease: "sine.out" }, at);
      tl.fromTo(bottle2, { x: 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 1.4, ease: "sine.out" }, at + 0.3);
      tl.fromTo(q('[data-s="steam"] path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.4, stagger: 0.2, ease: "sine.inOut" }, at + 0.5);
      tl.fromTo(ings, { y: -220, autoAlpha: 0, rotate: (i: number) => (i % 2 ? 60 : -60) }, { y: 0, autoAlpha: 1, rotate: 0, duration: 1.8, stagger: 0.15, ease: "sine.out" }, at + 0.2);
      break;
    case "meet":
      tl.fromTo(bottle, { x: "-55vw", rotation: -14 }, { x: 0, rotation: 0, duration: 1.1, ease: "power3.out" }, at);
      tl.fromTo(bottle2, { x: "55vw", rotation: 14 }, { x: 0, rotation: 0, duration: 1.1, ease: "power3.out" }, at);
      tl.fromTo(q('[data-s="pattern"]'), { clipPath: "inset(0 50% 0 50%)" }, { clipPath: "inset(0 0% 0 0%)", duration: 1.2, ease: "power2.inOut" }, at);
      tl.fromTo(ings, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, at + 0.5);
      break;
  }

  tl.fromTo(q('[data-s="name"]'), { yPercent: 115 }, { yPercent: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" }, at + 0.4)
    .fromTo(q('[data-s="copy"]'), { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.07, ease: "power2.out" }, at + 0.55)
    .fromTo(q('[data-s="tag"]'), { y: 16, autoAlpha: 0, rotate: -8 }, { y: 0, autoAlpha: 1, rotate: 0, duration: 0.5, stagger: 0.06, ease: "back.out(2)" }, at + 0.75);
}

function exitScene(tl: gsap.core.Timeline, scene: Element, style: Choreography, at: number) {
  const q = gsap.utils.selector(scene);
  const out: Record<Choreography, gsap.TweenVars> = {
    swing: { x: "45vw", rotation: -10 },
    soft: { scale: 1.12, autoAlpha: 0 },
    drop: { y: "-90vh" },
    tropical: { x: "-55vw", rotation: -20 },
    rise: { y: "-80vh" },
    steam: { y: -90, autoAlpha: 0 },
    meet: { y: -60, autoAlpha: 0 },
  };
  tl.to(q('[data-s="name"], [data-s="copy"], [data-s="tag"]'), { y: -46, autoAlpha: 0, duration: 0.45, stagger: 0.015, ease: "power2.in" }, at)
    .to(q('[data-s="bottle"], [data-s="bottle2"]'), { ...out[style], duration: 0.7, ease: "power2.in" }, at)
    .to(q('[data-s="ing"]'), { y: -140, autoAlpha: 0, duration: 0.6, stagger: 0.03, ease: "power2.in" }, at)
    .to(q('[data-s="ghost"]'), { xPercent: -12, autoAlpha: 0, duration: 0.7, ease: "power1.in" }, at);
}

function mobileFrom(style: Choreography): gsap.TweenVars {
  switch (style) {
    case "swing":
      return { x: "-40vw", rotation: -14 };
    case "drop":
      return { y: -120 };
    case "tropical":
      return { x: "40vw", rotation: 14 };
    case "rise":
      return { y: 120 };
    default:
      return { y: 50, scale: 0.9 };
  }
}

/* ─────────────────────────────── Controller ─────────────────────────────── */

/**
 * Client-side choreography for the server-rendered showcase. Desktop: one
 * pinned, scrubbed master timeline. Mobile: independent scene entrances.
 * Reduced motion: nothing runs; scenes stay stacked and fully readable.
 */
export function ShowcaseMotion({ styles, children }: { styles: Choreography[]; children: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      const q = gsap.utils.selector(el);

      // Built once the browser is idle: this section is below the fold, so
      // its ~100 tweens never compete with hydration. mm is created
      // synchronously, so useGSAP still reverts everything on unmount.
      const cancel = whenIdle(() => {
        mm.add(MOTION.desktop, () => {
          const stage = q("[data-stage]")[0];
          const sceneEls = q("[data-scene]");
          const railItems = q("[data-rail-item]");
          const progressBar = q("[data-progress]")[0];
          
          gsap.set(sceneEls, { autoAlpha: 0 });
          gsap.set(sceneEls[0], { autoAlpha: 1 });
  
          // Scene 1 enters as the stage scrolls into view.
          const intro = gsap.timeline({
            scrollTrigger: { trigger: stage, start: "top 85%", end: "top top", scrub: 0.8 },
          });
          enterScene(intro, sceneEls[0], styles[0], 0, false);
  
          const starts: number[] = [0];
          const master = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stage,
              start: "top top",
              end: () => `+=${window.innerHeight * sceneEls.length * 1.1}`,
              pin: true,
              scrub: 0.9,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                const t = master.time();
                let idx = 0;
                starts.forEach((s, i) => {
                  if (t >= s - 0.4) idx = i;
                });
                railItems.forEach((r, i) => r.toggleAttribute("data-active", i === idx));
                if (progressBar) progressBar.style.transform = `scaleX(${self.progress})`;
              },
            },
          });
  
          master.to({}, { duration: 1.2 }); // hold on scene 1
          for (let i = 1; i < sceneEls.length; i++) {
            const t = master.duration();
            exitScene(master, sceneEls[i - 1], styles[i - 1], t);
            const next = sceneEls[i];
            const bg = next.querySelector('[data-s="bg"]');
            master
              .set(next, { autoAlpha: 1 }, t + 0.2)
              .fromTo(bg, { clipPath: "circle(0% at 50% 55%)" }, { clipPath: "circle(150% at 50% 55%)", duration: 1, ease: "power2.inOut" }, t + 0.2);
            enterScene(master, next, styles[i], t + 0.55, i % 2 === 1);
            master.set(sceneEls[i - 1], { autoAlpha: 0 }, t + 1.25);
            starts.push(t + 0.55);
            master.to({}, { duration: i === sceneEls.length - 1 ? 0.8 : 1.2 }); // hold
          }
        });
  
        mm.add(MOTION.mobile, (ctx) => {
          q("[data-scene]").forEach((scene, i) => {
            // Each scene's timeline is only built shortly before it scrolls into
            // view, spreading the work instead of doing it all during load.
            // ctx.add() keeps late-created animations inside this context.
            ScrollTrigger.create({
              trigger: scene,
              start: "top 160%",
              once: true,
              onEnter: () => ctx.add(() => buildMobileScene(scene, styles[i] ?? "soft")),
            });
          });
        });
      });
      return cancel;
    },
    { scope: root, dependencies: [styles.join()] },
  );

  return (
    <section ref={root} id="products" aria-labelledby="showcase-title" className="relative bg-warm">
      {children}
    </section>
  );
}

function buildMobileScene(scene: Element, style: Choreography) {
    const s = gsap.utils.selector(scene);
    const tl = gsap.timeline({ scrollTrigger: { trigger: scene, start: "top 72%", once: true } });
    tl.fromTo(
      s('[data-s="bottle"], [data-s="bottle2"]'),
      { ...mobileFrom(style), autoAlpha: 0 },
      { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.1 },
    )
      .fromTo(s("[data-pendulum]"), { rotation: 22 }, { rotation: 0, duration: 2, ease: "elastic.out(1, 0.35)" }, 0)
      .fromTo(s('[data-s="ing"]'), { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.9, stagger: 0.06, ease: "back.out(1.6)" }, 0.2)
      .fromTo(s('[data-s="name"]'), { yPercent: 115 }, { yPercent: 0, duration: 0.9, stagger: 0.06 }, 0.25)
      .fromTo(s('[data-s="copy"], [data-s="tag"]'), { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.05 }, 0.4)
      .fromTo(s('[data-s="steam"] path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, stagger: 0.2 }, 0.4);
}
