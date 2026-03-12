-- RPC to approve attendance corrections and sync with presences table
CREATE OR REPLACE FUNCTION approve_attendance_correction(
    p_correction_id UUID,
    p_admin_id UUID,
    p_final_in TIME,
    p_final_out TIME
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_emp_id UUID;
    v_date DATE;
    v_entreprise_id UUID;
    v_msg TEXT;
    v_hours NUMERIC;
    v_overtime NUMERIC := 0;
BEGIN
    -- 1. Get correction details
    SELECT employee_id, correction_date, entreprise_id 
    INTO v_emp_id, v_date, v_entreprise_id
    FROM public.attendance_corrections
    WHERE id = p_correction_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Correction request not found or already processed.');
    END IF;

    -- 2. Update correction status
    UPDATE public.attendance_corrections
    SET 
        status = 'approved',
        manager_id = p_admin_id,
        suggested_check_in = p_final_in,
        suggested_check_out = p_final_out,
        updated_at = NOW()
    WHERE id = p_correction_id;

    -- 3. Calculate hours and overtime
    IF p_final_in IS NOT NULL AND p_final_out IS NOT NULL THEN
        v_hours := ROUND((EXTRACT(EPOCH FROM (p_final_out - p_final_in))/3600)::numeric, 2);
        IF v_hours > 8 THEN
            v_overtime := v_hours - 8;
        ELSE
            v_overtime := 0;
        END IF;
    ELSE
        v_hours := NULL;
        v_overtime := 0;
    END IF;

    -- 4. Sync with presences table
    -- Check if a record exists for that date
    IF EXISTS (SELECT 1 FROM public.presences WHERE employee_id = v_emp_id AND date = v_date) THEN
        UPDATE public.presences
        SET 
            check_in_time = p_final_in,
            check_out_time = p_final_out,
            hours_worked = v_hours,
            overtime_hours = v_overtime,
            status = CASE 
                WHEN p_final_in IS NOT NULL AND p_final_in <= '09:15:00'::TIME THEN 'present'
                WHEN p_final_in IS NOT NULL THEN 'late'
                ELSE status
            END,
            updated_at = NOW()
        WHERE employee_id = v_emp_id AND date = v_date;
        v_msg := 'Attendance record updated and approved.';
    ELSE
        INSERT INTO public.presences (
            employee_id, 
            entreprise_id, 
            date, 
            check_in_time, 
            check_out_time, 
            hours_worked,
            overtime_hours,
            status,
            created_at,
            updated_at
        )
        VALUES (
            v_emp_id, 
            v_entreprise_id, 
            v_date, 
            p_final_in, 
            p_final_out, 
            v_hours,
            v_overtime,
            CASE 
                WHEN p_final_in IS NOT NULL AND p_final_in <= '09:15:00'::TIME THEN 'present'
                WHEN p_final_in IS NOT NULL THEN 'late'
                ELSE 'present'
            END,
            NOW(),
            NOW()
        );
        v_msg := 'New attendance record created and approved.';
    END IF;

    RETURN jsonb_build_object('success', true, 'message', v_msg);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
