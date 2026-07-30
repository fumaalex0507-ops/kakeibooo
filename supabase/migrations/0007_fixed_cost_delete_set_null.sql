-- Deleting a fixed cost was silently rejected whenever it already had
-- generated transactions, because fixed_cost_id had no ON DELETE behavior
-- (defaults to NO ACTION/RESTRICT). Switch to SET NULL so past transactions
-- keep their history while the fixed cost itself can be deleted.
alter table transactions drop constraint transactions_fixed_cost_id_fkey;
alter table transactions
  add constraint transactions_fixed_cost_id_fkey
  foreign key (fixed_cost_id) references fixed_costs(id) on delete set null;
