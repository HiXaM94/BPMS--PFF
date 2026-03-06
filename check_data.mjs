import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhynmlxiiknrsduevlii.supabase.co';
const supabaseAnonKey = 'sb_publishable_YyQWyQZ_J1gv22fphCH48w_1S_NtMdW';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const { data: users, error } = await supabase.from('users').select('id, name, role').limit(10);
    if (error) console.error('Error fetching users:', error);
    console.log('First 10 Users:', users);

    const { data: emps } = await supabase.from('employees').select('user_id, position').limit(10);
    console.log('First 10 Employees:', emps);
}

check();
