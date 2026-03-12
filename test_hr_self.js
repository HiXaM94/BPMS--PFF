import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zhynmlxiiknrsduevlii.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjczNzksImV4cCI6MjA4NzM0MzM3OX0.k5pyGEmHv1E2KGv-BfM4CV4oUAfsFxBBUvbueIC0B6I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFetch() {
    console.log("Signing in as hr@bidayalab.com...");
    const { error: authErr } = await supabase.auth.signInWithPassword({
        email: 'hr@bidayalab.com',
        password: 'Password123!'
    });

    const { data: userData } = await supabase.auth.getUser();
    console.log("Current Auth UID:", userData?.user?.id);

    // If we have an RPC function, we can test it directly. Let's see if the user themselves can read their own row?
    // "users_self_select" allows id = auth.uid()
    const { data: myUser, error: myErr } = await supabase.from('users').select('*').eq('id', userData?.user?.id).single();
    console.log("HR user reading own row:", myUser, myErr || '');
}

testFetch();
