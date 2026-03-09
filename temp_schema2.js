import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhynmlxiiknrsduevlii.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc2NzM3OSwiZXhwIjoyMDg3MzQzMzc5fQ.0AynP6jIXQb6Fd18CSXiVkud4NwEhFoWSmFbUKwlzTw';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkActualSchema() {
    const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'payrolls' });
    // If no RPC, let's just insert an empty object to trigger the schema cache error and see what happens, or select limit 1.
    console.log("Fetching one row:");
    const { data: rowData, error: rowError } = await supabase.from('payrolls').select('*').limit(1);
    if (rowError) console.error("Row Error:", rowError.message);
    else console.log("Columns present in live DB:", Object.keys(rowData[0] || { "no_data_yet_but_cols": "unknown" }));

    // Let's try to query the schema directly via a deliberate failure
    const { error: fErr } = await supabase.from('payrolls').insert({ made_up_column: true });
    console.log("Deliberate failure:", fErr?.message);
}

checkActualSchema();
