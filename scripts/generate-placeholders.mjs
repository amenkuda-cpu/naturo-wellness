/**
 * Generates TEMPORARY placeholder artwork for the Naturo website.
 *
 *   npm run placeholders
 *
 * Every product bottle produced here carries a visible "PLACEHOLDER LABEL"
 * notice: it is NOT approved Naturo packaging. Replace any file in
 * /public/images/products with the final photograph of the same filename
 * (see README → "Replacing placeholder images").
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const out = (...p) => path.join(root, "public", "images", ...p);

const SANS = "Segoe UI, Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

const naturoMark = (x, y, s, color) => `
  <g transform="translate(${x} ${y}) scale(${s})" fill="${color}">
    <path d="M-30 -6 C-30 22 -16 34 0 34 C16 34 30 22 30 -6 L19 -6 C19 15 11 23 0 23 C-11 23 -19 15 -19 -6 Z"/>
    <rect x="-30" y="-14" width="11" height="12" rx="5.5"/>
    <path d="M-2 -6 C-14 -8 -19 -18 -17 -30 C-6 -28 0 -20 -2 -6 Z"/>
    <path d="M2 -6 C14 -8 19 -18 17 -30 C6 -28 0 -20 2 -6 Z"/>
    <rect x="-24" y="40" width="48" height="8" rx="4"/>
  </g>`;

function label({ x, y, w, h, product, ink, accent, size, curve = true }) {
  const cx = x + w / 2;
  const lines = product.labelLines;
  const nameSize = lines.some((l) => l.length > 9) ? 46 : 56;
  const nameY0 = y + h * 0.43;
  return `
  <g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFFDF5"/>
    <rect x="${x}" y="${y}" width="${w}" height="10" fill="${accent}"/>
    <rect x="${x}" y="${y + h - 10}" width="${w}" height="10" fill="${accent}"/>
    ${naturoMark(cx, y + 62, 0.85, ink)}
    <text x="${cx}" y="${y + 128}" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="30" letter-spacing="2" fill="${ink}">Naturo</text>
    ${lines
      .map(
        (l, i) =>
          `<text x="${cx}" y="${nameY0 + 30 + i * (nameSize + 4)}" text-anchor="middle" font-family="${SERIF}" font-size="${nameSize}" font-style="italic" fill="${ink}">${l}</text>`,
      )
      .join("")}
    <line x1="${cx - 60}" x2="${cx + 60}" y1="${y + h - 98}" y2="${y + h - 98}" stroke="${accent}" stroke-width="3"/>
    <text x="${cx}" y="${y + h - 66}" text-anchor="middle" font-family="${SANS}" font-size="17" letter-spacing="4" fill="${ink}" opacity="0.85">${product.kicker}</text>
    <text x="${cx}" y="${y + h - 34}" text-anchor="middle" font-family="${SANS}" font-size="13" letter-spacing="3" fill="${ink}" opacity="0.6">PLACEHOLDER LABEL${size ? " · " + size : ""}</text>
    ${
      curve
        ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#labelShade)"/>`
        : ""
    }
  </g>`;
}

const commonDefs = `
  <linearGradient id="labelShade" x1="0" x2="1">
    <stop offset="0" stop-color="#000" stop-opacity="0.28"/>
    <stop offset="0.12" stop-color="#000" stop-opacity="0.08"/>
    <stop offset="0.35" stop-color="#fff" stop-opacity="0.12"/>
    <stop offset="0.55" stop-color="#fff" stop-opacity="0"/>
    <stop offset="0.85" stop-color="#000" stop-opacity="0.1"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.32"/>
  </linearGradient>
  <linearGradient id="glassEdge" x1="0" x2="1">
    <stop offset="0" stop-color="#000" stop-opacity="0.35"/>
    <stop offset="0.08" stop-color="#000" stop-opacity="0.05"/>
    <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
    <stop offset="0.92" stop-color="#000" stop-opacity="0.08"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.4"/>
  </linearGradient>
  <linearGradient id="metal" x1="0" x2="1">
    <stop offset="0" stop-color="#8E9599"/>
    <stop offset="0.18" stop-color="#E9ECEE"/>
    <stop offset="0.32" stop-color="#FFFFFF"/>
    <stop offset="0.5" stop-color="#B5BBBF"/>
    <stop offset="0.75" stop-color="#E3E6E8"/>
    <stop offset="1" stop-color="#7D8488"/>
  </linearGradient>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
  <filter id="blur4" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
`;

const liquidGradient = (id, [a, b]) => `
  <linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="${a}"/>
    <stop offset="1" stop-color="${b}"/>
  </linearGradient>
  <radialGradient id="${id}Glow" cx="0.35" cy="0.4" r="0.7">
    <stop offset="0" stop-color="#fff" stop-opacity="0.35"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>`;

function ridges(x1, x2, y1, y2, step, color, opacity) {
  let s = "";
  for (let x = x1 + step; x < x2; x += step)
    s += `<line x1="${x}" x2="${x}" y1="${y1}" y2="${y2}" stroke="${color}" stroke-opacity="${opacity}" stroke-width="2"/>`;
  return s;
}

/* ------------------------------------------------------------------ */
/* Packaging shapes (800 × 1200 canvas)                                */
/* ------------------------------------------------------------------ */

