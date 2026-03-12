-- Migration to automatically calculate overtime hours
-- Date: 2026-03-09

-- 1. Create function to sync overtime_hours
CREATE OR REPLACE FUNCTION public.sync_overtime_hours()
RETURNS TRIGGER AS $$
BEGIN
    -- Only calculate if check_out_time exists and we can calculate hours
    IF NEW.hours_worked IS NOT NULL THEN
        -- Overtime = Hours Worked - 8 (standard daily hours)
        NEW.overtime_hours := GREATEST(0, NEW.hours_worked - 8);
    ELSE
        NEW.overtime_hours := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger to update overtime_hours automatically
DROP TRIGGER IF EXISTS trg_presences_overtime ON public.presences;
CREATE TRIGGER trg_presences_overtime
    BEFORE INSERT OR UPDATE OF hours_worked ON public.presences
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_overtime_hours();

-- 3. Backfill existing data
UPDATE public.presences
SET overtime_hours = GREATEST(0, hours_worked - 8)
WHERE hours_worked IS NOT NULL;
