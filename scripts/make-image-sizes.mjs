// Pre-sizes every site image into public/img/<path>-<width>.webp so phones download only what they need.
// Cloudflare Workers (free plan) can't resize images on the fly, so src/lib/image-loader.ts points
// next/image at these files instead. Re-run after adding or replacing an image:
//   node scripts/make-image-sizes.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export const WIDTHS = [96, 192, 320, 480, 640, 828, 1080, 1536];
const SRC = "public/images";
const OUT = "public/img";
const skip = new Set(["brand/grain.png"]);

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(webp|png|jpe?g)$/i.test(e.name)) files.push(p);
  }
})(SRC);

let made = 0, bytes = 0;
for (const file of files) {
  const rel = path.relative(SRC, file).replace(/\\/g, "/");
  if (skip.has(rel)) continue;
  const base = rel.replace(/\.(webp|png|jpe?g)$/i, "");
  const meta = await sharp(file).metadata();
  for (const w of WIDTHS) {
    const out = path.join(OUT, `${base}-${w}.webp`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    // Never upscale: narrower sources are saved at their own width under every name.
    const info = await sharp(file)
      .resize({ width: Math.min(w, meta.width), withoutEnlargement: true })
      .webp({ quality: 72, alphaQuality: 80, effort: 5 })
      .toFile(out);
    made++;
    bytes += info.size;
  }
}
console.log(`${made} files, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
