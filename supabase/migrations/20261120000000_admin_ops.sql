-- ═══════════════════════════════════════════════════════════════════════════
--  Naturo Wellness: admin operations
--  Pesepay payments · product costs & profit · live delivery tracking ·
--  customer queries · expenses
--  Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Pesepay as a payment method ─────────────────────────────────────────────
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('cash_on_delivery', 'manual', 'paynow', 'pesepay'));

-- ── Costs (for profit) ──────────────────────────────────────────────────────
-- What one unit costs Naturo to make or buy. Null = not entered yet.
alter table public.product_variants add column if not exists cost_cents integer
  check (cost_cents is null or cost_cents >= 0);

-- Cost snapshot on each order line, so later cost changes don't rewrite history.
alter table public.order_items add column if not exists unit_cost_cents integer;

create or replace function public.snapshot_line_cost()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.unit_cost_cents is null and new.variant_id is not null then
    select cost_cents into new.unit_cost_cents from public.product_variants where id = new.variant_id;
  end if;
  return new;
end $$;

drop trigger if exists order_items_cost_snapshot on public.order_items;
create trigger order_items_cost_snapshot before insert on public.order_items
  for each row execute function public.snapshot_line_cost();

-- ── Deliveries & live tracking ──────────────────────────────────────────────
create table if not exists public.deliveries (
  order_id          uuid primary key references public.orders(id) on delete cascade,
  rider_name        text check (char_length(rider_name) <= 80),
  rider_phone       text check (char_length(rider_phone) <= 20),
  rider_token_hash  text,
  dest_lat          double precision check (dest_lat between -90 and 90),
  dest_lng          double precision check (dest_lng between -180 and 180),
  dest_label        text check (char_length(dest_label) <= 200),
  started_at        timestamptz,
  delivered_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
drop trigger if exists deliveries_updated on public.deliveries;
create trigger deliveries_updated before update on public.deliveries
  for each row execute function public.set_updated_at();

create table if not exists public.delivery_pings (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders(id) on delete cascade,
  lat        double precision not null check (lat between -90 and 90),
  lng        double precision not null check (lng between -180 and 180),
  accuracy_m real,
  heading    real,
  speed_mps  real,
  created_at timestamptz not null default now()
);
create index if not exists delivery_pings_order_idx on public.delivery_pings(order_id, created_at desc);

-- ── Customer queries ────────────────────────────────────────────────────────
create table if not exists public.enquiries (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid references public.orders(id) on delete set null,
  order_number text,
  name         text not null check (char_length(name) between 2 and 100),
  phone        text check (char_length(phone) <= 20),
  email        text check (char_length(email) <= 200),
  topic        text not null default 'general'
               check (topic in ('order', 'wholesale', 'feedback', 'general')),
  message      text not null check (char_length(message) between 2 and 2000),
  status       text not null default 'new' check (status in ('new', 'open', 'resolved')),
  staff_note   text not null default '' check (char_length(staff_note) <= 1000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists enquiries_created_idx on public.enquiries(created_at desc);
drop trigger if exists enquiries_updated on public.enquiries;
create trigger enquiries_updated before update on public.enquiries
  for each row execute function public.set_updated_at();

-- ── Expenses ────────────────────────────────────────────────────────────────
create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  spent_on     date not null default current_date,
  category     text not null check (category in
                 ('ingredients', 'packaging', 'delivery', 'marketing', 'wages', 'rent', 'utilities', 'fees', 'other')),
  description  text not null check (char_length(description) between 1 and 200),
  amount_cents integer not null check (amount_cents > 0),
  currency     text not null default 'USD' check (currency in ('USD', 'ZWG', 'ZAR')),
  created_by   text not null default '',
  created_at   timestamptz not null default now()
);
create index if not exists expenses_spent_idx on public.expenses(spent_on desc);

-- ── Row Level Security: staff only. Riders and the public go through the
--    Next.js server (service role) after token checks. ───────────────────────
alter table public.deliveries     enable row level security;
alter table public.delivery_pings enable row level security;
alter table public.enquiries      enable row level security;
alter table public.expenses       enable row level security;

drop policy if exists deliveries_staff on public.deliveries;
create policy deliveries_staff on public.deliveries for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists pings_staff_read on public.delivery_pings;
create policy pings_staff_read on public.delivery_pings for select using (public.is_staff());

drop policy if exists enquiries_staff on public.enquiries;
create policy enquiries_staff on public.enquiries for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists expenses_staff_read on public.expenses;
create policy expenses_staff_read on public.expenses for select using (public.is_staff());
drop policy if exists expenses_admin_write on public.expenses;
create policy expenses_admin_write on public.expenses for all
  using (public.is_admin()) with check (public.is_admin());

-- ── Messages to customers (email / WhatsApp / SMS), for replies and order updates ──
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  enquiry_id    uuid references public.enquiries(id) on delete set null,
  order_id      uuid references public.orders(id) on delete set null,
  customer_name text not null default '' check (char_length(customer_name) <= 100),
  to_email      text check (char_length(to_email) <= 200),
  to_phone      text check (char_length(to_phone) <= 20),
  channel       text not null check (channel in ('email', 'whatsapp', 'sms')),
  subject       text not null default '' check (char_length(subject) <= 200),
  body          text not null check (char_length(body) between 1 and 4000),
  status        text not null default 'sent' check (status in ('sent', 'handed_off', 'failed')),
  error         text,
  sent_by       text not null default '',
  created_at    timestamptz not null default now()
);
create index if not exists messages_enquiry_idx on public.messages(enquiry_id, created_at);
create index if not exists messages_order_idx on public.messages(order_id, created_at);
create index if not exists messages_phone_idx on public.messages(to_phone);
alter table public.messages enable row level security;
drop policy if exists messages_staff on public.messages;
create policy messages_staff on public.messages for all
  using (public.is_staff()) with check (public.is_staff());

-- ── One-time email codes for admin sign in. Server (service role) only: no policies. ──
create table if not exists public.admin_login_codes (
  id         bigint generated always as identity primary key,
  email      text not null,
  code_hash  text not null,
  attempts   integer not null default 0,
  used       boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists admin_login_codes_email_idx on public.admin_login_codes(email, created_at desc);
alter table public.admin_login_codes enable row level security;
