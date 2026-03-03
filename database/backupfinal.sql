


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."ai_recommendation_type" AS ENUM (
    'candidate',
    'performance',
    'training',
    'leave',
    'salary'
);


ALTER TYPE "public"."ai_recommendation_type" OWNER TO "postgres";


CREATE TYPE "public"."analytics_report_type" AS ENUM (
    'global',
    'hr',
    'payroll',
    'attendance',
    'performance'
);


ALTER TYPE "public"."analytics_report_type" OWNER TO "postgres";


CREATE TYPE "public"."attendance_status" AS ENUM (
    'present',
    'absent',
    'late',
    'on_leave',
    'holiday'
);


ALTER TYPE "public"."attendance_status" OWNER TO "postgres";


CREATE TYPE "public"."candidate_stage" AS ENUM (
    'HR Screen',
    'Technical Interview',
    'Final Interview',
    'Offer'
);


ALTER TYPE "public"."candidate_stage" OWNER TO "postgres";


CREATE TYPE "public"."candidate_status" AS ENUM (
    'new',
    'screening',
    'interview',
    'offer',
    'rejected',
    'hired'
);


ALTER TYPE "public"."candidate_status" OWNER TO "postgres";


CREATE TYPE "public"."document_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'expired'
);


ALTER TYPE "public"."document_status" OWNER TO "postgres";


CREATE TYPE "public"."document_type" AS ENUM (
    'contract',
    'id_card',
    'diploma',
    'certificate',
    'other'
);


ALTER TYPE "public"."document_type" OWNER TO "postgres";


CREATE TYPE "public"."employment_type" AS ENUM (
    'full_time',
    'part_time',
    'contract',
    'internship'
);


ALTER TYPE "public"."employment_type" OWNER TO "postgres";


CREATE TYPE "public"."enterprise_plan" AS ENUM (
    'Starter',
    'Business',
    'Enterprise'
);


ALTER TYPE "public"."enterprise_plan" OWNER TO "postgres";


CREATE TYPE "public"."enterprise_status" AS ENUM (
    'active',
    'inactive',
    'trial',
    'suspended'
);


ALTER TYPE "public"."enterprise_status" OWNER TO "postgres";


CREATE TYPE "public"."leave_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


ALTER TYPE "public"."leave_status" OWNER TO "postgres";


CREATE TYPE "public"."leave_type" AS ENUM (
    'annual',
    'sick',
    'maternity',
    'paternity',
    'unpaid',
    'remote_work'
);


ALTER TYPE "public"."leave_type" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'info',
    'success',
    'warning',
    'error',
    'task',
    'payroll',
    'leave',
    'recruitment'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."payroll_status" AS ENUM (
    'draft',
    'pending',
    'processed',
    'paid',
    'cancelled'
);


ALTER TYPE "public"."payroll_status" OWNER TO "postgres";


CREATE TYPE "public"."project_status" AS ENUM (
    'planning',
    'in_progress',
    'completed',
    'on_hold',
    'cancelled'
);


ALTER TYPE "public"."project_status" OWNER TO "postgres";


CREATE TYPE "public"."recruitment_status" AS ENUM (
    'draft',
    'open',
    'in_progress',
    'closed',
    'cancelled'
);


ALTER TYPE "public"."recruitment_status" OWNER TO "postgres";


CREATE TYPE "public"."task_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."task_priority" OWNER TO "postgres";


CREATE TYPE "public"."task_status" AS ENUM (
    'todo',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'ADMIN',
    'TEAM_MANAGER',
    'HR',
    'EMPLOYEE',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."user_status" AS ENUM (
    'active',
    'inactive',
    'pending',
    'suspended'
);


ALTER TYPE "public"."user_status" OWNER TO "postgres";


CREATE TYPE "public"."validation_status" AS ENUM (
    'pending',
    'validated',
    'rejected'
);


ALTER TYPE "public"."validation_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_employee_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT id FROM public.employees WHERE user_id = auth.uid();
$$;


ALTER FUNCTION "public"."auth_employee_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_user_entreprise"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT entreprise_id FROM public.users WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."auth_user_entreprise"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE((SELECT role::text FROM public.users WHERE id = auth.uid()), 'EMPLOYEE');
$$;


ALTER FUNCTION "public"."auth_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.users (id, entreprise_id, name, email, role, status, avatar_initials)
  VALUES (
    NEW.id,
    '11111111-0001-0001-0001-000000000001',
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'role', '')::user_role,
      'EMPLOYEE'::user_role
    ),
    'active'::user_status,
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 2))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user error (non-fatal): %', SQLERRM;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(public.auth_user_role() = 'ADMIN', false);
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_hr_or_manager"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(public.auth_user_role() IN ('ADMIN', 'HR', 'TEAM_MANAGER'), false);
$$;


