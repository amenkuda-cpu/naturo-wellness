"use client";

import { Copy, Loader2, Mail, Send } from "lucide-react";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { bulkEmailAction, type BulkEmailState } from "@/app/admin/ops-actions";
import { mailtoUrl } from "./message-composer";
import { field } from "./ui";

/** Email apps cope badly with very long mailto links, so big lists open in batches. */
const BATCH = 40;

/**
 * Email many customers at once (announcements, price changes, new flavours).
 * With the email service connected each customer gets their own copy from
 * getnaturo.com; until then it opens the admin's email app with customers in Bcc.
 */
export function BulkEmail({
  recipients,
  emailReady,
  ownAddress,
  templates = [],
}: {
  recipients: { name: string; email: string; phone?: string | null }[];
  emailReady: boolean;
  /** "To" address when opening the email app (everyone else goes in Bcc so addresses stay private). */
  ownAddress: string;
  templates?: { label: string; subject: string; text: string }[];
}) {
  const [subject, setSubject] = useState("News from Naturo Wellness");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [state, action, pending] = useActionState<BulkEmailState, FormData>(bulkEmailAction, { ok: false, message: null, sentAt: 0 });
  const formRef = useRef<HTMLFormElement>(null);
  const lastSent = useRef(0);

  useEffect(() => {
    if (state.ok && state.sentAt !== lastSent.current) {
      lastSent.current = state.sentAt;
      const t = window.setTimeout(() => setBody(""), 0);
      return () => window.clearTimeout(t);
    }
  }, [state]);

  const batches: { name: string; email: string; phone?: string | null }[][] = [];
  for (let i = 0; i < recipients.length; i += BATCH) batches.push(recipients.slice(i, i + BATCH));
  const ready = subject.trim().length >= 2 && body.trim().length >= 2;

  /** Opens the email app for one batch and logs it on the server. */
  function openBatch(i: number) {
    if (!ready) return;
    const list = batches[i];
    const text = body.trim().replace(/\{name\}/g, "there");
    window.location.assign(mailtoUrl({ to: ownAddress, bcc: list.map((r) => r.email), subject: subject.trim(), body: text }));
    const fd = new FormData(formRef.current!);
    fd.set("mode", "handoff");
    fd.set("recipients", JSON.stringify(list));
    fd.set("body", text);
    startTransition(() => action(fd));
  }

  async function copyAddresses() {
    try {
      await navigator.clipboard.writeText(recipients.map((r) => r.email).join(", "));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  }

  return (
    <details className="group mb-5 rounded-[22px] border border-[var(--a-line)] bg-[var(--a-card)]/90 open:pb-4">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--a-inset)]" aria-hidden>
          <Mail className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block font-medium">Email all customers</span>
          <span className="block text-xs text-[var(--a-muted)]">
            {recipients.length} customer{recipients.length === 1 ? "" : "s"} with an email address
          </span>
        </span>
        <span className="ml-auto rounded-full bg-[var(--a-inset)] px-3 py-1.5 text-xs font-semibold">Write email</span>
      </summary>

      <div className="space-y-3 px-4">
        {recipients.length === 0 ? (
          <p className="text-sm text-[var(--a-muted)]">No customers have given an email address yet.</p>
        ) : (
          <>
            {!emailReady && (
              <p className="rounded-[14px] bg-[var(--c-warn-bg)] px-3 py-2 text-xs text-[var(--c-warn)]">
                This opens your own email app with customers in <strong>Bcc</strong> (they can&apos;t see each other&apos;s addresses): just press send there.
                {batches.length > 1 && ` Bigger lists open in batches of ${BATCH}.`} Automatic sending from getnaturo.com switches on once the email service is connected.
              </p>
            )}
            {templates.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {templates.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => {
                      setSubject(t.subject);
                      setBody(emailReady ? t.text : t.text.replace(/\{name\}/g, "there"));
                    }}
                    className="rounded-full border border-[var(--a-line)] px-3 py-1 text-xs text-[var(--a-muted)] hover:bg-[var(--a-hover)] hover:text-[var(--a-ink)]"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            <form ref={formRef} action={action} className="space-y-2">
              <input type="hidden" name="mode" value="server" />
              <input type="hidden" name="recipients" value={JSON.stringify(recipients)} />
              <input name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className={field} aria-label="Email subject" required />
              <textarea
                name="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                maxLength={4000}
                required
                placeholder={emailReady ? "Hi {name}, …  ({name} becomes each customer's first name)" : "Hi there, …"}
                className={`${field} resize-y`}
                aria-label="Message"
              />
              <div className="flex flex-wrap items-center gap-2">
                {emailReady ? (
                  <button
                    disabled={pending || !ready}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--a-accent)] px-5 py-2.5 text-sm font-semibold text-[#14151B] transition hover:brightness-110 disabled:opacity-50"
                  >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                    Send to {recipients.length} customer{recipients.length === 1 ? "" : "s"}
                  </button>
                ) : (
                  batches.map((b, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => openBatch(i)}
                      disabled={pending || !ready}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--a-accent)] px-5 py-2.5 text-sm font-semibold text-[#14151B] transition hover:brightness-110 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" aria-hidden />
                      {batches.length === 1
                        ? `Open in email app (${b.length})`
                        : `Open batch ${i + 1} (${i * BATCH + 1}–${i * BATCH + b.length})`}
                    </button>
                  ))
                )}
                <button
                  type="button"
                  onClick={copyAddresses}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--a-line)] px-4 py-2.5 text-sm text-[var(--a-muted)] hover:bg-[var(--a-hover)] hover:text-[var(--a-ink)]"
                >
                  <Copy className="h-4 w-4" aria-hidden /> {copied ? "Copied" : "Copy all addresses"}
                </button>
              </div>
              {state.message && <p aria-live="polite" className={state.ok ? "text-sm text-[var(--c-ok)]" : "text-sm text-[var(--c-bad)]"}>{state.message}</p>}
            </form>
          </>
        )}
      </div>
    </details>
  );
}
