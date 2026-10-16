import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/cart-page";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="bg-warm pt-28 lg:pt-36">
      <div className="container-x pb-10">
        <p className="eyebrow text-botanical">Your cart</p>
        <h1 className="display mt-4 text-[clamp(2.6rem,7vw,5.5rem)] text-forest">
          Almost <span className="serif-accent normal-case text-botanical">there.</span>
        </h1>
      </div>
      <CartPageClient />
    </div>
  );
}