ALTER FUNCTION "public"."is_admin_hr_or_manager"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_or_hr"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(public.auth_user_role() IN ('ADMIN', 'HR'), false);
$$;


ALTER FUNCTION "public"."is_admin_or_hr"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_hr"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(public.auth_user_role() = 'HR', false);
$$;


ALTER FUNCTION "public"."is_hr"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_manager"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(public.auth_user_role() = 'TEAM_MANAGER', false);
$$;


ALTER FUNCTION "public"."is_manager"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_my_team_member"("emp_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = emp_id
      AND manager_id = auth_employee_id()
  );
$$;


ALTER FUNCTION "public"."is_my_team_member"("emp_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_audit_trail"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    entreprise_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    COALESCE(NEW.entreprise_id, OLD.entreprise_id),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."log_audit_trail"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."provision_enterprise_admin"("p_auth_user_id" "uuid", "p_name" "text", "p_industry" "text", "p_phone" "text", "p_email" "text", "p_location" "text", "p_plan" "text", "p_legal_form" "text", "p_ice" "text", "p_rc" "text", "p_if_number" "text", "p_cnss" "text", "p_patente" "text", "p_country" "text", "p_logo_url" "text", "p_first_name" "text", "p_last_name" "text", "p_user_email" "text", "p_password_hash" "text", "p_avatar_initials" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_entreprise_id uuid;
  v_user_id       uuid;
BEGIN
  -- ── 1. Insert into entreprises ─────────────────────────────
  INSERT INTO public.entreprises (
    name, industry, phone, email, location, status, plan,
    legal_form, ice, rc, if_number, cnss, patente, country, logo_url,
    created_at, updated_at
  )
  VALUES (
    p_name,
    p_industry,
    p_phone,
    p_email,
    p_location,
    'active'::enterprise_status,
    p_plan::enterprise_plan,
    p_legal_form,
    p_ice,
    p_rc,
    p_if_number,
    p_cnss,
    p_patente,
    COALESCE(p_country, 'Morocco'),
    p_logo_url,
    now(),
    now()
  )
  RETURNING id INTO v_entreprise_id;

  -- ── 2. Insert into users ───────────────────────────────────
  -- id = auth.users.id → clean 1:1 link, no extra join needed
  INSERT INTO public.users (
    id, entreprise_id, name, email, role, status,
    avatar_initials, password_hash, created_at, updated_at
  )
  VALUES (
    p_auth_user_id,
    v_entreprise_id,
    p_first_name || ' ' || p_last_name,
    p_user_email,
    'admin'::user_role,
    'active'::user_status,
    p_avatar_initials,
    p_password_hash,
    now(),
    now()
  )
  RETURNING id INTO v_user_id;

  -- ── 3. Insert into admin_profiles ─────────────────────────
  INSERT INTO public.admin_profiles (
    user_id, first_name, last_name, email,
    password_hash, auth_user_id, created_at
  )
  VALUES (
    v_user_id,
    p_first_name,
    p_last_name,
    p_user_email,
    p_password_hash,
    p_auth_user_id,
    now()
  );

  -- Return the IDs so the frontend can confirm success
  RETURN json_build_object(
    'success',        true,
    'entreprise_id',  v_entreprise_id,
    'user_id',        v_user_id
  );

EXCEPTION WHEN OTHERS THEN
  -- Roll back everything and surface the error to the frontend
  RAISE EXCEPTION 'provision_enterprise_admin failed: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."provision_enterprise_admin"("p_auth_user_id" "uuid", "p_name" "text", "p_industry" "text", "p_phone" "text", "p_email" "text", "p_location" "text", "p_plan" "text", "p_legal_form" "text", "p_ice" "text", "p_rc" "text", "p_if_number" "text", "p_cnss" "text", "p_patente" "text", "p_country" "text", "p_logo_url" "text", "p_first_name" "text", "p_last_name" "text", "p_user_email" "text", "p_password_hash" "text", "p_avatar_initials" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."same_entreprise_employee"("emp_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = emp_id
      AND e.entreprise_id = auth_user_entreprise()
  );
$$;


ALTER FUNCTION "public"."same_entreprise_employee"("emp_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "password_hash" "text",
    "auth_user_id" "uuid"
);


ALTER TABLE "public"."admin_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "entreprise_id" "uuid",
    "interaction_type" "text" NOT NULL,
    "prompt" "text" NOT NULL,
    "response" "text",
    "model_used" "text",
    "tokens_used" integer,
    "confidence_score" numeric(3,2),
    "feedback_rating" integer,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_interactions_feedback_rating_check" CHECK ((("feedback_rating" >= 1) AND ("feedback_rating" <= 5)))
);


