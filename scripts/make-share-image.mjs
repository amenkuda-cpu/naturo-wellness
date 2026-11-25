// Builds public/og/naturo-wellness-share.jpg (1200x630): brand line, logo and the five wellness shots.
// Also builds public/favicon.ico (32/16 px) from src/app/icon.png. Run: node scripts/make-share-image.mjs
import sharp from "sharp";
import fs from "node:fs";

const W = 1200, H = 630;
const shots = ["ginger-shot", "glow-shot", "hibiscus-shot", "pineapple-shot", "mens-vitality-shot"];
const bottleH = 330;
// Trim the transparent padding so bottles can sit close together.
const bottles = await Promise.all(
  shots.map(async (s) => sharp(await sharp(`public/images/products/${s}.webp`).trim().toBuffer()).resize({ height: bottleH }).png().toBuffer()),
);
const widths = await Promise.all(bottles.map(async (b) => (await sharp(b).metadata()).width));
const logo = await sharp("public/images/brand/naturo-wellness-logo.png").resize(150, 146).png().toBuffer();

const esc = (s) => s.replace(/&/g, "&amp;");
const text = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#F7EFD6"/>
  <circle cx="905" cy="330" r="290" fill="#F5D84E"/>
  <text x="64" y="270" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="46" fill="#173F2B">Natural wellness</text>
  <text x="64" y="334" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="46" fill="#173F2B">shots, made fresh</text>
  <text x="64" y="402" font-family="Georgia, serif" font-style="italic" font-size="50" fill="#367A45">in Zimbabwe.</text>
  <text x="64" y="500" font-family="Arial, sans-serif" font-weight="700" font-size="17" letter-spacing="1.5" fill="#183126">${esc("GINGER · MEN'S · HIBISCUS · GLOW · PINEAPPLE")}</text>
  <text x="64" y="560" font-family="Arial, sans-serif" font-weight="700" font-size="28" fill="#367A45">getnaturo.com/shop</text>
</svg>`;

const gap = 8, total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
let x = W - 40 - total;
const composites = [{ input: logo, left: 56, top: 48 }];
bottles.forEach((b, i) => { composites.push({ input: b, left: x, top: H - bottleH - 120 + (i % 2 ? 24 : 0) }); x += widths[i] + gap; });
await sharp(Buffer.from(text)).composite(composites).jpeg({ quality: 84, mozjpeg: true }).toFile("public/og/naturo-wellness-share.jpg");

const ico16 = await sharp("src/app/icon.png").resize(16, 16).ensureAlpha().png({ palette: false }).toBuffer();
const ico32 = await sharp("src/app/icon.png").resize(32, 32).ensureAlpha().png({ palette: false }).toBuffer();
// Minimal ICO container holding two PNG images.
const imgs = [ico16, ico32];
const header = Buffer.alloc(6 + 16 * imgs.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(imgs.length, 4);
let offset = header.length;
imgs.forEach((buf, i) => {
  const size = i === 0 ? 16 : 32, o = 6 + i * 16;
  header.writeUInt8(size, o); header.writeUInt8(size, o + 1); header.writeUInt8(0, o + 2); header.writeUInt8(0, o + 3);
  header.writeUInt16LE(1, o + 4); header.writeUInt16LE(32, o + 6); header.writeUInt32LE(buf.length, o + 8); header.writeUInt32LE(offset, o + 12);
  offset += buf.length;
});
fs.writeFileSync("src/app/favicon.ico", Buffer.concat([header, ...imgs]));
await sharp("src/app/icon.png").resize(192, 192).png().toFile("public/icon-192.png");
await sharp("src/app/icon.png").resize(512, 512).png().toFile("public/icon-512.png");
console.log("done", fs.statSync("public/og/naturo-wellness-share.jpg").size);
