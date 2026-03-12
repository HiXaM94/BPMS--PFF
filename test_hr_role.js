import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zhynmlxiiknrsduevlii.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjczNzksImV4cCI6MjA4NzM0MzM3OX0.k5pyGEmHv1E2KGv-BfM4CV4oUAfsFxBBUvbueIC0B6I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFetch() {
    console.log("Signing in as hr@bidayalab.com...");
    await supabase.auth.signInWithPassword({
        email: 'hr@bidayalab.com',
        password: 'password123'
    });

    console.log("Calling is_admin_or_hr via RPC...");
    const { data: roleRet, error: roleErr } = await supabase.rpc('is_admin_or_hr');
    console.log("is_admin_or_hr returned:", roleRet, roleErr || '');

    console.log("Calling auth_user_role via RPC...");
    const { data: roleName, error: roleNameErr } = await supabase.rpc('auth_user_role');
    console.log("auth_user_role returned:", roleName, roleNameErr || '');
}

testFetch();
