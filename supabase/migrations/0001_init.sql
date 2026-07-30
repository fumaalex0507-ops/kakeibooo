-- Kakeibo initial schema

create extension if not exists pgcrypto;

-- Categories: lookup table (not enum) so adding a category later is a plain INSERT
create table categories (
  id text primary key,
  name text not null,
  sort_order int not null
);

insert into categories (id, name, sort_order) values
  ('food',          '食費',     1),
  ('daily_goods',   '日用品',   2),
  ('rent',          '家賃',     3),
  ('electricity',   '電気代',   4),
  ('water',         '水道代',   5),
  ('gas',           'ガス代',   6),
  ('gasoline',      'ガソリン', 7),
  ('social',        '交際費',   8),
  ('investment',    '投資',     9),
  ('subscription',  'サブスク', 10),
  ('entertainment', '娯楽',     11),
  ('other',         'その他',   12);

-- Fixed cost master (recurring templates: rent, recurring investment, etc.)
create table fixed_costs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id text not null references categories(id),
  payer_id text not null check (payer_id in ('風馬','ちか子')),
  total_amount integer not null check (total_amount >= 0),
  own_share integer not null default 0 check (own_share >= 0),
  other_share integer not null default 0 check (other_share >= 0),
  day_of_month integer not null check (day_of_month between 1 and 28),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint fixed_costs_split_nonnegative check (total_amount - own_share - other_share >= 0)
);

-- Transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  year_month text generated always as (to_char(date, 'YYYY-MM')) stored,
  payer_id text not null check (payer_id in ('風馬','ちか子')),
  category_id text not null references categories(id),
  total_amount integer not null check (total_amount >= 0),
  own_share integer not null default 0 check (own_share >= 0),
  other_share integer not null default 0 check (other_share >= 0),
  split_amount integer generated always as (total_amount - own_share - other_share) stored,
  fixed_cost_id uuid references fixed_costs(id),
  created_at timestamptz not null default now(),
  constraint transactions_split_nonnegative check (total_amount - own_share - other_share >= 0)
);

create index idx_transactions_year_month on transactions(year_month);
create index idx_transactions_category_id on transactions(category_id);
create index idx_transactions_payer_id on transactions(payer_id);

-- Idempotency guard for fixed-cost auto-generation: one auto-row per fixed_cost per month
create unique index uq_transactions_fixed_cost_month
  on transactions(fixed_cost_id, year_month)
  where fixed_cost_id is not null;

-- Budgets: one recurring monthly amount per category (no per-month history — see plan rationale)
create table budgets (
  category_id text primary key references categories(id),
  monthly_amount integer not null check (monthly_amount >= 0),
  updated_at timestamptz not null default now()
);

-- Aggregation view used by /expenses and /settlement to avoid summing raw rows client-side
create view v_monthly_totals as
select
  year_month,
  payer_id,
  category_id,
  sum(total_amount) as total_amount,
  sum(own_share)     as own_share,
  sum(other_share)   as other_share,
  sum(split_amount)  as split_amount,
  count(*)           as tx_count
from transactions
group by year_month, payer_id, category_id;

-- Fixed-cost auto-generation, idempotent via uq_transactions_fixed_cost_month
create or replace function generate_fixed_cost_transactions(p_year_month text)
returns integer
language plpgsql
as $$
declare
  v_month_start date := to_date(p_year_month || '-01', 'YYYY-MM-DD');
  v_last_day int := extract(day from (v_month_start + interval '1 month - 1 day'))::int;
  v_inserted int;
begin
  insert into transactions (date, payer_id, category_id, total_amount, own_share, other_share, fixed_cost_id)
  select
    make_date(
      extract(year from v_month_start)::int,
      extract(month from v_month_start)::int,
      least(fc.day_of_month, v_last_day)
    ),
    fc.payer_id,
    fc.category_id,
    fc.total_amount,
    fc.own_share,
    fc.other_share,
    fc.id
  from fixed_costs fc
  where fc.active = true
  on conflict (fixed_cost_id, year_month) where fixed_cost_id is not null do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

-- RLS: enabled but fully permissive — this app has no authentication at all.
-- SECURITY NOTE: the anon key is embedded in the client bundle by design, so anyone
-- who obtains the Supabase URL + anon key can read/write all rows. Acceptable for a
-- private 2-person household app with no sensitive account data. If stronger privacy
-- is wanted later, consider Vercel Deployment Protection or a middleware.ts Basic Auth
-- gate in front of the whole app instead of building real per-user auth.
alter table categories   enable row level security;
alter table fixed_costs  enable row level security;
alter table transactions enable row level security;
alter table budgets      enable row level security;

create policy "public all" on categories   for all using (true) with check (true);
create policy "public all" on fixed_costs  for all using (true) with check (true);
create policy "public all" on transactions for all using (true) with check (true);
create policy "public all" on budgets      for all using (true) with check (true);
