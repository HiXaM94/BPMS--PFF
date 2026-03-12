import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhynmlxiiknrsduevlii.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjczNzksImV4cCI6MjA4NzM0MzM3OX0.k5pyGEmHv1E2KGv-BfM4CV4oUAfsFxBBUvbueIC0B6I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertData() {
    console.log("Connecting to Supabase and fetching a random employee UUID...");

    // We need an employee ID since payrolls references employees(id)
    const { data: employees, error: empError } = await supabase.from('employees').select('id').limit(2);

    if (empError || !employees || employees.length === 0) {
        console.log("No employees found in the mock database. Please ensure the database has employees seeded.");
        return;
    }

    const mockRows = [
        {
            employee_id: employees[0].id,
            month: 'March 2026',
            period_start: '2026-03-01',
            period_end: '2026-03-31',
            base_salary: 15000,
            bonus: 500, // mapped to overtime
            deductions: 0, // mapped to advances
            status: 'GENERATED'
        }
    ];

    if (employees.length > 1) {
        mockRows.push({
            employee_id: employees[1].id,
            month: 'March 2026',
            period_start: '2026-03-01',
            period_end: '2026-03-31',
            base_salary: 12000,
            bonus: 1000,
            deductions: 500,
            status: 'GENERATED'
        });
    }

    console.log("Inserting rows into payrolls table using the correct schema...");
    const { data, error } = await supabase
        .from('payrolls')
        .insert(mockRows)
        .select();

    if (error) {
        console.error("Error inserting data:", error);
    } else {
        console.log("Successfully inserted data!");
        console.log(data);
    }
}

insertData();
