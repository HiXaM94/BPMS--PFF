import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zhynmlxiiknrsduevlii.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc2NzM3OSwiZXhwIjoyMDg3MzQzMzc5fQ.0AynP6jIXQb6Fd18CSXiVkud4NwEhFoWSmFbUKwlzTw';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
    const { data: allVac } = await supabaseAdmin.from('vacances').select('id, employee_id, leave_type').order('created_at', { ascending: false }).limit(10);
    console.log("All Vacances:", allVac);

    if (allVac && allVac.length > 0) {
        const empIds = allVac.map(v => v.employee_id);
        const { data: emps } = await supabaseAdmin.from('employees').select('id, entreprise_id').in('id', empIds);
        console.log("Corresponding Employees:", emps);
    }
}

checkData();
