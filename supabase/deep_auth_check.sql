-- Run ALL of these and share the full output

-- 1. Can GoTrue find users at all?
SELECT id, email, encrypted_password IS NOT NULL as has_pwd,
       email_confirmed_at IS NOT NULL as email_confirmed,
       LENGTH(encrypted_password) as pwd_len,
       raw_app_meta_data,
       raw_user_meta_data,
       banned_until,
       deleted_at
FROM auth.users
ORDER BY created_at;

-- 2. Check identities
SELECT id, user_id, provider, identity_data, provider_id
FROM auth.identities;

-- 3. Check auth.mfa_factors (GoTrue queries this on login)
SELECT * FROM auth.mfa_factors LIMIT 5;

-- 4. Check auth.sessions
SELECT count(*) FROM auth.sessions;

-- 5. Check if there are broken rows in auth.users
-- (null aud or role breaks GoTrue)
SELECT id, email, aud, role
FROM auth.users
WHERE aud IS NULL OR role IS NULL;

-- 6. Check auth hooks
SELECT * FROM auth.hooks LIMIT 10;
