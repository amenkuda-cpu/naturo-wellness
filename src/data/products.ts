import type { Category, CategoryId, Motif, Product, ProductTheme, ProductVariant } from "@/lib/types";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  NATURO PRODUCT CATALOGUE: the single source of product content.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  • Prices are in cents (USD). They are STARTING PRICES set from market
 *    research (Oct 2026) and are meant to be replaced with Naturo's price list,
 *    either here or (when Supabase is connected) in the admin dashboard.
 *    A product with `price: null` shows "Price coming soon" and cannot be bought.
 *  • `size` is taken from the printed label. `ingredients`, `nutrition` and
 *    `verifiedBenefits` stay empty until Naturo confirms them.
 *  • `motifs` are decorative art direction only. They are not ingredient claims.
 *  • Product photos live in /public/images/products/<photo>.webp as transparent
 *    900x1350 cut-outs. Products without `photo` use temporary artwork.
 */

export const categories: Category[] = [
  {
    id: "wellness-shots",
    name: "Wellness Shots",
    shortName: "Shots",
    description: "Small, bold 100 ml blends made for a daily ritual.",
  },
  {
    id: "traditional-favourites",
    name: "Traditional Favourites",
    shortName: "Traditional",
    description: "Much-loved Zimbabwean drinks in a modern, convenient bottle.",
  },
  {
    id: "teas-and-powders",
    name: "Herbal Teas",
    shortName: "Herbal Teas",
    description: "Seven herbal blends, 20 tea bags in every pouch, for a calm cup at home, at work or on the move.",
  },
  {
    id: "naturo-cans",
    name: "Naturo Cans",
    shortName: "Cans (18+)",
    description: "Fruity 5.2% alc./vol. drinks in 330 ml cans, best served with friends. For adults 18 and over.",
    ageRestricted: true,
  },
];

export const categoryById = (id: CategoryId) => categories.find((c) => c.id === id)!;

/** Alcoholic products: 18+ notice in the UI and age confirmation at checkout. */
export const isAgeRestricted = (product: Pick<Product, "category">) =>
  Boolean(categories.find((c) => c.id === product.category)?.ageRestricted);

const PENDING_PREP = null;
const DEFAULT_STORAGE = null;

function variant(productId: string, overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: `${productId}-standard`,
    sku: null,
    label: "Single",
    size: null,
    price: null,
    compareAtPrice: null,
    stockStatus: "unknown",
    stockQuantity: null,
    ...overrides,
  };
}

function image(s: Pick<Seed, "photo" | "file" | "name" | "kind">) {
  if (s.photo) {
    return {
      src: `/images/products/${s.photo}.webp`,
      alt: `${s.name} ${s.kind} with its Naturo Wellness label`,
      placeholder: false,
      width: 900,
      height: 1350,
    };
  }
  return {
    src: `/images/products/${s.file}-placeholder.webp`,
    alt: `${s.name}: temporary ${s.kind} artwork with a placeholder Naturo label`,
    placeholder: true,
    width: 900,
    height: 1350,
  };
}

const commonFaqs = (name: string) => [
  {
    question: `Where can I find the full ingredient list for ${name}?`,
    answer:
      "We publish ingredient lists exactly as they appear on our approved labels. Until a label is finalised for the website, please check the pack or contact us and we'll share the details.",
  },
  {
    question: "How is my order delivered?",
    answer:
      "Delivery and collection options, areas and fees are shown at checkout. Our team confirms every order before dispatch.",
  },
];

const canFaqs = (name: string) => [
  {
    question: `Who can buy ${name}?`,
    answer:
      "Naturo Cans contain alcohol (5.2% alc./vol.). They are only sold to adults aged 18 and over, and we may ask for ID on delivery or collection.",
  },
  ...commonFaqs(name),
];

interface Seed {
  id: string;
  name: string;
  /** Transparent product photo in /public/images/products (without .webp). */
  photo?: string;
  /** Temporary artwork name, used when there is no photo yet. */
  file?: string;
  category: CategoryId;
  packaging: Product["packaging"];
  shortDescription: string;
  fullDescription: string[];
  featured?: boolean;
  tags: string[];
  motifs: Motif[];
  theme: ProductTheme;
  mood: string;
  related: string[];
  preparation?: string | null;
  kind: string;
  /** Size as printed on the label. */
  size?: string;
  /** Starting price in cents (USD). Null = "Price coming soon". */
  price: number | null;
}

