import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhynmlxiiknrsduevlii.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjczNzksImV4cCI6MjA4NzM0MzM3OX0.k5pyGEmHv1E2KGv-BfM4CV4oUAfsFxBBUvbueIC0B6I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    console.log("Fetching one row to check the payrolls schema...");
    const { data, error } = await supabase.from('payrolls').select('*').limit(1);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Data exists:", data);
        if (data.length > 0) {
            console.log("Keys available:", Object.keys(data[0]));
        } else {
            console.log("Table is empty. Cannot infer schema from data.");
            // Try to insert a minimal row to see if it works
            const minimal = { period: 'March 2026', net_salary: 1000 };
            console.log("Testing minimal insert:", minimal);
            const { error: insErr } = await supabase.from('payrolls').insert([minimal]);
            if (insErr) {
                console.error("Minimal insert failed:", insErr);
            } else {
                console.log("Minimal insert succeeded!");
            }
        }
    }
}

checkSchema();
