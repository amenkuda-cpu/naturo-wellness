/**
 * next/image loader for Cloudflare Workers. The free plan can't resize images on request,
 * so every image under /images is pre-sized by scripts/make-image-sizes.mjs into
 * /img/<path>-<width>.webp. This picks the smallest pre-sized file that covers the
 * requested width. Anything else (remote URLs, grain texture) is served as-is.
 */
const WIDTHS = [96, 192, 320, 480, 640, 828, 1080, 1536];

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (!src.startsWith("/images/") || src.endsWith("grain.png") || !/\.(webp|png|jpe?g)$/i.test(src)) return src;
  const w = WIDTHS.find((x) => x >= width) ?? WIDTHS[WIDTHS.length - 1];
  return `/img/${src.slice("/images/".length).replace(/\.(webp|png|jpe?g)$/i, "")}-${w}.webp`;
}
