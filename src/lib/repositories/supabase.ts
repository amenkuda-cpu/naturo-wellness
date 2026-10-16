import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { categories, products as localProducts } from "@/data/products";
import type { OrderRecord, Repository } from "@/lib/orders/types";
import { StockConflictError } from "@/lib/orders/types";
import type { CategoryId, DeliveryZone, Product, ProductVariant, Promotion } from "@/lib/types";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Supabase-backed repository (production). Commerce data (prices, stock,
 * availability, verified label data) comes from the database; art direction
 * (theme colours, motifs, FAQs) is merged from the local catalogue file.
 *
 * NOTE: written against supabase/migrations/*. It has not been exercised
 * against a live project in this repository's development environment.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

function mapVariant(v: Row): ProductVariant {
  return {
    id: v.id,
    sku: v.sku,
    label: v.label,
    size: v.size,
    price: v.price_cents,
    compareAtPrice: v.compare_at_cents,
    stockStatus: v.stock_status,
    stockQuantity: v.stock_quantity,
  };
}

function mapProduct(p: Row): Product {
  const local = localProducts.find((lp) => lp.id === p.id);
  const fallbackTheme = { accent: "#367A45", deep: "#173F2B", tint: "#F5F0DF" };
  const images = Array.isArray(p.images) && p.images.length ? p.images : local?.images ?? [];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: (categories.some((c) => c.id === p.category_id) ? p.category_id : "wellness-shots") as CategoryId,
    shortDescription: p.short_description || local?.shortDescription || "",
    fullDescription: p.full_description?.length ? p.full_description : local?.fullDescription ?? [],
    currency: (p.product_variants?.[0]?.currency ?? "USD") as Product["currency"],
    images,
    packaging: local?.packaging ?? "shot",
    ingredients: p.ingredients,
    variants: ((p.product_variants ?? []) as Row[])
      .filter((v) => v.active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapVariant),
    featured: p.featured,
    enabledForSale: p.enabled_for_sale,
    tags: p.tags ?? [],
    preparation: p.preparation,
    storage: p.storage,
    allergens: p.allergens,
    nutrition: p.nutrition,
    verifiedBenefits: p.verified_benefits ?? [],
    relatedSlugs: local?.relatedSlugs ?? [],
    faqs: local?.faqs ?? [],
    motifs: local?.motifs ?? ["leaf", "droplet"],
    theme: local?.theme ?? fallbackTheme,
    mood: local?.mood ?? "",
  };
}

function mapOrder(o: Row): OrderRecord {
  const payment = ((o.payments ?? []) as Row[]).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
  return {
    id: o.id,
    orderNumber: o.order_number,
    createdAt: o.created_at,
    status: o.status,
    paymentStatus: o.payment_status,
    paymentMethod: o.payment_method,
    paymentReference: o.payment_reference,
    paymentData: payment?.poll_url ? { pollUrl: payment.poll_url } : {},
    currency: o.currency,
    customer: { fullName: o.customer_name, phone: o.customer_phone, email: o.customer_email },
    customerId: o.customer_id,
    fulfilment: {
      method: o.fulfilment_method,
      zoneId: o.delivery_zone_id,
      zoneName: o.delivery_zone_name,
      address: o.delivery_address,
    },
    lines: ((o.order_items ?? []) as Row[]).map((i) => ({
      productId: i.product_id,
      variantId: i.variant_id,
      name: i.product_name,
      variantLabel: i.variant_label,
      unitPrice: i.unit_price_cents,
      quantity: i.quantity,
      lineTotal: i.line_total_cents,
    })),
    subtotal: o.subtotal_cents,
    discount: o.discount_cents,
    deliveryFee: o.delivery_fee_cents,
    tax: o.tax_cents,
    total: o.total_cents,
    promoCode: o.promo_code,
    notes: o.notes,
    accessTokenHash: o.access_token_hash,
    history: ((o.order_events ?? []) as Row[])
      .sort((a, b) => (a.created_at > b.created_at ? 1 : -1))
      .map((e) => ({
        at: e.created_at,
        status: e.status,
        paymentStatus: e.payment_status,
        note: e.note,
        actor: e.actor,
      })),
  };
}

const ORDER_SELECT = "*, order_items(*), order_events(*), payments(*)";

/**
 * @param client Optional per-user client. Admin actions pass the signed-in
 * user's client so Row Level Security enforces staff permissions in the
 * database as well as on the server. Defaults to the service-role client.
 */
