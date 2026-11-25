import Link from "next/link";
import type { Motif } from "@/lib/types";

/**
 * Naturo Wellness Journal articles. Written in careful, general wellness language:
 * no medical claims, no promises to treat, cure or prevent anything.
 */
export interface Article {
  slug: string;
  title: string;
  /** <title>, under 60 characters. */
  seoTitle: string;
  /** Meta description, under 155 characters. */
  description: string;
  datePublished: string;
  readMinutes: number;
  image: string;
  imageAlt: string;
  motifs: Motif[];
  /** Product this article links to most. */
  productSlug: string;
  body: React.ReactNode;
}

const a = (href: string, text: string) => <Link href={href}>{text}</Link>;

export const articles: Article[] = [
  {
    slug: "benefits-of-ginger-shots",
    title: "Ginger shots: why people love them, and how to enjoy one",
    seoTitle: "Ginger Shots: Why People Love Them | Naturo Wellness",
    description:
      "Why ginger shots have become a morning favourite in Zimbabwe, what they taste like, and how to make one part of your routine. From Naturo Wellness.",
    datePublished: "2026-11-25",
    readMinutes: 4,
    image: "/images/products/ginger-shot.webp",
    imageAlt: "Naturo Wellness Ginger Shot bottle, 100 ml",
    motifs: ["ginger", "lemon-slice"],
    productSlug: "ginger-shot",
    body: (
      <>
        <p>
          Walk into any busy office in Harare before nine and you might spot someone knocking back a small bottle and
          pulling a face. Chances are it&apos;s a ginger shot. In a few short years, ginger shots have gone from a niche
          health-shop item to a morning habit for thousands of people. So what&apos;s the appeal?
        </p>
        <h2>A familiar flavour, made quick</h2>
        <p>
          Ginger is nothing new here. It has been a favourite in Zimbabwean kitchens for generations, grated into tea,
          added to stews and simmered on cold mornings. A ginger shot simply takes that familiar, warming flavour and puts
          it into a small bottle you can finish in a few seconds. No chopping, no boiling, no fuss.
        </p>
        <h2>Why people make it a habit</h2>
        <ul>
          <li><strong>The wake-up kick.</strong> The heat of fresh ginger is bold and immediate. Many people say it feels like a cold splash of water for the senses.</li>
          <li><strong>It&apos;s a ritual that sticks.</strong> A shot takes ten seconds, so it&apos;s easy to do every day, which is what makes a routine feel like a routine.</li>
          <li><strong>It replaces something else.</strong> Some people reach for a shot instead of a sugary fizzy drink mid-morning.</li>
          <li><strong>It&apos;s real food.</strong> Ginger is a plant you recognise, not a mystery powder.</li>
        </ul>
        <h2>What about health claims?</h2>
        <p>
          You&apos;ll often hear ginger shots called &quot;immunity shots&quot;. We keep things honest: our shots are
          natural drinks made to be part of a balanced lifestyle that also includes good food, water, sleep and movement.
          They aren&apos;t medicines, and no single drink can promise to prevent or cure anything. If you have a health
          condition, are pregnant or take medication, speak to your doctor before adding anything new to your routine.
        </p>
        <h2>How to enjoy a ginger shot</h2>
        <ul>
          <li>Keep it in the fridge. Ginger shots taste best ice-cold.</li>
          <li>Shake well before opening, because natural ingredients settle.</li>
          <li>Drink it in one go if you like the kick, or sip it slowly if it&apos;s your first time.</li>
          <li>Try it at the same time each day, such as with breakfast or before you leave home.</li>
        </ul>
        <h2>Try ours</h2>
        <p>
          The {a("/shop/ginger-shot", "Naturo Wellness Ginger Shot")} is a bold, warming 100 ml shot made fresh in
          Harare. If ginger feels too fiery, start with our sweeter {a("/shop/pineapple-shot", "Pineapple Shot")} or the
          fresh, light {a("/shop/glow-shot", "Glow Shot")}, then work your way up.
        </p>
      </>
    ),
  },
  {
    slug: "daily-wellness-routine",
    title: "How to build a daily wellness routine you'll actually keep",
    seoTitle: "How to Build a Daily Wellness Routine | Naturo Wellness",
    description:
      "Simple, realistic habits for a daily wellness routine in Zimbabwe: water, movement, rest, good food and small rituals that stick. From Naturo Wellness.",
    datePublished: "2026-11-25",
    readMinutes: 5,
    image: "/images/products/glow-shot.webp",
    imageAlt: "Naturo Wellness Glow Shot bottle, 100 ml",
    motifs: ["leaf", "droplet"],
    productSlug: "glow-shot",
    body: (
      <>
        <p>
          Most wellness plans fail for the same reason: they ask for too much, too soon. A routine you&apos;ll keep is
          built from small, boring, repeatable habits that fit around school runs, load-shedding, long commutes and busy
          weekends. Here&apos;s a simple way to start.
        </p>
        <h2>1. Anchor it to something you already do</h2>
        <p>
          New habits stick when they ride on old ones. Drink a glass of water as soon as the kettle goes on. Take your
          wellness shot when you pour your morning tea. Stretch for two minutes after you brush your teeth. The anchor does
          the remembering for you.
        </p>
        <h2>2. Start with water</h2>
        <p>
          Harare afternoons get hot. Keep a bottle of water on your desk or in the car and refill it twice a day. It&apos;s
          the simplest habit on this list and one of the easiest to forget.
        </p>
        <h2>3. Move a little, every day</h2>
        <p>
          You don&apos;t need a gym membership. A brisk 20-minute walk at lunch, taking the stairs, or dancing in the
          kitchen all count. Consistency beats intensity.
        </p>
        <h2>4. Eat more real food</h2>
        <p>
          Lean on the foods you grew up with: leafy greens like covo and rape, beans, groundnuts, sweet potatoes, fresh
          fruit from the market. Simple home cooking is hard to beat.
        </p>
        <h2>5. Protect your sleep</h2>
        <p>
          Put the phone down half an hour before bed and try to sleep and wake at similar times. A calm cup of herbal tea,
          like our {a("/shop/sunset-glow-tea", "Sunset Glow Herbal Tea")}, can become a cue that the day is done.
        </p>
        <h2>6. Add one small ritual you enjoy</h2>
        <p>
          Wellness should feel good, not like a punishment. For many people, that ritual is a morning wellness shot. It
          takes ten seconds, tastes great and reminds you that you&apos;re looking after yourself. Our
          {" "}{a("/shop/glow-shot", "Glow Shot")} is fresh and light, the {a("/shop/ginger-shot", "Ginger Shot")} brings
          the heat, and the {a("/shop/mens-vitality-shot", "Men's Vitality Shot")} is earthy and grounded.
        </p>
        <h2>Keep it kind</h2>
        <p>
          Miss a day? Start again tomorrow. A routine is something you return to, not something you have to get perfect.
          And if you have a health condition, your doctor is the best person to help you plan changes.
        </p>
      </>
    ),
  },
  {
    slug: "why-fresh-beats-bottled",
    title: "Why fresh beats bottled: what to look for in a wellness shot",
    seoTitle: "Why Fresh Beats Bottled | Wellness Shots Zimbabwe",
    description:
      "What makes a fresh wellness shot different from a long-life bottled drink, and how to read the label before you buy. A guide from Naturo Wellness Zimbabwe.",
    datePublished: "2026-11-25",
    readMinutes: 4,
    image: "/images/products/hibiscus-shot.webp",
    imageAlt: "Naturo Wellness Hibiscus Shot bottle, 100 ml",
    motifs: ["hibiscus", "droplet"],
    productSlug: "hibiscus-shot",
    body: (
      <>
        <p>
          Supermarket shelves are full of drinks that promise goodness and last for months. So why do so many people go
          out of their way for a fresh wellness shot that needs to live in the fridge? It comes down to taste, honesty and
          knowing what you&apos;re drinking.
        </p>
        <h2>Fresh tastes like the real thing</h2>
        <p>
          Fresh ginger is fiery. Fresh hibiscus is sharp and floral. Fresh pineapple is bright and sweet. Drinks made to
          sit on a shelf for months often need extra processing and added flavours to taste consistent, and some of that
          character gets lost along the way.
        </p>
        <h2>A short shelf life is a good sign</h2>
        <p>
          It sounds backwards, but a drink that needs the fridge and has a short date is usually telling you something
          good: it was made recently and is meant to be enjoyed soon. That&apos;s why we make our shots fresh in Zimbabwe
          and confirm every order before it&apos;s prepared.
        </p>
        <h2>How to read a wellness shot label</h2>
        <ul>
          <li><strong>Ingredients first.</strong> Ingredients are listed from most to least. The star ingredient should be near the top.</li>
          <li><strong>Watch for added sugar.</strong> Look for sugar, syrups and sweeteners on the list, and decide what suits you.</li>
          <li><strong>Check the size and date.</strong> A clear quantity (like 100 ml) and a clear date are signs of a brand that takes labelling seriously.</li>
          <li><strong>Be wary of big promises.</strong> A drink that claims to cure or prevent illness is overselling. Honest brands talk about taste, ingredients and routine.</li>
        </ul>
        <h2>Local and fresh</h2>
        <p>
          Buying from a local maker also means shorter journeys from kitchen to fridge, and you can ask questions directly.
          At Naturo Wellness you can message us on WhatsApp any time.
        </p>
        <h2>Taste the difference</h2>
        <p>
          Try the tangy, ruby-red {a("/shop/hibiscus-shot", "Hibiscus Shot")}, the bold
          {" "}{a("/shop/ginger-shot", "Ginger Shot")} or the sunny {a("/shop/pineapple-shot", "Pineapple Shot")}, all made
          fresh in Harare. Or {a("/shop", "browse the full Naturo Wellness range")}.
        </p>
      </>
    ),
  },
];

export const articleBySlug = (slug: string) => articles.find((x) => x.slug === slug);
