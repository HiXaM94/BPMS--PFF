import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// We need a Service Role key to create Auth users and bypass RLS table rules
// The user provided the ANON key, not the Service Role key.
// But we will try to insert into the public tables first to see if RLS allows it now.

async function seedBidayalab() {
    console.log("Seeding Bidayalab Company & Users...");

    // 1. Create Company
    const orgId = crypto.randomUUID();
    console.log("-> Creating Enterprise: Bidayalab");
    const { error: entError } = await supabase.from('entreprises').insert([{
        id: orgId,
        name: 'Bidayalab',
        industry: 'Technology',
        status: 'active'
    }]);

    if (entError) {
        console.error("Failed to create Enterprise. RLS is likely blocking anonymous inserts.");
        console.error(entError.message);
        console.log("\n⚠️ To create Auth users with passwords, we MUST use the Supabase Admin API or do it from the Dashboard.");
        return;
    }

    console.log("Successfully created Bidayalab!");
}

seedBidayalab();
