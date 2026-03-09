import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zhynmlxiiknrsduevlii.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjczNzksImV4cCI6MjA4NzM0MzM3OX0.k5pyGEmHv1E2KGv-BfM4CV4oUAfsFxBBUvbueIC0B6I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFetch() {
    console.log("Signing in as hr@bidayalab.com...");
    let { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'hr@bidayalab.com',
        password: 'password123'
    });

    console.log("Fetching all users...");
    const { data: users, error: usrErr } = await supabase.from('users').select('id, name, email');
    console.log(`HR can see ${users?.length} users.`, usrErr || '');

    console.log("Fetching vacances directly...");
    const { data: vac, error: vacErr } = await supabase.from('vacances').select('*');
    console.log(`HR can see ${vac?.length} vacances.`, vacErr || '');
}

testFetch();
