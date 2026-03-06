-- 1. Create the daily_qr_codes table
CREATE TABLE IF NOT EXISTS public.daily_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    secret_token TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT daily_qr_codes_entreprise_date_key UNIQUE (entreprise_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_qr_codes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read their company's QR codes"
ON public.daily_qr_codes FOR SELECT
USING (entreprise_id IN (
    SELECT entreprise_id FROM public.users WHERE id = auth.uid()
));

CREATE POLICY "System and Admins can insert QR codes"
ON public.daily_qr_codes FOR INSERT
WITH CHECK (true); -- Allow the cron job to insert

-- 2. Create the function to automatically generate QR codes daily
CREATE OR REPLACE FUNCTION public.generate_daily_qr_codes()
RETURNS void AS $$
DECLARE
    company public.entreprises%ROWTYPE;
    today_date DATE := CURRENT_DATE;
    new_token TEXT;
BEGIN
    FOR company IN SELECT * FROM public.entreprises LOOP
        new_token := 'QR-' || REPLACE(today_date::TEXT, '-', '') || '-' || encode(gen_random_bytes(8), 'hex');
        
        INSERT INTO public.daily_qr_codes(entreprise_id, date, secret_token, expires_at)
        VALUES (
            company.id, 
            today_date, 
            new_token, 
            (today_date + INTERVAL '1 day' + INTERVAL '6 hours') -- Expires next day at 6 AM
        )
        ON CONFLICT (entreprise_id, date) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Schedule the cron job (Requires pg_cron extension)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'generate-daily-qrs',
      '0 6 * * *', -- Every day at 6:00 AM
      'SELECT public.generate_daily_qr_codes();'
    );
  END IF;
END $$;

-- 4. Create the function to safely clock in or out
CREATE OR REPLACE FUNCTION public.clock_in_out(
    p_entreprise_id UUID,
    p_scanned_token TEXT,
    p_user_id UUID
) RETURNS jsonb AS $$
DECLARE
    v_qr_code public.daily_qr_codes%ROWTYPE;
    v_employee_id UUID;
    v_presence public.presences%ROWTYPE;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_current_time TIME := v_now::TIME;
    v_status TEXT;
    v_late_threshold TIME := '09:15:00'::TIME;
BEGIN
    -- 1. Validate the QR token
    SELECT * INTO v_qr_code 
    FROM public.daily_qr_codes 
    WHERE secret_token = p_scanned_token 
    AND entreprise_id = p_entreprise_id 
    AND date = CURRENT_DATE 
    AND is_active = true;

    IF v_qr_code IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid or expired QR code.');
    END IF;

    -- 2. Get Employee ID
    SELECT id INTO v_employee_id FROM public.employees WHERE user_id = p_user_id;

    IF v_employee_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Employee record not found.');
    END IF;

    -- 3. Check for existing presence today
    SELECT * INTO v_presence FROM public.presences WHERE employee_id = v_employee_id AND date = CURRENT_DATE;

    IF v_presence IS NULL THEN
        -- CLOCK IN
        IF v_current_time > v_late_threshold THEN
            v_status := 'late';
        ELSE
            v_status := 'present';
        END IF;

        INSERT INTO public.presences (employee_id, date, check_in_time, status)
        VALUES (v_employee_id, CURRENT_DATE, v_current_time, v_status);
        
        RETURN jsonb_build_object(
            'success', true, 
            'action', 'clock_in', 
            'time', v_current_time, 
            'status', v_status,
            'message', 'Clocked in successfully!'
        );
    ELSE
        -- CLOCK OUT
        IF v_presence.check_out_time IS NOT NULL THEN
            RETURN jsonb_build_object('success', false, 'message', 'Already clocked out for today.');
        END IF;

        UPDATE public.presences 
        SET check_out_time = v_current_time,
            hours_worked = EXTRACT(EPOCH FROM (v_current_time - v_presence.check_in_time))/3600
        WHERE id = v_presence.id;

        RETURN jsonb_build_object(
            'success', true, 
            'action', 'clock_out', 
            'time', v_current_time, 
            'message', 'Clocked out successfully!'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
