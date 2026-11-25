import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { brand } from "@/config/brand";
import { siteConfig } from "@/config/site";
import { getStoreSettings } from "@/lib/commerce/catalog";
import { formatMoney } from "@/lib/commerce/pricing";
import { breadcrumbLd, faqLd } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: { absolute: "Naturo Wellness FAQ | Delivery, Freshness & Orders" },
  description:
    "Answers about Naturo Wellness shots: delivery areas in Zimbabwe, freshness, storage, how to order online or on WhatsApp, payment and bulk orders.",
  alternates: { canonical: "/faq" },
  openGraph: { url: "/faq", title: "Naturo Wellness FAQ | Delivery, Freshness & Orders" },
};

const list = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

export default async function FaqPage() {
  const settings = await getStoreSettings();
  const zones = settings.deliveryZones.map((z) => `${z.name}${z.fee ? ` (${formatMoney(z.fee, settings.currency)})` : " (free)"}`);
  const payments = settings.paymentMethods.map((m) => m.label);

  // TODO(Naturo): once confirmed, add the exact shelf life of the shots (e.g. "up to X days in the fridge") to the storage answer.
  const groups: { title: string; faqs: { q: string; a: string }[] }[] = [
    {
      title: "About our shots",
      faqs: [
        {
          q: "What is Naturo Wellness?",
          a: `Naturo Wellness is a Harare-based Zimbabwean wellness brand founded by ${brand.founder.name}. We make natural wellness shots, made fresh in Zimbabwe: Ginger, Men's Vitality, Hibiscus, Glow and Pineapple. We also make herbal teas, Maheu and fruity cans.`,
        },
        {
          q: "How fresh are the shots?",
          a: "Our wellness shots are made fresh in Zimbabwe, and our team confirms every order before it is prepared so your drinks reach you in good condition.",
        },
        {
          q: "How long do the shots last and how should I store them?",
          a: "Keep your shots in the fridge from the moment they arrive and enjoy them by the date printed on the bottle. Shake well before opening, because natural ingredients settle.",
        },
        {
          q: "Which shot should I start with?",
          a: "If you love a bold kick, start with the Ginger Shot. If you prefer something sweeter, try the Pineapple Shot. Glow is fresh and light, Hibiscus is tangy and floral, and the Men's Vitality Shot is earthy and grounded.",
        },
        {
          q: "Are these immunity shots or medicines?",
          a: "Many people call ginger shots immunity shots, but our drinks are natural foods made to be part of a balanced, everyday routine. They are not medicines and are not intended to diagnose, treat, cure or prevent any disease. If you have a health condition, are pregnant or take medication, please speak to your doctor first.",
        },
        {
          q: "Where can I see the ingredients?",
          a: "On every label. We publish ingredient lists on the website exactly as they appear on our approved labels, and each product page shows the star ingredient.",
        },
      ],
    },
    {
      title: "Ordering and delivery",
      faqs: [
        {
          q: "How do I order?",
          a: "Two easy ways. Add your shots to the cart and check out on getnaturo.com in about a minute, or tap the WhatsApp button and send us your order. Either way, our team confirms your order before it is prepared.",
        },
        {
          q: "Can I order on WhatsApp?",
          a: `Yes. Message us on WhatsApp at ${siteConfig.contact.whatsapp} with what you'd like and where you are, and we'll take it from there. We're on WhatsApp messages only, so please send a message rather than call.`,
        },
        {
          q: "Where do you deliver in Zimbabwe?",
          a: zones.length
            ? `We currently deliver to: ${list(zones)}. You can also collect your order. The delivery fee is confirmed at checkout.`
            : "Delivery areas and fees are shown at checkout, and you can also collect your order. Message us on WhatsApp if you're not sure whether we reach you.",
        },
        {
          q: "Can I collect my order?",
          a: settings.collection.enabled
            ? settings.collection.details ?? "Yes. Choose collection at checkout and we'll confirm the collection point and time."
            : "Collection isn't available right now, but delivery is.",
        },
        {
          q: "How can I pay?",
          a: payments.length
            ? `You can pay with ${list(payments)}. Online payments go through the payment provider's secure page, and we never see or store your card details.`
            : "Payment options are shown at checkout.",
        },
        {
          q: "Do you do bulk or corporate orders?",
          a: "Yes. We'd love to supply offices, gyms, salons, events and shops. Send us a message on WhatsApp or through the contact page with the quantities you need and your delivery date, and we'll come back to you with a quote.",
        },
        {
          q: "How do I check my order?",
          a: "After ordering you'll get a private order link. Bookmark it to check your order status at any time, or message us on WhatsApp with your order number.",
        },
      ],
    },
  ];
  const all = groups.flatMap((g) => g.faqs);

  return (
    <>
      <JsonLd data={faqLd(all)} />
      <JsonLd data={breadcrumbLd([{ name: "FAQ", path: "/faq" }])} />
      <PageHero
        eyebrow="Naturo Wellness FAQ"
        title="Questions,"
        accent="answered."
        intro="Everything you need to know about our wellness shots, delivery in Zimbabwe and ordering online or on WhatsApp."
        motifs={["tea-leaf", "lemon-slice"]}
      />
      <div className="bg-warm py-16 lg:py-24">
        <div className="container-x max-w-4xl space-y-14">
          {groups.map((g, gi) => (
            <section key={g.title} aria-labelledby={`faq-group-${gi}`}>
              <h2 id={`faq-group-${gi}`} className="font-display text-2xl font-bold text-forest">{g.title}</h2>
              <div className="mt-4 divide-y divide-forest/10 border-y border-forest/10">
                {g.faqs.map((f, i) => (
                  <details key={f.q} className="group" open={gi === 0 && i === 0}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-display text-xl font-bold text-forest [&::-webkit-details-marker]:hidden">
                      <h3>{f.q}</h3>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-forest/20 transition-transform duration-300 group-open:rotate-45" aria-hidden>+</span>
                    </summary>
                    <p className="pb-6 text-lg text-ink/75">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
          <p className="text-lg text-ink/80">
            Still wondering about something?{" "}
            <a href={brand.whatsappUrl} target="_blank" rel="noopener" className="font-semibold text-forest underline underline-offset-4">Message us on WhatsApp</a>{" "}
            or <Link href="/shop" className="font-semibold text-forest underline underline-offset-4">browse the shop</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
