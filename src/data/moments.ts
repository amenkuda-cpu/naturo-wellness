import type { Motif } from "@/lib/types";

export interface Moment {
  id: string;
  title: string;
  line: string;
  productSlugs: string[];
  motifs: Motif[];
  color: string;
  ink: string;
}

/** "Shop by moment": descriptive groupings, never medical recommendations. */
export const moments: Moment[] = [
  {
    id: "daily-routine",
    title: "The Daily Routine",
    line: "Small bottles for the start of every day.",
    productSlugs: ["ginger-shot", "glow-shot", "mens-vitality-shot"],
    motifs: ["ginger", "leaf", "droplet"],
    color: "#F5D84E",
    ink: "#173F2B",
  },
  {
    id: "a-little-citrus",
    title: "A Little Citrus",
    line: "Bright, zesty and full of sunshine.",
    productSlugs: ["ginger-shot", "ginger-lemon-tea", "pineapple-shot"],
    motifs: ["lemon-slice", "orange-slice", "lime-slice"],
    color: "#FBEA91",
    ink: "#173F2B",
  },
  {
    id: "traditional-favourites",
    title: "Traditional Favourites",
    line: "Familiar flavours that feel like home.",
    productSlugs: ["maheu-traditional", "maheu-buttermilk"],
    motifs: ["maize-kernels", "sorghum-head", "leaf"],
    color: "#E9DCC0",
    ink: "#173F2B",
  },
  {
    id: "tea-moment",
    title: "Your Tea Moment",
    line: "A slower, comforting cup.",
    productSlugs: ["sunset-glow-tea", "hibiscus-tea"],
    motifs: ["tea-leaf", "carrot", "lemon-slice"],
    color: "#367A45",
    ink: "#FFFDF5",
  },
  {
    id: "something-tropical",
    title: "Something Tropical",
    line: "Sweet, vivid and holiday-bright.",
    productSlugs: ["pineapple-shot", "hibiscus-shot"],
    motifs: ["pineapple-chunk", "hibiscus", "orange-slice"],
    color: "#E7A33E",
    ink: "#173F2B",
  },
];
