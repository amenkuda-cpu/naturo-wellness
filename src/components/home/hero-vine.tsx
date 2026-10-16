/**
 * The hero vine: a cluster of stems bursting from the bottom-right corner.
 *
 * The markup always describes the FULLY GROWN vine (what reduced-motion and
 * no-JS visitors see). The hero's GSAP timeline grows it on load:
 *   - stems, branches & sub-branches: chains of stroked segments whose widths
 *     step down along each stem (a cheap taper), drawn with stroke-dashoffset
 *   - tendrils: stroked spirals drawn with stroke-dashoffset
 *   - leaves: scale + rotate in from their attachment points
 *   - stem shading fades in once a stem has grown
 * Every element carries `data-at` (seconds): the moment its growing tip reaches
 * it, so branches, tendrils and leaves spawn in waves just behind the tips.
 *
 * Depth: each stem lives in its own layer (back / mid / front). Back stems are
 * lighter and softly blurred, front stems darker and crisp. Each stem layer is
 * a separate composited element, so the idle sway (each stem slightly out of
 * sync) never repaints the SVG.
 *
 * viewBox 1200 × 900, anchored to the hero's bottom-right corner; stems start
 * just below the frame. A seeded PRNG keeps server and client markup identical.
 */

type Pt = [number, number];
type Layer = "back" | "mid" | "front";

/** Everything finishes growing by about this time (seconds). */
const GROW_CAP = 5.7;

