import { createClient } from '@supabase/supabase-js';

// Use the ANON key (same as the app uses) to test what the app actually sees
const supabaseUrl = 'https://zhynmlxiiknrsduevlii.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjczNzksImV4cCI6MjA4NzM0MzM3OX0.k5pyGEmHv1E2KGv-BfM4CV4oUAfsFxBBUvbueIC0B6I';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc2NzM3OSwiZXhwIjoyMDg3MzQzMzc5fQ.0AynP6jIXQb6Fd18CSXiVkud4NwEhFoWSmFbUKwlzTw';

const anonClient = createClient(supabaseUrl, anonKey);
const adminClient = createClient(supabaseUrl, serviceKey);

async function debug() {
    console.log("=== DEBUG: Checking payroll data ===\n");

    // 1. Check with SERVICE ROLE (bypasses RLS)
    console.log("1. Querying with SERVICE ROLE key (bypasses RLS):");
    const { data: adminData, error: adminError } = await adminClient
        .from('payrolls')
        .select('*')
        .gte('period_start', '2026-03-01')
        .lte('period_end', '2026-03-31');

    if (adminError) console.error("   Admin Error:", adminError.message);
    else console.log(`   Found ${adminData.length} rows:`, adminData.map(r => ({ id: r.id, employee_id: r.employee_id, net_salary: r.net_salary, period_start: r.period_start })));

    // 2. Check with ANON key (respects RLS - what the app sees!)
    console.log("\n2. Querying with ANON key (respects RLS - same as the app):");
    const { data: anonData, error: anonError } = await anonClient
        .from('payrolls')
        .select('*')
        .gte('period_start', '2026-03-01')
        .lte('period_end', '2026-03-31');

    if (anonError) console.error("   Anon Error:", anonError.message);
    else console.log(`   Found ${anonData.length} rows`);

    // 3. Sign in as HR user and check
    console.log("\n3. Signing in as hr@bidayalab.com and querying:");
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
        email: 'hr@bidayalab.com',
        password: 'password123'
    });
    if (signInError) {
        console.error("   Sign-in Error:", signInError.message);
    } else {
        console.log("   Signed in successfully as:", signInData.user.email);
        const { data: hrData, error: hrError } = await anonClient
            .from('payrolls')
            .select('*')
            .gte('period_start', '2026-03-01')
            .lte('period_end', '2026-03-31');

        if (hrError) console.error("   HR Query Error:", hrError.message);
        else console.log(`   HR sees ${hrData.length} rows:`, hrData.map(r => ({ employee_id: r.employee_id, net_salary: r.net_salary })));
    }

    // 4. Check RLS policies on payrolls table
    console.log("\n4. Checking RLS policies on payrolls table:");
    const { data: policies, error: polError } = await adminClient.rpc('get_policies', { table_name: 'payrolls' });
    if (polError) {
        console.log("   (RPC not available, checking manually via SQL)");
        // Try a direct query
        const { data: rlsCheck } = await adminClient.from('payrolls').select('id').limit(1);
        console.log("   Admin can see data?", rlsCheck && rlsCheck.length > 0 ? "YES" : "NO");
    } else {
        console.log("   Policies:", policies);
    }
}

debug();
