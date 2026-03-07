import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
if (!supabaseUrl || URL === 'YOUR_SUPABASE_URL') {
    console.log('Need URL');
}

// But I don't have the env vars loaded!
