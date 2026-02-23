# BPMS — Supabase Database Setup

This directory contains all SQL files needed to set up the PostgreSQL database for the BPMS application on Supabase.

---

## Files

| File | Description |
|------|-------------|
| `schema.sql` | Full database schema — enums, tables, indexes, triggers, functions |
| `rls_policies.sql` | Row Level Security policies for all tables |
| `seed.sql` | Sample data matching the frontend mock data |

---

## Prerequisites

- A [Supabase](https://supabase.com) project (free tier works)
- Access to the **SQL Editor** in the Supabase dashboard, or the [Supabase CLI](https://supabase.com/docs/guides/cli)

---

## Setup Order

**Always run the files in this exact order:**

```
1. schema.sql
2. rls_policies.sql
3. seed.sql          (optional — for development/testing only)
```

Running out of order will cause foreign key or policy errors.

---

## Option A — Supabase Dashboard (SQL Editor)

1. Open your Supabase project → **SQL Editor**
2. Click **New query**
3. Paste the contents of `schema.sql` → click **Run**
4. Create another new query, paste `rls_policies.sql` → click **Run**
5. *(Optional)* Create another new query, paste `seed.sql` → click **Run**

---

## Option B — Supabase CLI

```bash
# Install CLI if needed
npm install -g supabase

# Login
supabase login

# Link to your project (get project ref from dashboard URL)
supabase link --project-ref <your-project-ref>

# Push schema
supabase db execute --file supabase/schema.sql

# Push RLS policies
supabase db execute --file supabase/rls_policies.sql

# Push seed data (dev only)
supabase db execute --file supabase/seed.sql
```

---

## Option C — psql (direct connection)

```bash
# Get connection string from Supabase dashboard → Settings → Database
psql "postgresql://postgres:<password>@<host>:5432/postgres" \
  -f supabase/schema.sql \
  -f supabase/rls_policies.sql \
  -f supabase/seed.sql
```

---

## Database Schema Overview

### Core Entities

| Table | Description |
|-------|-------------|
| `entreprises` | Multi-tenant companies registered on the platform |
| `departments` | Departments within each entreprise |
| `users` | All user accounts (linked to Supabase Auth) |
| `employees` | Employee profiles linked to users |
| `employee_skills` | Skills per employee with proficiency level |
| `employee_certifications` | Professional certifications per employee |

### Role Profiles

| Table | Description |
|-------|-------------|
| `admin_profiles` | Extra data for ADMIN role users |
| `hr_profiles` | Extra data for HR role users |
| `team_manager_profiles` | Extra data for TEAM_MANAGER role users |

### Project & Task Management

| Table | Description |
|-------|-------------|
| `projects` | Projects assigned to departments and managers |
| `tasks` | Tasks within projects, assigned to employees |

### HR Modules

| Table | Description |
|-------|-------------|
| `payrolls` | Monthly payroll records per employee |
| `presences` | Daily attendance records |
| `leave_balances` | Leave quota per employee per year |
| `vacances` | Leave requests and approvals |
| `documents` | Document requests (certificates, payslips, etc.) |

### Recruitment

| Table | Description |
|-------|-------------|
| `recrutements` | Job postings |
| `candidates` | Applicants per job posting |

### Analytics & AI

| Table | Description |
|-------|-------------|
| `performances` | Employee performance records per period |
| `analytiques` | Aggregated business metrics |
| `ai_agents` | AI agent configurations per entreprise |
| `ai_recommendations` | AI-generated recommendations |

### System

| Table | Description |
|-------|-------------|
| `notifications` | In-app notifications per user |
| `system_logs` | Audit trail of all user actions |

---

## Roles & Permissions

The RLS policies enforce the following access model:

| Role | Access Scope |
|------|-------------|
| `ADMIN` | Full access to all data within their entreprise |
| `HR` | Read/write access to HR modules (payroll, leave, documents, recruitment) across the entreprise |
| `TEAM_MANAGER` | Read/write access to their own team's tasks, projects, and performance |
| `EMPLOYEE` | Read/write access to their own data only |

---

## Authentication Integration

The `users` table is linked to Supabase Auth via a trigger (`handle_new_user`). When a user registers through Supabase Auth:

1. A row is automatically inserted into `public.users`
2. The `entreprise_id` and `role` must be set by an admin after registration

For local development with the seed data, the `users` table is populated directly (bypassing Auth). In production, use Supabase Auth to create users.

### Creating a test user via Supabase Auth API

```bash
curl -X POST 'https://<project-ref>.supabase.co/auth/v1/signup' \
  -H "apikey: <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"ibrahim@bpms.io","password":"SecurePass123!"}'
```

Then update the user's `entreprise_id` and `role` in the `users` table via the dashboard or an admin API call.

---

## Seed Data Summary

The `seed.sql` file contains representative data for **TechCorp International** (the primary demo entreprise):

- **7** entreprises
- **9** departments
- **10** users (1 Admin, 1 HR, 2 Team Managers, 6 Employees)
- **10** employee profiles with skills and certifications
- **4** projects with **12** tasks
- **15** payroll records (Jan + Feb 2026)
- **17** attendance records
- **18** leave balance entries
- **8** leave requests
- **7** document requests
- **5** job postings with **8** candidates
- **11** performance records
- **12** analytics metrics
- **15** notifications
- **3** AI agents with **5** recommendations
- **10** system log entries

> **Warning:** Do not run `seed.sql` in production. It is for development and demo purposes only.

---

## Environment Variables

Add these to your `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Both values are available in your Supabase dashboard under **Settings → API**.

---

## Resetting the Database

To wipe all data and start fresh (dev only):

```sql
-- Run in SQL Editor — drops all BPMS tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then re-run `schema.sql` → `rls_policies.sql` → `seed.sql`.

---

## Troubleshooting

**Error: `relation "users" does not exist`**
→ You ran `rls_policies.sql` before `schema.sql`. Re-run in the correct order.

**Error: `duplicate key value violates unique constraint`**
→ You ran `seed.sql` twice. Either reset the DB or delete the conflicting rows first.

**Error: `new row violates row-level security policy`**
→ You are trying to insert data without a valid authenticated user context. Disable RLS temporarily for seeding: add `SET LOCAL row_security = off;` at the top of `seed.sql`, or run as the `postgres` superuser role.

**RLS policies not working as expected**
→ Check that `auth.uid()` returns the correct user ID. In the SQL Editor, you can test with:
```sql
SELECT auth.uid(), get_current_user_role(), get_current_user_entreprise();
```
