import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StaffContext } from "@/lib/auth";
import { env } from "@/lib/env";
import { createServiceClient, createUserClient } from "@/lib/supabase/server";
import type { Delivery, Enquiry, Expense, Message, OpsRepository, Ping } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

// ── Supabase ────────────────────────────────────────────────────────────────

const mapDelivery = (r: Row): Delivery => ({
  orderId: r.order_id,
  riderName: r.rider_name,
  riderPhone: r.rider_phone,
  riderTokenHash: r.rider_token_hash,
  dest: r.dest_lat != null && r.dest_lng != null ? { lat: r.dest_lat, lng: r.dest_lng } : null,
  destLabel: r.dest_label,
  startedAt: r.started_at,
  deliveredAt: r.delivered_at,
  updatedAt: r.updated_at,
});

const mapEnquiry = (r: Row): Enquiry => ({
  id: r.id,
  orderId: r.order_id,
  orderNumber: r.order_number,
  name: r.name,
  phone: r.phone,
  email: r.email,
  topic: r.topic,
  message: r.message,
  status: r.status,
  staffNote: r.staff_note,
  createdAt: r.created_at,
});

const mapMessage = (r: Row): Message => ({
  id: r.id,
  enquiryId: r.enquiry_id,
  orderId: r.order_id,
  customerName: r.customer_name,
  toEmail: r.to_email,
  toPhone: r.to_phone,
  channel: r.channel,
  subject: r.subject,
  body: r.body,
  status: r.status,
  error: r.error,
  sentBy: r.sent_by,
  createdAt: r.created_at,
});

