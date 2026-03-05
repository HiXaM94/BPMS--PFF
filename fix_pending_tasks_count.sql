-- Simple function to count pending tasks for a company
-- (tasks where validated_by is NULL and belongs to company users)
CREATE OR REPLACE FUNCTION get_pending_task_count(p_entreprise_id UUID)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COUNT(DISTINCT t.id)::INTEGER
  FROM tasks t
  JOIN users u ON (t.assigned_to = u.id OR t.created_by = u.id)
  WHERE u.entreprise_id = p_entreprise_id
  AND t.validated_by IS NULL;
$$;

GRANT EXECUTE ON FUNCTION get_pending_task_count(UUID) TO authenticated;
