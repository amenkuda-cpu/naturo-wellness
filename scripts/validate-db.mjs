// Applies supabase/migrations + seed.sql to an in-memory PostgreSQL (PGlite) with
// stubbed Supabase auth objects, then checks place_order() and RLS.   npm run test:db
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const root = fileURLToPath(new URL("..", import.meta.url));
const db = new PGlite();
const ok = (m) => console.log("✓", m);

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
`);

await db.exec(readFileSync(path.join(root, "supabase/migrations/20261014000000_initial_schema.sql"), "utf8"));
ok("migration applied");
const opsSql = readFileSync(path.join(root, "supabase/migrations/20261120000000_admin_ops.sql"), "utf8");
await db.exec(opsSql);
await db.exec(opsSql); // must be safe to run twice
ok("admin_ops migration applied (twice, idempotent)");
await db.exec(readFileSync(path.join(root, "supabase/seed.sql"), "utf8"));
const { rows: [{ n }] } = await db.query("select count(*)::int n from public.products");
ok(`seed applied (${n} products)`);

await db.exec(`
  grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
  grant usage, select on all sequences in schema public to anon, authenticated, service_role;
  update public.product_variants set price_cents = 250, stock_quantity = 3, cost_cents = 90 where id = 'ginger-shot-standard';
  insert into public.promotions (code, kind, value, usage_limit) values ('ONCE', 'percent', 10, 1);
  insert into auth.users values ('11111111-1111-1111-1111-111111111111', 'staff@naturo.test'), ('22222222-2222-2222-2222-222222222222', 'customer@naturo.test');
  insert into public.staff_members values ('11111111-1111-1111-1111-111111111111', 'admin');
`);

const order = (num, qty, promo = "") => ({
  order_number: num, customer_id: "", status: "pending", payment_status: "unpaid", payment_method: "cash_on_delivery",
  currency: "USD", customer_name: "Test Person", customer_phone: "0771234567", customer_email: "",
  fulfilment_method: "collection", delivery_zone_id: "", delivery_zone_name: "", delivery_address: null,
  subtotal_cents: 250 * qty, discount_cents: 0, delivery_fee_cents: 0, tax_cents: 0, total_cents: 250 * qty,
  promo_code: promo, notes: "", access_token_hash: "abc",
});
const items = (qty) => [{ product_id: "ginger-shot", variant_id: "ginger-shot-standard", product_name: "Ginger Shot", variant_label: "Single", unit_price_cents: 250, quantity: qty }];

await db.exec("set role service_role");
const r1 = await db.query("select public.place_order($1, $2) as id", [order("NW-T-1", 2, "ONCE"), items(2)]);
const { rows: [v] } = await db.query("select stock_quantity, stock_status from public.product_variants where id = 'ginger-shot-standard'");
if (v.stock_quantity !== 1) throw new Error("stock not decremented");
ok(`place_order created ${r1.rows[0].id.slice(0, 8)}…, stock 3 → ${v.stock_quantity}`);
const { rows: [li] } = await db.query("select unit_cost_cents from public.order_items limit 1");
if (li.unit_cost_cents !== 90) throw new Error(`cost snapshot missing: ${li.unit_cost_cents}`);
ok("order lines snapshot the unit cost (90c) for profit");
const pese = await db.query("select public.place_order($1, $2) as id", [{ ...order("NW-T-P", 1), payment_method: "pesepay", payment_status: "pending" }, items(1)]);
ok(`pesepay is an accepted payment method (${pese.rows[0].id.slice(0, 8)}…)`);
await db.query("delete from public.orders where order_number = 'NW-T-P'");
await db.query("update public.product_variants set stock_quantity = 1, stock_status = 'in_stock' where id = 'ginger-shot-standard'");

for (const [label, args, expect] of [
  ["oversell", [order("NW-T-2", 5), items(5)], /insufficient_stock/],
  ["exhausted promo", [order("NW-T-3", 1, "ONCE"), items(1)], /promotion_unavailable/],
]) {
  try {
    await db.query("select public.place_order($1, $2)", args);
    throw new Error(`${label} should fail`);
  } catch (e) {
    if (!expect.test(e.message)) throw e;
    ok(`place_order rejects ${label}`);
  }
}
const { rows: [{ c }] } = await db.query("select count(*)::int c from public.orders");
if (c !== 1) throw new Error("failed orders must roll back");
ok("failed orders roll back atomically");
await db.exec("reset role");

// ── RLS checks ──
const as = async (role, uid, sql) => {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);`);
  try {
    return await db.query(sql);
  } finally {
    await db.exec("reset role");
  }
};
const count = async (role, uid, sql) => (await as(role, uid, sql)).rows.length;

if ((await count("anon", null, "select * from public.orders")) !== 0) throw new Error("anon can read orders");
ok("anonymous visitors cannot read orders (incl. guest orders)");
if ((await count("authenticated", "22222222-2222-2222-2222-222222222222", "select * from public.orders")) !== 0) throw new Error("customer reads others");
ok("customers cannot read other people's orders");
if ((await count("authenticated", "11111111-1111-1111-1111-111111111111", "select * from public.orders")) !== 1) throw new Error("staff cannot read");
ok("staff can read orders");
if ((await count("anon", null, "select * from public.products")) !== n) throw new Error("public catalogue hidden");
ok("catalogue is publicly readable");
if ((await count("anon", null, "select * from public.promotions")) !== 0) throw new Error("promos listable");
ok("promotion codes are not publicly listable");

