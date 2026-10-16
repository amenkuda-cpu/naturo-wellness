import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers to common questions about Naturo Wellness products, orders, delivery and payment.",
  alternates: { canonical: "/faq" },
};

const faqs = [
  {
    q: "What does Naturo make?",
    a: "Natural wellness shots, traditional Zimbabwean favourites such as Maheu and Muvhee, and herbal teas and powders, proudly made in Zimbabwe.",
  },
  {
    q: "Where can I see the ingredients?",
    a: "On every product label. We publish ingredient lists on the website exactly as they appear on our approved labels; where a list isn't online yet, the product page says so.",
  },
  {
    q: "Are your products medicines?",
    a: "No. Our products are foods and beverages. They are not intended to diagnose, treat, cure or prevent any disease. If you have a health condition, please speak to a health professional.",
  },
  {
    q: "How do I pay?",
    a: "The payment options available to you are shown at checkout. For online payments you'll be taken to the payment provider's secure page. We never see or store your card details.",
  },
  {
    q: "How does delivery work?",
    a: "Delivery areas, fees and collection options are shown at checkout. Our team confirms every order before dispatch.",
  },
  {
    q: "How do I check my order?",
    a: "After ordering you'll get a private order link. Bookmark it to check your order's status at any time.",
  },
];

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <PageHero eyebrow="Help" title="Questions," accent="answered." motifs={["tea-leaf", "lemon-slice"]} />
      <div className="bg-warm py-16 lg:py-24">
        <div className="container-x max-w-4xl divide-y divide-forest/10 border-y border-forest/10">
          {faqs.map((f, i) => (
            <details key={f.q} className="group" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-display text-xl font-bold text-forest [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-forest/20 transition-transform duration-300 group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="pb-6 text-lg text-ink/75">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
