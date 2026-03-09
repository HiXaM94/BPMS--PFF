import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zhynmlxiiknrsduevlii.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjczNzksImV4cCI6MjA4NzM0MzM3OX0.k5pyGEmHv1E2KGv-BfM4CV4oUAfsFxBBUvbueIC0B6I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFetch() {
    console.log("Signing in as hr@bidayalab.com...");
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'hr@bidayalab.com',
        password: 'Password123!' // or password123
    });

    if (authErr) {
        if (authErr.message.includes('Invalid login')) {
            const { data: authData2, error: authErr2 } = await supabase.auth.signInWithPassword({
                email: 'hr@bidayalab.com',
                password: 'password123'
            });
            if (authErr2) {
                console.error("Auth failed:", authErr2);
                return;
            }
        }
    }

    const { data: userData } = await supabase.auth.getUser();
    console.log("Current Auth UID:", userData?.user?.id);

    console.log("Fetching all vacances with employees join...");
    const { data: reqs, error: reqErr } = await supabase
        .from('vacances')
        .select(`
            id,
            leave_type,
            status,
            employee_id,
            employees!inner (
                entreprise_id,
                users!inner ( name )
            )
        `)
        .order('created_at', { ascending: false });

    if (reqErr) {
        console.error("Fetch Error:", reqErr);
    } else {
        console.log(`Found ${reqs.length} requests.`);
        if (reqs.length > 0) {
            console.log("Sample request:", JSON.stringify(reqs[0], null, 2));
        }
    }
}

testFetch();
