"use client";

import { Loader2, Mail, MessageCircle, Send, Smartphone } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { sendMessageAction, type SendState } from "@/app/admin/ops-actions";
import { cn } from "@/lib/cn";
import type { Message, MessageChannel } from "@/lib/ops/types";
import { field } from "./ui";
import { whatsappDigits } from "@/lib/phone";

export interface Recipient {
  name: string;
  email: string | null;
  phone: string | null;
}

/** mailto: link that opens the admin's own email app with everything filled in. */
export function mailtoUrl({ to, bcc, subject, body }: { to?: string; bcc?: string[]; subject: string; body: string }) {
  const q = [`subject=${encodeURIComponent(subject)}`, `body=${encodeURIComponent(body)}`];
  if (bcc?.length) q.unshift(`bcc=${bcc.map(encodeURIComponent).join(",")}`);
  return `mailto:${to ? encodeURIComponent(to).replace(/%40/g, "@") : ""}?${q.join("&")}`;
}

/** Zimbabwe numbers: 07x… → 2637x… for WhatsApp links. */
export const waNumber = (phone: string, zoneId?: string | null) => whatsappDigits(phone, zoneId);

const CHANNELS: { id: MessageChannel; label: string; icon: typeof Mail }[] = [
  { id: "email", label: "Email", icon: Mail },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "sms", label: "SMS", icon: Smartphone },
];

/**
 * Write to a customer by email (sent from the server), WhatsApp or SMS
 * (opened on this device with the text filled in). Every message is logged
 * and shown in the thread underneath.
 */
