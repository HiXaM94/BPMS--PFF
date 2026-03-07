CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats(p_entreprise_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_users', (SELECT count(u.id) FROM public.users u WHERE u.entreprise_id = p_entreprise_id),
        'total_employees', (SELECT count(u.id) FROM public.users u WHERE u.entreprise_id = p_entreprise_id AND u.role = 'EMPLOYEE'::user_role),
        'attendance_today', (
            SELECT count(p.id) 
            FROM public.presences p
            JOIN public.employees e ON e.id = p.employee_id
            WHERE e.entreprise_id = p_entreprise_id AND p.date = CURRENT_DATE
        ),
        'pending_documents', (
            SELECT count(d.id) 
            FROM public.documents d 
            WHERE d.entreprise_id = p_entreprise_id AND d.status = 'pending'::document_status
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
        'chart_data', (
            SELECT jsonb_agg(month_stats)
            FROM (
                SELECT 
                    to_char(m, 'Mon YY') as label,
                    (
                        SELECT count(u.id) 
                        FROM public.users u 
                        WHERE u.entreprise_id = p_entreprise_id 
                        AND u.created_at <= (m + interval '1 month' - interval '1 second')
                    ) as value
                FROM (
                    SELECT generate_series(
                        date_trunc('month', NOW() - interval '5 months'),
                        date_trunc('month', NOW()),
                        interval '1 month'
                    ) as m
                ) months
            ) month_stats
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
                LIMIT 10
            ) presence_data
        ),
        'recent_documents', (
            SELECT jsonb_agg(doc_data)
            FROM (
                SELECT 
                    d.id,
                    d.title,
                    d.type,
                    u.name as uploaded_by_name,
                    d.uploaded_at,
                    d.status
                FROM public.documents d
                LEFT JOIN public.users u ON u.id = d.uploaded_by
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

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats(UUID) TO authenticated;
