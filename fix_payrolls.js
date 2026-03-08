import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhynmlxiiknrsduevlii.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc2NzM3OSwiZXhwIjoyMDg3MzQzMzc5fQ.0AynP6jIXQb6Fd18CSXiVkud4NwEhFoWSmFbUKwlzTw';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function insertPayrolls() {
    console.log("Fixing Payroll Insertion...");

    // IDs mapped from the previous successful run
    const empHR = 'e1daaaaa-0000-0000-0000-000000000001';
    const empAdmin = 'e1daaaaa-0000-0000-0000-000000000002';
    const empDev = 'e1daaaaa-0000-0000-0000-000000000003';

    // We need to fetch the admin's user_id to use as created_by
    const { data: adminData } = await supabase.from('employees').select('user_id').eq('id', empAdmin).single();
    const createdBy = adminData ? adminData.user_id : null;

    console.log("Inserting with true live schema columns... (omitting status enum)");
    const { error: payErr } = await supabase.from('payrolls').upsert([
        {
            employee_id: empHR,
            created_by: createdBy,
            period_start: '2026-03-01',
            period_end: '2026-03-31',
            salary_base: 18000,
            bonuses: 500,
            deductions: 1500,
            net_salary: 17000
        },
        {
            employee_id: empAdmin,
            created_by: createdBy,
            period_start: '2026-03-01',
            period_end: '2026-03-31',
            salary_base: 25000,
            bonuses: 0,
            deductions: 3000,
            net_salary: 22000
        },
        {
            employee_id: empDev,
            created_by: createdBy,
            period_start: '2026-03-01',
            period_end: '2026-03-31',
            salary_base: 12000,
            overtime_hours: 10,
            overtime_pay: 500,
            bonuses: 2000,
            deductions: 1500,
            net_salary: 13000
        }
    ], { onConflict: 'employee_id, period_start, period_end' });

    if (payErr) {
        console.error("- Error creating payrolls:", payErr.message);
    } else {
        console.log("- Payrolls successfully generated!");
    }
}

insertPayrolls();
