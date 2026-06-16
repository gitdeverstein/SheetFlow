ALTER TABLE "quotes" ALTER COLUMN "valid_until" TYPE timestamptz USING "valid_until" AT TIME ZONE 'UTC';
