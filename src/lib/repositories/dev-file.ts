import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { OrderRecord, Repository, VariantUpdate } from "@/lib/orders/types";
import { StockConflictError } from "@/lib/orders/types";
import type { Promotion, StockStatus } from "@/lib/types";
import { localCatalog, localZones } from "./static-catalog";

/**
 * DEVELOPMENT-ONLY repository backed by `.naturo-dev/store.json`.
 * It exists so the full shopping flow (cart → checkout → order → admin) can be
 * exercised locally without Supabase. It is never used in production builds
 * (see `env.dev.fileStore`).
 */

interface StoreFile {
  variants: Record<string, { price?: number | null; stockStatus?: StockStatus; stockQuantity?: number | null }>;
  products: Record<string, { enabledForSale?: boolean }>;
  promotions: Promotion[];
  orders: OrderRecord[];
}

const FILE = path.join(process.cwd(), ".naturo-dev", "store.json");
let queue: Promise<unknown> = Promise.resolve();

async function read(): Promise<StoreFile> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as StoreFile;
  } catch {
    return { variants: {}, products: {}, promotions: [], orders: [] };
  }
}

async function write(data: StoreFile) {
  await mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2));
  await rename(tmp, FILE);
}

/** Serialises read-modify-write cycles within this process. */
function mutate<T>(fn: (data: StoreFile) => T | Promise<T>): Promise<T> {
  const next = queue.then(async () => {
    const data = await read();
    const result = await fn(data);
    await write(data);
    return result;
  });
  queue = next.catch(() => undefined);
  return next;
}

export function createDevFileRepository(opts: { samplePrices: boolean }): Repository {
  const samplePromos: Promotion[] = opts.samplePrices
    ? [
        {
          code: "DEVTEST10",
          kind: "percent",
          value: 10,
          minSubtotal: null,
          active: true,
          startsAt: null,
          endsAt: null,
          usageLimit: null,
          usageCount: 0,
        },
      ]
    : [];

  const repo: Repository = {
    kind: "dev-file",
    canStoreOrders: true,

    async loadCatalog() {
      const data = await read();
      return localCatalog(opts).map((p) => ({
        ...p,
        enabledForSale: data.products[p.id]?.enabledForSale ?? p.enabledForSale,
        variants: p.variants.map((v) => ({ ...v, ...(data.variants[v.id] ?? {}) })),
      }));
    },

    async loadDeliveryZones() {
      return localZones(opts).filter((z) => z.active);
    },

    async findPromotion(code) {
      const data = await read();
      const all = [...samplePromos, ...data.promotions];
      return all.find((p) => p.code.toUpperCase() === code.trim().toUpperCase()) ?? null;
    },

    async createOrder(order) {
      const catalog = await repo.loadCatalog();
      return mutate((data) => {
        // Re-check & decrement tracked stock atomically within this process.
        for (const line of order.lines) {
          const variant = catalog.find((p) => p.id === line.productId)?.variants.find((v) => v.id === line.variantId);
          const qty = data.variants[line.variantId]?.stockQuantity ?? variant?.stockQuantity ?? null;
          if (qty !== null && qty !== undefined) {
            if (qty < line.quantity) throw new StockConflictError(`${line.name} is no longer available in that quantity.`);
            data.variants[line.variantId] = { ...data.variants[line.variantId], stockQuantity: qty - line.quantity };
          }
        }
        if (order.promoCode) {
          const promo = data.promotions.find((p) => p.code === order.promoCode);
          if (promo) promo.usageCount += 1;
        }
        const record: OrderRecord = {
          ...order,
          id: randomUUID(),
          createdAt: new Date().toISOString(),
          history: [
            {
              at: new Date().toISOString(),
              status: order.status,
              paymentStatus: order.paymentStatus,
              note: "Order placed",
              actor: "customer",
            },
          ],
        };
        data.orders.unshift(record);
        return record;
      });
    },

    async getOrder(id) {
      return (await read()).orders.find((o) => o.id === id) ?? null;
    },

    async getOrderByNumber(orderNumber) {
      return (await read()).orders.find((o) => o.orderNumber === orderNumber) ?? null;
    },

    async listOrders(o) {
      const orders = (await read()).orders.filter((x) => !o?.status || x.status === o.status);
      return orders.slice(0, o?.limit ?? 200);
    },

    async listOrdersForCustomer(customerId) {
      return (await read()).orders.filter((o) => o.customerId === customerId);
    },

    async updateOrder(id, patch, note) {
      return mutate((data) => {
        const order = data.orders.find((o) => o.id === id);
        if (!order) throw new Error("Order not found");
        Object.assign(order, patch);
        order.history.push({
          at: new Date().toISOString(),
          status: patch.status ?? null,
          paymentStatus: patch.paymentStatus ?? null,
          ...note,
        });
        return order;
      });
    },

    async updateVariant(_productId: string, variantId: string, update: VariantUpdate) {
      await mutate((data) => {
        data.variants[variantId] = { ...data.variants[variantId], ...update };
      });
    },

    async setProductEnabled(productId, enabled) {
      await mutate((data) => {
        data.products[productId] = { ...data.products[productId], enabledForSale: enabled };
      });
    },
  };
  return repo;
}
