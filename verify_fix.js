import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhynmlxiiknrsduevlii.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjczNzksImV4cCI6MjA4NzM0MzM3OX0.k5pyGEmHv1E2KGv-BfM4CV4oUAfsFxBBUvbueIC0B6I';

const client = createClient(supabaseUrl, anonKey);

async function verify() {
    console.log("=== Verifying RLS fix ===\n");

    const { data: signIn } = await client.auth.signInWithPassword({
        email: 'hr@bidayalab.com',
        password: 'password123'
    });

    if (!signIn?.user) { console.log("Sign-in failed!"); return; }
    console.log("Signed in as:", signIn.user.email);

    const { data, error } = await client
        .from('payrolls')
        .select('*')
        .gte('period_start', '2026-03-01')
        .lte('period_end', '2026-03-31');

    if (error) console.error("Query error:", error.message);
    else {
        console.log(`HR user now sees: ${data.length} payroll rows!`);
        if (data.length > 0) {
            console.log("Data:", data.map(r => ({ employee_id: r.employee_id, net_salary: r.net_salary })));
            const total = data.reduce((sum, r) => sum + (r.net_salary || 0), 0);
            console.log(`\nTotal Net Salary: ${total} MAD`);
            console.log("\n✅ SUCCESS! The app should now show this live data instead of mock data.");
        } else {
            console.log("Still 0 rows - RLS policies may not have been applied correctly.");
        }
    }
}
verify();
