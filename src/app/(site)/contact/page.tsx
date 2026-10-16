import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact Naturo Wellness",
  description: "Get in touch with Naturo Wellness about orders, stockists and wholesale.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const c = siteConfig.contact;
  const rows = [
    { icon: Phone, label: "Phone", value: c.phone, href: c.phone ? `tel:${c.phone.replace(/\s/g, "")}` : null },
    { icon: MessageCircle, label: "WhatsApp", value: c.whatsapp, href: c.whatsapp ? `https://wa.me/${c.whatsapp.replace(/\D/g, "")}` : null },
    { icon: Mail, label: "Email", value: c.email, href: c.email ? `mailto:${c.email}` : null },
    { icon: MapPin, label: "Address", value: c.address, href: null },
    { icon: Clock, label: "Hours", value: c.hours, href: null },
  ];
  const configured = rows.some((r) => r.value);

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's"
        accent="talk."
        intro="Questions about an order, becoming a stockist, or bringing Naturo to your gym, salon or shop? We'd love to hear from you."
        motifs={["hibiscus", "pineapple-chunk"]}
        tone="sun"
      />
      <div className="bg-warm py-16 lg:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <ul className="divide-y divide-forest/10 border-y border-forest/10">
            {rows.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex items-center gap-5 py-6">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-cream text-botanical">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="eyebrow block text-ink/70">{label}</span>
                  {value ? (
                    href ? (
                      <a href={href} className="text-lg font-semibold text-forest hover:underline" rel={href.startsWith("http") ? "noopener" : undefined}>
                        {value}
                      </a>
                    ) : (
                      <span className="text-lg font-semibold text-forest">{value}</span>
                    )
                  ) : (
                    <span className="text-lg text-ink/70">To be confirmed</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <div className="rounded-[2rem] bg-forest p-8 text-warm sm:p-10">
            <p className="serif-accent text-3xl text-citrus">Stockists & wholesale</p>
            <p className="mt-4 text-warm/80">
              We&apos;re growing our network of supermarkets, pharmacies, wellness shops, gyms and salons. Reach out using the
              details here and our team will get back to you.
            </p>
            {!configured && (
              <p className="mt-6 rounded-xl bg-warm/10 p-4 text-sm text-warm/80">
                Official contact details are being finalised and will appear here shortly.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
