import { NextResponse } from "next/server";
import { quoteRequestSchema } from "@/lib/commerce/validation";
import { quoteCart } from "@/lib/orders/service";

/** Server-authoritative pricing for the cart & checkout summary. */
export async function POST(request: Request) {
  const parsed = quoteRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart." }, { status: 400 });
  }
  const { quote, fulfilmentError } = await quoteCart({
    items: parsed.data.items,
    fulfilment: parsed.data.fulfilment,
    promoCode: parsed.data.promoCode || null,
  });
  return NextResponse.json({ quote, fulfilmentError });
}