function shotBottle(p) {
  const body =
    "M318 300 L318 322 C318 372 214 384 214 456 L214 1046 Q214 1112 280 1112 L520 1112 Q586 1112 586 1046 L586 456 C586 384 482 372 482 322 L482 300 Z";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
  <defs>${commonDefs}${liquidGradient("liq", p.liquid)}
    <clipPath id="body"><path d="${body}"/></clipPath>
  </defs>
  <g clip-path="url(#body)">
    <rect x="200" y="290" width="400" height="840" fill="#ffffff" opacity="0.25"/>
    <rect x="200" y="372" width="400" height="760" fill="url(#liq)"/>
    <ellipse cx="400" cy="374" rx="200" ry="10" fill="#fff" opacity="0.35"/>
    <rect x="200" y="372" width="400" height="760" fill="url(#liqGlow)"/>
    ${label({ x: 214, y: 560, w: 372, h: 400, product: p, ink: p.ink, accent: p.accent, size: p.sizeText })}
    <rect x="200" y="290" width="400" height="840" fill="url(#glassEdge)"/>
  </g>
  <path d="${body}" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="3"/>
  <rect x="246" y="470" width="20" height="560" rx="10" fill="#fff" opacity="0.55"/>
  <rect x="276" y="470" width="6" height="560" rx="3" fill="#fff" opacity="0.35"/>
  <rect x="548" y="500" width="8" height="500" rx="4" fill="#fff" opacity="0.25"/>
  <path d="M330 330 C318 360 268 380 262 420" stroke="#fff" stroke-opacity="0.6" stroke-width="8" fill="none" stroke-linecap="round"/>
  <rect x="306" y="150" width="188" height="150" rx="14" fill="url(#metal)"/>
  ${ridges(306, 494, 158, 292, 9, "#5d6468", 0.35)}
  <rect x="306" y="150" width="188" height="16" rx="8" fill="#fff" opacity="0.5"/>
  <rect x="300" y="282" width="200" height="22" rx="6" fill="url(#metal)"/>
</svg>`;
}

function tallBottle(p) {
  const body =
    "M346 330 L346 380 C346 440 250 452 250 540 L250 1070 Q250 1124 304 1124 L496 1124 Q550 1124 550 1070 L550 540 C550 452 454 440 454 380 L454 330 Z";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
  <defs>${commonDefs}${liquidGradient("liq", p.liquid)}
    <clipPath id="body"><path d="${body}"/></clipPath>
    <linearGradient id="cap" x1="0" x2="1">
      <stop offset="0" stop-color="${p.cap[1]}"/><stop offset="0.35" stop-color="${p.cap[0]}"/><stop offset="1" stop-color="${p.cap[1]}"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#body)">
    <rect x="240" y="320" width="320" height="820" fill="#fff" opacity="0.3"/>
    <rect x="240" y="420" width="320" height="720" fill="url(#liq)"/>
    <rect x="240" y="420" width="320" height="720" fill="url(#liqGlow)"/>
    ${label({ x: 250, y: 610, w: 300, h: 400, product: p, ink: p.ink, accent: p.accent, size: p.sizeText })}
    <rect x="240" y="320" width="320" height="820" fill="url(#glassEdge)"/>
  </g>
  <path d="${body}" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="3"/>
  <rect x="276" y="560" width="16" height="490" rx="8" fill="#fff" opacity="0.5"/>
  <rect x="514" y="580" width="7" height="440" rx="3.5" fill="#fff" opacity="0.25"/>
  <rect x="332" y="208" width="136" height="124" rx="12" fill="url(#cap)"/>
  ${ridges(332, 468, 216, 326, 8, "#000", 0.18)}
  <rect x="332" y="208" width="136" height="14" rx="7" fill="#fff" opacity="0.35"/>
  <rect x="326" y="322" width="148" height="18" rx="6" fill="url(#cap)"/>
</svg>`;
}

