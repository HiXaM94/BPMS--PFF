import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhynmlxiiknrsduevlii.supabase.co';
const supabaseAnonKey = 'sb_publishable_YyQWyQZ_J1gv22fphCH48w_1S_NtMdW';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkConnection() {
    console.log("Testing connection to Supabase...");

    const { data, error } = await supabase.from('entreprises').select('*').limit(1);

    if (error) {
        console.error("Connection Failed:", error.message);
    } else {
        console.log("Connection Successful! Fetched data:", data);
    }
}

checkConnection();
