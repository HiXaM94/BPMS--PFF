import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTasksSchema() {
    console.log('Checking tasks table columns...');

    // Try to select the problematic columns
    const { data, error } = await supabase
        .from('tasks')
        .select('id, validated_at, validated_by, rejection_reason, finished, finish')
        .limit(1);

    if (error) {
        console.error('Schema Check Error:', error.message);
        if (error.hint) console.log('Hint:', error.hint);
    } else {
        console.log('Successfully selected columns. Schema matches expected code.');
        console.log('Data sample:', data);
    }
}

checkTasksSchema();
