"use client";

import { Loader2, Send } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { sendEnquiryAction, type EnquiryState } from "@/app/(site)/contact/actions";
import { cn } from "@/lib/cn";

/** Query form used on the contact page (full) and on order pages (compact, linked to the order). */
export function EnquiryForm({
  order,
  tone = "light",
}: {
  order?: { id: string; token: string; name: string; phone: string; email: string | null };
  tone?: "light" | "dark";
}) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(sendEnquiryAction, { ok: false, message: null });
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);
  const label = cn("mb-1.5 block text-sm font-medium", tone === "dark" ? "text-warm/85" : "text-forest");

  return (
    <form ref={form} action={action} className="space-y-4">
      {/* Honeypot: hidden from people, bots fill it in. */}
      <div className="hidden" aria-hidden>
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {order ? (
        <>
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="t" value={order.token} />
          <input type="hidden" name="name" value={order.name} />
          <input type="hidden" name="phone" value={order.phone} />
          <input type="hidden" name="email" value={order.email ?? ""} />
          <input type="hidden" name="topic" value="order" />
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="enq-name" className={label}>Your name</label>
              <input id="enq-name" name="name" required autoComplete="name" className="field" />
            </div>
            <div>
              <label htmlFor="enq-phone" className={label}>Phone or WhatsApp</label>
              <input id="enq-phone" name="phone" inputMode="tel" autoComplete="tel" className="field" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="enq-email" className={label}>Email (optional)</label>
              <input id="enq-email" name="email" type="email" autoComplete="email" className="field" />
            </div>
            <div>
              <label htmlFor="enq-topic" className={label}>What is it about?</label>
              <select id="enq-topic" name="topic" className="field" defaultValue="general">
                <option value="order">An order</option>
                <option value="wholesale">Stockist / wholesale</option>
                <option value="feedback">Feedback</option>
                <option value="general">Something else</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="enq-order" className={label}>Order number (if you have one)</label>
            <input id="enq-order" name="orderNumber" placeholder="NW-…" className="field" />
          </div>
        </>
      )}
      <div>
        <label htmlFor={order ? "enq-msg-order" : "enq-msg"} className={label}>{order ? "Your question about this order" : "Message"}</label>
        <textarea id={order ? "enq-msg-order" : "enq-msg"} name="message" required rows={order ? 3 : 5} maxLength={2000} className="field resize-y" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition disabled:opacity-60",
          tone === "dark" ? "bg-sun text-forest hover:bg-citrus" : "bg-forest text-warm hover:bg-botanical",
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        Send message
      </button>
      <p aria-live="polite" className={cn("text-sm font-medium", state.ok ? (tone === "dark" ? "text-citrus" : "text-botanical") : "text-[#b42318]")}>
        {state.message}
      </p>
    </form>
  );
}
