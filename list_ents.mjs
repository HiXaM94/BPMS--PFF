import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhynmlxiiknrsduevlii.supabase.co';
const supabaseKey = 'sb_publishable_YyQWyQZ_J1gv22fphCH48w_1S_NtMdW';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listEnts() {
    const { data, error } = await supabase.from('entreprises').select('id, name');
    if (error) console.error(error);
    else console.log('Enterprises:', data);
}

listEnts();
