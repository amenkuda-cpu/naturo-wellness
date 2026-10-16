import { NextResponse } from "next/server";
import { checkoutSchema, fieldErrors } from "@/lib/commerce/validation";
import { getSessionUser } from "@/lib/auth";
import { placeOrder } from "@/lib/orders/service";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  try {
    const user = await getSessionUser();
    const result = await placeOrder(parsed.data, user?.id ?? null);
    if (!result.ok) {
      return NextResponse.json(result, { status: result.status });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[checkout] unexpected error", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong placing your order. Please try again." },
      { status: 500 },
    );
  }
}
