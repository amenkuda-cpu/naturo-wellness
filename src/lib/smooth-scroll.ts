"use client";

import type Lenis from "lenis";

/** Module-level handle so overlays (cart drawer, menu) can pause smooth scroll. */
let instance: Lenis | null = null;

export const smoothScroll = {
  set(lenis: Lenis | null) {
    instance = lenis;
  },
  get: () => instance,
  stop() {
    instance?.stop();
  },
  start() {
    instance?.start();
  },
  toTop() {
    if (instance) instance.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  },
};
