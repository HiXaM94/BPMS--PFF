-- Run this in Supabase SQL Editor
-- Creates the employees table to store detailed HR and payroll information

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE,
    
    -- Basic Employee Identifiers
    employee_code VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    -- HR & Payroll Details
    position VARCHAR(150),
    department VARCHAR(100),
    hire_date DATE,
    cnss_number VARCHAR(50),
    bank_rib VARCHAR(100),
    
    -- Additional Profile Info
    phone VARCHAR(50),
    location VARCHAR(150),
    manager_name VARCHAR(100),
    bio TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    
    -- Auditing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- Ensure a user only has one employee profile (1-to-1 relationship)
    CONSTRAINT unique_user_employee UNIQUE (user_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 1. Policy: Users can see all employees within their own company
CREATE POLICY "View same company employees" 
ON public.employees 
FOR SELECT 
USING (
    entreprise_id = (SELECT entreprise_id FROM public.users WHERE id = auth.uid()) 
    OR 
    entreprise_id = public.get_my_entreprise_id()
);

-- 2. Policy: Company Admins and HR can insert/update employee records for their company
CREATE POLICY "Admin and HR can manage company employees" 
ON public.employees 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND entreprise_id = employees.entreprise_id
        AND role IN ('ADMIN', 'HR')
    )
);

-- Add database trigger to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
