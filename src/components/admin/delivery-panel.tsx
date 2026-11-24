"use client";

import { Check, Copy, Crosshair, Loader2, MessageCircle, Search, Send } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { assignRiderAction, findDestinationAction, setDestinationAction, type RiderState } from "@/app/admin/ops-actions";
import { LiveMap } from "@/components/tracking/live-map";
import { btn, field } from "./ui";
import { whatsappDigits } from "@/lib/phone";

/** Order page: assign a rider, set the drop-off pin, share the rider link, watch the trip live. */
export function DeliveryPanel({
  orderId,
  orderNumber,
  address,
  riderName,
  riderPhone,
  hasDest,
  started,
  delivered,
}: {
  orderId: string;
  orderNumber: string;
  address: string;
  riderName: string | null;
  riderPhone: string | null;
  hasDest: boolean;
  started: boolean;
  delivered: boolean;
}) {
  const init: RiderState = { ok: false, message: null, link: null };
  const [rider, riderAction, riderPending] = useActionState(assignRiderAction, init);
  const [find, findAction, findPending] = useActionState(findDestinationAction, init);
  const [picking, setPicking] = useState(!hasDest);
  const [pinPending, startPin] = useTransition();
  const [copied, setCopied] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  const link = rider.link;
  const waText = link ? `Naturo delivery ${orderNumber}. Open this link and tap Start delivery: ${link}` : "";
  const waPhone = whatsappDigits(riderPhone ?? "");

  return (
    <div className="space-y-4">
      <LiveMap
        key={mapKey}
        endpoint={`/api/admin/tracking?order=${orderId}`}
        height={340}
        dark
        onPick={
          picking
            ? (p) =>
                startPin(async () => {
                  await setDestinationAction(orderId, p.lat, p.lng);
                  setPicking(false);
                  setMapKey((k) => k + 1);
                })
            : undefined
        }
        pickHint={pinPending ? "Saving pin…" : "Tap the customer's door to set the drop-off pin"}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setPicking((v) => !v)} className={picking ? btn.primary : btn.secondary}>
          <Crosshair className="h-4 w-4" aria-hidden /> {picking ? "Tap the map…" : "Move drop-off pin"}
        </button>
        <form action={findAction} className="flex min-w-[240px] flex-1 gap-2">
          <input type="hidden" name="orderId" value={orderId} />
          <label className="sr-only" htmlFor={`find-${orderId}`}>Find address</label>
          <input id={`find-${orderId}`} name="query" defaultValue={address} className={field} placeholder="Address or landmark" />
          <button className={btn.secondary} disabled={findPending} aria-label="Find on map">
            {findPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          </button>
        </form>
      </div>
      {find.message && <p className={find.ok ? "text-sm text-[var(--c-ok)]" : "text-sm text-[var(--c-bad)]"} aria-live="polite">{find.message}</p>}

      {!delivered && (
        <form action={riderAction} className="rounded-[20px] bg-[var(--a-inset)] p-4">
          <input type="hidden" name="orderId" value={orderId} />
          <p className="mb-3 text-sm font-bold text-[var(--a-ink)]">
            {riderName ? `Rider: ${riderName}${started ? " · on the way" : ""}` : "Assign a rider"}
          </p>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input name="riderName" defaultValue={riderName ?? ""} required className={field} placeholder="Rider's name" aria-label="Rider's name" />
            <input name="riderPhone" defaultValue={riderPhone ?? ""} inputMode="tel" className={field} placeholder="Rider's phone (for WhatsApp)" aria-label="Rider's phone" />
            <button className={btn.primary} disabled={riderPending}>
              {riderPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              {riderName ? "New rider link" : "Create rider link"}
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--a-muted)]">
            The rider opens the link on their phone and taps Start. Their GPS then moves on this map and on the customer&apos;s order page. A new link
            switches off the old one.
          </p>
          {rider.message && <p className={rider.ok ? "mt-3 text-sm font-medium text-[var(--c-ok)]" : "mt-3 text-sm font-medium text-[var(--c-bad)]"} aria-live="polite">{rider.message}</p>}
          {link && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-[12px] bg-[var(--a-card)] px-3 py-2 text-xs text-[var(--a-muted)]">{link}</code>
              <button
                type="button"
                className={btn.secondary}
                onClick={() => {
                  void navigator.clipboard.writeText(link).then(() => {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1600);
                  });
                }}
              >
                {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} {copied ? "Copied" : "Copy"}
              </button>
              <a href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener" className={btn.primary} style={{ backgroundColor: "#1FA855" }}>
                <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp it
              </a>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
