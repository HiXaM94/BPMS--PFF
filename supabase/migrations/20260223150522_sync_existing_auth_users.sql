-- Sync existing auth.users to public.users
-- This is needed after a db reset to create profiles for users that already exist in auth.users

INSERT INTO public.users (id, entreprise_id, name, email, role, status, avatar_initials)
SELECT 
  au.id,
  '11111111-0001-0001-0001-000000000001' as entreprise_id, -- Default to TechCorp
  COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
  au.email,
  COALESCE((au.raw_user_meta_data->>'role')::user_role, 'EMPLOYEE'::user_role) as role,
  'active'::user_status as status,
  UPPER(LEFT(COALESCE(au.raw_user_meta_data->>'name', au.email), 2)) as avatar_initials
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);
