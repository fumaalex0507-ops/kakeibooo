-- 水道代 doesn't come every month — lets a month be marked "skipped" (no
-- bill expected) instead of sitting at 未 forever.
alter table settlement_status add column water_skipped boolean not null default false;
