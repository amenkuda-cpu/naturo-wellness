import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div className="bg-warm pb-24 pt-28 lg:pt-36">
      <div className="container-x">
        <p className="eyebrow text-botanical">Secure checkout</p>
        <h1 className="display mt-4 text-[clamp(2.6rem,7vw,5.5rem)] text-forest">
          Checkout<span className="serif-accent normal-case text-botanical">.</span>
        </h1>
        <div className="mt-12">
          <CheckoutForm />
        </div>
      </div>
    </div>
  );
}
