-- Create a new table for SaaS Owners (Super Admins)
-- This table stores credentials for high-level management access

CREATE TABLE IF NOT EXISTS public.owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- Recommended: Store as a hash if not using Supabase Auth
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policy (e.g., only authenticated users with specific roles can view)
-- Adjust these policies based on your specific security requirements
CREATE POLICY "Owners are viewable by authenticated users" 
ON public.owners FOR SELECT 
TO authenticated 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER trg_owners_updated_at
BEFORE UPDATE ON public.owners
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert the Super Admin record
INSERT INTO public.owners (name, email, password) 
VALUES ('admin', 'super.admin@gmail.com', 'Team-E@2026');
