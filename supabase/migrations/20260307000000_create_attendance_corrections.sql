-- 1. Create attendance_corrections table
CREATE TABLE IF NOT EXISTS public.attendance_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
    correction_date DATE NOT NULL,
    issue_type TEXT NOT NULL, -- 'Missing Clock-In', 'Missing Clock-Out', 'Wrong Time', etc.
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    suggested_check_in TIME,
    suggested_check_out TIME,
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.attendance_corrections ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Employees can view their own requests
DROP POLICY IF EXISTS "Employees can view own corrections" ON public.attendance_corrections;
CREATE POLICY "Employees can view own corrections"
ON public.attendance_corrections FOR SELECT
USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

-- Employees can insert their own requests
DROP POLICY IF EXISTS "Employees can insert own corrections" ON public.attendance_corrections;
CREATE POLICY "Employees can insert own corrections"
ON public.attendance_corrections FOR INSERT
WITH CHECK (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
);

-- Managers can view requests from employees they manage
-- (Assuming user_details has reports_to)
DROP POLICY IF EXISTS "Managers can view team corrections" ON public.attendance_corrections;
CREATE POLICY "Managers can view team corrections"
ON public.attendance_corrections FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_details ud
        JOIN public.employees e ON e.user_id = ud.id_user
        WHERE e.id = public.attendance_corrections.employee_id
        AND ud.reports_to = auth.uid()
    ) OR 
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'SUPER_ADMIN', 'HR')
);

-- Managers/HR can update status
DROP POLICY IF EXISTS "Managers can update correction status" ON public.attendance_corrections;
CREATE POLICY "Managers can update correction status"
ON public.attendance_corrections FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_details ud
        JOIN public.employees e ON e.user_id = ud.id_user
        WHERE e.id = public.attendance_corrections.employee_id
        AND ud.reports_to = auth.uid()
    ) OR 
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('ADMIN', 'SUPER_ADMIN', 'HR')
);