ALTER TABLE "public"."ai_interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "employee_id" "uuid",
    "type" "public"."ai_recommendation_type" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "confidence" numeric(3,2),
    "applied" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_recommendations_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric)))
);


ALTER TABLE "public"."ai_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytiques" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entreprise_id" "uuid" NOT NULL,
    "generated_by" "uuid",
    "report_type" "public"."analytics_report_type" DEFAULT 'global'::"public"."analytics_report_type" NOT NULL,
    "period" "text" NOT NULL,
    "period_start" "date",
    "period_end" "date",
    "data" "jsonb",
    "generated_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."analytiques" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "entreprise_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cache_metadata" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cache_key" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "ttl_seconds" integer,
    "last_accessed" timestamp with time zone,
    "access_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."cache_metadata" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."candidates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recrutement_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "cv_url" "text",
    "linkedin_url" "text",
    "experience_years" smallint,
    "skills" "text",
    "status" "public"."candidate_status" DEFAULT 'new'::"public"."candidate_status" NOT NULL,
    "stage" "public"."candidate_stage" DEFAULT 'HR Screen'::"public"."candidate_stage" NOT NULL,
    "rating" smallint,
    "notes" "text",
    "applied_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "candidates_rating_check" CHECK ((("rating" >= 0) AND ("rating" <= 5)))
);


ALTER TABLE "public"."candidates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entreprise_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid",
    "entreprise_id" "uuid",
    "title" "text" NOT NULL,
    "type" "public"."document_type" NOT NULL,
    "file_url" "text",
    "status" "public"."document_status" DEFAULT 'pending'::"public"."document_status" NOT NULL,
    "uploaded_by" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_certifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "issuer" "text",
    "issued_date" "date",
    "expiry_date" "date",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."employee_certifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_skills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "level" smallint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "employee_skills_level_check" CHECK ((("level" >= 0) AND ("level" <= 100)))
);


ALTER TABLE "public"."employee_skills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entreprise_id" "uuid" NOT NULL,
    "department_id" "uuid",
    "manager_id" "uuid",
    "employee_code" "text",
    "position" "text" NOT NULL,
    "hire_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "salary_base" numeric(12,2) DEFAULT 0 NOT NULL,
    "phone" "text",
    "location" "text",
    "cnss" "text",
    "rib" "text",
    "bio" "text",
    "status" "public"."user_status" DEFAULT 'active'::"public"."user_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entreprises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "industry" "text",
    "phone" "text",
    "email" "text",
    "location" "text",
    "status" "public"."enterprise_status" DEFAULT 'active'::"public"."enterprise_status" NOT NULL,
    "plan" "public"."enterprise_plan" DEFAULT 'Starter'::"public"."enterprise_plan" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "legal_form" "text",
    "ice" "text",
    "rc" "text",
    "if_number" "text",
    "cnss" "text",
    "patente" "text",
    "country" "text" DEFAULT 'Morocco'::"text",
    "logo_url" "text"
);


