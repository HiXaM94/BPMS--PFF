-- Run this in Supabase SQL Editor
-- Creates the user_details table to store extended profile details for all users (Admin, HR, Manager, Employee)

CREATE TABLE IF NOT EXISTS public.user_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_user UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE,
    
    -- HR & Payroll Details
    cnss VARCHAR(50),
    rib VARCHAR(100),
    join_date DATE,
    department VARCHAR(100),
    phone VARCHAR(50),
    
    -- Hierarchy
    reports_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Miscellaneous
    position VARCHAR(150),
    location VARCHAR(150),
    bio TEXT,
    
    -- Auditing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    -- Ensure a user only has one details profile (1-to-1 relationship)
    CONSTRAINT unique_user_details UNIQUE (id_user)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.user_details ENABLE ROW LEVEL SECURITY;

-- 1. Policy: Users can see all details within their own company
CREATE POLICY "View same company user details" 
ON public.user_details 
FOR SELECT 
USING (
    entreprise_id = public.get_my_entreprise_id()
);

-- 2. Policy: Company Admins and HR can insert/update details for their company
CREATE POLICY "Admin and HR can manage company details" 
ON public.user_details 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND entreprise_id = user_details.entreprise_id
        AND role IN ('ADMIN', 'HR')
    )
);

-- 3. Policy: User can update their own details
CREATE POLICY "Users can update their own details"
ON public.user_details
FOR UPDATE
USING (id_user = auth.uid());

-- Add database trigger to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_user_details_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_details_updated_at ON public.user_details;

CREATE TRIGGER update_user_details_updated_at
    BEFORE UPDATE ON public.user_details
    FOR EACH ROW
    EXECUTE FUNCTION update_user_details_updated_at_column();
