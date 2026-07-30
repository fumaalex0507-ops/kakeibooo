-- Tracks whether a given month's settlement (the 風馬<->ちか子 transfer) has
-- actually been done, independent of the computed settlement amount itself.
create table settlement_status (
  year_month text primary key,
  completed boolean not null default false,
  completed_at timestamptz
);

alter table settlement_status enable row level security;
create policy "public all" on settlement_status for all using (true) with check (true);
