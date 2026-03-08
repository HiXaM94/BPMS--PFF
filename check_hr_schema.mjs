import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHRProfilesSchema() {
    console.log('Checking hr_profiles table columns...');

    // select * from hr_profiles limit 0 is a quick way to get column names if the driver supports it
    // but with supabase-js, we can try to select specific columns we suspect exist
    const suspects = ['id', 'employee_id', 'user_id', 'password_hash', 'password_changed', 'created_at'];

    const { data, error } = await supabase
        .from('hr_profiles')
        .select(suspects.join(','))
        .limit(1);

    if (error) {
        console.error('Schema Check Error:', error.message);
        if (error.hint) console.log('Hint:', error.hint);

        // Try individually to see which ones fail
        for (const col of suspects) {
            const { error: colError } = await supabase.from('hr_profiles').select(col).limit(1);
            if (colError) {
                console.log(`Column [${col}] does NOT exist or error: ${colError.message}`);
            } else {
                console.log(`Column [${col}] exists.`);
            }
        }
    } else {
        console.log('Successfully selected suspected columns. Data sample:', data);
    }
}

checkHRProfilesSchema();
