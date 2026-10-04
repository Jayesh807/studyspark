-- Drops the notification tables (push subscriptions, push reminders, festival holidays).
-- DESTRUCTIVE: all rows in these tables are permanently deleted.
--
-- Before running:
--   1. Back up the three tables, e.g.:
--        pg_dump "$DATABASE_URL" -t '"PushSubscription"' -t '"PushReminder"' -t '"FestivalHoliday"' -f notification-backup.sql
--   2. Deploy the code change first, so nothing still reads or writes these tables.
--
-- Run manually against the production database:
--        psql "$DATABASE_URL" -f prisma/sql/drop-notification-tables.sql

BEGIN;

-- PushReminder references PushSubscription, so it is dropped first.
DROP TABLE IF EXISTS "PushReminder";
DROP TABLE IF EXISTS "PushSubscription";
DROP TABLE IF EXISTS "FestivalHoliday";

COMMIT;
