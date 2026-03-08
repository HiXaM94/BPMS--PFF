import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zhynmlxiiknrsduevlii.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjczNzksImV4cCI6MjA4NzM0MzM3OX0.k5pyGEmHv1E2KGv-BfM4CV4oUAfsFxBBUvbueIC0B6I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRLS() {
    console.log("Signing in as employee@bidayalab.com...");
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'employee@bidayalab.com',
        password: 'Password123!' // or password123
    });

    if (authErr) {
        if (authErr.message.includes('Invalid login')) {
            const { data: authData2, error: authErr2 } = await supabase.auth.signInWithPassword({
                email: 'employee@bidayalab.com',
                password: 'password123'
            });
            if (authErr2) {
                console.error("Auth failed:", authErr2);
                return;
            }
            console.log("Logged in with 'password123'");
        } else {
            console.error("Auth failed:", authErr);
            return;
        }
    } else {
        console.log("Logged in with 'Password123!'");
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    console.log("Current Auth UID:", userId);

    const { data: emp, error: empErr } = await supabase.from('employees').select('id, user_id').eq('user_id', userId).single();
    if (empErr) {
        console.error("Error fetching employee:", empErr);
        return;
    }
    console.log("Employee Record:", emp);

    // Call the RPC to check auth_employee_id() (Might not be exposed, but we can try)
    const { data: rpcData, error: rpcErr } = await supabase.rpc('auth_employee_id');
    console.log("auth_employee_id() returned:", rpcData, rpcErr ? rpcErr.message : '');

    console.log("Attempting to insert vacance...");
    const { data: vacData, error: vacErr } = await supabase.from('vacances').insert({
        employee_id: emp.id,
        leave_type: 'sick',
        start_date: '2026-03-20',
        end_date: '2026-03-21',
        days_count: 2,
        reason: 'RLS Testing',
        status: 'pending' // Note: the policy might be failing here if 'status' isn't allowed? wait... 'vacances_self_all' allows all.
    }).select();

    if (vacErr) {
        console.error("INSERT ERROR:", vacErr);
    } else {
        console.log("INSERT SUCCESS:", vacData);
        // clean up
        await supabase.from('vacances').delete().eq('id', vacData[0].id);
    }
}

testRLS();
