import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zhynmlxiiknrsduevlii.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjczNzksImV4cCI6MjA4NzM0MzM3OX0.k5pyGEmHv1E2KGv-BfM4CV4oUAfsFxBBUvbueIC0B6I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRPC() {
    console.log("Signing in as hr@bidayalab.com...");
    await supabase.auth.signInWithPassword({
        email: 'hr@bidayalab.com',
        password: 'password123'
    });

    const empId = 'db23d739-911c-4c34-b582-6937e99aa677';
    console.log("Testing with Employee ID:", empId);
    const { data: rpcData, error: rpcErr } = await supabase.rpc('same_entreprise_employee', { emp_id: empId });
    console.log("same_entreprise_employee RPC result:", rpcData, rpcErr || '');
}

testRPC();
