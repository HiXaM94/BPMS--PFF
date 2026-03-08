import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zhynmlxiiknrsduevlii.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc2NzM3OSwiZXhwIjoyMDg3MzQzMzc5fQ.0AynP6jIXQb6Fd18CSXiVkud4NwEhFoWSmFbUKwlzTw';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
    console.log("Checking all vacances...");
    const { data: allVac } = await supabaseAdmin.from('vacances').select('id, employee_id');
    console.log(`Total vacances in DB: ${allVac.length}`);

    console.log("Checking hr@bidayalab.com user record...");
    const { data: hrUser } = await supabaseAdmin.from('users').select('*').eq('email', 'hr@bidayalab.com').single();
    console.log("HR User entreprise_id:", hrUser?.entreprise_id);

    console.log("Checking some employee records from vacances...");
    if (allVac.length > 0) {
        const sampleEmpIds = allVac.slice(0, 3).map(v => v.employee_id);
        const { data: emps } = await supabaseAdmin.from('employees').select('id, entreprise_id').in('id', sampleEmpIds);
        console.log("Sample Employees from vacances:", emps);
    }
}

checkData();
