import Link from "next/link";
import { AdminTitle, Card, DevModeBanner } from "@/components/admin/ui";
import { ProductImage } from "@/components/product/product-image";
import { requireStaff } from "@/lib/auth";
import { getStaffRepository } from "@/lib/repositories";
import { setProductEnabledAction, updateVariantAction } from "../actions";

// Staff data is always read per request.
export const instant = false;

export default async function AdminProducts() {
  const ctx = await requireStaff();
  const repo = await getStaffRepository(ctx);
  const catalog = await repo.loadCatalog(); // fresh, uncached
  const isAdmin = ctx.role === "admin";

  return (
    <>
      <DevModeBanner ctx={ctx} />
      <AdminTitle title="Products" />
      <p className="mb-6 max-w-2xl text-sm text-ink/75">
        Leave the price empty to show &ldquo;Price coming soon&rdquo;. A product can only be purchased when it is enabled
        <em> and</em> has a price. Content (descriptions, ingredients, images) is edited in{" "}
        <code className="rounded bg-cream px-1">src/data/products.ts</code> or the Supabase table until the content editor is built.
      </p>
      <div className="space-y-4">
        {catalog.map((p) => (
          <Card key={p.id} className="grid gap-6 md:grid-cols-[96px_1fr]">
            <div className="relative h-28 w-24 overflow-hidden rounded-xl" style={{ backgroundColor: p.theme.tint }}>
              <ProductImage product={p} sizes="96px" className="absolute inset-1" />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={`/shop/${p.slug}`} className="font-display text-xl font-bold text-forest hover:underline">{p.name}</Link>
                  <p className="text-xs text-ink/70">{p.id}</p>
                </div>
                <form action={setProductEnabledAction}>
                  <input type="hidden" name="productId" value={p.id} />
                  <input type="hidden" name="enabled" value={String(!p.enabledForSale)} />
                  <button
                    disabled={!isAdmin}
                    className={p.enabledForSale ? "rounded-full bg-leaf/25 px-4 py-2 text-xs font-semibold text-forest" : "rounded-full bg-hibiscus/10 px-4 py-2 text-xs font-semibold text-hibiscus"}
                  >
                    {p.enabledForSale ? "Enabled for sale: disable" : "Disabled: enable"}
                  </button>
                </form>
              </div>
              {p.variants.map((v) => (
                <form key={v.id} action={updateVariantAction} className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <input type="hidden" name="productId" value={p.id} />
                  <input type="hidden" name="variantId" value={v.id} />
                  <label className="text-sm">
                    <span className="mb-1 block text-ink/70">Price ({p.currency}) · {v.size ?? v.label}</span>
                    <input name="price" inputMode="decimal" defaultValue={v.price !== null ? (v.price / 100).toFixed(2) : ""} placeholder="Coming soon" className="field" disabled={!isAdmin} />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-ink/70">Stock status</span>
                    <select name="stockStatus" defaultValue={v.stockStatus} className="field" disabled={!isAdmin}>
                      <option value="unknown">Not shown</option>
                      <option value="in_stock">In stock</option>
                      <option value="low_stock">Low stock</option>
                      <option value="out_of_stock">Out of stock</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-ink/70">Quantity (blank = untracked)</span>
                    <input name="stockQuantity" inputMode="numeric" defaultValue={v.stockQuantity ?? ""} className="field" disabled={!isAdmin} />
                  </label>
                  <button disabled={!isAdmin} className="h-12 rounded-full bg-forest px-5 text-xs font-semibold uppercase tracking-[0.14em] text-warm hover:bg-botanical disabled:opacity-40">
                    Save
                  </button>
                </form>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
