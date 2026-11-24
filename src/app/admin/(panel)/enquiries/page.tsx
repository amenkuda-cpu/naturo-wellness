import { Inbox, Phone, Save } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/admin/live";
import { MessageComposer } from "@/components/admin/message-composer";
import { AdminTitle, Card, DevModeBanner, EmptyState, Pill, SetupNotice, btn, field, harareTime, timeAgo, tones, type Tone } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { env } from "@/lib/env";
import { requestNow } from "@/lib/ops/metrics";
import { getStaffOps } from "@/lib/ops/repository";
import { QUERY_TEMPLATES } from "@/lib/ops/templates";
import type { EnquiryStatus, EnquiryTopic } from "@/lib/ops/types";
import { updateEnquiryAction } from "../../ops-actions";

export const metadata: Metadata = { title: "Queries" };
export const instant = false;

const STATUS: Record<EnquiryStatus, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "hibiscus" },
  open: { label: "In progress", tone: "sun" },
  resolved: { label: "Resolved", tone: "green" },
};
const TOPIC: Record<EnquiryTopic, { label: string; tone: Tone }> = {
  order: { label: "About an order", tone: "ember" },
  wholesale: { label: "Stockist / wholesale", tone: "violet" },
  feedback: { label: "Feedback", tone: "teal" },
  general: { label: "General", tone: "sky" },
};

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const ctx = await requireStaff();
  const { show } = await searchParams;
  const ops = await getStaffOps(ctx);
  const [ready, all, messages] = await Promise.all([ops.ready(), ops.listEnquiries(500).catch(() => []), ops.listMessages({ limit: 1000 }).catch(() => [])]);
  const filter = show === "resolved" || show === "all" ? show : "open";
  const list = all.filter((e) => (filter === "all" ? true : filter === "resolved" ? e.status === "resolved" : e.status !== "resolved"));
  const now = requestNow();
  const threadOf = (id: string) => messages.filter((m) => m.enquiryId === id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <>
      <AutoRefresh seconds={60} />
      <DevModeBanner ctx={ctx} />
      <AdminTitle title="Queries" subtitle="Questions from the contact page and customers' order pages. Reply by email, WhatsApp or SMS right here." />
      {!ready && <SetupNotice title="Queries need one database step">Apply the admin_ops migration to start receiving queries.</SetupNotice>}

      <nav aria-label="Filter queries" className="mb-5 flex gap-2">
        {(["open", "resolved", "all"] as const).map((f) => {
          const on = filter === f;
          const n = f === "all" ? all.length : f === "resolved" ? all.filter((e) => e.status === "resolved").length : all.filter((e) => e.status !== "resolved").length;
          return (
            <Link key={f} href={`/admin/enquiries?show=${f}`} aria-current={on ? "page" : undefined} className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: on ? tones.hibiscus.base : "var(--a-card)", color: on ? "#fff" : "var(--a-muted)" }}>
              {f === "open" ? "Open" : f === "resolved" ? "Resolved" : "All"} · {n}
            </Link>
          );
        })}
      </nav>

      {list.length === 0 ? (
        <EmptyState icon={Inbox} tone="hibiscus" title={filter === "open" ? "Inbox zero" : "Nothing here yet"}>
          Customers can send a question from the Contact page, or from their order page with the order number attached.
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {list.map((e) => {
            const phone = (e.phone ?? "").replace(/\s/g, "");
            return (
              <li key={e.id}>
                <Card className={e.status === "new" ? "border-l-[6px] border-l-[#E2457E]" : ""}>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold">{e.name}</p>
                          <p className="text-sm text-[var(--a-muted)]" title={harareTime(e.createdAt)}>
                            {timeAgo(e.createdAt, now)}
                            {e.orderNumber && <> · order {e.orderId ? <Link href={`/admin/orders/${e.orderId}`} className="font-semibold underline">{e.orderNumber}</Link> : e.orderNumber}</>}
                          </p>
                          <p className="mt-1 text-xs text-[var(--a-muted)]">{[e.phone, e.email].filter(Boolean).join(" · ")}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5"><Pill tone={TOPIC[e.topic].tone}>{TOPIC[e.topic].label}</Pill><Pill tone={STATUS[e.status].tone}>{STATUS[e.status].label}</Pill></div>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap rounded-[16px] bg-[var(--a-inset)] p-4 leading-relaxed">{e.message}</p>
                      <form action={updateEnquiryAction} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                        <input type="hidden" name="id" value={e.id} />
                        <input name="staffNote" defaultValue={e.staffNote} maxLength={1000} className={field} placeholder="Internal note (who's handling it)" aria-label="Internal note" />
                        <select name="status" defaultValue={e.status === "new" ? "open" : e.status} className={field} aria-label="Status">
                          <option value="new">New</option>
                          <option value="open">In progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <button className={btn.secondary}><Save className="h-4 w-4" aria-hidden /> Save</button>
                      </form>
                      {phone && <a href={`tel:${phone}`} className={`${btn.secondary} mt-3`}><Phone className="h-4 w-4" aria-hidden /> Call {e.name.split(" ")[0]}</a>}
                    </div>
                    <div className="min-w-0 rounded-[22px] border border-[var(--a-line)] p-4">
                      <p className="mb-3 text-sm font-semibold">Reply</p>
                      <MessageComposer
                        to={{ name: e.name, email: e.email, phone: e.phone }}
                        enquiryId={e.id}
                        orderId={e.orderId ?? undefined}
                        templates={QUERY_TEMPLATES}
                        history={threadOf(e.id)}
                        canResolve
                        emailReady={env.email.configured || !env.isProduction}
                        defaultSubject="Re: your message to Naturo Wellness"
                      />
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