const upd = await as("authenticated", "22222222-2222-2222-2222-222222222222", "update public.product_variants set price_cents = 1 where id = 'ginger-shot-standard' returning id");
if (upd.rows.length) throw new Error("customer changed price");
ok("customers cannot change prices");
const upd2 = await as("authenticated", "11111111-1111-1111-1111-111111111111", "update public.product_variants set price_cents = 300 where id = 'ginger-shot-standard' returning id");
if (upd2.rows.length !== 1) throw new Error("staff cannot update price");
ok("staff can change prices");
const self = await as("authenticated", "22222222-2222-2222-2222-222222222222", "insert into public.staff_members values ('22222222-2222-2222-2222-222222222222', 'admin') returning user_id").catch((e) => e);
if (!(self instanceof Error)) throw new Error("customer self-promoted to admin");
ok("customers cannot make themselves staff");
for (const role of ["anon", "authenticated"]) {
  const e = await as(role, null, `select public.place_order('{}'::jsonb, '[]'::jsonb)`).catch((x) => x);
  if (!(e instanceof Error) || !/permission denied/.test(e.message)) throw new Error(`${role} can call place_order: ${e.message ?? e}`);
}
ok("place_order is not callable by anon/authenticated");
const bad = await db.query("update public.product_variants set price_cents = -5 where id = 'glow-shot-standard'").catch((e) => e);
if (!(bad instanceof Error)) throw new Error("negative price allowed");
ok("constraints reject negative prices");

// ── Admin ops tables ──
const STAFF = "11111111-1111-1111-1111-111111111111";
const CUSTOMER = "22222222-2222-2222-2222-222222222222";
const { rows: [{ id: oid }] } = await db.query("select id from public.orders limit 1");
await db.exec(`
  insert into public.deliveries (order_id, rider_name, dest_lat, dest_lng) values ('${oid}', 'Tendai', -17.8, 31.05);
  insert into public.delivery_pings (order_id, lat, lng) values ('${oid}', -17.81, 31.04);
  insert into public.enquiries (name, phone, message) values ('Rudo', '0771111111', 'Do you deliver to Borrowdale?');
  insert into public.expenses (category, description, amount_cents) values ('packaging', 'Bottles', 1500);
`);
for (const t of ["deliveries", "delivery_pings", "enquiries", "expenses"]) {
  if ((await count("anon", null, `select * from public.${t}`)) !== 0) throw new Error(`anon reads ${t}`);
  if ((await count("authenticated", CUSTOMER, `select * from public.${t}`)) !== 0) throw new Error(`customer reads ${t}`);
  if ((await count("authenticated", STAFF, `select * from public.${t}`)) !== 1) throw new Error(`staff cannot read ${t}`);
}
ok("deliveries, GPS pings, queries and expenses are staff-only");
const fakePing = await as("anon", null, `insert into public.delivery_pings (order_id, lat, lng) values ('${oid}', 0, 0) returning id`).catch((e) => e);
if (!(fakePing instanceof Error)) throw new Error("anon can forge GPS pings");
ok("nobody can forge GPS pings directly (riders go through the server with a secret link)");
const badLat = await db.query(`insert into public.delivery_pings (order_id, lat, lng) values ('${oid}', 123, 0)`).catch((e) => e);
if (!(badLat instanceof Error)) throw new Error("impossible latitude accepted");
ok("constraints reject impossible coordinates");

await db.exec(`
  insert into public.messages (customer_name, to_phone, channel, body, status) values ('Rudo', '0771111111', 'whatsapp', 'Hi Rudo', 'handed_off');
  insert into public.admin_login_codes (email, code_hash, expires_at) values ('staff@naturo.test', 'abc', now() + interval '10 minutes');
`);
if ((await count("anon", null, "select * from public.messages")) !== 0) throw new Error("anon reads messages");
if ((await count("authenticated", CUSTOMER, "select * from public.messages")) !== 0) throw new Error("customer reads messages");
if ((await count("authenticated", STAFF, "select * from public.messages")) !== 1) throw new Error("staff cannot read messages");
ok("customer messages are staff-only");
for (const [who, uid] of [["anon", null], ["customer", CUSTOMER], ["staff", STAFF]]) {
  const role = who === "anon" ? "anon" : "authenticated";
  if ((await count(role, uid, "select * from public.admin_login_codes")) !== 0) throw new Error(`${who} can read login codes`);
}
ok("sign-in codes are readable by nobody but the server");
const badChannel = await db.query("insert into public.messages (channel, body) values ('fax', 'x')").catch((e) => e);
if (!(badChannel instanceof Error)) throw new Error("unknown message channel accepted");
ok("constraints reject unknown message channels");
console.log("\nAll database checks passed.");