export function MessageComposer({
  to,
  enquiryId,
  orderId,
  templates = [],
  history = [],
  canResolve = false,
  emailReady,
  defaultSubject = "",
}: {
  to: Recipient;
  enquiryId?: string;
  orderId?: string;
  templates?: { label: string; text: string }[];
  history?: Message[];
  canResolve?: boolean;
  emailReady: boolean;
  defaultSubject?: string;
}) {
  const first: MessageChannel = to.email ? "email" : to.phone ? "whatsapp" : "email";
  const [channel, setChannel] = useState<MessageChannel>(first);
  const [body, setBody] = useState("");
  const [state, action, pending] = useActionState<SendState, FormData>(sendMessageAction, { ok: false, message: null, sentAt: 0 });
  const lastSent = useRef(0);

  useEffect(() => {
    if (state.ok && state.sentAt !== lastSent.current) {
      lastSent.current = state.sentAt;
      const t = window.setTimeout(() => setBody(""), 0);
      return () => window.clearTimeout(t);
    }
  }, [state]);

  const available = (c: MessageChannel) => (c === "email" ? Boolean(to.email) : Boolean(to.phone));
  const firstName = to.name.split(" ")[0] || "there";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Email app / WhatsApp / SMS must open inside the click, or the browser blocks it.
    if (body.trim().length < 2) return;
    if (channel === "email") {
      if (emailReady || !to.email) return;
      const subject = String(new FormData(e.currentTarget).get("subject") || defaultSubject || "A message from Naturo Wellness");
      window.location.assign(mailtoUrl({ to: to.email, subject, body: body.trim() }));
      return;
    }
    if (!to.phone) return;
    const text = encodeURIComponent(body.trim());
    const url = channel === "whatsapp" ? `https://wa.me/${waNumber(to.phone)}?text=${text}` : `sms:${to.phone.replace(/\s/g, "")}?&body=${text}`;
    window.open(url, "_blank", "noopener");
    void e;
  }

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Send by" className="flex flex-wrap gap-1.5">
        {CHANNELS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={channel === id}
            disabled={!available(id)}
            onClick={() => setChannel(id)}
            title={available(id) ? undefined : id === "email" ? "No email address on file" : "No phone number on file"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
              channel === id ? "bg-[var(--a-pill)] text-[var(--a-pill-ink)]" : "bg-[var(--a-inset)] text-[var(--a-muted)] hover:text-[var(--a-ink)]",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden /> {label}
          </button>
        ))}
        <span className="ml-auto self-center truncate text-xs text-[var(--a-muted)]">
          To {channel === "email" ? to.email ?? "—" : to.phone ?? "—"}
        </span>
      </div>

      {channel === "email" && !emailReady && (
        <p className="rounded-[14px] bg-[var(--c-warn-bg)] px-3 py-2 text-xs text-[var(--c-warn)]">
          Emails open in your own email app (Gmail, Outlook…) with everything filled in: just press send there. Automatic sending from getnaturo.com switches on once the email service is connected.
        </p>
      )}

      {templates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {templates.map((t) => (
            <button key={t.label} type="button" onClick={() => setBody(t.text.replace(/\{name\}/g, firstName))} className="rounded-full border border-[var(--a-line)] px-3 py-1 text-xs text-[var(--a-muted)] hover:bg-[var(--a-hover)] hover:text-[var(--a-ink)]">
              {t.label}
            </button>
          ))}
        </div>
      )}

      <form action={action} onSubmit={onSubmit} className="space-y-2">
        <input type="hidden" name="channel" value={channel} />
        <input type="hidden" name="customerName" value={to.name} />
        <input type="hidden" name="toEmail" value={to.email ?? ""} />
        <input type="hidden" name="toPhone" value={to.phone ?? ""} />
        <input type="hidden" name="enquiryId" value={enquiryId ?? ""} />
        <input type="hidden" name="orderId" value={orderId ?? ""} />
        {channel === "email" && <input name="subject" defaultValue={defaultSubject} placeholder="Subject" className={field} aria-label="Email subject" />}
        <textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={4000}
          required
          placeholder={`Hi ${firstName}, …`}
          className={`${field} resize-y`}
          aria-label="Message"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          {canResolve ? (
            <label className="flex items-center gap-2 text-sm text-[var(--a-muted)]">
              <input type="checkbox" name="resolve" className="h-4 w-4 accent-[#9B7BF7]" /> Mark as resolved
            </label>
          ) : (
            <span />
          )}
          <button
            disabled={pending || !available(channel)}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--a-accent)] px-5 py-2.5 text-sm font-semibold text-[#14151B] transition hover:brightness-110 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            {channel === "email" ? (emailReady ? "Send email" : "Open in email app") : channel === "whatsapp" ? "Open in WhatsApp" : "Open in SMS"}
          </button>
        </div>
        {state.message && <p aria-live="polite" className={state.ok ? "text-sm text-[var(--c-ok)]" : "text-sm text-[var(--c-bad)]"}>{state.message}</p>}
      </form>

      {history.length > 0 && (
        <ol className="space-y-2 border-t border-[var(--a-line)] pt-3" aria-label="Messages sent">
          {history.map((m) => (
            <li key={m.id} className="rounded-[16px] bg-[var(--a-inset)] p-3 text-sm">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-[var(--a-muted)]">
                <span className="font-semibold text-[var(--a-ink)]">{m.channel === "email" ? "Email" : m.channel === "whatsapp" ? "WhatsApp" : "SMS"}</span>
                <span>·</span>
                <span>{new Date(m.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Harare" })}</span>
                <span>· {m.sentBy}</span>
                <span className={cn("ml-auto rounded-full px-2 py-0.5 font-semibold", m.status === "failed" ? "bg-[var(--c-bad-bg)] text-[var(--c-bad)]" : "bg-[var(--c-ok-bg)] text-[var(--c-ok)]")}>
                  {m.status === "sent" ? "Sent" : m.status === "handed_off" ? (m.channel === "email" ? "Opened in email app" : "Opened on phone") : "Failed"}
                </span>
              </div>
              {m.subject && <p className="font-medium">{m.subject}</p>}
              <p className="whitespace-pre-wrap text-[var(--a-ink)]/90">{m.body}</p>
              {m.error && <p className="mt-1 text-xs text-[var(--c-bad)]">{m.error}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
