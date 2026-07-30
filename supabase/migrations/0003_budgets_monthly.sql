-- Budgets become month-specific: (category_id, payer_id, year_month).
-- Carry-forward from the most recent prior month (when no row exists for
-- the exact target month) is handled in application code at read time,
-- not stored redundantly here. Table was empty, so just recreate it.
drop table if exists budgets;

create table budgets (
  category_id text not null references categories(id),
  payer_id text not null check (payer_id in ('風馬','ちか子')),
  year_month text not null,
  monthly_amount integer not null check (monthly_amount >= 0),
  updated_at timestamptz not null default now(),
  primary key (category_id, payer_id, year_month)
);

create index idx_budgets_payer_year_month on budgets(payer_id, year_month);

alter table budgets enable row level security;
create policy "public all" on budgets for all using (true) with check (true);