ALTER TABLE "public"."entreprises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."file_uploads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "uploaded_by" "uuid",
    "entreprise_id" "uuid",
    "file_name" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "storage_path" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."file_uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hr_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."hr_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leave_balances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "leave_type" "public"."leave_type" NOT NULL,
    "year" smallint DEFAULT EXTRACT(year FROM "now"()) NOT NULL,
    "total_days" smallint DEFAULT 0 NOT NULL,
    "used_days" smallint DEFAULT 0 NOT NULL,
    "remaining_days" smallint GENERATED ALWAYS AS (("total_days" - "used_days")) STORED,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."leave_balances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."notification_type" DEFAULT 'info'::"public"."notification_type" NOT NULL,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "related_entity" "text",
    "related_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payrolls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "salary_base" numeric(12,2) NOT NULL,
    "overtime_hours" numeric(5,2) DEFAULT 0,
    "overtime_pay" numeric(12,2) DEFAULT 0,
    "bonuses" numeric(12,2) DEFAULT 0,
    "deductions" numeric(12,2) DEFAULT 0,
    "net_salary" numeric(12,2) NOT NULL,
    "status" "public"."payroll_status" DEFAULT 'draft'::"public"."payroll_status" NOT NULL,
    "processed_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payrolls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "resource" "text" NOT NULL,
    "action" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."presences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "check_in_time" time without time zone,
    "check_out_time" time without time zone,
    "hours_worked" numeric(5,2),
    "overtime_hours" numeric(5,2) DEFAULT 0,
    "status" "public"."attendance_status" DEFAULT 'present'::"public"."attendance_status" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."presences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entreprise_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "public"."project_status" DEFAULT 'planning'::"public"."project_status" NOT NULL,
    "start_date" "date",
    "end_date" "date",
    "budget" numeric(12,2),
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recrutements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entreprise_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "requirements" "text",
    "department_id" "uuid",
    "employment_type" "public"."employment_type" DEFAULT 'full_time'::"public"."employment_type" NOT NULL,
    "location" "text",
    "salary_min" numeric(12,2),
    "salary_max" numeric(12,2),
    "status" "public"."recruitment_status" DEFAULT 'draft'::"public"."recruitment_status" NOT NULL,
    "created_by" "uuid",
    "published_at" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."recrutements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_change_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "from_role" "public"."user_role" NOT NULL,
    "to_role" "public"."user_role" NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."role_change_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "public"."user_role" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "entreprise_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entreprise_id" "uuid",
    "category" "text" NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "is_encrypted" boolean DEFAULT false,
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."task_status" DEFAULT 'todo'::"public"."task_status" NOT NULL,
    "priority" "public"."task_priority" DEFAULT 'medium'::"public"."task_priority" NOT NULL,
    "assigned_to" "uuid",
    "created_by" "uuid",
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "validated_at" timestamp with time zone,
    "validated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_manager_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."team_manager_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "theme" "text" DEFAULT 'light'::"text",
    "language" "text" DEFAULT 'en'::"text",
    "timezone" "text" DEFAULT 'UTC'::"text",
    "notifications" "jsonb" DEFAULT '{"sms": false, "push": true, "email": true}'::"jsonb",
    "dashboard_layout" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "entreprise_id" "uuid",
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."user_role" DEFAULT 'EMPLOYEE'::"public"."user_role" NOT NULL,
    "status" "public"."user_status" DEFAULT 'active'::"public"."user_status" NOT NULL,
    "avatar_initials" "text",
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_image_url" "text",
    "password_hash" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vacances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "leave_type" "public"."leave_type" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "days_count" smallint NOT NULL,
    "reason" "text",
    "status" "public"."leave_status" DEFAULT 'pending'::"public"."leave_status" NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vacances" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_profiles"
    ADD CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_profiles"
    ADD CONSTRAINT "admin_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."ai_interactions"
    ADD CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytiques"
    ADD CONSTRAINT "analytiques_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cache_metadata"
    ADD CONSTRAINT "cache_metadata_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."cache_metadata"
    ADD CONSTRAINT "cache_metadata_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "candidates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_certifications"
    ADD CONSTRAINT "employee_certifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_skills"
    ADD CONSTRAINT "employee_skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_employee_code_key" UNIQUE ("employee_code");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."entreprises"
    ADD CONSTRAINT "entreprises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."file_uploads"
    ADD CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hr_profiles"
    ADD CONSTRAINT "hr_profiles_employee_id_key" UNIQUE ("employee_id");