/* ── Helpers ───────────────────────────────────────────────────────────── */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spline(points: Pt[], perSegment = 6): Pt[] {
  const p = [points[0], ...points, points[points.length - 1]];
  const out: Pt[] = [];
  for (let i = 1; i < p.length - 2; i++) {
    for (let s = 0; s < perSegment; s++) {
      const t = s / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p[i - 1][0], p[i][0], p[i + 1][0], p[i + 2][0]), f(p[i - 1][1], p[i][1], p[i + 1][1], p[i + 2][1])]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
const deg = (r: number) => (r * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;

function line(pts: Pt[]): string {
  return pts.map(([x, y], i) => `${i ? "L" : "M"}${r1(x)} ${r1(y)}`).join("");
}

function angleAt(pts: Pt[], i: number): number {
  const a = pts[Math.max(0, i - 1)];
  const b = pts[Math.min(pts.length - 1, i + 1)];
  return deg(Math.atan2(b[1] - a[1], b[0] - a[0]));
}

const widthAt = (w0: number, w1: number, t: number) => w0 + (w1 - w0) * Math.pow(t, 0.7);

/** Offset a polyline along its normals (shading lines and twist strands). */
function offsetLine(pts: Pt[], k: (t: number, i: number) => number): Pt[] {
  return pts.map((p, i) => {
    const a = rad(angleAt(pts, i));
    const d = k(i / (pts.length - 1), i);
    return [p[0] - Math.sin(a) * d, p[1] + Math.cos(a) * d];
  });
}

/** Quad-out growth: fast first, slowing towards the tip. Seconds at fraction f. */
const easedTime = (start: number, dur: number, f: number) => start + dur * (1 - Math.sqrt(1 - Math.min(f, 0.9999)));

interface Segment {
  d: string;
  w: number;
  at: number;
  dur: number;
}

/** Split a stem into k stroked segments of stepped width, each with its own draw window. */
function segmentsOf(pts: Pt[], w0: number, w1: number, k: number, timeAt: (f: number) => number): Segment[] {
  const n = pts.length - 1;
  const out: Segment[] = [];
  for (let j = 0; j < k; j++) {
    const s = Math.floor((j * n) / k);
    const e = Math.floor(((j + 1) * n) / k);
    const fa = s / n;
    const fb = e / n;
    out.push({
      d: line(pts.slice(s, e + 1)),
      w: r1(widthAt(w0, w1, (fa + fb) / 2)),
      at: timeAt(fa),
      dur: Math.max(0.05, timeAt(fb) - timeAt(fa)),
    });
  }
  return out;
}

/** Grow a branch from a point: a heading plus a steady bend. */
function grow(start: Pt, heading: number, length: number, bend: number, steps = 8): Pt[] {
  const pts: Pt[] = [start];
  let a = heading;
  let [x, y] = start;
  for (let i = 0; i < steps; i++) {
    a += bend;
    x += Math.cos(rad(a)) * (length / steps);
    y += Math.sin(rad(a)) * (length / steps);
    pts.push([x, y]);
  }
  return spline(pts, 3);
}

/** A tendril: a tightening spiral that curls at the tip. */
function spiral(start: Pt, heading: number, length: number, dir: 1 | -1): Pt[] {
  const pts: Pt[] = [start];
  let a = heading;
  let [x, y] = start;
  const steps = 30;
  for (let i = 0; i < steps; i++) {
    const s = (length / steps) * (1 - i / (steps * 1.25));
    a += dir * (2.5 + i * 1.3);
    x += Math.cos(rad(a)) * s;
    y += Math.sin(rad(a)) * s;
    pts.push([x, y]);
  }
  return pts;
}

/* ── Stem cluster ──────────────────────────────────────────────────────── */

interface HangerDef {
  t: number;
  heading: number;
  length: number;
  bend: number;
}

interface StemDef {
  id: string;
  layer: Layer;
  /** Control points from the corner outwards. */
  pts: Pt[];
  w0: number;
  /** Seconds after load when the stem bursts out, and how long it takes to grow. */
  start: number;
  dur: number;
  /** Spacing of side branches along the stem (fraction of its length). */
  branchEvery: number;
  branchLen: number;
  curl: 1 | -1;
  seed: number;
  /** Dedicated downward branches the products hang from. */
  hangers?: HangerDef[];
  /** Idle sway: amplitude (deg) and half-period (s). */
  sway: [number, number];
}

const STEMS: StemDef[] = [
  // Dominant: the great arch sweeping across the top to the left (carries the bottles).
  {
    id: "arch",
    layer: "mid",
    pts: [[1172, 968], [1150, 880], [1118, 790], [1098, 700], [1094, 610], [1072, 520], [1030, 432], [970, 356], [890, 292], [800, 246], [700, 214], [592, 196], [482, 192], [376, 204], [280, 230], [196, 268], [128, 316]],
    w0: 50,
    start: 0.12,
    dur: 4.3,
    branchEvery: 0.072,
    branchLen: 150,
    curl: -1,
    seed: 11,
    hangers: [
      { t: 0.45, heading: 62, length: 210, bend: 4 },
      { t: 0.6, heading: 98, length: 245, bend: -3 },
      { t: 0.75, heading: 108, length: 190, bend: 5 },
    ],
    sway: [0.45, 4.6],
  },
  // Dominant: shoots straight up toward the top of the screen, curling over at the crown.
  {
    id: "tower",
    layer: "front",
    pts: [[1188, 968], [1172, 860], [1140, 750], [1128, 640], [1100, 540], [1060, 450], [1040, 350], [1052, 250], [1010, 160], [930, 110], [850, 112]],
    w0: 44,
    start: 0.32,
    dur: 3.5,
    branchEvery: 0.085,
    branchLen: 135,
    curl: 1,
    seed: 23,
    sway: [0.6, 3.9],
  },
  // Dominant (background): a wide, low sweep across the middle toward the left.
  {
    id: "sweep",
    layer: "back",
    pts: [[1160, 972], [1110, 880], [1040, 800], [960, 720], [860, 650], [750, 590], [640, 556], [530, 548], [430, 566], [350, 600]],
    w0: 40,
    start: 0.02,
    dur: 4.6,
    branchEvery: 0.08,
    branchLen: 140,
    curl: 1,
    seed: 37,
    sway: [0.35, 5.4],
  },
  // Thin: climbs, then hooks back over the arch in a loose loop.
  {
    id: "hook",
    layer: "mid",
    pts: [[1180, 968], [1150, 860], [1100, 740], [1030, 620], [960, 520], [900, 430], [890, 340], [940, 280], [1010, 270], [1052, 320], [1030, 370]],
    w0: 22,
    start: 0.48,
    dur: 3.9,
    branchEvery: 0.12,
    branchLen: 100,
    curl: -1,
    seed: 41,
    sway: [0.7, 3.4],
  },
  // Thin (front): a slender stem rising along the right edge.
  {
    id: "edge",
    layer: "front",
    pts: [[1196, 968], [1186, 820], [1170, 680], [1176, 540], [1160, 400], [1170, 270], [1146, 160], [1104, 92]],
    w0: 18,
    start: 0.66,
    dur: 3.4,
    branchEvery: 0.14,
    branchLen: 85,
    curl: -1,
    seed: 53,
    sway: [0.8, 3.1],
  },
  // Thin (background): a diagonal climber crossing behind the arch.
  {
    id: "diagonal",
    layer: "back",
    pts: [[1168, 972], [1090, 860], [990, 760], [890, 670], [800, 570], [730, 470], [690, 380], [700, 300], [745, 262]],
    w0: 18,
    start: 0.22,
    dur: 4.1,
    branchEvery: 0.12,
    branchLen: 95,
    curl: 1,
    seed: 67,
    sway: [0.5, 4.2],
  },
  // Thin: a low runner curling out along the bottom.
  {
    id: "runner",
    layer: "front",
    pts: [[1176, 972], [1110, 918], [1030, 884], [950, 872], [880, 884], [830, 912]],
    w0: 15,
    start: 0.84,
    dur: 2.8,
    branchEvery: 0.18,
    branchLen: 70,
    curl: 1,
    seed: 79,
    sway: [0.9, 3.6],
  },
];

/* ── Generated geometry ────────────────────────────────────────────────── */

interface Branch {
  pts: Pt[];
  w0: number;
  w1: number;
  at: number;
  dur: number;
  /** Sub-branches are hidden on phones to keep the repaint light. */
  minor: boolean;
}

interface Tendril {
  d: string;
  at: number;
  dur: number;
  minor: boolean;
}

interface Leaf {
  x: number;
  y: number;
  r: number;
  s: number;
  tone: 0 | 1 | 2;
  at: number;
  minor: boolean;
}

interface BuiltStem {
  def: StemDef;
  pts: Pt[];
  segs: Segment[];
  branches: Branch[];
  hangers: Branch[];
  tendrils: Tendril[];
  leaves: Leaf[];
  doneAt: number;
}

function buildStem(def: StemDef): BuiltStem {
  const rand = mulberry32(def.seed * 7919);
  const pts = spline(def.pts, 6);
  const timeAt = (f: number) => easedTime(def.start, def.dur, f);
  const w1 = Math.max(3, def.w0 * 0.12);
  const branches: Branch[] = [];
  const tendrils: Tendril[] = [];
  const leaves: Leaf[] = [];

  const addLeaf = (p: Pt, r: number, s: number, at: number, minor: boolean) =>
    leaves.push({ x: r1(p[0]), y: r1(p[1]), r: Math.round(r), s: r2(s), tone: Math.floor(rand() * 3) as 0 | 1 | 2, at: r2(at), minor });
  const addTendril = (start: Pt, heading: number, length: number, dir: 1 | -1, at: number, minor: boolean) =>
    tendrils.push({ d: line(spiral(start, heading, length, dir)), at: r2(at), dur: 0.8, minor });

  // A branch: leaves along it, a leaf fan or tendril at the tip, maybe sub-branches.
  const makeBranch = (start: Pt, heading: number, length: number, bend: number, w0: number, at: number, depth: 0 | 1): Branch => {
    let dur = (depth ? 0.3 : 0.38) + length / 420;
    if (at + dur > GROW_CAP) dur = Math.max(0.3, GROW_CAP - at);
    const bp = grow(start, heading, length, bend, depth ? 5 : 8);
    const b: Branch = { pts: bp, w0, w1: depth ? 1.6 : 2.4, at, dur, minor: depth === 1 };
    const tAt = (f: number) => easedTime(at, dur, f);

    // Front stems get sparser leaves so the near layer stays airy, not a wall.
    const step = depth ? 6 : def.layer === "front" ? 9 : 8;
    for (let i = 3, side = rand() < 0.5 ? 1 : -1; i < bp.length - 1; i += step, side *= -1) {
      addLeaf(bp[i], angleAt(bp, i) + side * (42 + rand() * 38), (depth ? 0.55 : 0.7) + rand() * 0.45, tAt(i / (bp.length - 1)) + 0.06, depth === 1 || i % 2 === 0);
    }
    const tip = bp[bp.length - 1];
    const tipA = angleAt(bp, bp.length - 1);
    if (rand() < (depth ? 0.45 : 0.55)) {
      addTendril(tip, tipA, (depth ? 45 : 70) + rand() * 30, rand() < 0.5 ? 1 : -1, at + dur * 0.9, depth === 1);
    } else {
      for (let k = 0; k < 2; k++) addLeaf(tip, tipA - 22 + k * 44 + (rand() - 0.5) * 16, (depth ? 0.6 : 0.8) + rand() * 0.3, at + dur + 0.02, depth === 1);
    }
    if (depth === 0) {
      // Only longer branches fork: sub-branches were most of the vine's paths.
      const subs = length > 110 ? 1 : 0;
      for (let k = 0; k < subs; k++) {
        const u = 0.38 + k * 0.28 + rand() * 0.08;
        const i = Math.round(u * (bp.length - 1));
        const side = k % 2 ? 1 : -1;
        branches.push(
          makeBranch(bp[i], angleAt(bp, i) + side * (35 + rand() * 30), length * (0.42 + rand() * 0.18), (rand() - 0.5) * 16, Math.max(2.4, w0 * 0.45), tAt(u), 1),
        );
      }
    }
    return b;
  };

  // Side branches spawning along the stem in waves.
  const hangerTs = (def.hangers ?? []).map((h) => h.t);
  let side = 1;
  for (let t = 0.13 + rand() * 0.04; t < 0.9; t += def.branchEvery * (0.8 + rand() * 0.4)) {
    if (hangerTs.some((h) => Math.abs(h - t) < 0.04)) continue;
    const i = Math.round(t * (pts.length - 1));
    const a = angleAt(pts, i);
    const w = widthAt(def.w0, w1, t);
    const len = def.branchLen * (0.7 + rand() * 0.6) * (1 - t * 0.35);
    branches.push(makeBranch(pts[i], a + side * (38 + rand() * 42), len, (rand() - 0.5) * 18, Math.max(3, w * 0.42), timeAt(t), 0));
    side *= -1;
  }

  // The product hangers: fixed shapes so the bottles land in predictable places.
  const hangers = (def.hangers ?? []).map((h) => {
    const i = Math.round(h.t * (pts.length - 1));
    return makeBranch(pts[i], h.heading, h.length, h.bend, Math.max(4, widthAt(def.w0, w1, h.t) * 0.42), timeAt(h.t), 0);
  });

  // Leaves along the stem itself, set on alternating sides of its edge.
  for (let i = Math.round(pts.length * 0.12), s = 1; i < pts.length - 1; i += def.layer === "front" ? 10 : 8, s *= -1) {
    const f = i / (pts.length - 1);
    const off = (widthAt(def.w0, w1, f) / 2) * s;
    const a = angleAt(pts, i);
    addLeaf([pts[i][0] - Math.sin(rad(a)) * off, pts[i][1] + Math.cos(rad(a)) * off], a + s * (55 + rand() * 30), 0.9 + rand() * 0.6, timeAt(f) + 0.1, i % 8 === 0);
  }
  // The stem ends in a big curl.
  addTendril(pts[pts.length - 1], angleAt(pts, pts.length - 1), def.w0 * 2.6 + 40, def.curl, timeAt(0.98), false);

  const segs = segmentsOf(pts, def.w0, w1, def.w0 > 30 ? 10 : 7, timeAt);
  const doneAt = Math.max(
    timeAt(0.9999),
    ...branches.concat(hangers).map((b) => b.at + b.dur),
    ...tendrils.map((t) => t.at + t.dur),
    ...leaves.map((l) => l.at + 0.55),
  );
  return { def, pts, segs, branches, hangers, tendrils, leaves, doneAt };
}

const BUILT = STEMS.map(buildStem);
const ARCH = BUILT[0];

/* ── Public constants for the hero ─────────────────────────────────────── */

export const VINE_VIEWBOX = { w: 1200, h: 900 };

/** When the last part of the vine finishes growing (seconds). */
export const VINE_GROWN_AT = Math.max(...BUILT.map((b) => b.doneAt));

/** Sway of the arch stem, which the bottles share (they hang from it). */
export const VINE_ARCH_SWAY = ARCH.def.sway;

/** Pivot of the idle sway: the corner the cluster grows from (% of the box). */
export const VINE_PIVOT = "97.5% 106%";

const hangOn = (h: Branch, f: number) => {
  const p = h.pts[Math.round((h.pts.length - 1) * f)];
  return { x: r1(p[0]), y: r1(p[1]) };
};

/** Product hang points (viewBox units); string length & bottle height in % of box height (cqh). */
export const VINE_HANGS = [
  { slug: "pineapple-shot", ...hangOn(ARCH.hangers[2], 0.72), len: 6, h: 21 },
  { slug: "ginger-shot", ...hangOn(ARCH.hangers[1], 0.66), len: 4, h: 27 },
  { slug: "hibiscus-shot", ...hangOn(ARCH.hangers[0], 0.62), len: 9, h: 22 },
] as const;

/* ── Rendering ─────────────────────────────────────────────────────────── */

const LEAF = "M0 0C9-9 31-13 58 0C31 13 9 9 0 0Z";
/** Upper half of the leaf, lightened: soft shading with flat (cheap) fills. */
const LEAF_LIGHT = "M0 0C9-9 31-13 58 0C40-3 18-3 0 0Z";

const PALETTE: Record<Layer, { stem: string; branch: string; dark: string; light: string; tendril: string; leaves: [string, string, string] }> = {
  back: { stem: "#86B865", branch: "#92C170", dark: "#5E9C3C", light: "#C7E08F", tendril: "#9CC77A", leaves: ["#A4CC80", "#8DBF6A", "#B6D88F"] },
  mid: { stem: "#4E8A3A", branch: "#5A9440", dark: "#2F6B36", light: "#B2D46A", tendril: "#6FA046", leaves: ["#6FA046", "#4E8A3A", "#8DBF45"] },
  front: { stem: "#356F33", branch: "#3F7D33", dark: "#1F4F2A", light: "#9AC653", tendril: "#4E8A3A", leaves: ["#4E8A3A", "#2F6B36", "#5E9C3C"] },
};

/**
 * Layer styling: background stems recede (lighter, softly blurred). The blur is
 * a CSS class (vine-depth-blur) that is held off while the vine grows: blurring
 * a layer that repaints every frame is expensive, so it eases in once grown.
 */
const LAYER_STYLE: Record<Layer, { style: React.CSSProperties; className?: string }> = {
  back: { style: { opacity: 0.62 }, className: "vine-depth-blur" },
  mid: { style: {} },
  front: { style: {} },
};

function StemSvg({ stem }: { stem: BuiltStem }) {
  const c = PALETTE[stem.def.layer];
  const all = [...stem.branches, ...stem.hangers];
  const W0 = stem.def.w0;
  const W1 = Math.max(3, W0 * 0.12);
  const done = (stem.def.start + stem.def.dur - 0.3).toFixed(2);
  return (
    <svg viewBox="0 0 1200 900" className="absolute inset-0 h-full w-full" aria-hidden focusable="false" overflow="visible">
      <g fill="none" strokeLinecap="round">
        {/* Stem first, then branches & sub-branches (sub-branches are desktop-only). */}
        {stem.segs.map((s, i) => (
          <path key={`s${i}`} data-grow-seg data-at={s.at.toFixed(2)} data-dur={s.dur.toFixed(2)} d={s.d} stroke={c.stem} strokeWidth={s.w} pathLength={1} strokeDasharray="1 1" strokeDashoffset="0" />
        ))}
        {all.map((b, bi) =>
          segmentsOf(b.pts, b.w0, b.w1, b.minor ? 1 : 2, (f) => easedTime(b.at, b.dur, f)).map((s, i) => (
            <path
              key={`b${bi}-${i}`}
              data-grow-seg
              data-at={s.at.toFixed(2)}
              data-dur={s.dur.toFixed(2)}
              className={b.minor ? "max-lg:hidden" : undefined}
              d={s.d}
              stroke={c.branch}
              strokeWidth={s.w}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset="0"
            />
          )),
        )}
        {/* Tendrils */}
        {stem.tendrils.map((t, i) => (
          <path
            key={`t${i}`}
            data-grow-seg
            data-at={t.at.toFixed(2)}
            data-dur={t.dur.toFixed(2)}
            className={t.minor ? "max-lg:hidden" : undefined}
            d={t.d}
            stroke={c.tendril}
            strokeWidth={W0 > 30 ? 3 : 2.4}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset="0"
          />
        ))}
        {/* Shading & a twisting strand, faded in once the stem has grown. */}
        <g data-shade data-at={done}>
          <path d={line(offsetLine(stem.pts, (t) => -widthAt(W0, W1, t) * 0.3))} stroke={c.dark} strokeOpacity="0.5" strokeWidth={W0 > 30 ? 6 : 3} />
          <path d={line(offsetLine(stem.pts, (t) => widthAt(W0, W1, t) * 0.24))} stroke={c.light} strokeOpacity="0.55" strokeWidth={W0 > 30 ? 3.5 : 2} />
          {W0 > 30 && (
            <path d={line(offsetLine(stem.pts, (t, i) => Math.sin(i * 0.42) * widthAt(W0, W1, t) * 0.42))} stroke={c.dark} strokeOpacity="0.55" strokeWidth="3" />
          )}
        </g>
      </g>

      {/* Leaves (minor ones are desktop-only). */}
      {stem.leaves.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`} className={l.minor ? "max-lg:hidden" : undefined}>
          <g data-leaf data-at={l.at.toFixed(2)}>
            <path d={LEAF} fill={c.leaves[l.tone]} />
            {stem.def.layer === "front" && <path d={LEAF_LIGHT} fill="#FFFFFF" fillOpacity="0.16" />}
          </g>
        </g>
      ))}

      {/* Knots where the product strings tie on. */}
      {stem.def.hangers && VINE_HANGS.map((h) => <circle key={h.slug} data-knot cx={h.x} cy={h.y} r="4.5" fill={c.dark} />)}
    </svg>
  );
}

const ORDER: Layer[] = ["back", "mid", "front"];

/**
 * The stem layers, back to front. Each is wrapped in its own swaying layer
 * (`data-stem-sway` with its sway amplitude/period), pivoting on the corner.
 */
export function HeroVine({ className }: { className?: string }) {
  return (
    <>
      {ORDER.flatMap((layer) =>
        BUILT.filter((s) => s.def.layer === layer).map((stem) => (
          <div
            key={stem.def.id}
            data-stem-sway
            data-amp={stem.def.sway[0]}
            data-period={stem.def.sway[1]}
            className={`absolute inset-0 ${className ?? ""}`}
            style={{ willChange: "transform" }}
          >
            {/* Blur & opacity live on an inner, non-composited wrapper so they are
                baked into the layer's raster once. On the swaying layer itself the
                GPU had to re-blur the whole layer on every frame of the sway. */}
            <div className={`absolute inset-0 ${LAYER_STYLE[layer].className ?? ""}`} style={LAYER_STYLE[layer].style}>
              <StemSvg stem={stem} />
            </div>
          </div>
        )),
      )}
    </>
  );
}
