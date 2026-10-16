import type { Metadata } from "next";
import { ProsePage } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <ProsePage eyebrow="Policies" title="Privacy" accent="policy" draft motifs={["leaf"]}>
      <p>This policy explains what personal information Naturo Wellness collects when you use this website, why we collect it and how we look after it.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Order details: your name, mobile number, optional email address and delivery address.</li>
        <li>Account details, if you create an account: your email address and order history.</li>
        <li>Basic, privacy-respecting usage data (such as pages viewed) if analytics is enabled.</li>
      </ul>
      <p>We do not collect or store card numbers. Online payments are processed by our payment provider on their secure pages.</p>
      <h2>How we use it</h2>
      <ul>
        <li>To confirm, prepare and deliver your order, and to contact you about it.</li>
        <li>To provide customer support and handle refunds or returns.</li>
        <li>To keep accurate business and tax records.</li>
      </ul>
      <p>We will not sell your personal information. We only share it with service providers who help us run the shop (for example hosting, payments and delivery), and only as needed.</p>
      <h2>Keeping it safe</h2>
      <p>Order records are stored securely and access is limited to authorised Naturo staff. Your order link contains a private code. Please don&apos;t share it publicly.</p>
      <h2>Your choices</h2>
      <p>You can ask us to access, correct or delete your personal information, subject to records we must keep by law. Contact us using the details on our contact page.</p>
    </ProsePage>
  );
}
