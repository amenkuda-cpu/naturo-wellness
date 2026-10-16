import type { Metadata } from "next";
import { ProsePage } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "Refunds & returns", alternates: { canonical: "/returns" } };

export default function ReturnsPage() {
  return (
    <ProsePage eyebrow="Policies" title="Refunds &" accent="returns" draft motifs={["lemon-slice"]}>
      <p>We want you to love every Naturo product. Because our drinks are perishable food products, returns work a little differently from other goods.</p>
      <h2>If something is wrong</h2>
      <ul>
        <li>If an item arrives damaged, leaking, past its best-before date or not as ordered, contact us within 24 hours of delivery or collection with your order number and a photo.</li>
        <li>We will offer a replacement or a refund for the affected items.</li>
      </ul>
      <h2>Change of mind</h2>
      <p>For food safety reasons we can&apos;t accept returns of opened or chilled products for a change of mind. You may cancel an order free of charge before our team has dispatched it.</p>
      <h2>Refunds</h2>
      <p>Approved refunds are made using the original payment method where possible. Refund timing depends on the payment provider.</p>
    </ProsePage>
  );
}
