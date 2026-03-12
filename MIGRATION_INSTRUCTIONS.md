# 🚨 URGENT: Database Migrations Required

## Problem

Your application is getting **400 errors** because the database tables are missing required columns. The migrations have not been run in your Supabase database yet.

**Error Messages:**
```
Failed to load resource: the server responded with a status of 400 ()
- /rest/v1/candidates?select=*&order=created_at.desc
- /rest/v1/recrutements
```

---

## Solution: Run These 2 Migrations

### Step 1: Run Migration for Table Schema

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/zhynmlxiiknrsduevlii
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of: `supabase/migrations/20260312100001_public_job_applications_safe.sql`
5. Paste into SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for "Success. No rows returned" or similar confirmation

### Step 2: Run Migration for RLS Policies

1. Still in SQL Editor
2. Click **New Query** again
3. Copy the entire contents of: `supabase/migrations/20260312100002_fix_recrutements_rls.sql`
4. Paste into SQL Editor
5. Click **Run**
6. Wait for confirmation

### Step 3: Verify

Run this diagnostic query in SQL Editor to verify:

```sql
-- Check if new columns exist
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'recrutements' 
AND column_name IN ('position', 'is_public', 'applicants_count', 'salary_range');

SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'candidates' 
AND column_name IN ('applied_position', 'score', 'cover_letter', 'linkedin_url');
```

You should see all these columns listed.

### Step 4: Refresh Application

1. Go back to your application: http://localhost:5173
2. Hard refresh: **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)
3. Navigate to `/recruitment`
4. Errors should be gone

---

## What These Migrations Do

### Migration 1: `20260312100001_public_job_applications_safe.sql`

**Adds to `recrutements` table:**
- `position` - Job title
- `department` - Department name
- `contract_type` - Full-time, Part-time, etc.
- `salary_range` - Salary information
- `closing_date` - Application deadline
- `applicants_count` - Auto-incremented count
- `shortlisted_count` - Shortlisted candidates
- `is_public` - Show on careers portal

**Adds to `candidates` table:**
- `applied_position` - Position applied for
- `score` - AI-generated score
- `cover_letter` - Candidate's cover letter
- `portfolio_url` - Portfolio link
- `linkedin_url` - LinkedIn profile
- `experience_years` - Years of experience

**Creates storage bucket:**
- `candidate-cvs` - For CV uploads

**Adds RLS policies:**
- Public can view open jobs
- Public can submit applications
- Public can upload CVs
- HR can view/update/delete candidates

### Migration 2: `20260312100002_fix_recrutements_rls.sql`

**Adds RLS policies for `recrutements` table:**
- HR/Admin can INSERT job postings
- HR/Admin can UPDATE job postings
- HR/Admin can DELETE job postings
- HR/Admin can view ALL jobs (not just public)

**Fixes the 403 Forbidden error** when creating job posts.

---

## Alternative: Use Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Navigate to project directory
cd d:\pfe-main\pfe-main

# Link to your project (if not already linked)
supabase link --project-ref zhynmlxiiknrsduevlii

# Run migrations
supabase db push
```

---

## Troubleshooting

### If you get "relation already exists" errors:

The migrations are designed to be safe and idempotent. They use:
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `DROP POLICY IF EXISTS` before `CREATE POLICY`
- `ON CONFLICT DO NOTHING` for inserts

You can safely run them multiple times.

### If you still get 400 errors after running migrations:

1. Check the browser console for the exact error message
2. Run the diagnostic query (see `DIAGNOSTIC_QUERY.sql`)
3. Verify the columns exist in the database
4. Clear browser cache and hard refresh
5. Check Supabase logs in Dashboard → Logs

### If policies are not working:

1. Verify RLS is enabled on tables:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename IN ('recrutements', 'candidates');
   ```
   Both should show `rowsecurity = true`

2. Check your user role:
   ```sql
   SELECT id, email, role 
   FROM users 
   WHERE email = 'jihad@gmail.com';
   ```
   Should show `role = 'ADMIN'` or `'HR'`

---

## After Running Migrations

You should be able to:

✅ Navigate to `/recruitment` without errors
✅ Create new job postings (no 403 error)
✅ View candidates list
✅ Access `/careers` portal publicly
✅ Submit job applications
✅ Upload CVs to storage

---

## Quick Verification Checklist

After running migrations, test these:

- [ ] Login as HR (jihad@gmail.com)
- [ ] Navigate to `/recruitment` - no 400 errors
- [ ] Click "Create New Job" - form opens
- [ ] Fill in job details and save - no 403 error
- [ ] See job in list with applicant count
- [ ] Open `/careers` in incognito - jobs visible
- [ ] Submit test application - success message
- [ ] Return to `/recruitment` → Candidates - application appears

---

## Need Help?

If you encounter issues:

1. Check Supabase Dashboard → Logs for detailed error messages
2. Run the diagnostic query to see current schema
3. Verify your user has HR or ADMIN role
4. Check browser console for JavaScript errors
5. Ensure you're using the correct Supabase project URL

---

**Status: Migrations ready to run. Execute in Supabase SQL Editor now.**