function supabaseOps(db: SupabaseClient): OpsRepository {
  const must = <T>(res: { data: T; error: unknown }) => {
    if (res.error) throw res.error;
    return res.data;
  };
  let readyCache: boolean | null = null;
  return {
    async listMessages(f = {}) {
      let q = db.from("messages").select("*").order("created_at", { ascending: false }).limit(f.limit ?? 500);
      if (f.enquiryId) q = q.eq("enquiry_id", f.enquiryId);
      if (f.orderId) q = q.eq("order_id", f.orderId);
      const { data, error } = await q;
      if (error) return [];
      return (data ?? []).map(mapMessage);
    },
    async addMessage(m) {
      const data = must(
        await db
          .from("messages")
          .insert({
            enquiry_id: m.enquiryId,
            order_id: m.orderId,
            customer_name: m.customerName,
            to_email: m.toEmail,
            to_phone: m.toPhone,
            channel: m.channel,
            subject: m.subject,
            body: m.body,
            status: m.status,
            error: m.error,
            sent_by: m.sentBy,
          })
          .select("*")
          .single(),
      );
      return mapMessage(data);
    },
    async ready() {
      if (readyCache !== null) return readyCache;
      const { error } = await db.from("deliveries").select("order_id").limit(1);
      readyCache = !error;
      return readyCache;
    },
    async getDelivery(orderId) {
      const data = must(await db.from("deliveries").select("*").eq("order_id", orderId).maybeSingle());
      return data ? mapDelivery(data) : null;
    },
    async listDeliveries(ids) {
      if (!ids.length) return [];
      return (must(await db.from("deliveries").select("*").in("order_id", ids)) ?? []).map(mapDelivery);
    },
    async upsertDelivery(orderId, p) {
      const row: Row = { order_id: orderId };
      if (p.riderName !== undefined) row.rider_name = p.riderName;
      if (p.riderPhone !== undefined) row.rider_phone = p.riderPhone;
      if (p.riderTokenHash !== undefined) row.rider_token_hash = p.riderTokenHash;
      if (p.dest !== undefined) {
        row.dest_lat = p.dest?.lat ?? null;
        row.dest_lng = p.dest?.lng ?? null;
      }
      if (p.destLabel !== undefined) row.dest_label = p.destLabel;
      if (p.startedAt !== undefined) row.started_at = p.startedAt;
      if (p.deliveredAt !== undefined) row.delivered_at = p.deliveredAt;
      const data = must(await db.from("deliveries").upsert(row, { onConflict: "order_id" }).select("*").single());
      return mapDelivery(data);
    },
    async addPing(orderId, p) {
      must(
        await db.from("delivery_pings").insert({
          order_id: orderId,
          lat: p.lat,
          lng: p.lng,
          accuracy_m: p.accuracy,
          heading: p.heading,
          speed_mps: p.speed,
        }),
      );
    },
    async listPings(orderId, limit = 300) {
      const data = must(
        await db.from("delivery_pings").select("*").eq("order_id", orderId).order("created_at", { ascending: false }).limit(limit),
      );
      return (data ?? [])
        .map((r: Row) => ({ lat: r.lat, lng: r.lng, accuracy: r.accuracy_m, heading: r.heading, speed: r.speed_mps, at: r.created_at }))
        .reverse();
    },
    async listEnquiries(limit = 300) {
      return (must(await db.from("enquiries").select("*").order("created_at", { ascending: false }).limit(limit)) ?? []).map(mapEnquiry);
    },
    async createEnquiry(e) {
      const data = must(
        await db
          .from("enquiries")
          .insert({
            order_id: e.orderId,
            order_number: e.orderNumber,
            name: e.name,
            phone: e.phone,
            email: e.email,
            topic: e.topic,
            message: e.message,
          })
          .select("*")
          .single(),
      );
      return mapEnquiry(data);
    },
    async updateEnquiry(id, p) {
      const row: Row = {};
      if (p.status) row.status = p.status;
      if (p.staffNote !== undefined) row.staff_note = p.staffNote;
      must(await db.from("enquiries").update(row).eq("id", id));
    },
    async listExpenses(since) {
      let q = db.from("expenses").select("*").order("spent_on", { ascending: false }).limit(1000);
      if (since) q = q.gte("spent_on", since.slice(0, 10));
      return (must(await q) ?? []).map((r: Row) => ({
        id: r.id,
        spentOn: r.spent_on,
        category: r.category,
        description: r.description,
        amount: r.amount_cents,
        createdBy: r.created_by,
        createdAt: r.created_at,
      }));
    },
    async addExpense(e) {
      must(
        await db.from("expenses").insert({
          spent_on: e.spentOn,
          category: e.category,
          description: e.description,
          amount_cents: e.amount,
          created_by: e.createdBy,
        }),
      );
    },
    async deleteExpense(id) {
      must(await db.from("expenses").delete().eq("id", id));
    },
    async listVariantCosts() {
      const { data, error } = await db.from("product_variants").select("id, cost_cents");
      if (error) return {};
      return Object.fromEntries((data ?? []).map((r: Row) => [r.id, r.cost_cents ?? null]));
    },
    async setVariantCost(variantId, cost) {
      must(await db.from("product_variants").update({ cost_cents: cost }).eq("id", variantId));
    },
  };
}

// ── Development JSON store (.naturo-dev/ops.json) ───────────────────────────

interface OpsFile {
  deliveries: Delivery[];
  pings: Record<string, Ping[]>;
  enquiries: Enquiry[];
  expenses: Expense[];
  costs: Record<string, number | null>;
  messages: Message[];
}

const FILE = path.join(process.cwd(), ".naturo-dev", "ops.json");
let queue: Promise<unknown> = Promise.resolve();

async function readOps(): Promise<OpsFile> {
  try {
    const d = JSON.parse(await readFile(FILE, "utf8")) as Partial<OpsFile>;
    return { deliveries: [], pings: {}, enquiries: [], expenses: [], costs: {}, messages: [], ...d };
  } catch {
    return { deliveries: [], pings: {}, enquiries: [], expenses: [], costs: {}, messages: [] };
  }
}

function mutate<T>(fn: (d: OpsFile) => T): Promise<T> {
  const next = queue.then(async () => {
    const d = await readOps();
    const out = fn(d);
    await mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(d, null, 2));
    await rename(tmp, FILE);
    return out;
  });
  queue = next.catch(() => undefined);
  return next;
}

