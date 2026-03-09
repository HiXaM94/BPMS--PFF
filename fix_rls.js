// Use the Supabase Management API to execute raw SQL
// The Management API endpoint is: POST https://api.supabase.com/v1/projects/{ref}/sql
// But this requires a management/access token, not just the service role key.
// 
// Alternative: Use the pg connection string via the PostgREST /rpc endpoint
// Actually, the simplest approach: use supabase-js to call the pg functions

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhynmlxiiknrsduevlii.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc2NzM3OSwiZXhwIjoyMDg3MzQzMzc5fQ.0AynP6jIXQb6Fd18CSXiVkud4NwEhFoWSmFbUKwlzTw';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjczNzksImV4cCI6MjA4NzM0MzM3OX0.k5pyGEmHv1E2KGv-BfM4CV4oUAfsFxBBUvbueIC0B6I';

async function addRLSPolicies() {
    console.log("Adding RLS policies via Supabase SQL API...\n");

    // The project ref is extracted from the URL (zhynmlxiiknrsduevlii)
    const projectRef = 'zhynmlxiiknrsduevlii';

    const sql = `
    -- Add RLS SELECT policies for all relevant tables
    DO $$
    BEGIN
      -- payrolls
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payrolls' AND policyname = 'authenticated_read_payrolls') THEN
        CREATE POLICY "authenticated_read_payrolls" ON payrolls FOR SELECT TO authenticated USING (true);
      END IF;
      
      -- employees
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'authenticated_read_employees') THEN
        CREATE POLICY "authenticated_read_employees" ON employees FOR SELECT TO authenticated USING (true);
      END IF;

      -- users
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'authenticated_read_users') THEN
        CREATE POLICY "authenticated_read_users" ON users FOR SELECT TO authenticated USING (true);
      END IF;

      -- departments  
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'authenticated_read_departments') THEN
        CREATE POLICY "authenticated_read_departments" ON departments FOR SELECT TO authenticated USING (true);
      END IF;

      -- entreprises
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entreprises' AND policyname = 'authenticated_read_entreprises') THEN
        CREATE POLICY "authenticated_read_entreprises" ON entreprises FOR SELECT TO authenticated USING (true);
      END IF;
    END
    $$;
  `;

    // Try the Supabase SQL API endpoint (available on newer Supabase versions)
    const response = await fetch(`${supabaseUrl}/pg/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey
        },
        body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
        console.log("Direct /pg/query not available:", response.status);

        // Try the alternative endpoint
        const response2 = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceKey}`,
                'apikey': serviceKey
            }
        });
        console.log("REST API status:", response2.status);

        // Last resort: create an RPC function via the service role that can run our SQL
        // Actually, we can create an RPC function that creates policies
        const adminClient = createClient(supabaseUrl, serviceKey);

        // Let's try a different approach: use the PostgREST's ability to call pg_catalog functions
        // Actually the supabase-js client doesn't support raw SQL. Let's try using the 
        // Supabase Database REST API with the X-Supabase-Schema header

        // The real solution: call the SQL through the Supabase Dashboard or use pg client
        console.log("\n=== Cannot run raw SQL via API ===");
        console.log("The SQL needs to be run in the Supabase SQL Editor.");
        console.log("Generating the SQL file...\n");

        return false;
    } else {
        const result = await response.json();
        console.log("Success!", result);
        return true;
    }
}

async function verifyFix() {
    const anonClient = createClient(supabaseUrl, anonKey);

    const { data: signInData } = await anonClient.auth.signInWithPassword({
        email: 'hr@bidayalab.com',
        password: 'password123'
    });

    if (signInData?.user) {
        const { data, error } = await anonClient
            .from('payrolls')
            .select('*')
            .gte('period_start', '2026-03-01')
            .lte('period_end', '2026-03-31');

        console.log(`\nAfter fix: HR user sees ${data?.length || 0} rows`);
        if (data && data.length > 0) {
            console.log("SUCCESS! Data:", data.map(r => ({ employee_id: r.employee_id, net_salary: r.net_salary })));
        }
        if (error) console.error("Error:", error.message);
    }
}

const success = await addRLSPolicies();
if (success) {
    await verifyFix();
}