ALTER TABLE ONLY "public"."hr_profiles"
    ADD CONSTRAINT "hr_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leave_balances"
    ADD CONSTRAINT "leave_balances_employee_id_leave_type_year_key" UNIQUE ("employee_id", "leave_type", "year");



ALTER TABLE ONLY "public"."leave_balances"
    ADD CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payrolls"
    ADD CONSTRAINT "payrolls_employee_id_period_start_period_end_key" UNIQUE ("employee_id", "period_start", "period_end");



ALTER TABLE ONLY "public"."payrolls"
    ADD CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."presences"
    ADD CONSTRAINT "presences_employee_id_date_key" UNIQUE ("employee_id", "date");



ALTER TABLE ONLY "public"."presences"
    ADD CONSTRAINT "presences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recrutements"
    ADD CONSTRAINT "recrutements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_change_requests"
    ADD CONSTRAINT "role_change_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_permission_id_entreprise_id_key" UNIQUE ("role", "permission_id", "entreprise_id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_entreprise_id_category_key_key" UNIQUE ("entreprise_id", "category", "key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_manager_profiles"
    ADD CONSTRAINT "team_manager_profiles_employee_id_key" UNIQUE ("employee_id");



ALTER TABLE ONLY "public"."team_manager_profiles"
    ADD CONSTRAINT "team_manager_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vacances"
    ADD CONSTRAINT "vacances_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_ai_interactions_created" ON "public"."ai_interactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_ai_interactions_type" ON "public"."ai_interactions" USING "btree" ("interaction_type");



CREATE INDEX "idx_ai_interactions_user" ON "public"."ai_interactions" USING "btree" ("user_id");



CREATE INDEX "idx_audit_logs_created" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_entity" ON "public"."audit_logs" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_audit_logs_entreprise" ON "public"."audit_logs" USING "btree" ("entreprise_id");



CREATE INDEX "idx_audit_logs_user" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_cache_expires" ON "public"."cache_metadata" USING "btree" ("expires_at");



CREATE INDEX "idx_cache_key" ON "public"."cache_metadata" USING "btree" ("cache_key");



CREATE INDEX "idx_candidates_recrutement" ON "public"."candidates" USING "btree" ("recrutement_id");



CREATE INDEX "idx_candidates_stage" ON "public"."candidates" USING "btree" ("stage");



CREATE INDEX "idx_candidates_status" ON "public"."candidates" USING "btree" ("status");



CREATE INDEX "idx_documents_employee" ON "public"."documents" USING "btree" ("employee_id");



CREATE INDEX "idx_documents_entreprise" ON "public"."documents" USING "btree" ("entreprise_id");



CREATE INDEX "idx_documents_status" ON "public"."documents" USING "btree" ("status");



CREATE INDEX "idx_employees_department" ON "public"."employees" USING "btree" ("department_id");



CREATE INDEX "idx_employees_entreprise" ON "public"."employees" USING "btree" ("entreprise_id");



CREATE INDEX "idx_employees_manager" ON "public"."employees" USING "btree" ("manager_id");



CREATE INDEX "idx_employees_status" ON "public"."employees" USING "btree" ("status");



CREATE INDEX "idx_employees_user_id" ON "public"."employees" USING "btree" ("user_id");



CREATE INDEX "idx_leave_balances_employee" ON "public"."leave_balances" USING "btree" ("employee_id");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_payrolls_employee" ON "public"."payrolls" USING "btree" ("employee_id");



CREATE INDEX "idx_payrolls_period" ON "public"."payrolls" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_payrolls_status" ON "public"."payrolls" USING "btree" ("status");



CREATE INDEX "idx_presences_date" ON "public"."presences" USING "btree" ("date");



CREATE INDEX "idx_presences_employee" ON "public"."presences" USING "btree" ("employee_id");



CREATE INDEX "idx_projects_created_by" ON "public"."projects" USING "btree" ("created_by");



CREATE INDEX "idx_projects_entreprise" ON "public"."projects" USING "btree" ("entreprise_id");



CREATE INDEX "idx_projects_status" ON "public"."projects" USING "btree" ("status");



CREATE INDEX "idx_recrutements_department" ON "public"."recrutements" USING "btree" ("department_id");



CREATE INDEX "idx_recrutements_entreprise" ON "public"."recrutements" USING "btree" ("entreprise_id");



CREATE INDEX "idx_recrutements_status" ON "public"."recrutements" USING "btree" ("status");



CREATE INDEX "idx_role_perms_permission" ON "public"."role_permissions" USING "btree" ("permission_id");



CREATE INDEX "idx_role_perms_role" ON "public"."role_permissions" USING "btree" ("role");



CREATE INDEX "idx_role_requests_status" ON "public"."role_change_requests" USING "btree" ("status");



CREATE INDEX "idx_role_requests_user" ON "public"."role_change_requests" USING "btree" ("user_id");



CREATE INDEX "idx_settings_category" ON "public"."system_settings" USING "btree" ("category");



CREATE INDEX "idx_settings_entreprise" ON "public"."system_settings" USING "btree" ("entreprise_id");



CREATE INDEX "idx_tasks_assigned_to" ON "public"."tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_tasks_priority" ON "public"."tasks" USING "btree" ("priority");



CREATE INDEX "idx_tasks_project" ON "public"."tasks" USING "btree" ("project_id");



CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");



CREATE INDEX "idx_uploads_entity" ON "public"."file_uploads" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_uploads_user" ON "public"."file_uploads" USING "btree" ("uploaded_by");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_entreprise" ON "public"."users" USING "btree" ("entreprise_id");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_users_status" ON "public"."users" USING "btree" ("status");



CREATE INDEX "idx_vacances_employee" ON "public"."vacances" USING "btree" ("employee_id");



CREATE INDEX "idx_vacances_status" ON "public"."vacances" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "trg_candidates_updated_at" BEFORE UPDATE ON "public"."candidates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_departments_updated_at" BEFORE UPDATE ON "public"."departments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_documents_updated_at" BEFORE UPDATE ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_employees_updated_at" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_leave_balances_updated_at" BEFORE UPDATE ON "public"."leave_balances" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_payrolls_updated_at" BEFORE UPDATE ON "public"."payrolls" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_presences_updated_at" BEFORE UPDATE ON "public"."presences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_recrutements_updated_at" BEFORE UPDATE ON "public"."recrutements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_vacances_updated_at" BEFORE UPDATE ON "public"."vacances" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."admin_profiles"
    ADD CONSTRAINT "admin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_interactions"
    ADD CONSTRAINT "ai_interactions_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "public"."entreprises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_interactions"
    ADD CONSTRAINT "ai_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."analytiques"
    ADD CONSTRAINT "analytiques_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "public"."entreprises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytiques"
    ADD CONSTRAINT "analytiques_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "public"."entreprises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "candidates_recrutement_id_fkey" FOREIGN KEY ("recrutement_id") REFERENCES "public"."recrutements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "public"."entreprises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "public"."entreprises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employee_certifications"
    ADD CONSTRAINT "employee_certifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_skills"
    ADD CONSTRAINT "employee_skills_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "public"."entreprises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."file_uploads"
    ADD CONSTRAINT "file_uploads_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "public"."entreprises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."file_uploads"
    ADD CONSTRAINT "file_uploads_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."hr_profiles"
    ADD CONSTRAINT "hr_profiles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leave_balances"
    ADD CONSTRAINT "leave_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payrolls"
    ADD CONSTRAINT "payrolls_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payrolls"
    ADD CONSTRAINT "payrolls_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."presences"
    ADD CONSTRAINT "presences_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "public"."entreprises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recrutements"
    ADD CONSTRAINT "recrutements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."recrutements"
    ADD CONSTRAINT "recrutements_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."recrutements"
    ADD CONSTRAINT "recrutements_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "public"."entreprises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_change_requests"
    ADD CONSTRAINT "role_change_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."role_change_requests"
    ADD CONSTRAINT "role_change_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "public"."entreprises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "public"."entreprises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."team_manager_profiles"
    ADD CONSTRAINT "team_manager_profiles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "public"."entreprises"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vacances"
    ADD CONSTRAINT "vacances_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vacances"
    ADD CONSTRAINT "vacances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



CREATE POLICY "Admin HR manage departments" ON "public"."departments" USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admin HR manage employees" ON "public"."employees" USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admin HR read all employees" ON "public"."employees" FOR SELECT USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admin HR read all users" ON "public"."users" FOR SELECT USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admin HR update users" ON "public"."users" FOR UPDATE USING ("public"."is_admin_or_hr"());



CREATE POLICY "Admins can view their entreprise" ON "public"."entreprises" FOR SELECT TO "authenticated" USING (("id" IN ( SELECT "users"."entreprise_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins manage all entreprises" ON "public"."entreprises" USING ("public"."is_admin"());



CREATE POLICY "Employees read own record" ON "public"."employees" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Manager reads team employees" ON "public"."employees" FOR SELECT USING (("public"."is_manager"() AND ("entreprise_id" = "public"."auth_user_entreprise"())));



CREATE POLICY "Same entreprise reads departments" ON "public"."departments" FOR SELECT USING (("entreprise_id" = "public"."auth_user_entreprise"()));



CREATE POLICY "Users can view own data" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users read own profile" ON "public"."users" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Users see their own entreprise" ON "public"."entreprises" FOR SELECT USING (("id" = "public"."auth_user_entreprise"()));



CREATE POLICY "Users update own profile" ON "public"."users" FOR UPDATE USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."admin_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_profiles_self_select" ON "public"."admin_profiles" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."ai_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_recommendations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_self_all" ON "public"."ai_interactions" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."analytiques" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_user_select" ON "public"."audit_logs" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."cache_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."candidates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_certifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employees_self_select" ON "public"."employees" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "employees_self_update" ON "public"."employees" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."entreprises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."file_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hr_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leave_balances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_self_all" ON "public"."notifications" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."payrolls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "permissions_all_select" ON "public"."permissions" FOR SELECT USING (true);



CREATE POLICY "preferences_self_all" ON "public"."user_preferences" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."presences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_employee_select" ON "public"."projects" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tasks"
  WHERE (("tasks"."project_id" = "projects"."id") AND ("tasks"."assigned_to" = "auth"."uid"())))));



ALTER TABLE "public"."recrutements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_change_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "role_perms_all_select" ON "public"."role_permissions" FOR SELECT USING (true);



CREATE POLICY "role_requests_self_insert" ON "public"."role_change_requests" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "role_requests_self_select" ON "public"."role_change_requests" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks_employee_select" ON "public"."tasks" FOR SELECT USING (("assigned_to" = "auth"."uid"()));



CREATE POLICY "tasks_employee_update_status" ON "public"."tasks" FOR UPDATE USING (("assigned_to" = "auth"."uid"())) WITH CHECK (("assigned_to" = "auth"."uid"()));



ALTER TABLE "public"."team_manager_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "uploads_self_insert" ON "public"."file_uploads" FOR INSERT WITH CHECK (("uploaded_by" = "auth"."uid"()));



ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_self_select" ON "public"."users" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "users_self_update" ON "public"."users" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."vacances" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."auth_employee_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_employee_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_employee_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_user_entreprise"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_user_entreprise"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_user_entreprise"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_hr_or_manager"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_hr_or_manager"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_hr_or_manager"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_or_hr"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_or_hr"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_hr"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_hr"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_hr"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_hr"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_manager"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_manager"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_manager"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_my_team_member"("emp_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_my_team_member"("emp_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_my_team_member"("emp_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_audit_trail"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_audit_trail"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_audit_trail"() TO "service_role";



GRANT ALL ON FUNCTION "public"."provision_enterprise_admin"("p_auth_user_id" "uuid", "p_name" "text", "p_industry" "text", "p_phone" "text", "p_email" "text", "p_location" "text", "p_plan" "text", "p_legal_form" "text", "p_ice" "text", "p_rc" "text", "p_if_number" "text", "p_cnss" "text", "p_patente" "text", "p_country" "text", "p_logo_url" "text", "p_first_name" "text", "p_last_name" "text", "p_user_email" "text", "p_password_hash" "text", "p_avatar_initials" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."provision_enterprise_admin"("p_auth_user_id" "uuid", "p_name" "text", "p_industry" "text", "p_phone" "text", "p_email" "text", "p_location" "text", "p_plan" "text", "p_legal_form" "text", "p_ice" "text", "p_rc" "text", "p_if_number" "text", "p_cnss" "text", "p_patente" "text", "p_country" "text", "p_logo_url" "text", "p_first_name" "text", "p_last_name" "text", "p_user_email" "text", "p_password_hash" "text", "p_avatar_initials" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."provision_enterprise_admin"("p_auth_user_id" "uuid", "p_name" "text", "p_industry" "text", "p_phone" "text", "p_email" "text", "p_location" "text", "p_plan" "text", "p_legal_form" "text", "p_ice" "text", "p_rc" "text", "p_if_number" "text", "p_cnss" "text", "p_patente" "text", "p_country" "text", "p_logo_url" "text", "p_first_name" "text", "p_last_name" "text", "p_user_email" "text", "p_password_hash" "text", "p_avatar_initials" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."same_entreprise_employee"("emp_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."same_entreprise_employee"("emp_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."same_entreprise_employee"("emp_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_profiles" TO "anon";
GRANT ALL ON TABLE "public"."admin_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."ai_interactions" TO "anon";
GRANT ALL ON TABLE "public"."ai_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."ai_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."ai_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."analytiques" TO "anon";
GRANT ALL ON TABLE "public"."analytiques" TO "authenticated";
GRANT ALL ON TABLE "public"."analytiques" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."cache_metadata" TO "anon";
GRANT ALL ON TABLE "public"."cache_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."cache_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."candidates" TO "anon";
GRANT ALL ON TABLE "public"."candidates" TO "authenticated";
GRANT ALL ON TABLE "public"."candidates" TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."employee_certifications" TO "anon";
GRANT ALL ON TABLE "public"."employee_certifications" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_certifications" TO "service_role";



GRANT ALL ON TABLE "public"."employee_skills" TO "anon";
GRANT ALL ON TABLE "public"."employee_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_skills" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."entreprises" TO "anon";
GRANT ALL ON TABLE "public"."entreprises" TO "authenticated";
GRANT ALL ON TABLE "public"."entreprises" TO "service_role";



GRANT ALL ON TABLE "public"."file_uploads" TO "anon";
GRANT ALL ON TABLE "public"."file_uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."file_uploads" TO "service_role";



GRANT ALL ON TABLE "public"."hr_profiles" TO "anon";
GRANT ALL ON TABLE "public"."hr_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."hr_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."leave_balances" TO "anon";
GRANT ALL ON TABLE "public"."leave_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."leave_balances" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payrolls" TO "anon";
GRANT ALL ON TABLE "public"."payrolls" TO "authenticated";
GRANT ALL ON TABLE "public"."payrolls" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."presences" TO "anon";
GRANT ALL ON TABLE "public"."presences" TO "authenticated";
GRANT ALL ON TABLE "public"."presences" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."recrutements" TO "anon";
GRANT ALL ON TABLE "public"."recrutements" TO "authenticated";
GRANT ALL ON TABLE "public"."recrutements" TO "service_role";



GRANT ALL ON TABLE "public"."role_change_requests" TO "anon";
GRANT ALL ON TABLE "public"."role_change_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."role_change_requests" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."team_manager_profiles" TO "anon";
GRANT ALL ON TABLE "public"."team_manager_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."team_manager_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vacances" TO "anon";
GRANT ALL ON TABLE "public"."vacances" TO "authenticated";
GRANT ALL ON TABLE "public"."vacances" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