const devOps: OpsRepository = {
  ready: async () => true,
  listMessages: async (f = {}) =>
    (await readOps()).messages
      .filter((m) => (!f.enquiryId || m.enquiryId === f.enquiryId) && (!f.orderId || m.orderId === f.orderId))
      .slice(0, f.limit ?? 500),
  addMessage: (m) =>
    mutate((d) => {
      const row: Message = { ...m, id: randomUUID(), createdAt: new Date().toISOString() };
      d.messages.unshift(row);
      return row;
    }),
  getDelivery: async (id) => (await readOps()).deliveries.find((d) => d.orderId === id) ?? null,
  listDeliveries: async (ids) => (await readOps()).deliveries.filter((d) => ids.includes(d.orderId)),
  upsertDelivery: (orderId, p) =>
    mutate((d) => {
      let row = d.deliveries.find((x) => x.orderId === orderId);
      if (!row) {
        row = { orderId, riderName: null, riderPhone: null, riderTokenHash: null, dest: null, destLabel: null, startedAt: null, deliveredAt: null, updatedAt: "" };
        d.deliveries.push(row);
      }
      Object.assign(row, p, { updatedAt: new Date().toISOString() });
      return row;
    }),
  addPing: (orderId, p) =>
    mutate((d) => {
      const list = (d.pings[orderId] ??= []);
      list.push({ ...p, at: new Date().toISOString() });
      if (list.length > 1000) list.splice(0, list.length - 1000);
    }),
  listPings: async (orderId, limit = 300) => ((await readOps()).pings[orderId] ?? []).slice(-limit),
  listEnquiries: async (limit = 300) => (await readOps()).enquiries.slice(0, limit),
  createEnquiry: (e) =>
    mutate((d) => {
      const row: Enquiry = { ...e, id: randomUUID(), status: "new", staffNote: "", createdAt: new Date().toISOString() };
      d.enquiries.unshift(row);
      return row;
    }),
  updateEnquiry: (id, p) =>
    mutate((d) => {
      const row = d.enquiries.find((x) => x.id === id);
      if (row) Object.assign(row, p);
    }),
  listExpenses: async (since) =>
    (await readOps()).expenses.filter((e) => !since || e.spentOn >= since.slice(0, 10)).sort((a, b) => (a.spentOn < b.spentOn ? 1 : -1)),
  addExpense: (e) =>
    mutate((d) => {
      d.expenses.push({ ...e, id: randomUUID(), createdAt: new Date().toISOString() });
    }),
  deleteExpense: (id) =>
    mutate((d) => {
      d.expenses = d.expenses.filter((x) => x.id !== id);
    }),
  listVariantCosts: async () => (await readOps()).costs,
  setVariantCost: (variantId, cost) =>
    mutate((d) => {
      d.costs[variantId] = cost;
    }),
};

// ── Selection ───────────────────────────────────────────────────────────────

function unavailable(): OpsRepository {
  const fail = async (): Promise<never> => {
    throw new Error("Operations data is not configured.");
  };
  return {
    ready: async () => false,
    listMessages: async () => [],
    addMessage: fail,
    getDelivery: async () => null,
    listDeliveries: async () => [],
    upsertDelivery: fail,
    addPing: fail,
    listPings: async () => [],
    listEnquiries: async () => [],
    createEnquiry: fail,
    updateEnquiry: fail,
    listExpenses: async () => [],
    addExpense: fail,
    deleteExpense: fail,
    listVariantCosts: async () => ({}),
    setVariantCost: fail,
  };
}

/** Server-side access (service role): rider pings, public queries, customer tracking. */
export function getSystemOps(): OpsRepository {
  if (env.supabase.configured) return supabaseOps(createServiceClient());
  if (env.dev.fileStore) return devOps;
  return unavailable();
}

/** Staff access: acts AS the signed-in staff member, so RLS applies. */
export async function getStaffOps(ctx: StaffContext): Promise<OpsRepository> {
  if (ctx.mode === "supabase") {
    const client = await createUserClient();
    if (!client) throw new Error("Supabase auth is not configured.");
    return supabaseOps(client);
  }
  return getSystemOps();
}
