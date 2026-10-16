import type { Metadata } from "next";
import { ProsePage } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "Terms & conditions", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <ProsePage eyebrow="Policies" title="Terms &" accent="conditions" draft motifs={["tea-leaf"]}>
      <p>These terms apply to orders placed with Naturo Wellness through this website. By placing an order you agree to them.</p>
      <h2>Orders</h2>
      <ul>
        <li>Placing an order is an offer to buy. Your order is accepted when our team confirms it.</li>
        <li>We may decline or cancel an order, for example if an item is unavailable or a price was displayed in error. If you have paid, we will refund you in full.</li>
        <li>Prices are shown in the currency displayed at checkout and are confirmed when you place your order.</li>
      </ul>
      <h2>Payment</h2>
      <p>Available payment methods are shown at checkout. Orders paid online are only treated as paid once the payment provider confirms the payment to us.</p>
      <h2>Delivery and collection</h2>
      <p>Delivery areas, fees and collection details are shown at checkout and confirmed by our team. Delivery times are estimates.</p>
      <h2>Product information</h2>
      <p>Our products are foods and beverages. They are not medicines and are not intended to diagnose, treat, cure or prevent any disease. Always read the label, especially if you have allergies, are pregnant or take medication, and speak to a health professional if you have concerns.</p>
      <h2>Contact</h2>
      <p>If you have questions about these terms or an order, please contact us.</p>
    </ProsePage>
  );
}
