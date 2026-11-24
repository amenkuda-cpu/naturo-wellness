import "server-only";
import { env } from "@/lib/env";

/**
 * Outgoing email over HTTPS (works from Cloudflare Workers): Zoho ZeptoMail when
 * ZEPTOMAIL_TOKEN is set, otherwise Resend. Without either, development prints
 * the email to the server console; production reports "not configured".
 */

export type EmailResult = { ok: true; id: string | null; dev?: boolean } | { ok: false; error: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Plain text → simple branded HTML (paragraphs, line breaks). */
export function brandedHtml(title: string, text: string, footer = "Naturo Wellness · Feel good. Naturally.") {
  const body = esc(text)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.6">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f5f0df;font-family:Arial,Helvetica,sans-serif;color:#183126">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf5;border-radius:18px;overflow:hidden">
<tr><td style="background:#173f2b;padding:18px 24px;color:#fbea91;font-size:18px;font-weight:bold;letter-spacing:.5px">Naturo Wellness</td></tr>
<tr><td style="padding:24px"><h1 style="margin:0 0 16px;font-size:20px;color:#173f2b">${esc(title)}</h1>${body}</td></tr>
<tr><td style="padding:14px 24px;background:#f5f0df;font-size:12px;color:#5e6b60">${esc(footer)}</td></tr>
</table></td></tr></table></body></html>`;
}

/** Which getnaturo.com address an email comes from. */
export type Sender = "noreply" | "billing" | "support";

/** "Name <address>" → parts. */
export function parseAddress(value: string): { name: string; address: string } {
  const m = /^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/.exec(value);
  return m ? { name: m[1].replace(/^"|"$/g, ""), address: m[2] } : { name: "", address: value.trim() };
}

export interface OutgoingEmail {
  to: string;
  toName?: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  /** Defaults to support (a human answers replies). */
  from?: Sender;
}

export async function sendEmail(msg: OutgoingEmail): Promise<EmailResult> {
  const from = env.email.from[msg.from ?? "support"];
  const replyTo = msg.replyTo || env.email.replyTo;
  const html = msg.html ?? brandedHtml(msg.subject, msg.text);
  if (!env.email.configured) {
    if (!env.isProduction) {
      console.log(`\n[email:dev] From: ${from}\n[email:dev] To: ${msg.to}\n[email:dev] Subject: ${msg.subject}\n${msg.text}\n`);
      return { ok: true, id: null, dev: true };
    }
    return { ok: false, error: "Email sending is not set up yet (ZEPTOMAIL_TOKEN)." };
  }
  try {
    return env.email.zeptoToken ? await viaZepto({ ...msg, html }, from, replyTo) : await viaResend({ ...msg, html }, from, replyTo);
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Zoho ZeptoMail: https://www.zoho.com/zeptomail/help/api/email-sending.html */
async function viaZepto(msg: OutgoingEmail & { html: string }, from: string, replyTo: string): Promise<EmailResult> {
  const token = env.email.zeptoToken.replace(/^zoho-enczapikey\s+/i, "");
  const sender = parseAddress(from);
  const res = await fetch(`${env.email.zeptoUrl}/v1.1/email`, {
    method: "POST",
    headers: { Authorization: `Zoho-enczapikey ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      from: { address: sender.address, name: sender.name || "Naturo Wellness" },
      to: [{ email_address: { address: msg.to, ...(msg.toName ? { name: msg.toName } : {}) } }],
      ...(replyTo ? { reply_to: [parseAddress(replyTo)].map((r) => ({ address: r.address, ...(r.name ? { name: r.name } : {}) })) } : {}),
      subject: msg.subject,
      textbody: msg.text,
      htmlbody: msg.html,
      track_clicks: false,
      track_opens: false,
    }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as {
    request_id?: string;
    error?: { message?: string; details?: Array<{ message?: string }> };
  };
  if (!res.ok) {
    const detail = json.error?.details?.map((d) => d.message).filter(Boolean).join("; ");
    return { ok: false, error: [json.error?.message, detail].filter(Boolean).join(": ") || `ZeptoMail error ${res.status}` };
  }
  return { ok: true, id: json.request_id ?? null };
}

async function viaResend(msg: OutgoingEmail & { html: string }, from: string, replyTo: string): Promise<EmailResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.email.resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [msg.to],
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) return { ok: false, error: json.message ?? `Email service error ${res.status}` };
  return { ok: true, id: json.id ?? null };
}
