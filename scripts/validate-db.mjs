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
await db.exec(readFileSync(path.join(root, "supabase/seed.sql"), "utf8"));
const { rows: [{ n }] } = await db.query("select count(*)::int n from public.products");
ok(`seed applied (${n} products)`);

await db.exec(`
  grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
  grant usage, select on all sequences in schema public to anon, authenticated, service_role;
  update public.product_variants set price_cents = 250, stock_quantity = 3 where id = 'ginger-shot-standard';
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
console.log("\nAll database checks passed.");
