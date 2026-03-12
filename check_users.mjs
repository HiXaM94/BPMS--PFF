import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhynmlxiiknrsduevlii.supabase.co';
const supabaseKey = 'sb_publishable_YyQWyQZ_J1gv22fphCH48w_1S_NtMdW';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    const { data, count, error } = await supabase.from('users').select('*', { count: 'exact' }).limit(5);
    if (error) console.error(error);
    else console.log('Users Count:', count, 'Sample:', data);
}

checkUsers();
