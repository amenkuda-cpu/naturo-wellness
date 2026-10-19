"use client";

import { AlertCircle, ArrowRight, Loader2, Lock, Store, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cart, useCart } from "@/components/cart/cart-store";
import { OrderSummary } from "@/components/cart/order-summary";
import { useQuote } from "@/components/cart/use-quote";
import { useStore } from "@/components/providers/store-provider";
import { ButtonLabel, buttonClasses } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/commerce/pricing";
import { isAgeRestricted, productById } from "@/data/products";
import { checkoutSchema, fieldErrors } from "@/lib/commerce/validation";
import type { FulfilmentMethod, PaymentMethodId } from "@/lib/types";

type Errors = Record<string, string>;

/** Error key (from Zod paths) → input id. */
const FIELD_IDS: Record<string, string> = {
  "customer.fullName": "fullName",
  "customer.phone": "phone",
  "customer.email": "email",
  "fulfilment.address.line1": "line1",
  "fulfilment.address.suburb": "suburb",
  "fulfilment.address.city": "city",
  "fulfilment.zoneId": "zone",
  paymentMethod: "payment-0",
  acceptTerms: "acceptTerms",
  ageConfirmed: "ageConfirmed",
};
const ID_TO_KEY = Object.fromEntries(Object.entries(FIELD_IDS).map(([k, v]) => [v, k]));

