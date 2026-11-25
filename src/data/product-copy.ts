/**
 * Search-friendly product page copy, one entry per product. Written in general wellness
 * language only: no medical claims, nothing about curing, treating or preventing anything.
 *
 * Ingredient lists are NOT written here. They come from the approved label (admin → Products,
 * or the `ingredients` column in Supabase) so we never publish an unconfirmed list.
 * TODO(Naturo): add each product's full ingredient list in the admin dashboard.
 */
export interface ProductCopy {
  /** <title>, under 60 characters, leads with Naturo Wellness. */
  seoTitle: string;
  /** Meta description, under 155 characters. */
  seoDescription: string;
  /** The ingredient the product is named after, shown as "Star ingredient". */
  star: string;
  /** Unique intro paragraphs for the product page. */
  intro: string[];
  /** Why people enjoy it: general, everyday language only. */
  highlights: string[];
  howToEnjoy: string;
  storage: string;
  faqs: { q: string; a: string }[];
}

const SHOT_STORAGE =
  "Keep your shots in the fridge from the moment they arrive, and enjoy them by the date printed on the bottle. Give the bottle a good shake before you open it, because natural ingredients settle.";
const TEA_STORAGE = "Store the pouch somewhere cool and dry, sealed after each use, and away from strong smells.";
const CAN_STORAGE = "Store in a cool place out of direct sunlight, and chill before serving.";
const MAHEU_STORAGE = "Keep refrigerated and enjoy by the date on the bottle. Shake well before drinking.";

const orderFaq = {
  q: "How do I order in Zimbabwe?",
  a: "Add it to your cart and check out on getnaturo.com, or tap the WhatsApp button and send us your order. We confirm every order before it is prepared.",
};

