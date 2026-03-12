import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhynmlxiiknrsduevlii.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjczNzksImV4cCI6MjA4NzM0MzM3OX0.k5pyGEmHv1E2KGv-BfM4CV4oUAfsFxBBUvbueIC0B6I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedData() {
    console.log("Seeding Enterprise, User, Employee, and Payroll data...");

    const enterpriseId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const employeeId = crypto.randomUUID();

    // 1. Minimum Enterprise
    console.log("-> Inserting Enterprise...");
    const { error: entError } = await supabase.from('entreprises').insert([{
        id: enterpriseId,
        name: 'Demo Company for Payroll Test'
    }]);
    if (entError) { console.error("Error Enterprise:", entError); return; }

    // 2. Minimum User (bypassing Auth constraints if allowed by policy context, otherwise we hope RLS allows it)
    console.log("-> Inserting User...");
    const { error: usrError } = await supabase.from('users').insert([{
        id: userId,
        entreprise_id: enterpriseId,
        name: 'Demo Employee User',
        email: `demo-${Date.now()}@example.com`
    }]);
    if (usrError) { console.error("Error User:", usrError); return; }

    // 3. Minimum Employee
    console.log("-> Inserting Employee...");
    const { error: empError } = await supabase.from('employees').insert([{
        id: employeeId,
        user_id: userId,
        entreprise_id: enterpriseId,
        position: 'Tester',
        salary_base: 15000
    }]);
    if (empError) { console.error("Error Employee:", empError); return; }

    // 4. Finally, the Payroll
    console.log("-> Inserting Payroll for March 2026...");
    const mockRows = [{
        employee_id: employeeId,
        month: 'March 2026',
        period_start: '2026-03-01',
        period_end: '2026-03-31',
        base_salary: 15000,
        bonus: 1000,
        deductions: 0,
        status: 'GENERATED'
    }];

    const { data, error } = await supabase.from('payrolls').insert(mockRows).select();

    if (error) {
        console.error("Error Payroll:", error);
    } else {
        console.log("Successfully inserted ALL data! Payrolls:", data);
    }
}

seedData();
