import type { Metadata } from "next";
import { ProsePage } from "@/components/layout/prose-page";
import { getStoreSettings } from "@/lib/commerce/catalog";
import { formatMoney } from "@/lib/commerce/pricing";

export const metadata: Metadata = {
  title: "Delivery information",
  description: "How Naturo Wellness delivery and collection works.",
  alternates: { canonical: "/delivery" },
};

export default async function DeliveryPage() {
  const settings = await getStoreSettings();
  return (
    <ProsePage eyebrow="Help" title="Delivery &" accent="collection" motifs={["ginger", "droplet"]}>
      <p>Every order is confirmed by a member of the Naturo team before it is prepared, so we can make sure your drinks reach you fresh.</p>
      <h2>Delivery areas</h2>
      {settings.deliveryZones.length > 0 ? (
        <ul>
          {settings.deliveryZones.map((z) => (
            <li key={z.id}>
              <strong>{z.name}</strong>: {z.fee ? formatMoney(z.fee, settings.currency) : "Free"}
              {z.description && <span className="block text-base text-ink/70">{z.description}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p>Our delivery areas and fees are being finalised and will be listed here. In the meantime, please contact us to arrange delivery.</p>
      )}
      <h2>Collection</h2>
      <p>
        {settings.collection.enabled
          ? settings.collection.details ?? "Collection is available. We'll confirm the collection point and times when we confirm your order."
          : "Collection is not currently available."}
      </p>
      <h2>Keeping it fresh</h2>
      <p>Please refrigerate chilled products as soon as you receive them and follow the storage instructions on each label.</p>
    </ProsePage>
  );
}