function pouch(p) {
  const shape = "M226 196 L574 196 L596 1098 Q400 1128 204 1098 Z";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
  <defs>${commonDefs}
    <clipPath id="body"><path d="${shape}"/></clipPath>
    <linearGradient id="pouchShade" x1="0" x2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.22"/>
      <stop offset="0.2" stop-color="#fff" stop-opacity="0.12"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.8" stop-color="#000" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.26"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#body)">
    <rect x="190" y="190" width="420" height="940" fill="${p.pouch}"/>
    <rect x="190" y="190" width="420" height="70" fill="${p.accent}" opacity="0.9"/>
    <line x1="190" x2="610" y1="290" y2="290" stroke="#000" stroke-opacity="0.12" stroke-width="4" stroke-dasharray="2 8"/>
    ${label({ x: 240, y: 420, w: 320, h: 470, product: p, ink: p.ink, accent: p.accent, size: p.sizeText, curve: false })}
    <rect x="190" y="980" width="420" height="160" fill="${p.accent}" opacity="0.18"/>
    <rect x="190" y="190" width="420" height="940" fill="url(#pouchShade)"/>
  </g>
  <path d="${shape}" fill="none" stroke="#000" stroke-opacity="0.08" stroke-width="3"/>
  <circle cx="246" cy="232" r="9" fill="#F5F0DF" opacity="0.9"/>
  <path d="M226 196 L574 196" stroke="#fff" stroke-opacity="0.5" stroke-width="4"/>
</svg>`;
}

/* ------------------------------------------------------------------ */
/* Ingredient illustrations (600 × 600, transparent)                   */
/* ------------------------------------------------------------------ */

const ing = (inner, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><defs>${commonDefs}${defs}</defs>${inner}</svg>`;

function citrusSlice(id, rim, pith, flesh, fleshDark) {
  let seg = "";
  for (let i = 0; i < 10; i++) {
    const a = (i * 36 * Math.PI) / 180;
    seg += `<path d="M300 300 L${300 + 200 * Math.cos(a - 0.27)} ${300 + 200 * Math.sin(a - 0.27)} A200 200 0 0 1 ${300 + 200 * Math.cos(a + 0.27)} ${300 + 200 * Math.sin(a + 0.27)} Z" fill="url(#${id}F)" stroke="${pith}" stroke-width="10" stroke-linejoin="round"/>`;
  }
  return ing(
    `
     <circle cx="300" cy="300" r="250" fill="${rim}"/>
     <circle cx="300" cy="300" r="236" fill="${pith}"/>
     <circle cx="300" cy="300" r="214" fill="${pith}"/>
     <g clip-path="url(#${id}C)">${seg}</g>
     <circle cx="300" cy="300" r="16" fill="${pith}"/>
     <circle cx="300" cy="300" r="250" fill="url(#${id}H)"/>`,
    `<radialGradient id="${id}F" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="${flesh}"/><stop offset="1" stop-color="${fleshDark}"/></radialGradient>
     <radialGradient id="${id}H" cx="0.3" cy="0.25" r="0.8"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.12"/></radialGradient>
     <clipPath id="${id}C"><circle cx="300" cy="300" r="206"/></clipPath>`,
  );
}

const ingredients = {
  "lemon-slice": citrusSlice("lm", "#F2C230", "#FFF6CF", "#FBE36B", "#F2C230"),
  "lime-slice": citrusSlice("li", "#4E8F2C", "#EEF6D4", "#C5E07A", "#8DBF45"),
  "orange-slice": citrusSlice("or", "#E8892A", "#FFEBD0", "#F8B657", "#EC8A2C"),

  ginger: ing(
    `
     <g fill="url(#gSkin)" stroke="#9B7442" stroke-width="5">
       <path d="M120 360 C90 300 130 250 190 262 C200 210 260 190 300 226 C330 180 400 178 420 230 C470 210 520 250 500 300 C540 330 520 400 460 400 C430 440 360 446 330 410 C290 450 220 450 200 410 C150 430 110 410 120 360 Z"/>
       <path d="M410 232 C420 180 470 150 500 170 C520 186 500 226 470 236 Z"/>
       <path d="M180 270 C160 220 180 180 214 186 C236 192 230 236 214 262 Z"/>
     </g>
     <g stroke="#8A6233" stroke-opacity="0.55" stroke-width="4" fill="none" stroke-linecap="round">
       <path d="M200 300 C214 312 214 330 204 344"/><path d="M300 260 C316 276 318 300 306 320"/>
       <path d="M400 270 C414 290 412 312 398 330"/><path d="M460 320 C472 336 470 354 458 368"/>
       <path d="M250 380 C262 392 262 404 252 414"/>
     </g>
     <ellipse cx="497" cy="300" rx="34" ry="44" fill="#F3D889" stroke="#B88A4D" stroke-width="5"/>
     <ellipse cx="497" cy="300" rx="18" ry="26" fill="#EBC768" opacity="0.8"/>
     <path d="M120 360 C90 300 130 250 190 262 C200 210 260 190 300 226 C330 180 400 178 420 230 C470 210 520 250 500 300 C540 330 520 400 460 400 C430 440 360 446 330 410 C290 450 220 450 200 410 C150 430 110 410 120 360 Z" fill="url(#gHi)"/>`,
    `<linearGradient id="gSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6C690"/><stop offset="1" stop-color="#C39A5E"/></linearGradient>
     <radialGradient id="gHi" cx="0.35" cy="0.3" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="0.3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
  ),

  "ginger-slice": ing(
    `
     <path d="M110 300 C100 190 200 110 310 116 C430 122 500 200 490 310 C482 420 400 490 290 484 C180 478 118 410 110 300 Z" fill="#C9A26A" stroke="#9B7442" stroke-width="6"/>
     <path d="M136 300 C130 205 214 140 310 144 C414 148 466 214 460 306 C454 402 386 458 292 454 C196 450 142 392 136 300 Z" fill="url(#gsF)"/>
     <g stroke="#E2BC5C" stroke-opacity="0.55" stroke-width="3" fill="none">
       <ellipse cx="300" cy="300" rx="110" ry="96"/><ellipse cx="300" cy="300" rx="60" ry="50"/>
     </g>
     <g fill="#D9AE4A" opacity="0.6">${Array.from({ length: 26 }, (_, i) => {
       const a = i * 0.9;
       const r = 40 + ((i * 37) % 120);
       return `<circle cx="${300 + r * Math.cos(a)}" cy="${300 + r * 0.9 * Math.sin(a)}" r="3"/>`;
     }).join("")}</g>`,
    `<radialGradient id="gsF" cx="0.45" cy="0.42" r="0.65"><stop offset="0" stop-color="#FBEAA8"/><stop offset="1" stop-color="#EDCB6E"/></radialGradient>`,
  ),

  hibiscus: ing(
    `
     ${[0, 72, 144, 216, 288]
       .map(
         (a) => `<g transform="rotate(${a} 300 300)">
       <path d="M300 300 C230 250 190 140 240 80 C270 44 330 44 360 80 C410 140 370 250 300 300 Z" fill="url(#hPet)" stroke="#9E1430" stroke-width="3"/>
       <path d="M300 290 C280 220 280 150 300 96" stroke="#7A0E25" stroke-opacity="0.35" stroke-width="3" fill="none"/>
       <path d="M300 290 C320 230 330 170 330 120" stroke="#7A0E25" stroke-opacity="0.25" stroke-width="3" fill="none"/>
     </g>`,
       )
       .join("")}
     <circle cx="300" cy="300" r="56" fill="url(#hEye)"/>
     <path d="M300 300 C330 250 380 210 420 196" stroke="#F4D9A8" stroke-width="10" fill="none" stroke-linecap="round"/>
     ${[0, 1, 2, 3, 4, 5, 6]
       .map(
         (i) =>
           `<circle cx="${380 + i * 8}" cy="${212 - i * 3 + (i % 2) * 10}" r="9" fill="#F6C83A"/>`,
       )
       .join("")}
     <circle cx="428" cy="192" r="14" fill="#B5122F"/>`,
    `<radialGradient id="hPet" cx="0.5" cy="0.9" r="0.9"><stop offset="0" stop-color="#7A0E25"/><stop offset="0.35" stop-color="#D2264A"/><stop offset="1" stop-color="#F0566F"/></radialGradient>
     <radialGradient id="hEye" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#4A0716"/><stop offset="1" stop-color="#8E1029" stop-opacity="0"/></radialGradient>`,
  ),

  "hibiscus-petal": ing(
    `<path d="M300 520 C190 450 130 280 210 160 C250 100 350 100 390 160 C470 280 410 450 300 520 Z" fill="url(#hp2)" stroke="#9E1430" stroke-width="4"/>
     <path d="M300 500 C290 380 290 260 300 150" stroke="#7A0E25" stroke-opacity="0.3" stroke-width="4" fill="none"/>`,
    `<radialGradient id="hp2" cx="0.5" cy="1" r="1"><stop offset="0" stop-color="#7A0E25"/><stop offset="0.4" stop-color="#D2264A"/><stop offset="1" stop-color="#F26C83"/></radialGradient>`,
  ),

  "pineapple-chunk": ing(
    `
     <path d="M120 420 L300 110 L480 420 Q300 470 120 420 Z" fill="url(#pF)"/>
     <path d="M120 420 Q300 470 480 420 L470 460 Q300 512 130 460 Z" fill="#B88A1B"/>
     <g stroke="#6E5110" stroke-opacity="0.45" stroke-width="3">
       <path d="M135 445 L170 480 M175 455 L210 492 M220 462 L255 498 M265 466 L300 500 M310 466 L345 498 M355 462 L390 492 M400 455 L435 480"/>
     </g>
     <path d="M300 130 L300 440" stroke="#F8E7A2" stroke-width="22" stroke-linecap="round" opacity="0.8"/>
     <g fill="#E7B322" opacity="0.7">${Array.from({ length: 18 }, (_, i) => `<ellipse cx="${200 + (i % 6) * 40}" cy="${300 + Math.floor(i / 6) * 40}" rx="5" ry="12"/>`).join("")}</g>
     <path d="M120 420 L300 110 L480 420 Q300 470 120 420 Z" fill="url(#pH)"/>`,
    `<linearGradient id="pF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCE680"/><stop offset="1" stop-color="#F3C230"/></linearGradient>
     <radialGradient id="pH" cx="0.35" cy="0.3" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="0.4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
  ),

  "pineapple-crown": ing(
    `${[-50, -30, -12, 0, 12, 30, 50]
      .map(
        (a, i) =>
          `<path transform="rotate(${a} 300 560)" d="M300 560 C280 420 285 240 300 ${60 + Math.abs(a) * 3} C315 240 320 420 300 560 Z" fill="${i % 2 ? "#3F7D33" : "#5E9C3C"}" stroke="#2E5E26" stroke-width="3"/>`,
      )
      .join("")}`,
  ),

  leaf: ing(
    `
     <path d="M110 500 C110 300 250 120 500 90 C500 330 360 500 110 500 Z" fill="url(#lf)" stroke="#2D6332" stroke-width="4"/>
     <path d="M120 490 C230 380 340 250 490 100" stroke="#E8F2C8" stroke-opacity="0.7" stroke-width="6" fill="none"/>
     <g stroke="#E8F2C8" stroke-opacity="0.45" stroke-width="3" fill="none">
       <path d="M200 400 C220 340 230 300 230 250"/><path d="M260 340 C300 320 340 320 380 330"/>
       <path d="M300 290 C320 240 330 200 330 170"/><path d="M350 240 C390 230 420 230 450 240"/>
       <path d="M200 400 C250 410 300 410 340 400"/>
     </g>
     <path d="M110 500 C110 300 250 120 500 90 C500 330 360 500 110 500 Z" fill="url(#lfH)"/>`,
    `<linearGradient id="lf" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2F6E39"/><stop offset="0.6" stop-color="#5E9C3C"/><stop offset="1" stop-color="#8DBF45"/></linearGradient>
     <radialGradient id="lfH" cx="0.6" cy="0.3" r="0.6"><stop offset="0" stop-color="#fff" stop-opacity="0.25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
  ),

  "tea-leaf": ing(
    `<path d="M300 560 C200 460 180 260 300 60 C420 260 400 460 300 560 Z" fill="url(#tl)" stroke="#2D5A2B" stroke-width="4"/>
     <path d="M300 540 L300 90" stroke="#DDEBB8" stroke-opacity="0.6" stroke-width="5"/>
     <g stroke="#DDEBB8" stroke-opacity="0.4" stroke-width="3" fill="none">
       ${[160, 230, 300, 370, 440].map((y) => `<path d="M300 ${y + 40} L250 ${y}"/><path d="M300 ${y + 40} L350 ${y}"/>`).join("")}
     </g>`,
    `<linearGradient id="tl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7FAE4E"/><stop offset="1" stop-color="#36693A"/></linearGradient>`,
  ),

  carrot: ing(
    `<path d="M210 140 C190 80 220 40 250 70 C250 30 300 30 300 80 C320 40 370 60 340 120" fill="#4E8F2C" stroke="#2E5E26" stroke-width="4"/>
     <path d="M190 150 C250 110 330 120 350 170 C370 230 300 340 160 540 C150 552 136 546 140 530 C180 330 150 190 190 150 Z" fill="url(#ca)" stroke="#B5561A" stroke-width="4"/>
     <g stroke="#B5561A" stroke-opacity="0.5" stroke-width="4" stroke-linecap="round">
       <path d="M220 220 L260 230"/><path d="M200 290 L240 296"/><path d="M200 360 L236 362"/><path d="M190 430 L218 430"/>
     </g>`,
    `<linearGradient id="ca" x1="0" x2="1"><stop offset="0" stop-color="#F59A3A"/><stop offset="1" stop-color="#E06A1B"/></linearGradient>`,
  ),

  droplet: ing(
    `<path d="M300 80 C360 200 440 280 440 380 C440 460 378 520 300 520 C222 520 160 460 160 380 C160 280 240 200 300 80 Z" fill="url(#dr)" stroke="#fff" stroke-opacity="0.8" stroke-width="4"/>
     <path d="M230 380 C230 330 250 300 270 280" stroke="#fff" stroke-width="16" stroke-linecap="round" fill="none" opacity="0.8"/>`,
    `<radialGradient id="dr" cx="0.4" cy="0.6" r="0.6"><stop offset="0" stop-color="#fff" stop-opacity="0.15"/><stop offset="1" stop-color="#F5D84E" stop-opacity="0.55"/></radialGradient>`,
  ),

  "maize-kernels": ing(
    `
     <g transform="rotate(-24 300 300)">
       <path d="M300 60 C390 60 420 200 410 330 C400 450 360 520 300 520 C240 520 200 450 190 330 C180 200 210 60 300 60 Z" fill="#F0C64A"/>
       ${Array.from({ length: 9 }, (_, r) =>
         Array.from({ length: 5 }, (_, c) => `<rect x="${222 + c * 32}" y="${100 + r * 44}" width="28" height="38" rx="12" fill="url(#mk)" stroke="#C99A22" stroke-width="2"/>`).join(""),
       ).join("")}
       <path d="M200 380 C150 320 140 200 190 120 C200 240 230 330 300 520 C250 500 220 450 200 380 Z" fill="#B9C98A" stroke="#7E944B" stroke-width="3"/>
       <path d="M400 380 C450 320 460 200 410 120 C400 240 370 330 300 520 C350 500 380 450 400 380 Z" fill="#A5B877" stroke="#7E944B" stroke-width="3"/>
     </g>`,
    `<radialGradient id="mk" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#FFE9A0"/><stop offset="1" stop-color="#EBB733"/></radialGradient>`,
  ),

  "sorghum-head": ing(
    `<path d="M300 580 C300 480 296 420 300 330" stroke="#8A7A3E" stroke-width="10" fill="none"/>
     ${Array.from({ length: 46 }, (_, i) => {
       const row = Math.floor(i / 6);
       const col = i % 6;
       const x = 230 + col * 28 + (row % 2) * 14 - row * 1.5;
       const y = 90 + row * 30;
       return `<ellipse cx="${x}" cy="${y}" rx="15" ry="13" fill="${i % 3 ? "#A8492A" : "#C2643A"}" stroke="#7A3219" stroke-width="2"/>`;
     }).join("")}`,
  ),
};

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

const products = [
  { file: "ginger-shot", shape: shotBottle, labelLines: ["Ginger", "Shot"], kicker: "WELLNESS SHOT", liquid: ["#F2BC3D", "#C9781A"], ink: "#173F2B", accent: "#E7A33E" },
  { file: "glow-shot", shape: shotBottle, labelLines: ["Glow", "Shot"], kicker: "WELLNESS SHOT", liquid: ["#DDE48A", "#93B444"], ink: "#173F2B", accent: "#77A84A" },
  { file: "hibiscus-shot", shape: shotBottle, labelLines: ["Hibiscus", "Shot"], kicker: "WELLNESS SHOT", liquid: ["#C21E48", "#62071F"], ink: "#5A0F22", accent: "#B5122F" },
  { file: "pineapple-shot", shape: shotBottle, labelLines: ["Pineapple", "Shot"], kicker: "WELLNESS SHOT", liquid: ["#FBD34C", "#E8A118"], ink: "#173F2B", accent: "#F2B92B" },
  { file: "mens-vitality", shape: shotBottle, labelLines: ["Men’s", "Vitality"], kicker: "WELLNESS SHOT", liquid: ["#8C6438", "#3E2A16"], ink: "#173F2B", accent: "#C7832F" },
  { file: "maheu", shape: tallBottle, labelLines: ["Maheu"], kicker: "TRADITIONAL", liquid: ["#F1E7CF", "#D3C29A"], ink: "#173F2B", accent: "#C9A24A", cap: ["#367A45", "#173F2B"] },
  { file: "muvhee", shape: tallBottle, labelLines: ["Muvhee"], kicker: "TRADITIONAL", liquid: ["#E1BE8A", "#9E7443"], ink: "#173F2B", accent: "#A86B2C", cap: ["#E7A33E", "#9C5E1C"] },
  { file: "herbal-tea", shape: pouch, labelLines: ["Ginger,", "Lemon", "&amp; Carrot"], kicker: "HERBAL TEA", pouch: "#E9DCC0", ink: "#173F2B", accent: "#E9772E" },
  { file: "instant-powder", shape: pouch, labelLines: ["Ginger,", "Lemon", "&amp; Carrot"], kicker: "INSTANT POWDER", pouch: "#F7E9A6", ink: "#173F2B", accent: "#367A45" },
];

async function render(svg, file, width) {
  await sharp(Buffer.from(svg), { density: 144 })
    .resize({ width })
    .webp({ quality: 86, alphaQuality: 90, effort: 5 })
    .toFile(file);
}

await mkdir(out("products"), { recursive: true });
await mkdir(out("ingredients"), { recursive: true });

for (const p of products) {
  await render(p.shape(p), out("products", `${p.file}-placeholder.webp`), 900);
  console.log("product", p.file);
}
for (const [name, svg] of Object.entries(ingredients)) {
  await render(svg, out("ingredients", `${name}.webp`), 600);
  console.log("ingredient", name);
}
