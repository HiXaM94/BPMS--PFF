-- Migration to add functional workflow execution tracking
-- Date: 2026-03-09

-- 1. Workflow Instances (Real-world executions of a template)
CREATE TABLE IF NOT EXISTS public.hr_workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE CASCADE,
    workflow_key TEXT NOT NULL, -- 'onboarding', 'leaveApproval', etc.
    target_id UUID NOT NULL,    -- Usually an employee_id or leave_request_id
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    current_node_ids TEXT[] DEFAULT '{}', -- Array of active node IDs (supports parallel steps)
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Workflow Step History (Audit of completed nodes)
CREATE TABLE IF NOT EXISTS public.hr_workflow_step_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES public.hr_workflow_instances(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    action_taken TEXT, -- 'completed', 'approved', 'rejected'
    actor_id UUID REFERENCES public.users(id),
    notes TEXT,
    completed_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- RLS Policies
ALTER TABLE public.hr_workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_workflow_step_history ENABLE ROW LEVEL SECURITY;

-- HR/Admin can manage workflows for their enterprise
CREATE POLICY "HR/Admin manage workflow instances" ON public.hr_workflow_instances
    FOR ALL USING (entreprise_id IN (
        SELECT entreprise_id FROM public.employees WHERE user_id = auth.uid()
    ));

CREATE POLICY "HR/Admin manage workflow history" ON public.hr_workflow_step_history
    FOR ALL USING (instance_id IN (
        SELECT id FROM public.hr_workflow_instances WHERE entreprise_id IN (
            SELECT entreprise_id FROM public.employees WHERE user_id = auth.uid()
        )
    ));

-- Indexes
CREATE INDEX idx_workflow_instances_entreprise ON public.hr_workflow_instances(entreprise_id);
CREATE INDEX idx_workflow_instances_target ON public.hr_workflow_instances(target_id);
CREATE INDEX idx_workflow_history_instance ON public.hr_workflow_step_history(instance_id);
