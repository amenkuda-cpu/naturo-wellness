-- ════════════════════════════════════════════════════════════════════════
--  Naturo Wellness: initial schema
--  Apply with:  supabase db push   (or paste into the Supabase SQL editor)
-- ════════════════════════════════════════════════════════════════════════

-- gen_random_uuid() is built into PostgreSQL 13+; no extension required.

-- ── Helpers ─────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ── Staff & customers ───────────────────────────────────────────────────

create table public.staff_members (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_members where user_id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_members where user_id = auth.uid() and role = 'admin');
$$;

create table public.customers (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text check (char_length(full_name) <= 100),
  phone      text check (char_length(phone) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger customers_updated before update on public.customers
  for each row execute function public.set_updated_at();

-- ── Catalogue ───────────────────────────────────────────────────────────

create table public.categories (
  id          text primary key check (id ~ '^[a-z0-9-]+$'),
  name        text not null,
  description text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.products (
  id                text primary key check (id ~ '^[a-z0-9-]+$'),
  slug              text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name              text not null check (char_length(name) between 1 and 160),
  category_id       text not null references public.categories(id) on update cascade,
  short_description text not null default '',
  full_description  text[] not null default '{}',
  images            jsonb not null default '[]'::jsonb,
  ingredients       text[],            -- null until verified from the approved label
  preparation       text,
  storage           text,
  allergens         text,
  nutrition         jsonb,             -- null until verified
  verified_benefits text[] not null default '{}',
  tags              text[] not null default '{}',
  featured          boolean not null default false,
  enabled_for_sale  boolean not null default false,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create trigger products_updated before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_variants (
  id               text primary key,
  product_id       text not null references public.products(id) on delete cascade,
  sku              text unique,
  label            text not null default 'Single',
  size             text,
  price_cents      integer check (price_cents is null or price_cents > 0),
  compare_at_cents integer check (compare_at_cents is null or compare_at_cents > 0),
  currency         text not null default 'USD' check (currency in ('USD', 'ZWG', 'ZAR')),
  stock_status     text not null default 'unknown'
                   check (stock_status in ('in_stock', 'low_stock', 'out_of_stock', 'unknown')),
  stock_quantity   integer check (stock_quantity is null or stock_quantity >= 0),
  active           boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index product_variants_product_idx on public.product_variants(product_id);
create trigger product_variants_updated before update on public.product_variants
  for each row execute function public.set_updated_at();

-- ── Fulfilment, promotions, settings ────────────────────────────────────

create table public.delivery_zones (
  id          text primary key check (id ~ '^[a-z0-9-]+$'),
  name        text not null,
  description text not null default '',
  fee_cents   integer check (fee_cents is null or fee_cents >= 0),
  active      boolean not null default true,
  sort_order  integer not null default 0
);

create table public.promotions (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique check (code = upper(code) and char_length(code) between 3 and 32),
  kind               text not null check (kind in ('percent', 'fixed')),
  value              integer not null check (value > 0),
  min_subtotal_cents integer check (min_subtotal_cents is null or min_subtotal_cents >= 0),
  active             boolean not null default true,
  starts_at          timestamptz,
  ends_at            timestamptz,
  usage_limit        integer check (usage_limit is null or usage_limit > 0),
  usage_count        integer not null default 0 check (usage_count >= 0),
  created_at         timestamptz not null default now(),
  check (kind <> 'percent' or value <= 100)
);

create table public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── Orders ──────────────────────────────────────────────────────────────

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique,
  customer_id        uuid references auth.users(id) on delete set null,
  status             text not null default 'pending' check (status in
                       ('pending','confirmed','preparing','ready_for_collection','out_for_delivery','completed','cancelled')),
  payment_status     text not null default 'unpaid' check (payment_status in
                       ('unpaid','pending','paid','failed','refunded','cancelled')),
  payment_method     text not null check (payment_method in ('cash_on_delivery','manual','paynow')),
  payment_reference  text,
  currency           text not null check (currency in ('USD', 'ZWG', 'ZAR')),
  customer_name      text not null check (char_length(customer_name) between 2 and 100),
  customer_phone     text not null check (char_length(customer_phone) between 9 and 20),
  customer_email     text,
  fulfilment_method  text not null check (fulfilment_method in ('delivery', 'collection')),
  delivery_zone_id   text references public.delivery_zones(id) on delete set null,
  delivery_zone_name text,
  delivery_address   jsonb,
  subtotal_cents     integer not null check (subtotal_cents >= 0),
  discount_cents     integer not null default 0 check (discount_cents >= 0),
  delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  tax_cents          integer not null default 0 check (tax_cents >= 0),
  total_cents        integer not null check (total_cents >= 0),
  promo_code         text,
  notes              text not null default '' check (char_length(notes) <= 500),
  access_token_hash  text not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (fulfilment_method <> 'delivery' or delivery_address is not null)
);
create index orders_customer_idx on public.orders(customer_id);
create index orders_status_idx on public.orders(status);
create index orders_created_idx on public.orders(created_at desc);
create trigger orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id               bigint generated always as identity primary key,
  order_id         uuid not null references public.orders(id) on delete cascade,
  product_id       text references public.products(id) on delete set null,
  variant_id       text references public.product_variants(id) on delete set null,
  product_name     text not null,
  variant_label    text not null,
  unit_price_cents integer not null check (unit_price_cents > 0),
  quantity         integer not null check (quantity between 1 and 999),
  line_total_cents integer not null,
  check (line_total_cents = unit_price_cents * quantity)
);
create index order_items_order_idx on public.order_items(order_id);

create table public.order_events (
  id             bigint generated always as identity primary key,
  order_id       uuid not null references public.orders(id) on delete cascade,
  status         text,
  payment_status text,
  note           text not null default '',
  actor          text not null,
  created_at     timestamptz not null default now()
);
create index order_events_order_idx on public.order_events(order_id);

create table public.payments (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders(id) on delete cascade,
  provider           text not null,
  status             text not null,
  amount_cents       integer,
  provider_reference text,
  poll_url           text,
  raw                jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index payments_order_idx on public.payments(order_id);
create trigger payments_updated before update on public.payments
  for each row execute function public.set_updated_at();

create table public.inventory_movements (
  id         bigint generated always as identity primary key,
  variant_id text not null references public.product_variants(id) on delete cascade,
  order_id   uuid references public.orders(id) on delete set null,
  change     integer not null check (change <> 0),
  reason     text not null check (reason in ('order', 'restock', 'adjustment', 'cancellation')),
  note       text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index inventory_movements_variant_idx on public.inventory_movements(variant_id);

-- ════════════════════════════════════════════════════════════════════════
--  Row Level Security
--  The storefront server uses the service-role key (bypasses RLS) for order
--  creation & guest order lookups. Browsers only ever hold the anon key.
-- ════════════════════════════════════════════════════════════════════════

alter table public.staff_members       enable row level security;
alter table public.customers           enable row level security;
alter table public.categories          enable row level security;
alter table public.products            enable row level security;
alter table public.product_variants    enable row level security;
alter table public.delivery_zones      enable row level security;
alter table public.promotions          enable row level security;
alter table public.site_settings       enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.order_events        enable row level security;
alter table public.payments            enable row level security;
alter table public.inventory_movements enable row level security;

-- Staff membership: users may see their own row; only admins manage roles.
create policy staff_self_read on public.staff_members for select
  using (user_id = auth.uid() or public.is_admin());
create policy staff_admin_write on public.staff_members for all
  using (public.is_admin()) with check (public.is_admin());

-- Customers: own profile only (staff may read).
create policy customers_own_read on public.customers for select
  using (id = auth.uid() or public.is_staff());
create policy customers_own_insert on public.customers for insert
  with check (id = auth.uid());
create policy customers_own_update on public.customers for update
  using (id = auth.uid()) with check (id = auth.uid());

-- Public catalogue reads; staff edit; admins create/delete.
create policy categories_read on public.categories for select using (true);
create policy categories_admin on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

create policy products_read on public.products for select using (true);
create policy products_staff_update on public.products for update
  using (public.is_staff()) with check (public.is_staff());
create policy products_admin_insert on public.products for insert with check (public.is_admin());
create policy products_admin_delete on public.products for delete using (public.is_admin());

create policy variants_read on public.product_variants for select using (true);
create policy variants_staff_update on public.product_variants for update
  using (public.is_staff()) with check (public.is_staff());
create policy variants_admin_insert on public.product_variants for insert with check (public.is_admin());
create policy variants_admin_delete on public.product_variants for delete using (public.is_admin());

create policy zones_read on public.delivery_zones for select using (active or public.is_staff());
create policy zones_admin on public.delivery_zones for all
  using (public.is_admin()) with check (public.is_admin());

-- Promotion codes are looked up server-side only; never listable publicly.
create policy promotions_staff_read on public.promotions for select using (public.is_staff());
create policy promotions_admin on public.promotions for all
  using (public.is_admin()) with check (public.is_admin());

create policy settings_read on public.site_settings for select using (true);
create policy settings_admin on public.site_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- Orders: customers see their own; staff see & update all. No client inserts.
create policy orders_read on public.orders for select
  using ((customer_id is not null and customer_id = auth.uid()) or public.is_staff());
create policy orders_staff_update on public.orders for update
  using (public.is_staff()) with check (public.is_staff());

create policy order_items_read on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and ((o.customer_id is not null and o.customer_id = auth.uid()) or public.is_staff())
  ));

create policy order_events_read on public.order_events for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and ((o.customer_id is not null and o.customer_id = auth.uid()) or public.is_staff())
  ));
create policy order_events_staff_insert on public.order_events for insert with check (public.is_staff());

create policy payments_staff_read on public.payments for select using (public.is_staff());

create policy inventory_staff_read on public.inventory_movements for select using (public.is_staff());
create policy inventory_staff_insert on public.inventory_movements for insert with check (public.is_staff());

-- ════════════════════════════════════════════════════════════════════════
--  place_order: atomic order creation with stock reservation.
--  Callable ONLY by the service role (the Next.js server), after the server
--  has validated input and computed authoritative totals.
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.place_order(p_order jsonb, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_item     jsonb;
  v_qty      integer;
  v_stock    integer;
  v_updated  integer;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'empty_order' using errcode = 'P0001';
  end if;

  -- Lock & check every tracked variant first.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    select stock_quantity into v_stock
      from public.product_variants
      where id = v_item->>'variant_id' and active
      for update;
    if not found then
      raise exception 'variant_unavailable:%', v_item->>'variant_id' using errcode = 'P0001';
    end if;
    if v_stock is not null and v_stock < v_qty then
      raise exception 'insufficient_stock:%', v_item->>'variant_id' using errcode = 'P0001';
    end if;
  end loop;

  insert into public.orders (
    order_number, customer_id, status, payment_status, payment_method, currency,
    customer_name, customer_phone, customer_email,
    fulfilment_method, delivery_zone_id, delivery_zone_name, delivery_address,
    subtotal_cents, discount_cents, delivery_fee_cents, tax_cents, total_cents,
    promo_code, notes, access_token_hash
  ) values (
    p_order->>'order_number',
    nullif(p_order->>'customer_id', '')::uuid,
    p_order->>'status',
    p_order->>'payment_status',
    p_order->>'payment_method',
    p_order->>'currency',
    p_order->>'customer_name',
    p_order->>'customer_phone',
    nullif(p_order->>'customer_email', ''),
    p_order->>'fulfilment_method',
    nullif(p_order->>'delivery_zone_id', ''),
    nullif(p_order->>'delivery_zone_name', ''),
    case when p_order ? 'delivery_address' and p_order->'delivery_address' <> 'null'::jsonb
         then p_order->'delivery_address' else null end,
    (p_order->>'subtotal_cents')::integer,
    (p_order->>'discount_cents')::integer,
    (p_order->>'delivery_fee_cents')::integer,
    (p_order->>'tax_cents')::integer,
    (p_order->>'total_cents')::integer,
    nullif(p_order->>'promo_code', ''),
    coalesce(p_order->>'notes', ''),
    p_order->>'access_token_hash'
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    insert into public.order_items (
      order_id, product_id, variant_id, product_name, variant_label,
      unit_price_cents, quantity, line_total_cents
    ) values (
      v_order_id, v_item->>'product_id', v_item->>'variant_id', v_item->>'product_name',
      v_item->>'variant_label', (v_item->>'unit_price_cents')::integer, v_qty,
      (v_item->>'unit_price_cents')::integer * v_qty
    );

    update public.product_variants
      set stock_quantity = stock_quantity - v_qty,
          stock_status = case when stock_quantity - v_qty = 0 then 'out_of_stock' else stock_status end
      where id = v_item->>'variant_id' and stock_quantity is not null;
    get diagnostics v_updated = row_count;
    if v_updated > 0 then
      insert into public.inventory_movements (variant_id, order_id, change, reason)
      values (v_item->>'variant_id', v_order_id, -v_qty, 'order');
    end if;
  end loop;

  if nullif(p_order->>'promo_code', '') is not null then
    update public.promotions
      set usage_count = usage_count + 1
      where code = p_order->>'promo_code'
        and (usage_limit is null or usage_count < usage_limit);
    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      raise exception 'promotion_unavailable' using errcode = 'P0001';
    end if;
  end if;

  insert into public.order_events (order_id, status, payment_status, note, actor)
  values (v_order_id, p_order->>'status', p_order->>'payment_status', 'Order placed', 'customer');

  return v_order_id;
end $$;

revoke all on function public.place_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb, jsonb) to service_role;
