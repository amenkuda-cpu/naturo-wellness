import type { Category, CategoryId, Motif, Product, ProductTheme, ProductVariant } from "@/lib/types";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  NATURO PRODUCT CATALOGUE: the single source of product content.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  • Prices are intentionally `null`. A product shows "Price coming soon" and
 *    cannot be purchased until a real price is set, either here or (when
 *    Supabase is connected) in the `product_variants` table / admin dashboard.
 *  • `ingredients`, `nutrition`, `allergens`, `size` and `verifiedBenefits`
 *    stay null/empty until Naturo confirms them from the approved label.
 *  • `motifs` are decorative art direction only. They are not ingredient claims.
 *  • Images point at temporary artwork. Drop the final photo into
 *    /public/images/products/ with the same filename and set placeholder: false.
 */

export const categories: Category[] = [
  {
    id: "wellness-shots",
    name: "Wellness Shots",
    shortName: "Shots",
    description: "Small, bold blends made for a daily ritual.",
  },
  {
    id: "traditional-favourites",
    name: "Traditional Favourites",
    shortName: "Traditional",
    description: "Much-loved Zimbabwean drinks in a modern, convenient bottle.",
  },
  {
    id: "teas-and-powders",
    name: "Herbal Teas & Powders",
    shortName: "Teas & Powders",
    description: "Comforting blends for a cup at home, at work or on the move.",
  },
];

export const categoryById = (id: CategoryId) => categories.find((c) => c.id === id)!;

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

function image(file: string, name: string, kind: string) {
  return {
    src: `/images/products/${file}-placeholder.webp`,
    alt: `${name}: temporary ${kind} artwork with a placeholder Naturo label`,
    placeholder: true,
    width: 900,
    height: 1350,
  };
}

const commonFaqs = (name: string) => [
  {
    question: `Where can I find the full ingredient list for ${name}?`,
    answer:
      "We publish ingredient lists exactly as they appear on our approved labels. Until a label is finalised for the website, please check the bottle or contact us and we'll share the details.",
  },
  {
    question: "How is my order delivered?",
    answer:
      "Delivery and collection options, areas and fees are shown at checkout. Our team confirms every order before dispatch.",
  },
];

interface Seed {
  id: string;
  name: string;
  file: string;
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
}

