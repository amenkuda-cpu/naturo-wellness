import { Clock, Mail, MapPin, MessageCircle, MessagesSquare, Phone } from "lucide-react";
import type { Metadata } from "next";
import { EnquiryForm } from "@/components/checkout/enquiry-form";
import { OpenNowBadge, OpeningHoursTable } from "@/components/contact/opening-hours";
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
    { icon: MessagesSquare, label: "Messenger", value: c.messenger ? "Naturo Wellness on Facebook" : null, href: c.messenger },
    { icon: MapPin, label: "Visit us", value: c.address, href: c.mapUrl },
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
                      <a
                        href={href}
                        className="text-lg font-semibold text-forest hover:underline"
                        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
                      >
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
            <li className="flex items-start gap-5 py-6">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-cream text-botanical">
                <Clock className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="eyebrow text-ink/70">Opening hours</span>
                  <OpenNowBadge />
                </div>
                <OpeningHoursTable className="mt-3 max-w-sm" />
                <p className="mt-2 text-xs text-ink/60">Harare time. Public holidays may differ.</p>
              </div>
            </li>
          </ul>
          <div className="rounded-[2rem] bg-forest p-8 text-warm sm:p-10">
            <p className="serif-accent text-3xl text-citrus">Send us a message</p>
            <p className="mt-3 text-warm/80">
              A question about an order, becoming a stockist, or just feedback. It goes straight to the Naturo team.
            </p>
            <div className="mt-6">
              <EnquiryForm tone="dark" />
            </div>
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