export const productCopy: Record<string, ProductCopy> = {
  "ginger-shot": {
    seoTitle: "Naturo Wellness Ginger Shot | Ginger Shots in Harare",
    seoDescription:
      "The Naturo Wellness Ginger Shot: a bold, warming 100 ml ginger shot made fresh in Harare, Zimbabwe. Order online or on WhatsApp.",
    star: "Ginger",
    intro: [
      "If you like your mornings with a bit of fire, this is your bottle. The Naturo Wellness Ginger Shot is a bold, warming hit of real ginger with a bright, zesty finish, made fresh in Harare and bottled in a handy 100 ml shot.",
      "Ginger has been a favourite in Zimbabwean kitchens for generations. We took that familiar, punchy flavour and turned it into the easiest part of your daily routine: shake, open, drink, go.",
    ],
    highlights: [
      "Made with real ginger for a warming, wide-awake kick",
      "A quick 100 ml ritual that fits a busy morning",
      "Made fresh in Zimbabwe",
      "A great place to start if you're new to wellness shots",
    ],
    howToEnjoy:
      "Shake well and enjoy chilled, straight from the bottle. Many people take one with breakfast or before heading out. Too fiery for you? Sip it slowly or follow it with a glass of water.",
    storage: SHOT_STORAGE,
    faqs: [
      {
        q: "What does a ginger shot taste like?",
        a: "Warm and punchy. You'll feel the heat of the ginger first, followed by a fresh, zesty finish. It's meant to wake you up.",
      },
      {
        q: "Is the Ginger Shot an immunity shot?",
        a: "Many people call ginger shots immunity shots. Ours is a natural drink made to be part of a balanced, everyday routine. It is not a medicine and we don't claim it prevents or treats any illness.",
      },
      orderFaq,
    ],
  },
  "glow-shot": {
    seoTitle: "Naturo Wellness Glow Shot | Natural Wellness Shot",
    seoDescription:
      "The Naturo Wellness Glow Shot: a fresh, green botanical wellness shot made in Zimbabwe. 100 ml, made fresh. Order online or on WhatsApp.",
    star: "Fresh green botanicals",
    intro: [
      "Glow Shot is our fresh, green and golden blend, made for people who love small, natural rituals. It's bright, clean and easy to enjoy, even if you're new to wellness shots.",
      "We created it for the moments you want to feel put together: a busy weekday morning, after the gym, or that mid-afternoon slump at your desk in Harare.",
    ],
    highlights: [
      "Fresh, light and easy to love",
      "A gentle first shot if ginger is too fiery for you",
      "Made fresh in Zimbabwe",
      "A 100 ml bottle that fits in any bag",
    ],
    howToEnjoy:
      "Shake well and drink chilled. Enjoy it on its own in the morning, after a workout, or alongside a Naturo Ginger Shot if you like to switch things up through the week.",
    storage: SHOT_STORAGE,
    faqs: [
      {
        q: "Who is the Glow Shot for?",
        a: "Anyone who enjoys making natural wellness part of their day. It's a lighter, fresher taste than our Ginger Shot, so it's a popular first shot.",
      },
      {
        q: "Does it contain added sugar?",
        a: "Please check the label on your bottle for the full ingredient list. We publish ingredients on the website exactly as they appear on the approved label.",
      },
      orderFaq,
    ],
  },
  "hibiscus-shot": {
    seoTitle: "Naturo Wellness Hibiscus Shot | Made in Zimbabwe",
    seoDescription:
      "The Naturo Wellness Hibiscus Shot: a tangy, ruby-red hibiscus shot made fresh in Zimbabwe. 100 ml. Order online or on WhatsApp in Harare.",
    star: "Hibiscus",
    intro: [
      "Deep ruby in colour and tangy on the tongue, the Naturo Wellness Hibiscus Shot celebrates one of the most striking flowers around. It's refreshing, a little tart and beautifully bright.",
      "Hibiscus is loved across Africa for its colour and its sharp, cranberry-like taste. We've captured that in a fresh 100 ml shot that feels like a treat and works as an everyday ritual.",
    ],
    highlights: [
      "Made with hibiscus for a tangy, floral taste",
      "A naturally striking ruby colour",
      "Refreshing chilled, any time of day",
      "Made fresh in Zimbabwe",
    ],
    howToEnjoy:
      "Shake well and enjoy it ice-cold, straight from the bottle. It's lovely in the afternoon when you want something refreshing that isn't a fizzy drink.",
    storage: SHOT_STORAGE,
    faqs: [
      {
        q: "What does a hibiscus shot taste like?",
        a: "Tangy and floral, a bit like cranberry, with a clean finish. If you enjoy hibiscus tea, you'll feel right at home.",
      },
      {
        q: "Do you also sell hibiscus tea?",
        a: "Yes. Our Hibiscus Herbal Tea comes in a pouch of 20 tea bags and is lovely hot or iced.",
      },
      orderFaq,
    ],
  },
  "pineapple-shot": {
    seoTitle: "Naturo Wellness Pineapple Shot | Wellness Shots ZW",
    seoDescription:
      "The Naturo Wellness Pineapple Shot: sweet, tropical and made fresh in Zimbabwe, with the vitamin C found naturally in pineapple. Order today.",
    star: "Pineapple",
    intro: [
      "Sunshine in a small bottle. The Naturo Wellness Pineapple Shot is sweet, tropical and bright, made with pineapple and the vitamin C that occurs naturally in the fruit.",
      "It's our go-to for anyone who wants their wellness routine to taste like a holiday, and a favourite with people who find ginger a little too strong.",
    ],
    highlights: [
      "Made with pineapple for a sweet, tropical taste",
      "Contains vitamin C found naturally in pineapple",
      "The easiest shot to love if you're new to shots",
      "Made fresh in Zimbabwe",
    ],
    howToEnjoy:
      "Shake well and enjoy chilled. Great with breakfast, as a mid-morning pick-me-up, or after a walk on a hot Harare day.",
    storage: SHOT_STORAGE,
    faqs: [
      {
        q: "Is the Pineapple Shot sweet?",
        a: "Yes, it's our sweetest and most tropical shot. The full ingredient list is printed on the bottle label.",
      },
      {
        q: "Which shot should I try first?",
        a: "If you like bold flavours, start with the Ginger Shot. If you prefer something sweeter, the Pineapple Shot is a lovely first choice.",
      },
      orderFaq,
    ],
  },
  "mens-vitality-shot": {
    seoTitle: "Naturo Wellness Men's Vitality Shot | Zimbabwe",
    seoDescription:
      "The Naturo Wellness Men's Vitality Shot: an earthy men's wellness shot inspired by traditional ingredients. Made fresh in Zimbabwe. Order now.",
    star: "Traditional roots and botanicals",
    intro: [
      "Grounded, earthy and confident. The Naturo Wellness Men's Vitality Shot draws on traditional ingredients that have long been part of men's routines in Zimbabwe, made fresh and bottled in a no-fuss 100 ml shot.",
      "It's made for busy days: early starts, long drives and full calendars. One deliberate ritual to start the day the way you mean to go on.",
    ],
    highlights: [
      "An earthy, grounded flavour inspired by tradition",
      "A men's wellness shot made for busy routines",
      "Made fresh in Zimbabwe",
      "A 100 ml bottle that's quick to enjoy",
    ],
    howToEnjoy:
      "Shake well and enjoy chilled, ideally at the same time each day so it becomes part of your routine. Many men pair it with a Naturo Ginger Shot.",
    storage: SHOT_STORAGE,
    faqs: [
      {
        q: "What is a men's wellness shot?",
        a: "It's a small, concentrated drink made to be part of a daily routine. Ours is inspired by traditional ingredients associated with energy and stamina. It is a food product, not a medicine.",
      },
      {
        q: "Can women drink it too?",
        a: "It's designed with men's routines in mind, but anyone who enjoys an earthy flavour can enjoy it. If you have a health condition or are pregnant, please check the label and ask your doctor first.",
      },
      orderFaq,
    ],
  },
  "maheu-traditional": {
    seoTitle: "Naturo Wellness Maheu Traditional | Zimbabwean Maheu",
    seoDescription:
      "Naturo Wellness Maheu Traditional: the much-loved Zimbabwean fermented maize drink, in a modern bottle. Order online or on WhatsApp.",
    star: "Maize",
    intro: [
      "Few drinks taste more like home than maheu. Our Maheu Traditional is the familiar, creamy fermented maize drink many Zimbabweans grew up with, now in a convenient bottle you can grab on the go.",
      "It's filling, comforting and perfect for school runs, long workdays and anyone who misses the taste of home.",
    ],
    highlights: ["A classic Zimbabwean favourite", "Creamy, familiar and satisfying", "Easy to carry and share"],
    howToEnjoy: "Shake well and enjoy chilled, on its own or as a quick, filling snack between meals.",
    storage: MAHEU_STORAGE,
    faqs: [orderFaq],
  },
  "maheu-buttermilk": {
    seoTitle: "Naturo Wellness Maheu Buttermilk | Made in Zimbabwe",
    seoDescription:
      "Naturo Wellness Maheu Buttermilk: traditional fermented maize drink with a smooth, tangy buttermilk flavour. Made in Zimbabwe. Order online.",
    star: "Maize",
    intro: [
      "All the comfort of traditional maheu with a smooth, tangy buttermilk twist. Naturo Wellness Maheu Buttermilk is refreshing, creamy and made in Zimbabwe.",
      "If you love the taste of maheu but want something a little lighter and tangier, this is the one to try.",
    ],
    highlights: ["Smooth and tangy", "A modern take on a Zimbabwean classic", "Great chilled on a hot day"],
    howToEnjoy: "Shake well and enjoy cold, straight from the bottle.",
    storage: MAHEU_STORAGE,
    faqs: [orderFaq],
  },
  "ginger-lemon-tea": {
    seoTitle: "Naturo Wellness Ginger Lemon Tea | Herbal Tea ZW",
    seoDescription:
      "Naturo Wellness Ginger Lemon Herbal Tea: warming ginger and bright lemon, 20 tea bags per pouch. Made in Zimbabwe. Order online or on WhatsApp.",
    star: "Ginger and lemon",
    intro: [
      "Warming ginger and bright lemon in one comforting cup. Our Ginger Lemon Herbal Tea is the cosy partner to the Naturo Ginger Shot, for slower moments at home or at your desk.",
      "Each pouch holds 20 tea bags, so there's always one ready when you need a calm few minutes.",
    ],
    highlights: ["Ginger and lemon in every cup", "20 tea bags per 40 g pouch", "Lovely with a little honey"],
    howToEnjoy: "Steep one tea bag in a cup of freshly boiled water for 3 to 5 minutes. Add honey if you like.",
    storage: TEA_STORAGE,
    faqs: [orderFaq],
  },
  "hibiscus-tea": {
    seoTitle: "Naturo Wellness Hibiscus Tea | Herbal Tea Zimbabwe",
    seoDescription:
      "Naturo Wellness Hibiscus Herbal Tea: a ruby-red, tangy infusion, lovely hot or iced. 20 tea bags per pouch. Order online in Zimbabwe.",
    star: "Hibiscus",
    intro: [
      "A ruby-red, tangy cup that's just as good iced as it is hot. Naturo Wellness Hibiscus Herbal Tea brings the bright, floral taste of hibiscus to your teapot.",
      "Brew a big jug, chill it, and you've got a refreshing drink for the whole family on a hot afternoon.",
    ],
    highlights: ["A vivid ruby colour", "Tangy and floral", "Great hot or iced", "20 tea bags per 40 g pouch"],
    howToEnjoy: "Steep one tea bag in freshly boiled water for 3 to 5 minutes. For iced tea, let it cool and pour over ice.",
    storage: TEA_STORAGE,
    faqs: [orderFaq],
  },
  "sunset-glow-tea": {
    seoTitle: "Naturo Wellness Sunset Glow Tea | Turmeric Ginger",
    seoDescription:
      "Naturo Wellness Sunset Glow Herbal Tea: golden turmeric and warming ginger in an earthy cup. 20 tea bags per pouch. Made in Zimbabwe.",
    star: "Turmeric and ginger",
    intro: [
      "Golden turmeric and warming ginger make an earthy, glowing cup. Sunset Glow is the tea we reach for at the end of a long day.",
      "It's smooth, gently spiced and a beautiful golden colour in the mug.",
    ],
    highlights: ["Turmeric and ginger together", "Earthy and gently warming", "20 tea bags per 40 g pouch"],
    howToEnjoy: "Steep one tea bag in freshly boiled water for 3 to 5 minutes. A splash of milk works well too.",
    storage: TEA_STORAGE,
    faqs: [orderFaq],
  },
  "green-focus-tea": {
    seoTitle: "Naturo Wellness Green Focus Tea | Green Tea Zimbabwe",
    seoDescription:
      "Naturo Wellness Green Focus Herbal Tea: fresh green tea for a clean, bright cup on a busy day. 20 tea bags per pouch. Order online.",
    star: "Green tea",
    intro: [
      "A fresh, clean cup of green tea for the busiest part of your day. Green Focus is light, bright and easy to drink at your desk.",
      "Brew it a little cooler than other teas and you'll get a smooth cup without bitterness.",
    ],
    highlights: ["Fresh green tea", "Clean, light taste", "20 tea bags per 40 g pouch"],
    howToEnjoy: "Steep one tea bag in hot (not boiling) water for 2 to 3 minutes.",
    storage: TEA_STORAGE,
    faqs: [orderFaq],
  },
  "indongo-bloom-tea": {
    seoTitle: "Naturo Wellness Indongo Bloom Tea | Blue Flower Tea",
    seoDescription:
      "Naturo Wellness Indongo Bloom: butterfly pea flower tea that brews a deep blue and changes colour with lemon. 20 tea bags. Order online.",
    star: "Butterfly pea flower",
    intro: [
      "A cup that turns heads. Indongo Bloom is butterfly pea flower tea that brews a striking, deep blue, then shifts to purple when you add a squeeze of lemon.",
      "It's gentle and floral, and a lovely way to make tea time feel a little magical.",
    ],
    highlights: ["Brews a deep blue", "Changes colour with lemon", "20 tea bags per 40 g pouch"],
    howToEnjoy: "Steep one tea bag in freshly boiled water for 3 to 5 minutes. Add a squeeze of lemon and watch the colour change.",
    storage: TEA_STORAGE,
    faqs: [orderFaq],
  },
  "muvheyi-tea": {
    seoTitle: "Naturo Wellness Muvheyi Tea | Zimbabwean Herbal Tea",
    seoDescription:
      "Naturo Wellness Muvheyi Herbal Tea: a traditional Zimbabwean herbal leaf, made easy in a tea bag. 20 tea bags per pouch. Order online.",
    star: "Muvheyi leaf",
    intro: [
      "Muvheyi is a herbal leaf with deep roots in Zimbabwean tradition. We've made it easy to enjoy, packed into tea bags so you can brew a cup anywhere.",
      "It's a calm, leafy cup with a taste of heritage.",
    ],
    highlights: ["A traditional Zimbabwean herb", "Calm and leafy", "20 tea bags per 40 g pouch"],
    howToEnjoy: "Steep one tea bag in freshly boiled water for 3 to 5 minutes.",
    storage: TEA_STORAGE,
    faqs: [orderFaq],
  },
  "carrot-tea": {
    seoTitle: "Naturo Wellness Carrot Tea | Herbal Tea Zimbabwe",
    seoDescription:
      "Naturo Wellness Carrot Herbal Tea: a gentle, naturally sweet carrot infusion. 20 tea bags per pouch. Made in Zimbabwe. Order online.",
    star: "Carrot",
    intro: [
      "Mellow, earthy and naturally sweet. Our Carrot Herbal Tea is a gentle infusion for anyone who wants a soft, comforting cup.",
      "It's an easy, cosy tea for evenings at home.",
    ],
    highlights: ["Naturally sweet", "Mellow and earthy", "20 tea bags per 40 g pouch"],
    howToEnjoy: "Steep one tea bag in freshly boiled water for 3 to 5 minutes.",
    storage: TEA_STORAGE,
    faqs: [orderFaq],
  },
  "orange-can": {
    seoTitle: "Naturo Wellness Orange Can | 330 ml Fruit Drink",
    seoDescription:
      "Naturo Orange: juicy orange flavour in an ice-cold 330 ml can from Naturo Wellness Zimbabwe. Best served with friends. Order online.",
    star: "Orange flavour",
    intro: [
      "Juicy, zesty and made for sharing. Naturo Orange is a fruity orange flavour drink in an ice-cold 330 ml can.",
      "Bring a few to the braai, the office or the weekend drive.",
    ],
    highlights: ["Juicy orange flavour", "330 ml can", "Best served ice-cold"],
    howToEnjoy: "Chill well and serve ice-cold.",
    storage: CAN_STORAGE,
    faqs: [orderFaq],
  },
  "cranberry-can": {
    seoTitle: "Naturo Wellness Cranberry Can | 330 ml Fruit Drink",
    seoDescription:
      "Naturo Cranberry: tart, berry-bright cranberry flavour in an ice-cold 330 ml can from Naturo Wellness Zimbabwe. Order online today.",
    star: "Cranberry flavour",
    intro: [
      "Tart, berry-bright and refreshing. Naturo Cranberry brings a crisp cranberry flavour to an ice-cold 330 ml can.",
      "A grown-up fruity drink that's perfect with friends.",
    ],
    highlights: ["Tart cranberry flavour", "330 ml can", "Best served ice-cold"],
    howToEnjoy: "Chill well and serve ice-cold.",
    storage: CAN_STORAGE,
    faqs: [orderFaq],
  },
  "apple-can": {
    seoTitle: "Naturo Wellness Apple Can | 330 ml Fruit Drink",
    seoDescription:
      "Naturo Apple: crisp green apple flavour in an ice-cold 330 ml can from Naturo Wellness Zimbabwe. Best served with friends. Order online.",
    star: "Green apple flavour",
    intro: [
      "Crisp, fresh and easy to love. Naturo Apple is a green apple flavour drink in an ice-cold 330 ml can.",
      "Grab a few for lunchboxes, picnics and lazy Sunday afternoons.",
    ],
    highlights: ["Crisp green apple flavour", "330 ml can", "Best served ice-cold"],
    howToEnjoy: "Chill well and serve ice-cold.",
    storage: CAN_STORAGE,
    faqs: [orderFaq],
  },
};

/** The five wellness shots, in the order we present them. */
export const SHOT_SLUGS = ["ginger-shot", "mens-vitality-shot", "hibiscus-shot", "glow-shot", "pineapple-shot"] as const;
