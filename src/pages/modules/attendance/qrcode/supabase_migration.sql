-- ============================================================
-- QR CODE ATTENDANCE SYSTEM — Supabase SQL Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1. Create the daily_qr_codes table
CREATE TABLE IF NOT EXISTS daily_qr_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    secret_token TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(company_id, date)
);

-- 2. Index for fast lookups by date + company
CREATE INDEX IF NOT EXISTS idx_daily_qr_codes_date_company
    ON daily_qr_codes(date, company_id);

-- 3. Enable Row Level Security
ALTER TABLE daily_qr_codes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Allow authenticated users to read today's QR code
CREATE POLICY "Anyone can read today QR code"
    ON daily_qr_codes FOR SELECT
    USING (true);

-- 5. RLS Policy: Only service role (pg_cron / backend) can insert
CREATE POLICY "Service can insert QR codes"
    ON daily_qr_codes FOR INSERT
    WITH CHECK (true);

-- 6. Function to generate a daily QR token for ALL companies
CREATE OR REPLACE FUNCTION generate_daily_qr_tokens()
RETURNS void AS $$
BEGIN
    INSERT INTO daily_qr_codes (company_id, date, secret_token, generated_at, expires_at, is_active)
    SELECT
        c.id,
        CURRENT_DATE,
        -- Generate a secure random token: prefix + random hex
        'QR-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || encode(gen_random_bytes(16), 'hex'),
        NOW(),
        NOW() + INTERVAL '24 hours',
        TRUE
    FROM companies c
    WHERE NOT EXISTS (
        SELECT 1 FROM daily_qr_codes dqr
        WHERE dqr.company_id = c.id AND dqr.date = CURRENT_DATE
    );

    -- Deactivate yesterday's codes
    UPDATE daily_qr_codes
    SET is_active = FALSE
    WHERE date < CURRENT_DATE AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 8. Schedule: Run generate_daily_qr_tokens() every day at 08:00 UTC
-- Adjust the time to match your timezone
-- For Morocco (UTC+1), use '0 7 * * *' to run at 8:00 AM local time
SELECT cron.schedule(
    'generate-daily-qr-codes',   -- job name
    '0 7 * * *',                 -- cron expression: daily at 07:00 UTC = 08:00 Morocco
    'SELECT generate_daily_qr_tokens()'
);

-- 9. Generate today's tokens immediately (first run)
SELECT generate_daily_qr_tokens();