function Field({
  id,
  label,
  error,
  hint,
  children,
  optional,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label} {optional && <span className="font-normal text-ink/70">(optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink/70">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm text-[#b42318]">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutForm() {
  const { lines, hydrated } = useCart();
  const { settings } = useStore();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const zones = settings.deliveryZones;

  const [method, setMethod] = useState<FulfilmentMethod>(
    zones.length > 0 ? "delivery" : "collection",
  );
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [payment, setPayment] = useState<PaymentMethodId | "">(settings.paymentMethods[0]?.id ?? "");
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const started = useRef(false);

  const fulfilment = method === "delivery" ? { method, zoneId } : { method };
  const { quote, verified, loading } = useQuote(lines, { fulfilment, promoCode: promo });

  useEffect(() => {
    if (hydrated && lines.length && !started.current) {
      started.current = true;
      track("begin_checkout", { items: lines.length });
    }
  }, [hydrated, lines.length]);

  useEffect(() => {
    if (promo && quote.promotionCode) track("coupon_applied", { code: quote.promotionCode });
  }, [promo, quote.promotionCode]);

  if (!hydrated) return <div className="py-24 text-ink/70">Loading checkout…</div>;

  if (lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-3xl font-extrabold uppercase text-forest">Your cart is empty</p>
        <Link href="/shop" className={buttonClasses({ size: "lg", className: "mt-8" })}>
          <ButtonLabel>Shop Naturo</ButtonLabel>
        </Link>
      </div>
    );
  }

  if (!settings.orderingEnabled) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] bg-cream p-8 text-center">
        <p className="font-display text-3xl font-extrabold uppercase text-forest">Online ordering opens soon</p>
        <p className="mt-3 text-ink/70">
          We&apos;re putting the finishing touches on online checkout. In the meantime, please{" "}
          <Link href="/contact" className="font-semibold underline underline-offset-4">contact us</Link> to order.
        </p>
      </div>
    );
  }

  const err = (k: string) => errors[k];
  const aria = (k: string, id: string) => ({
    "aria-invalid": Boolean(errors[k]) || undefined,
    "aria-describedby": errors[k] ? `${id}-error` : undefined,
  });

  const needsAge = lines.some((l) => {
    const p = productById(l.productId);
    return p ? isAgeRestricted(p) : false;
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      items: lines,
      customer: {
        fullName: String(fd.get("fullName") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        email: String(fd.get("email") ?? ""),
      },
      fulfilment:
        method === "delivery"
          ? {
              method,
              zoneId,
              address: {
                line1: String(fd.get("line1") ?? ""),
                suburb: String(fd.get("suburb") ?? ""),
                city: String(fd.get("city") ?? ""),
                instructions: String(fd.get("instructions") ?? ""),
              },
            }
          : { method },
      paymentMethod: payment,
      promoCode: promo,
      notes: String(fd.get("notes") ?? ""),
      acceptTerms: fd.get("acceptTerms") === "on",
      ageConfirmed: fd.get("ageConfirmed") === "on",
    };

    const local = checkoutSchema.safeParse(payload);
    const ageMissing = needsAge && !payload.ageConfirmed;
    if (!local.success || ageMissing) {
      const fe = local.success ? {} : fieldErrors(local.error);
      if (ageMissing) fe.ageConfirmed = "Please confirm you are 18 or older to order Naturo Cans.";
      setErrors(fe);
      setFormError("Please check the highlighted fields.");
      focusFirstError(fe);
      return;
    }

    setSubmitting(true);
    setErrors({});
    setFormError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setErrors(data.fieldErrors ?? {});
        setFormError(data.error ?? "We couldn't place your order. Please try again.");
        if (data.fieldErrors) focusFirstError(data.fieldErrors);
        setSubmitting(false);
        return;
      }
      cart.clear();
      track("purchase", { order_number: data.orderNumber, payment_method: payment, value: quote.total });
      if (data.next.kind === "redirect") window.location.assign(data.next.url);
      else router.push(data.next.url);
    } catch {
      setFormError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  function focusFirstError(fe: Errors) {
    const first = Object.keys(fe).map((k) => FIELD_IDS[k]).find(Boolean);
    window.setTimeout(() => (first ? document.getElementById(first) : formRef.current?.querySelector("[role=alert]") as HTMLElement | null)?.focus(), 30);
  }

  const blocked = quote.issues.length > 0 || quote.lines.length === 0;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onInput={(e) => {
        const key = ID_TO_KEY[(e.target as HTMLElement).id];
        if (key && errors[key]) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }
      }}
      noValidate className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="space-y-12 lg:col-span-7">
        {formError && (
          <div role="alert" tabIndex={-1} className="flex items-start gap-3 rounded-2xl border border-[#b42318]/30 bg-[#fef3f2] p-4 text-[#7a1a12]">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p>{formError}</p>
          </div>
        )}

        {/* 1. Contact */}
        <fieldset className="space-y-5">
          <legend className="flex items-center gap-3 font-display text-2xl font-extrabold uppercase tracking-tight text-forest">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-sun font-sans text-sm">1</span> Your details
          </legend>
          <Field id="fullName" label="Full name" error={err("customer.fullName")}>
            <input id="fullName" name="fullName" autoComplete="name" required className="field" {...aria("customer.fullName", "fullName")} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="phone" label="Mobile number" error={err("customer.phone")} hint="We'll use this to confirm your order.">
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="077 123 4567"
                required
                className="field"
                {...aria("customer.phone", "phone")}
              />
            </Field>
            <Field id="email" label="Email" optional error={err("customer.email")} hint="For your order confirmation.">
              <input id="email" name="email" type="email" autoComplete="email" className="field" {...aria("customer.email", "email")} />
            </Field>
          </div>
        </fieldset>

        {/* 2. Fulfilment */}
        <fieldset className="space-y-5">
          <legend className="flex items-center gap-3 font-display text-2xl font-extrabold uppercase tracking-tight text-forest">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-sun font-sans text-sm">2</span> Delivery or collection
          </legend>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Fulfilment method">
            {(
              [
                { id: "delivery", label: "Delivery", icon: Truck, disabled: zones.length === 0, note: zones.length ? "To your door" : "Not available yet" },
                { id: "collection", label: "Collection", icon: Store, disabled: !settings.collection.enabled, note: "Collect from Naturo" },
              ] as const
            ).map((o) => (
              <label
                key={o.id}
                className={cn(
                  "flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-botanical",
                  method === o.id ? "border-forest bg-forest/[0.04]" : "border-ink/15 hover:border-forest/50",
                  o.disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <input
                  type="radio"
                  name="method"
                  value={o.id}
                  checked={method === o.id}
                  disabled={o.disabled}
                  onChange={() => setMethod(o.id)}
                  className="h-4 w-4 accent-[#173F2B]"
                />
                <o.icon className="h-5 w-5 text-botanical" aria-hidden />
                <span>
                  <span className="block font-semibold">{o.label}</span>
                  <span className="block text-sm text-ink/70">{o.note}</span>
                </span>
              </label>
            ))}
          </div>

          {method === "delivery" ? (
            <div className="space-y-5">
              <Field id="zone" label="Delivery area" error={err("fulfilment.zoneId")}>
                <select id="zone" value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="field" {...aria("fulfilment.zoneId", "zone")}>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} · {z.fee ? formatMoney(z.fee, settings.currency) : "Free"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="line1" label="Street address" error={err("fulfilment.address.line1")}>
                <input id="line1" name="line1" autoComplete="address-line1" className="field" {...aria("fulfilment.address.line1", "line1")} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="suburb" label="Suburb" error={err("fulfilment.address.suburb")}>
                  <input id="suburb" name="suburb" autoComplete="address-level3" className="field" {...aria("fulfilment.address.suburb", "suburb")} />
                </Field>
                <Field id="city" label="Town / city" error={err("fulfilment.address.city")}>
                  <input id="city" name="city" autoComplete="address-level2" className="field" {...aria("fulfilment.address.city", "city")} />
                </Field>
              </div>
              <Field id="instructions" label="Delivery notes" optional>
                <textarea id="instructions" name="instructions" rows={2} maxLength={300} className="field" placeholder="Gate code, landmarks…" />
              </Field>
            </div>
          ) : (
            <p className="rounded-2xl bg-cream p-4 text-sm text-ink/75">
              {settings.collection.details ?? "Collection details will be confirmed by our team when we confirm your order."}
            </p>
          )}
        </fieldset>

        {/* 3. Payment */}
        <fieldset className="space-y-4">
          <legend className="flex items-center gap-3 font-display text-2xl font-extrabold uppercase tracking-tight text-forest">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-sun font-sans text-sm">3</span> Payment
          </legend>
          <div className="space-y-3" role="radiogroup" aria-label="Payment method">
            {settings.paymentMethods.map((m, i) => (
              <label
                key={m.id}
                className={cn(
                  "flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-botanical",
                  payment === m.id ? "border-forest bg-forest/[0.04]" : "border-ink/15 hover:border-forest/50",
                )}
              >
                <input
                  id={`payment-${i}`}
                  type="radio"
                  name="payment"
                  value={m.id}
                  checked={payment === m.id}
                  onChange={() => setPayment(m.id)}
                  className="mt-1 h-4 w-4 accent-[#173F2B]"
                />
                <span>
                  <span className="block font-semibold">{m.label}</span>
                  <span className="block text-sm text-ink/70">{m.description}</span>
                </span>
              </label>
            ))}
          </div>
          {err("paymentMethod") && <p className="text-sm text-[#b42318]">{err("paymentMethod")}</p>}
          <p className="flex items-center gap-2 text-xs text-ink/70">
            <Lock className="h-3.5 w-3.5" aria-hidden /> We never see or store card details. Card and mobile-money payments are handled by the payment provider.
          </p>
        </fieldset>

        <Field id="notes" label="Order notes" optional>
          <textarea id="notes" name="notes" rows={3} maxLength={500} className="field" />
        </Field>
      </div>

      {/* Summary */}
      <div className="lg:col-span-5">
        <div className="space-y-5 lg:sticky lg:top-28">
          <OrderSummary
            quote={quote}
            verified={verified}
            loading={loading}
            deliveryLabel={method === "collection" ? "Collection: free" : null}
          >
            <div className="mt-6 border-t border-forest/10 pt-5">
              <label htmlFor="promo" className="text-sm font-medium">Discount code</label>
              <div className="mt-2 flex gap-2">
                <input
                  id="promo"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className="field h-11 !py-0 uppercase"
                  autoComplete="off"
                  aria-invalid={Boolean(promo && quote.promotionError) || undefined}
                  aria-describedby="promo-status"
                />
                <button
                  type="button"
                  onClick={() => setPromo(promoInput.trim())}
                  className="h-11 shrink-0 rounded-full border border-forest px-5 text-xs font-semibold uppercase tracking-[0.14em] text-forest hover:bg-forest hover:text-warm"
                >
                  Apply
                </button>
              </div>
              <p id="promo-status" className="mt-2 text-sm" aria-live="polite">
                {promo && verified && quote.promotionError && <span className="text-[#b42318]">{quote.promotionError}</span>}
                {promo && verified && quote.promotionCode && <span className="text-botanical">Code {quote.promotionCode} applied.</span>}
              </p>
            </div>

            {quote.issues.length > 0 && (
              <ul className="mt-4 space-y-1 rounded-xl bg-hibiscus/10 p-3 text-sm text-hibiscus" role="alert">
                {quote.issues.map((i) => <li key={i.variantId}>{i.message}</li>)}
                <li><Link href="/cart" className="font-semibold underline">Update your cart</Link></li>
              </ul>
            )}

            <label className="mt-6 flex items-start gap-3 text-sm">
              <input id="acceptTerms" name="acceptTerms" type="checkbox" className="mt-0.5 h-4 w-4 accent-[#173F2B]" aria-invalid={Boolean(err("acceptTerms")) || undefined} />
              <span>
                I agree to the <Link href="/terms" className="underline underline-offset-4" target="_blank">terms</Link> and{" "}
                <Link href="/privacy" className="underline underline-offset-4" target="_blank">privacy policy</Link>.
              </span>
            </label>
            {err("acceptTerms") && <p className="mt-1.5 text-sm text-[#b42318]">{err("acceptTerms")}</p>}

            {needsAge && (
              <>
                <label className="mt-4 flex items-start gap-3 text-sm">
                  <input
                    id="ageConfirmed"
                    name="ageConfirmed"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-[#173F2B]"
                    aria-invalid={Boolean(err("ageConfirmed")) || undefined}
                  />
                  <span>
                    <strong>I confirm I am 18 or older.</strong> Naturo Cans contain alcohol, and we may ask for ID on
                    delivery or collection.
                  </span>
                </label>
                {err("ageConfirmed") && <p className="mt-1.5 text-sm text-[#b42318]">{err("ageConfirmed")}</p>}
              </>
            )}

            <button
              type="submit"
              disabled={submitting || blocked}
              className={buttonClasses({ size: "lg", className: "mt-6 w-full" })}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              <ButtonLabel>{submitting ? "Placing order…" : `Place order · ${formatMoney(quote.total, quote.currency)}`}</ButtonLabel>
              {!submitting && <ArrowRight className="h-4 w-4" aria-hidden />}
            </button>
            {siteConfig.contact.phone && (
              <p className="mt-4 text-center text-xs text-ink/70">Need help? Call {siteConfig.contact.phone}</p>
            )}
          </OrderSummary>
        </div>
      </div>
    </form>
  );
}
