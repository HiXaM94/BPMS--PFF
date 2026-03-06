-- Migration: Add suggested time columns and approval function for attendance corrections

-- 1. Add suggested time columns to attendance_corrections
ALTER TABLE public.attendance_corrections 
ADD COLUMN IF NOT EXISTS suggested_check_in TIME,
ADD COLUMN IF NOT EXISTS suggested_check_out TIME,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- 2. Create the approval function
CREATE OR REPLACE FUNCTION public.approve_attendance_correction(
    p_correction_id UUID,
    p_admin_id UUID,
    p_final_in TIME,
    p_final_out TIME
) RETURNS jsonb AS $$
DECLARE
    v_correction public.attendance_corrections%ROWTYPE;
    v_hours NUMERIC;
    v_overtime NUMERIC := 0;
    v_status TEXT;
    v_late_threshold TIME := '09:15:00'::TIME;
BEGIN
    -- 1. Fetch correction request
    SELECT * INTO v_correction FROM public.attendance_corrections WHERE id = p_correction_id;
    
    IF v_correction IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Correction request not found.');
    END IF;

    IF v_correction.status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'message', 'This request has already been processed.');
    END IF;

    -- 2. Calculate Hours and Overtime (Threshold: 8 hours)
    IF p_final_in IS NOT NULL AND p_final_out IS NOT NULL THEN
        v_hours := EXTRACT(EPOCH FROM (p_final_out - p_final_in))/3600;
        IF v_hours < 0 THEN v_hours := v_hours + 24; END IF; -- Handle overnight if necessary (unlikely for office)
        
        IF v_hours > 8 THEN
            v_overtime := v_hours - 8;
        END IF;
    END IF;

    -- 3. Determine status (Late vs Present)
    IF p_final_in > v_late_threshold THEN
        v_status := 'late';
    ELSE
        v_status := 'present';
    END IF;

    -- 4. Upsert into presences table
    INSERT INTO public.presences (
        employee_id, 
        entreprise_id, 
        date, 
        check_in_time, 
        check_out_time, 
        hours_worked, 
        overtime_hours, 
        status
    )
    VALUES (
        v_correction.employee_id, 
        v_correction.entreprise_id, 
        v_correction.correction_date, 
        p_final_in, 
        p_final_out, 
        v_hours, 
        v_overtime, 
        v_status
    )
    ON CONFLICT (employee_id, date) DO UPDATE SET
        check_in_time = EXCLUDED.check_in_time,
        check_out_time = EXCLUDED.check_out_time,
        hours_worked = EXCLUDED.hours_worked,
        overtime_hours = EXCLUDED.overtime_hours,
        status = EXCLUDED.status,
        updated_at = NOW();

    -- 5. Update correction request status
    UPDATE public.attendance_corrections SET
        status = 'approved',
        manager_id = p_admin_id,
        suggested_check_in = p_final_in,
        suggested_check_out = p_final_out,
        processed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_correction_id;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Attendance correction approved and synchronized successfully!',
        'hours', ROUND(v_hours::numeric, 2),
        'overtime', ROUND(v_overtime::numeric, 2)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
