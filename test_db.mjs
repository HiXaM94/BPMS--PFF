import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDB() {
    console.log('Testing Employee columns...');
    const { data: empData, error: empErr } = await supabase.from('employees').select('password_changed').limit(1);
    if (empErr) console.error('Employee Error:', empErr);
    else console.log('Employee Password Changed column exists! Data sample:', empData);

    console.log('\nTesting Manager columns...');
    const { data: mgrData, error: mgrErr } = await supabase.from('team_manager_profiles').select('password_changed').limit(1);
    if (mgrErr) console.error('Manager Error:', mgrErr);
    else console.log('Manager Password Changed column exists! Data sample:', mgrData);

    console.log('\nTesting RPC presence...');
    // Expecting a JWT missing error since we aren't authenticating as a user, which is fine,
    // we just want to know the function exists securely.
    const { error: rpcErr } = await supabase.rpc('update_profile_password', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_role: 'EMPLOYEE',
        p_password: 'test'
    });
    console.log('RPC Error (expected JWT/foreign key or similar issues, NOT "function not found"):', rpcErr?.message || rpcErr);
}

testDB();
