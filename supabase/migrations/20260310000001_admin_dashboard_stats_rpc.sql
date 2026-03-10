CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats(p_entreprise_id UUID, p_chart_days INT DEFAULT 14)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    v_total_users INT;
    v_new_users_week INT;
    v_total_employees INT;
    v_on_leave_today INT;
    v_leave_load_pct NUMERIC;
    v_leave_status_label TEXT;
BEGIN
    -- Basic counts
    SELECT count(id) INTO v_total_users FROM public.users WHERE entreprise_id = p_entreprise_id;
    SELECT count(id) INTO v_new_users_week FROM public.users 
    WHERE entreprise_id = p_entreprise_id AND created_at >= NOW() - interval '7 days';
    
    SELECT count(u.id) INTO v_total_employees 
    FROM public.users u 
    WHERE u.entreprise_id = p_entreprise_id AND u.role = 'EMPLOYEE'::user_role;

    -- Global Leave Load calculation
    SELECT count(v.id) INTO v_on_leave_today
    FROM public.vacances v
    JOIN public.employees e ON e.id = v.employee_id
    WHERE e.entreprise_id = p_entreprise_id 
    AND v.status = 'approved'::leave_status
    AND CURRENT_DATE BETWEEN v.start_date AND v.end_date;

    v_leave_load_pct := CASE WHEN v_total_employees > 0 THEN (v_on_leave_today * 100.0 / v_total_employees) ELSE 0 END;
    
    v_leave_status_label := CASE 
        WHEN v_leave_load_pct > 30 THEN 'High Load'
        WHEN v_leave_load_pct > 15 THEN 'Moderate Load'
        ELSE 'Normal Load'
    END;

    SELECT jsonb_build_object(
        'total_users', v_total_users,
        'user_trend_pct', ROUND(CASE WHEN v_total_users > 0 THEN (v_new_users_week * 100.0 / v_total_users) ELSE 0 END, 1),
        'total_employees', v_total_employees,
        'attendance_today', (
            SELECT count(p.id) 
            FROM public.presences p
            JOIN public.employees e ON e.id = p.employee_id
            WHERE e.entreprise_id = p_entreprise_id AND p.date = CURRENT_DATE
        ),
        'pending_documents', (
            SELECT count(d.id) 
            FROM public.documents d 
            WHERE d.entreprise_id = p_entreprise_id AND d.status IN ('pending'::document_status, 'submitted'::document_status)
        ),
        'leave_pending', (
            SELECT count(v.id) 
            FROM public.vacances v
            JOIN public.employees e ON e.id = v.employee_id
            WHERE e.entreprise_id = p_entreprise_id AND v.status = 'pending'::leave_status
        ),
        'leave_approved', (
            SELECT count(v.id) 
            FROM public.vacances v
            JOIN public.employees e ON e.id = v.employee_id
            WHERE e.entreprise_id = p_entreprise_id AND v.status = 'approved'::leave_status
        ),
        'leave_status_label', v_leave_status_label,
        'chart_data', (
            -- Dynamic attendance activity chart
            SELECT jsonb_agg(day_stats)
            FROM (
                SELECT 
                    to_char(d, CASE WHEN p_chart_days <= 1 THEN 'HH24:00' ELSE 'DD Mon' END) as label,
                    (
                        SELECT count(p.id) 
                        FROM public.presences p
                        JOIN public.employees e ON e.id = p.employee_id
                        WHERE e.entreprise_id = p_entreprise_id 
                        AND p.date = d::date
                    ) as value
                FROM (
                    -- Time range of activity
                    SELECT generate_series(
                        CURRENT_DATE - (p_chart_days - 1) * interval '1 day',
                        CURRENT_DATE,
                        interval '1 day'
                    )::date as d
                ) days
            ) day_stats
        ),
        'period_activity_count', (
            SELECT count(p.id) 
            FROM public.presences p
            JOIN public.employees e ON e.id = p.employee_id
            WHERE e.entreprise_id = p_entreprise_id 
            AND p.date >= CURRENT_DATE - (p_chart_days - 1) * interval '1 day'
            AND p.date <= CURRENT_DATE
        ),
        'latest_attendance', (
            SELECT jsonb_agg(presence_data)
            FROM (
                SELECT 
                    p.id,
                    u.name as employee_name,
                    p.date,
                    p.check_in_time,
                    p.check_out_time,
                    p.status
                FROM public.presences p
                JOIN public.employees e ON e.id = p.employee_id
                JOIN public.users u ON u.id = e.user_id
                WHERE e.entreprise_id = p_entreprise_id
                ORDER BY p.date DESC, p.check_in_time DESC
                LIMIT 48
            ) presence_data
        ),
        'recent_documents', (
            SELECT jsonb_agg(doc_data)
            FROM (
                SELECT 
                    d.id,
                    d.title,
                    COALESCE(d.doc_type, d.type::text) as type,
                    u.name as uploaded_by_name,
                    d.uploaded_at,
                    d.status
                FROM public.documents d
                LEFT JOIN public.users u ON u.id = d.user_id
                WHERE d.entreprise_id = p_entreprise_id
                ORDER BY d.uploaded_at DESC
                LIMIT 10
            ) doc_data
        ),
        'role_distribution', (
            SELECT jsonb_agg(role_data)
            FROM (
                SELECT 
                    role,
                    count(id) as count
                FROM public.users
                WHERE entreprise_id = p_entreprise_id
                GROUP BY role
                ORDER BY count DESC
            ) role_data
        ),
        'entreprise_info', (
            SELECT jsonb_build_object(
                'name', name,
                'plan', plan,
                'status', status,
                'created_at', created_at
            )
            FROM public.entreprises
            WHERE id = p_entreprise_id
        )
    ) INTO result;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats(UUID, INT) TO authenticated;
