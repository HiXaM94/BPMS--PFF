-- Ticket System for Admin ↔ Super Admin Communication

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
    reply TEXT,
    replied_at TIMESTAMPTZ,
    is_read_by_admin BOOLEAN NOT NULL DEFAULT true,
    is_read_by_super BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast querying (using IF NOT EXISTS to prevent rerunnning errors in Postgres 9.5+)
CREATE INDEX IF NOT EXISTS idx_tickets_entreprise_id ON public.tickets(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON public.tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Admins can view tickets they created or belong to their entreprise
DROP POLICY IF EXISTS "Admins can view their own company tickets" ON public.tickets;
CREATE POLICY "Admins can view their own company tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (
    entreprise_id IN (
        SELECT entreprise_id FROM public.users WHERE id = auth.uid()
    )
);

-- Admins can create tickets for their entreprise
DROP POLICY IF EXISTS "Admins can create tickets" ON public.tickets;
CREATE POLICY "Admins can create tickets"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK (
    entreprise_id IN (
        SELECT entreprise_id FROM public.users WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
);

-- Admins can update their own tickets (e.g. to mark as read)
DROP POLICY IF EXISTS "Admins can update their tickets" ON public.tickets;
CREATE POLICY "Admins can update their tickets"
ON public.tickets FOR UPDATE
TO authenticated
USING (
    entreprise_id IN (
        SELECT entreprise_id FROM public.users WHERE id = auth.uid()
    )
)
WITH CHECK (
    entreprise_id IN (
        SELECT entreprise_id FROM public.users WHERE id = auth.uid()
    )
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS trg_tickets_updated_at ON public.tickets;
CREATE TRIGGER trg_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Note: Super Admin requires bypassing RLS or policies specifically for them.
-- Assuming Super Admins are stored in the 'owners' table
DROP POLICY IF EXISTS "Super Admins can view and update all tickets" ON public.tickets;
CREATE POLICY "Super Admins can view and update all tickets"
ON public.tickets FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.owners WHERE id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.owners WHERE id = auth.uid()
    )
);
