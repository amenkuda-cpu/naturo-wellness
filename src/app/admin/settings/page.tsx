import { AdminTitle, Card, DevModeBanner } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { getStoreSettings } from "@/lib/commerce/catalog";
import { formatMoney } from "@/lib/commerce/pricing";
import { env } from "@/lib/env";

function Row({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <li className="flex items-start justify-between gap-6 border-b border-forest/5 py-3 last:border-0">
      <span>
        <span className="font-medium">{label}</span>
        <span className="block text-sm text-ink/70">{detail}</span>
      </span>
      <span className={ok ? "rounded-full bg-leaf/25 px-3 py-1 text-xs font-semibold text-forest" : "rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink/70"}>
        {ok ? "Configured" : "Not configured"}
      </span>
    </li>
  );
}

// Staff data is always read per request.
export const instant = false;

export default async function AdminSettings() {
  const ctx = await requireStaff();
  const settings = await getStoreSettings();
  return (
    <>
      <DevModeBanner ctx={ctx} />
      <AdminTitle title="Settings & status" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl font-bold text-forest">Integrations</h2>
          <ul className="mt-3">
            <Row label="Database (Supabase)" ok={env.supabase.configured} detail={`Active data source: ${settings.dataSource}`} />
            <Row label="Customer accounts" ok={env.supabase.authConfigured} detail="Supabase Auth magic-link sign-in" />
            <Row label="Paynow" ok={env.payments.paynow.enabled} detail="EcoCash, OneMoney, InnBucks, cards via Paynow redirect" />
            <Row label="Manual payment" ok={env.payments.manual} detail="Staff verify transfers before confirming" />
            <Row label="Cash on delivery" ok={env.payments.cashOnDelivery} detail="Pay on delivery or collection" />
          </ul>
          <p className="mt-4 text-sm text-ink/70">
            Online ordering is <strong>{settings.orderingEnabled ? "enabled" : "disabled"}</strong>. These values come from
            environment variables (see README).
          </p>
        </Card>
        <Card>
          <h2 className="font-display text-xl font-bold text-forest">Delivery zones</h2>
          {settings.deliveryZones.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {settings.deliveryZones.map((z) => (
                <li key={z.id} className="flex justify-between"><span>{z.name}</span><span className="tabular-nums">{z.fee ? formatMoney(z.fee, settings.currency) : "Free"}</span></li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink/70">No delivery zones with fees configured. Only collection is offered.</p>
          )}
          <p className="mt-4 text-sm text-ink/70">
            Manage zones in the Supabase <code>delivery_zones</code> table (or <code>src/config/commerce.ts</code> without a
            database). A zones editor is on the roadmap.
          </p>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="font-display text-xl font-bold text-forest">Not yet built in this dashboard</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink/70">
            <li>Creating and editing discount codes (use the Supabase <code>promotions</code> table for now)</li>
            <li>Product content editing and image uploads (edit <code>src/data/products.ts</code> or Supabase)</li>
            <li>Delivery-zone editor and category management</li>
            <li>Sales charts beyond the overview totals</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
