/**
 * Core commerce types shared by the storefront, server and admin.
 * Money is always stored as an integer number of minor units (cents).
 */

export type CurrencyCode = "USD" | "ZWG" | "ZAR";

export type CategoryId = "wellness-shots" | "traditional-favourites" | "teas-and-powders";

export interface Category {
  id: CategoryId;
  name: string;
  shortName: string;
  description: string;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "unknown";

export type PackagingShape = "shot" | "tall" | "pouch";

export interface ProductVariant {
  id: string;
  sku: string | null;
  /** e.g. "Single bottle". */
  label: string;
  /** e.g. "100 ml". Null until confirmed by Naturo. */
  size: string | null;
  /** Minor units. Null = price not yet set → "Price coming soon", never purchasable. */
  price: number | null;
  compareAtPrice: number | null;
  stockStatus: StockStatus;
  /** Null = stock is not tracked numerically. */
  stockQuantity: number | null;
}

export interface NutritionRow {
  label: string;
  per100: string;
  perServing?: string;
}

export interface ProductFaq {
  question: string;
  answer: string;
}

/** Decorative motifs for art direction. NOT an ingredient claim. */
export type Motif =
  | "ginger"
  | "ginger-slice"
  | "lemon-slice"
  | "lime-slice"
  | "orange-slice"
  | "hibiscus"
  | "hibiscus-petal"
  | "pineapple-chunk"
  | "pineapple-crown"
  | "leaf"
  | "tea-leaf"
  | "carrot"
  | "droplet"
  | "maize-kernels"
  | "sorghum-head";

export interface ProductTheme {
  /** Main accent colour drawn from the product's character. */
  accent: string;
  /** Deep tone for text on light backgrounds / dark scenes. */
  deep: string;
  /** Soft background tint. */
  tint: string;
  /** Whether scenes using this product should be dark. */
  dark?: boolean;
}

export interface ProductImage {
  src: string;
  alt: string;
  /** True for temporary artwork; shows a small notice in the UI. */
  placeholder: boolean;
  width: number;
  height: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  shortDescription: string;
  fullDescription: string[];
  currency: CurrencyCode;
  images: ProductImage[];
  packaging: PackagingShape;
  /** Verified ingredient list. Null until confirmed from the approved label. */
  ingredients: string[] | null;
  variants: ProductVariant[];
  featured: boolean;
  /** Master switch: a product must be enabled AND priced to be sold. */
  enabledForSale: boolean;
  tags: string[];
  preparation: string | null;
  storage: string | null;
  allergens: string | null;
  nutrition: NutritionRow[] | null;
  /** Only benefits verified by Naturo (and compliant with local regulation). */
  verifiedBenefits: string[];
  relatedSlugs: string[];
  faqs: ProductFaq[];
  motifs: Motif[];
  theme: ProductTheme;
  /** Short art-direction line for the showcase (descriptive, not medical). */
  mood: string;
}

export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}

export type FulfilmentMethod = "delivery" | "collection";

export type PaymentMethodId = "cash_on_delivery" | "manual" | "paynow";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_collection"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded" | "cancelled";

export interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  /** Minor units. Zones without a configured fee are not offered at checkout. */
  fee: number | null;
  active: boolean;
}

export type PromotionKind = "percent" | "fixed";

export interface Promotion {
  code: string;
  kind: PromotionKind;
  /** Percent (0-100) for "percent"; minor units for "fixed". */
  value: number;
  minSubtotal: number | null;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
}
