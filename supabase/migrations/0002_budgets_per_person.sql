-- Budgets become per-person: (category_id, payer_id) instead of just category_id.
-- Only test data existed in this table so far, so it's simplest to recreate it.
drop table if exists budgets;

create table budgets (
  category_id text not null references categories(id),
  payer_id text not null check (payer_id in ('風馬','ちか子')),
  monthly_amount integer not null check (monthly_amount >= 0),
  updated_at timestamptz not null default now(),
  primary key (category_id, payer_id)
);

alter table budgets enable row level security;
create policy "public all" on budgets for all using (true) with check (true);
