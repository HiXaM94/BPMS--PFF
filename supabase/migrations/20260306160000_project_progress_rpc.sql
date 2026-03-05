-- Aggregated project progress for admins (bypasses RLS via security definer)
create or replace function public.get_project_progress(
  p_entreprise_id uuid
)
returns table (
  project_id uuid,
  total_tasks integer,
  completed_tasks integer,
  progress_percent integer
)
language sql
security definer
set search_path = public
as $$
  with project_tasks as (
    select
      t.project_id,
      count(*) as total_tasks,
      count(*) filter (
        where coalesce(lower(t.status::text), '') in ('completed', 'validated', 'finished', 'done')
          or t.validated_at is not null
      ) as completed_tasks
    from tasks t
    join projects p on p.id = t.project_id
    where p.entreprise_id = p_entreprise_id
    group by t.project_id
  )
  select
    p.id as project_id,
    coalesce(pt.total_tasks, 0) as total_tasks,
    coalesce(pt.completed_tasks, 0) as completed_tasks,
    case
      when coalesce(pt.total_tasks, 0) = 0 then 0
      else round((pt.completed_tasks::numeric / pt.total_tasks::numeric) * 100)::int
    end as progress_percent
  from projects p
  left join project_tasks pt on pt.project_id = p.id
  where p.entreprise_id = p_entreprise_id;
$$;

grant execute on function public.get_project_progress(uuid) to authenticated;