const TEA_SIZE = "20 tea bags · 40 g";
const TEA_PREP = "Steep one tea bag in a cup of freshly boiled water for 3–5 minutes.";
const CAN_SIZE = "330 ml · 5.2% alc./vol.";

const seeds: Seed[] = [
  /* ───────────── Wellness shots (100 ml) ───────────── */
  {
    id: "ginger-shot",
    name: "Ginger Shot",
    photo: "ginger-shot",
    category: "wellness-shots",
    packaging: "shot",
    kind: "bottle",
    size: "100 ml",
    price: 200,
    shortDescription: "A warming, zesty ginger blend for your daily wellness routine.",
    fullDescription: [
      "Our Ginger Shot is bold by design: a warming, zesty hit of ginger made to be the easiest part of your morning.",
      "Keep one in the fridge, take it with breakfast or before you head out, and let the flavour wake you up.",
    ],
    featured: true,
    tags: ["daily-routine", "citrus", "warming", "bestseller-candidate"],
    motifs: ["ginger", "lemon-slice", "ginger-slice", "droplet"],
    theme: { accent: "#E7A33E", deep: "#7A4A12", tint: "#F8E7BF" },
    mood: "Warming. Zesty. Wide awake.",
    related: ["glow-shot", "pineapple-shot", "ginger-lemon-tea"],
  },
  {
    id: "glow-shot",
    name: "Glow Shot",
    photo: "glow-shot",
    category: "wellness-shots",
    packaging: "shot",
    kind: "bottle",
    size: "100 ml",
    price: 200,
    shortDescription:
      "A fresh botanical blend for people who enjoy making natural wellness part of their everyday routine.",
    fullDescription: [
      "Glow Shot is our fresh, green-and-golden botanical blend: bright, clean and easy to love.",
      "Made for people who enjoy small, natural rituals, whether that's with breakfast, after the gym or mid-afternoon.",
    ],
    featured: true,
    tags: ["daily-routine", "botanical", "fresh"],
    motifs: ["leaf", "lime-slice", "tea-leaf", "droplet"],
    theme: { accent: "#77A84A", deep: "#2E5A22", tint: "#EEF3D2" },
    mood: "Fresh. Bright. Botanical.",
    related: ["ginger-shot", "hibiscus-shot", "green-focus-tea"],
  },
  {
    id: "hibiscus-shot",
    name: "Hibiscus Shot",
    photo: "hibiscus-shot",
    category: "wellness-shots",
    packaging: "shot",
    kind: "bottle",
    size: "100 ml",
    price: 200,
    shortDescription: "A tangy, refreshing hibiscus blend with a vibrant botanical character.",
    fullDescription: [
      "Deep ruby in colour and tangy on the tongue, our Hibiscus Shot celebrates one of the most striking flowers in the botanical world.",
      "Refreshing on its own, chilled, or as a bright moment in your day.",
    ],
    featured: true,
    tags: ["botanical", "tangy", "floral"],
    motifs: ["hibiscus", "hibiscus-petal", "orange-slice", "droplet"],
    theme: { accent: "#B5122F", deep: "#5A0F22", tint: "#F6D6D9", dark: true },
    mood: "Tangy. Vivid. Floral.",
    related: ["hibiscus-tea", "glow-shot", "pineapple-shot"],
  },
  {
    id: "pineapple-shot",
    name: "Pineapple Shot",
    photo: "pineapple-shot",
    category: "wellness-shots",
    packaging: "shot",
    kind: "bottle",
    size: "100 ml",
    price: 200,
    shortDescription: "A sweet, tropical blend with naturally occurring vitamin C.",
    fullDescription: [
      "Sunshine in a small bottle. Our Pineapple Shot is sweet, tropical and bright, with the naturally occurring vitamin C found in pineapple.",
      "A favourite for anyone who wants their wellness ritual to taste like a holiday.",
    ],
    featured: true,
    tags: ["tropical", "sweet", "citrus"],
    motifs: ["pineapple-chunk", "pineapple-crown", "orange-slice", "droplet"],
    theme: { accent: "#F2B92B", deep: "#6E4B06", tint: "#FCEFB4" },
    mood: "Sweet. Tropical. Sunny.",
    related: ["ginger-shot", "hibiscus-shot", "glow-shot"],
  },
  {
    id: "mens-vitality-shot",
    name: "Men’s Vitality Shot",
    photo: "mens-vitality-shot",
    category: "wellness-shots",
    packaging: "shot",
    kind: "bottle",
    size: "100 ml",
    price: 250,
    shortDescription:
      "A natural blend inspired by traditional ingredients and associated with energy and stamina.",
    fullDescription: [
      "Grounded, earthy and confident, our Men’s Vitality Shot draws inspiration from traditional ingredients long associated with energy and stamina.",
      "A deliberate, no-fuss ritual for busy days.",
    ],
    tags: ["daily-routine", "earthy", "traditional-inspired"],
    motifs: ["ginger", "leaf", "ginger-slice", "tea-leaf"],
    theme: { accent: "#C7832F", deep: "#173F2B", tint: "#DCE6D5", dark: true },
    mood: "Grounded. Earthy. Confident.",
    related: ["ginger-shot", "sunset-glow-tea", "maheu-traditional"],
  },

  /* ───────────── Traditional favourites ───────────── */
  {
    id: "maheu-traditional",
    name: "Maheu Traditional",
    photo: "maheu-traditional",
    category: "traditional-favourites",
    packaging: "tall",
    kind: "bottle",
    size: "500 ml",
    price: 100,
    shortDescription:
      "Traditional fermented maize drink: the much-loved Zimbabwean original, smooth, creamy and refreshing.",
    fullDescription: [
      "Maheu is a taste of home for so many Zimbabweans. Our Traditional flavour keeps it classic: a smooth, creamy fermented maize drink, bottled so a familiar favourite fits into modern life.",
      "Enjoy it chilled, on the go, or shared with the family.",
    ],
    featured: true,
    tags: ["traditional", "heritage", "family"],
    motifs: ["maize-kernels", "sorghum-head", "leaf"],
    theme: { accent: "#E8B520", deep: "#5B4515", tint: "#F8EDC9" },
    mood: "Familiar. Creamy. Home.",
    related: ["maheu-buttermilk", "muvhee", "ginger-shot"],
  },
  {
    id: "maheu-buttermilk",
    name: "Maheu Buttermilk",
    photo: "maheu-buttermilk",
    category: "traditional-favourites",
    packaging: "tall",
    kind: "bottle",
    size: "500 ml",
    price: 100,
    shortDescription: "Traditional fermented maize drink with a smooth, tangy buttermilk flavour.",
    fullDescription: [
      "All the comfort of traditional maheu with a gentle buttermilk tang. Smooth, creamy and refreshing.",
      "Best served cold, any time of day.",
    ],
    tags: ["traditional", "heritage", "creamy"],
    motifs: ["maize-kernels", "droplet", "leaf"],
    theme: { accent: "#2F8FD8", deep: "#173F5B", tint: "#E3EFF8" },
    mood: "Smooth. Tangy. Refreshing.",
    related: ["maheu-traditional", "muvhee", "pineapple-shot"],
  },
  {
    id: "muvhee",
    name: "Muvhee",
    file: "muvhee",
    category: "traditional-favourites",
    packaging: "tall",
    kind: "bottle",
    price: null,
    shortDescription: "A traditional drink presented in a modern, convenient bottled format.",
    fullDescription: [
      "Muvhee brings a traditional drink into a modern, convenient bottle, with all the character you remember and none of the fuss.",
      "Proudly part of our heritage range.",
    ],
    tags: ["traditional", "heritage"],
    motifs: ["sorghum-head", "maize-kernels", "leaf"],
    theme: { accent: "#A86B2C", deep: "#4A2D10", tint: "#F0DFC6" },
    mood: "Heritage. Character. Pride.",
    related: ["maheu-traditional", "maheu-buttermilk", "muvheyi-tea"],
  },

  /* ───────────── Herbal teas (20 bags · 40 g) ───────────── */
  {
    id: "ginger-lemon-tea",
    name: "Ginger Lemon Herbal Tea",
    photo: "ginger-lemon-tea",
    category: "teas-and-powders",
    packaging: "pouch",
    kind: "pouch",
    size: TEA_SIZE,
    price: 350,
    preparation: TEA_PREP,
    shortDescription: "Warming ginger and bright lemon in a comforting herbal cup.",
    fullDescription: [
      "A classic pairing: warming ginger with a bright squeeze of lemon. 100% natural herbal tea.",
      "Brew it when you want a calm moment, at home, at your desk or wherever the day takes you.",
    ],
    featured: true,
    tags: ["tea-moment", "citrus", "warming"],
    motifs: ["ginger", "lemon-slice", "tea-leaf", "ginger-slice"],
    theme: { accent: "#F2C230", deep: "#5C4410", tint: "#FBF0C4" },
    mood: "Warming. Bright. Comforting.",
    related: ["ginger-shot", "sunset-glow-tea", "carrot-tea"],
  },
  {
    id: "hibiscus-tea",
    name: "Hibiscus Herbal Tea",
    photo: "hibiscus-tea",
    category: "teas-and-powders",
    packaging: "pouch",
    kind: "pouch",
    size: TEA_SIZE,
    price: 350,
    preparation: TEA_PREP,
    shortDescription: "A ruby-red, tangy hibiscus infusion, lovely hot or iced.",
    fullDescription: [
      "Hibiscus flowers brew into a deep ruby cup with a tangy, cranberry-like character. 100% natural herbal tea.",
      "Serve it hot, or brew it strong and pour over ice on a warm afternoon.",
    ],
    featured: true,
    tags: ["tea-moment", "floral", "tangy"],
    motifs: ["hibiscus", "hibiscus-petal", "tea-leaf", "leaf"],
    theme: { accent: "#B8173A", deep: "#5A0F22", tint: "#F6D6DC" },
    mood: "Tangy. Ruby. Floral.",
    related: ["hibiscus-shot", "indongo-bloom-tea", "sunset-glow-tea"],
  },
  {
    id: "sunset-glow-tea",
    name: "Sunset Glow Herbal Tea",
    photo: "sunset-glow-tea",
    category: "teas-and-powders",
    packaging: "pouch",
    kind: "pouch",
    size: TEA_SIZE,
    price: 400,
    preparation: TEA_PREP,
    shortDescription: "Golden turmeric and warming ginger: an earthy, glowing cup.",
    fullDescription: [
      "Turmeric and ginger come together in a golden, earthy blend with a gentle warmth. 100% natural herbal tea.",
      "Made for slow evenings and the last light of the day.",
    ],
    tags: ["tea-moment", "warming", "earthy"],
    motifs: ["ginger", "ginger-slice", "orange-slice", "tea-leaf"],
    theme: { accent: "#F08A1C", deep: "#6B3A0B", tint: "#FCE5C4" },
    mood: "Golden. Earthy. Warm.",
    related: ["ginger-lemon-tea", "carrot-tea", "mens-vitality-shot"],
  },
  {
    id: "green-focus-tea",
    name: "Green Focus Herbal Tea",
    photo: "green-focus-tea",
    category: "teas-and-powders",
    packaging: "pouch",
    kind: "pouch",
    size: TEA_SIZE,
    price: 350,
    preparation: "Steep one tea bag in hot (not boiling) water for 2–3 minutes.",
    shortDescription: "Fresh green tea for a clean, bright cup during a busy day.",
    fullDescription: [
      "Green Focus is pure green tea: fresh, grassy and clean, with the light lift of a proper cup of tea.",
      "Brew it a little cooler than boiling to keep it smooth.",
    ],
    tags: ["tea-moment", "fresh", "botanical"],
    motifs: ["tea-leaf", "leaf", "lime-slice", "droplet"],
    theme: { accent: "#5FA234", deep: "#24501A", tint: "#E6F1D4" },
    mood: "Fresh. Clean. Focused.",
    related: ["glow-shot", "muvheyi-tea", "ginger-lemon-tea"],
  },
  {
    id: "indongo-bloom-tea",
    name: "Indongo Bloom Herbal Tea",
    photo: "indongo-bloom-tea",
    category: "teas-and-powders",
    packaging: "pouch",
    kind: "pouch",
    size: TEA_SIZE,
    price: 450,
    preparation: `${TEA_PREP} Add a squeeze of lemon and watch the colour change.`,
    shortDescription: "Butterfly pea flower tea that brews a striking, deep blue.",
    fullDescription: [
      "Indongo Bloom is made with butterfly pea flower, which brews into a vivid blue cup with a soft, earthy taste. 100% natural herbal tea.",
      "Add a squeeze of lemon and the blue turns violet in front of you.",
    ],
    tags: ["tea-moment", "floral", "colourful"],
    motifs: ["leaf", "tea-leaf", "lemon-slice", "droplet"],
    theme: { accent: "#3A44B8", deep: "#1C2366", tint: "#DFE2F7", dark: true },
    mood: "Blue. Floral. Magical.",
    related: ["hibiscus-tea", "green-focus-tea", "muvheyi-tea"],
  },
  {
    id: "muvheyi-tea",
    name: "Muvheyi Herbal Tea",
    photo: "muvheyi-tea",
    category: "teas-and-powders",
    packaging: "pouch",
    kind: "pouch",
    size: TEA_SIZE,
    price: 350,
    preparation: TEA_PREP,
    shortDescription: "A traditional Zimbabwean herbal leaf, made easy in a tea bag.",
    fullDescription: [
      "Muvheyi is a herbal leaf with deep roots in Zimbabwean tradition. We've made it as easy as dropping a tea bag in a cup. 100% natural herbal tea.",
      "A heritage cup for everyday moments.",
    ],
    tags: ["tea-moment", "traditional", "botanical"],
    motifs: ["tea-leaf", "leaf", "droplet"],
    theme: { accent: "#3E8A3A", deep: "#1D4A1F", tint: "#E1EDD9" },
    mood: "Heritage. Leafy. Calm.",
    related: ["green-focus-tea", "muvhee", "carrot-tea"],
  },
  {
    id: "carrot-tea",
    name: "Carrot Herbal Tea",
    photo: "carrot-tea",
    category: "teas-and-powders",
    packaging: "pouch",
    kind: "pouch",
    size: TEA_SIZE,
    price: 350,
    preparation: TEA_PREP,
    shortDescription: "A gentle, naturally sweet carrot infusion.",
    fullDescription: [
      "Our Carrot Herbal Tea brews into a mellow, naturally sweet and earthy cup. 100% natural herbal tea.",
      "Soft enough for any time of day.",
    ],
    tags: ["tea-moment", "earthy", "sweet"],
    motifs: ["carrot", "tea-leaf", "leaf", "droplet"],
    theme: { accent: "#EE7A22", deep: "#6A320C", tint: "#FBE2CC" },
    mood: "Mellow. Sweet. Earthy.",
    related: ["ginger-lemon-tea", "sunset-glow-tea", "ginger-lemon-carrot-powder"],
  },
  {
    id: "ginger-lemon-carrot-powder",
    name: "Ginger, Lemon & Carrot Instant Powder",
    file: "instant-powder",
    category: "teas-and-powders",
    packaging: "pouch",
    kind: "pouch",
    price: null,
    shortDescription: "A convenient powdered blend designed for easy preparation.",
    fullDescription: [
      "Ginger, lemon and carrot in a convenient instant powder.",
      "Designed for easy preparation, so a warm cup is only moments away.",
    ],
    tags: ["tea-moment", "convenient", "citrus"],
    motifs: ["lemon-slice", "carrot", "ginger", "tea-leaf"],
    theme: { accent: "#367A45", deep: "#173F2B", tint: "#F8F0C6" },
    mood: "Quick. Warm. Easy.",
    related: ["ginger-lemon-tea", "carrot-tea", "ginger-shot"],
  },

  /* ───────────── Naturo Cans (330 ml · 5.2% alc./vol. · 18+) ───────────── */
  {
    id: "orange-can",
    name: "Naturo Orange",
    photo: "orange-can",
    category: "naturo-cans",
    packaging: "can",
    kind: "can",
    size: CAN_SIZE,
    price: 150,
    shortDescription: "Juicy orange flavour, 5.2% alc./vol. Best served with friends. 18+ only.",
    fullDescription: [
      "Bright, juicy orange in an ice-cold 330 ml can. 5.2% alc./vol.",
      "Best served with friends. Please enjoy responsibly. Not for sale to persons under 18.",
    ],
    featured: true,
    tags: ["social", "citrus", "chilled"],
    motifs: ["orange-slice", "droplet", "leaf"],
    theme: { accent: "#F2711C", deep: "#1F2550", tint: "#FDE0C8" },
    mood: "Juicy. Zesty. Sociable.",
    related: ["cranberry-can", "apple-can", "pineapple-shot"],
  },
  {
    id: "cranberry-can",
    name: "Naturo Cranberry",
    photo: "cranberry-can",
    category: "naturo-cans",
    packaging: "can",
    kind: "can",
    size: CAN_SIZE,
    price: 150,
    shortDescription: "Tart, berry-bright cranberry flavour, 5.2% alc./vol. Best served with friends. 18+ only.",
    fullDescription: [
      "Tart, berry-bright cranberry in an ice-cold 330 ml can. 5.2% alc./vol.",
      "Best served with friends. Please enjoy responsibly. Not for sale to persons under 18.",
    ],
    tags: ["social", "berry", "chilled"],
    motifs: ["hibiscus-petal", "droplet", "leaf"],
    theme: { accent: "#D7245A", deep: "#4A0F2A", tint: "#F9D3DF", dark: true },
    mood: "Tart. Bright. Sociable.",
    related: ["orange-can", "apple-can", "hibiscus-shot"],
  },
  {
    id: "apple-can",
    name: "Naturo Apple",
    photo: "apple-can",
    category: "naturo-cans",
    packaging: "can",
    kind: "can",
    size: CAN_SIZE,
    price: 150,
    shortDescription: "Crisp green apple flavour, 5.2% alc./vol. Best served with friends. 18+ only.",
    fullDescription: [
      "Crisp, green apple in an ice-cold 330 ml can. 5.2% alc./vol.",
      "Best served with friends. Please enjoy responsibly. Not for sale to persons under 18.",
    ],
    tags: ["social", "crisp", "chilled"],
    motifs: ["lime-slice", "droplet", "leaf"],
    theme: { accent: "#6CC234", deep: "#1E4A1A", tint: "#E5F4D4" },
    mood: "Crisp. Fresh. Sociable.",
    related: ["orange-can", "cranberry-can", "glow-shot"],
  },
];

const VARIANT_LABEL: Record<Product["packaging"], string> = { shot: "Bottle", tall: "Bottle", pouch: "Pouch", can: "Can" };

export const products: Product[] = seeds.map((s) => ({
  id: s.id,
  slug: s.id,
  name: s.name,
  category: s.category,
  shortDescription: s.shortDescription,
  fullDescription: s.fullDescription,
  currency: "USD",
  images: [image(s)],
  packaging: s.packaging,
  ingredients: null,
  variants: [variant(s.id, { label: VARIANT_LABEL[s.packaging], size: s.size ?? null, price: s.price })],
  featured: s.featured ?? false,
  enabledForSale: true,
  tags: s.tags,
  preparation: s.preparation ?? PENDING_PREP,
  storage: DEFAULT_STORAGE,
  allergens: null,
  nutrition: null,
  verifiedBenefits: [],
  relatedSlugs: s.related,
  faqs: categoryById(s.category).ageRestricted ? canFaqs(s.name) : commonFaqs(s.name),
  motifs: s.motifs,
  theme: s.theme,
  mood: s.mood,
}));

export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const productById = (id: string) => products.find((p) => p.id === id);
