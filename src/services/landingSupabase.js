import { createClient } from '@supabase/supabase-js';

// Connection to the Landing Page database (qploscnekhtwhenkhyks)
const supabaseUrl = import.meta.env.VITE_LANDING_SUPABASE_URL || 'https://qploscnekhtwhenkhyks.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_LANDING_SUPABASE_ANON_KEY || 'sb_publishable_keqaIXvoro0tIFdP0n6KfQ_x0iggNbM';

export const landingSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false, // We only need public/anon read access for analytics
    }
});