export function createSupabaseRepository(client?: SupabaseClient): Repository {
  const db = (): SupabaseClient => client ?? createServiceClient();

  const repo: Repository = {
    kind: "supabase",
    canStoreOrders: true,

    async loadCatalog() {
      const { data, error } = await db()
        .from("products")
        .select("*, product_variants(*)")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map(mapProduct);
    },

    async loadDeliveryZones(): Promise<DeliveryZone[]> {
      const { data, error } = await db().from("delivery_zones").select("*").eq("active", true).order("sort_order");
      if (error) throw error;
      return (data ?? []).map((z: Row) => ({
        id: z.id,
        name: z.name,
        description: z.description,
        fee: z.fee_cents,
        active: z.active,
      }));
    },

    async findPromotion(code): Promise<Promotion | null> {
      const { data, error } = await db()
        .from("promotions")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        code: data.code,
        kind: data.kind,
        value: data.value,
        minSubtotal: data.min_subtotal_cents,
        active: data.active,
        startsAt: data.starts_at,
        endsAt: data.ends_at,
        usageLimit: data.usage_limit,
        usageCount: data.usage_count,
      };
    },

    async createOrder(order) {
      const { data: id, error } = await db().rpc("place_order", {
        p_order: {
          order_number: order.orderNumber,
          customer_id: order.customerId ?? "",
          status: order.status,
          payment_status: order.paymentStatus,
          payment_method: order.paymentMethod,
          currency: order.currency,
          customer_name: order.customer.fullName,
          customer_phone: order.customer.phone,
          customer_email: order.customer.email ?? "",
          fulfilment_method: order.fulfilment.method,
          delivery_zone_id: order.fulfilment.zoneId ?? "",
          delivery_zone_name: order.fulfilment.zoneName ?? "",
          delivery_address: order.fulfilment.address,
          subtotal_cents: order.subtotal,
          discount_cents: order.discount,
          delivery_fee_cents: order.deliveryFee,
          tax_cents: order.tax,
          total_cents: order.total,
          promo_code: order.promoCode ?? "",
          notes: order.notes,
          access_token_hash: order.accessTokenHash,
        },
        p_items: order.lines.map((l) => ({
          product_id: l.productId,
          variant_id: l.variantId,
          product_name: l.name,
          variant_label: l.variantLabel,
          unit_price_cents: l.unitPrice,
          quantity: l.quantity,
        })),
      });
      if (error) {
        if (/insufficient_stock|variant_unavailable|promotion_unavailable/.test(error.message)) {
          throw new StockConflictError("Some items are no longer available in the quantity requested.");
        }
        throw error;
      }
      const created = await repo.getOrder(id as string);
      if (!created) throw new Error("Order was created but could not be read back.");
      return created;
    },

    async getOrder(id) {
      const { data, error } = await db().from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? mapOrder(data) : null;
    },

    async getOrderByNumber(orderNumber) {
      const { data, error } = await db()
        .from("orders")
        .select(ORDER_SELECT)
        .eq("order_number", orderNumber)
        .maybeSingle();
      if (error) throw error;
      return data ? mapOrder(data) : null;
    },

    async listOrders(o) {
      let q = db().from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(o?.limit ?? 200);
      if (o?.status) q = q.eq("status", o.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(mapOrder);
    },

    async listOrdersForCustomer(customerId) {
      const { data, error } = await db()
        .from("orders")
        .select(ORDER_SELECT)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapOrder);
    },

    async updateOrder(id, patch, note) {
      const update: Row = {};
      if (patch.status) update.status = patch.status;
      if (patch.paymentStatus) update.payment_status = patch.paymentStatus;
      if (patch.paymentReference !== undefined) update.payment_reference = patch.paymentReference;
      if (Object.keys(update).length) {
        const { error } = await db().from("orders").update(update).eq("id", id);
        if (error) throw error;
      }
      if (patch.paymentData?.pollUrl || patch.paymentData?.provider) {
        const { error } = await db().from("payments").insert({
          order_id: id,
          provider: patch.paymentData.provider ?? "paynow",
          status: patch.paymentStatus ?? "pending",
          poll_url: patch.paymentData.pollUrl ?? null,
          provider_reference: patch.paymentReference ?? null,
          raw: patch.paymentData,
        });
        if (error) throw error;
      }
      const { error: evErr } = await db().from("order_events").insert({
        order_id: id,
        status: patch.status ?? null,
        payment_status: patch.paymentStatus ?? null,
        note: note.note,
        actor: note.actor,
      });
      if (evErr) throw evErr;
      const order = await repo.getOrder(id);
      if (!order) throw new Error("Order not found");
      return order;
    },

    async updateVariant(_productId, variantId, update) {
      const row: Row = {};
      if (update.price !== undefined) row.price_cents = update.price;
      if (update.stockStatus !== undefined) row.stock_status = update.stockStatus;
      if (update.stockQuantity !== undefined) row.stock_quantity = update.stockQuantity;
      const { error } = await db().from("product_variants").update(row).eq("id", variantId);
      if (error) throw error;
    },

    async setProductEnabled(productId, enabled) {
      const { error } = await db().from("products").update({ enabled_for_sale: enabled }).eq("id", productId);
      if (error) throw error;
    },
  };
  return repo;
}