const seeds: Seed[] = [
  {
    id: "ginger-shot",
    name: "Ginger Shot",
    file: "ginger-shot",
    category: "wellness-shots",
    packaging: "shot",
    kind: "bottle",
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
    related: ["glow-shot", "pineapple-shot", "ginger-lemon-carrot-tea"],
  },
  {
    id: "glow-shot",
    name: "Glow Shot",
    file: "glow-shot",
    category: "wellness-shots",
    packaging: "shot",
    kind: "bottle",
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
    related: ["ginger-shot", "hibiscus-shot", "pineapple-shot"],
  },
  {
    id: "hibiscus-shot",
    name: "Hibiscus Shot",
    file: "hibiscus-shot",
    category: "wellness-shots",
    packaging: "shot",
    kind: "bottle",
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
    related: ["glow-shot", "pineapple-shot", "ginger-shot"],
  },
  {
    id: "pineapple-shot",
    name: "Pineapple Shot",
    file: "pineapple-shot",
    category: "wellness-shots",
    packaging: "shot",
    kind: "bottle",
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
    file: "mens-vitality",
    category: "wellness-shots",
    packaging: "shot",
    kind: "bottle",
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
    related: ["ginger-shot", "glow-shot", "maheu"],
  },
  {
    id: "maheu",
    name: "Maheu",
    file: "maheu",
    category: "traditional-favourites",
    packaging: "tall",
    kind: "bottle",
    shortDescription:
      "A much-loved Zimbabwean favourite, freshly prepared and bottled to bring a familiar taste into everyday life.",
    fullDescription: [
      "Maheu is a taste of home for so many Zimbabweans. We prepare ours fresh and bottle it so that a familiar favourite fits into modern life.",
      "Enjoy it chilled, on the go, or shared with the family.",
    ],
    featured: true,
    tags: ["traditional", "heritage", "family"],
    motifs: ["maize-kernels", "sorghum-head", "leaf"],
    theme: { accent: "#C9A24A", deep: "#5B4515", tint: "#F1E7CF" },
    mood: "Familiar. Nourishing. Home.",
    related: ["muvhee", "ginger-lemon-carrot-tea", "ginger-shot"],
  },
  {
    id: "muvhee",
    name: "Muvhee",
    file: "muvhee",
    category: "traditional-favourites",
    packaging: "tall",
    kind: "bottle",
    shortDescription: "A traditional drink presented in a modern, convenient bottled format.",
    fullDescription: [
      "Muvhee brings a traditional drink into a modern, convenient bottle, with all the character you remember and none of the fuss.",
      "Proudly part of our heritage range.",
    ],
    tags: ["traditional", "heritage"],
    motifs: ["sorghum-head", "maize-kernels", "leaf"],
    theme: { accent: "#A86B2C", deep: "#4A2D10", tint: "#F0DFC6" },
    mood: "Heritage. Character. Pride.",
    related: ["maheu", "ginger-shot", "ginger-lemon-carrot-tea"],
  },
  {
    id: "ginger-lemon-carrot-tea",
    name: "Ginger, Lemon & Carrot Tea",
    file: "herbal-tea",
    category: "teas-and-powders",
    packaging: "pouch",
    kind: "pouch",
    shortDescription:
      "A comforting blend inspired by familiar ingredients, ideal for a soothing cup at home, at work, or on the move.",
    fullDescription: [
      "A comforting cup built around familiar ingredients: warming ginger, bright lemon and earthy carrot.",
      "Brew it when you want a calm moment, at home, at your desk or wherever the day takes you.",
    ],
    featured: true,
    tags: ["tea-moment", "citrus", "warming"],
    motifs: ["tea-leaf", "lemon-slice", "carrot", "ginger-slice"],
    theme: { accent: "#E9772E", deep: "#5C3413", tint: "#F5ECD9" },
    mood: "Calm. Comforting. Slow.",
    related: ["ginger-lemon-carrot-powder", "ginger-shot", "maheu"],
  },
  {
    id: "ginger-lemon-carrot-powder",
    name: "Ginger, Lemon & Carrot Instant Powder",
    file: "instant-powder",
    category: "teas-and-powders",
    packaging: "pouch",
    kind: "pouch",
    shortDescription: "A convenient powdered blend designed for easy preparation.",
    fullDescription: [
      "All the comfort of our Ginger, Lemon & Carrot blend in a convenient instant powder.",
      "Designed for easy preparation, so a warm cup is only moments away.",
    ],
    tags: ["tea-moment", "convenient", "citrus"],
    motifs: ["lemon-slice", "carrot", "ginger", "tea-leaf"],
    theme: { accent: "#367A45", deep: "#173F2B", tint: "#F8F0C6" },
    mood: "Quick. Warm. Easy.",
    related: ["ginger-lemon-carrot-tea", "ginger-shot", "glow-shot"],
  },
];

export const products: Product[] = seeds.map((s) => ({
  id: s.id,
  slug: s.id,
  name: s.name,
  category: s.category,
  shortDescription: s.shortDescription,
  fullDescription: s.fullDescription,
  currency: "USD",
  images: [image(s.file, s.name, s.kind)],
  packaging: s.packaging,
  ingredients: null,
  variants: [variant(s.id)],
  featured: s.featured ?? false,
  enabledForSale: true,
  tags: s.tags,
  preparation: s.preparation ?? PENDING_PREP,
  storage: DEFAULT_STORAGE,
  allergens: null,
  nutrition: null,
  verifiedBenefits: [],
  relatedSlugs: s.related,
  faqs: commonFaqs(s.name),
  motifs: s.motifs,
  theme: s.theme,
  mood: s.mood,
}));

export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const productById = (id: string) => products.find((p) => p.id === id);
