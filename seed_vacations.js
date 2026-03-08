import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhynmlxiiknrsduevlii.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc2NzM3OSwiZXhwIjoyMDg3MzQzMzc5fQ.0AynP6jIXQb6Fd18CSXiVkud4NwEhFoWSmFbUKwlzTw';

// Initialize Supabase with the SERVICE_ROLE key to bypass RLS and access Auth Admin API
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function seedVacations() {
    console.log('--- Seeding Vacations & Leave Balances for Bidayalab ---');

    // 1. Get Bidayalab Enterprise ID
    let { data: bidayalab } = await supabase.from('entreprises').select('id, name').ilike('name', '%Bidayalab%').single();
    if (!bidayalab) {
        console.log('Exact Bidayalab name not found, picking the first enterprise...');
        const { data: anyEnt } = await supabase.from('entreprises').select('id, name').limit(1).single();
        if (!anyEnt) {
            console.error('No enterprises found at all!');
            return;
        }
        bidayalab = anyEnt;
    }
    const entrepriseId = bidayalab.id;
    console.log(`Found Enterprise: ${bidayalab.name} (ID: ${entrepriseId})`);

    // 2. Get all Bidayalab Employees + Users info
    const { data: employees } = await supabase
        .from('employees')
        .select(`
            id,
            user_id,
            position,
            users ( name, email, role )
        `)
        .eq('entreprise_id', entrepriseId);

    if (!employees || employees.length === 0) {
        console.error('No employees found in Bidayalab.');
        return;
    }
    console.log(`Found ${employees.length} employees.`);

    // 3. Insert Base Leave Balances for each employee for the current year
    const currentYear = new Date().getFullYear();
    const balancesToInsert = [];

    employees.forEach(emp => {
        // Annual, Sick, Unpaid, Remote
        balancesToInsert.push({ employee_id: emp.id, leave_type: 'annual', total_days: 22, used_days: Math.floor(Math.random() * 5), year: currentYear });
        balancesToInsert.push({ employee_id: emp.id, leave_type: 'sick', total_days: 10, used_days: Math.floor(Math.random() * 3), year: currentYear });
        balancesToInsert.push({ employee_id: emp.id, leave_type: 'unpaid', total_days: 30, used_days: 0, year: currentYear });
        balancesToInsert.push({ employee_id: emp.id, leave_type: 'remote_work', total_days: 20, used_days: Math.floor(Math.random() * 10), year: currentYear });
    });

    console.log(`Inserting ${balancesToInsert.length} leave balances...`);
    // Upsert balances (on conflict do nothing or update)
    const { error: balErr } = await supabase.from('leave_balances').upsert(balancesToInsert, { onConflict: 'employee_id, leave_type, year' });
    if (balErr) console.error('Error inserting balances:', balErr);
    else console.log('Leave balances inserted.');

    // 4. Create sample Vacances (Leave Requests)
    // Clear existing for a clean slate
    await supabase.from('vacances').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const requestsToInsert = [];

    // Find HR Manager, Admin inside the team
    const hrEmp = employees[0];
    const adminEmp = employees[1];
    const empRegular = employees[2];

    console.log(`Found HR: ${hrEmp?.users?.name}, Admin: ${adminEmp?.users?.name}, Employee: ${empRegular?.users?.name}`);

    // Some historical approved
    if (empRegular) {
        requestsToInsert.push({
            employee_id: empRegular.id, // Correct column mapping for 'vacances'
            leave_type: 'annual',
            start_date: '2026-02-10',
            end_date: '2026-02-12',
            days_count: 3,
            reason: 'Family visit',
            status: 'approved'
        });
        // Pending future request
        requestsToInsert.push({
            employee_id: empRegular.id,
            leave_type: 'annual',
            start_date: '2026-04-15',
            end_date: '2026-04-20',
            days_count: 4, // Excludes weekend basically
            reason: 'Spring break trip',
            status: 'pending'
        });
        // Rejected request
        requestsToInsert.push({
            employee_id: empRegular.id,
            leave_type: 'sick',
            start_date: '2026-03-01',
            end_date: '2026-03-01',
            days_count: 1,
            reason: 'Headache',
            status: 'rejected'
        });
    }

    if (hrEmp) {
        requestsToInsert.push({
            employee_id: hrEmp.id,
            leave_type: 'remote_work',
            start_date: '2026-03-10',
            end_date: '2026-03-12',
            days_count: 3,
            reason: 'Working from another city',
            status: 'pending'
        });
    }

    if (adminEmp) {
        requestsToInsert.push({
            employee_id: adminEmp.id,
            leave_type: 'annual',
            start_date: '2026-01-05',
            end_date: '2026-01-15',
            days_count: 10,
            reason: 'Winter holidays',
            status: 'approved'
        });
    }

    // Add a few random ones for other employees
    const otherEmps = employees.slice(3);
    otherEmps.forEach((e, i) => {
        requestsToInsert.push({
            employee_id: e.id,
            leave_type: i % 2 === 0 ? 'sick' : 'unpaid',
            start_date: `2026-03-${10 + i}`,
            end_date: `2026-03-${12 + i}`,
            days_count: 3,
            reason: 'Personal time off',
            status: 'pending'
        });
    });

    console.log(`Inserting ${requestsToInsert.length} leave requests...`);
    const { error: reqErr } = await supabase.from('vacances').insert(requestsToInsert);
    if (reqErr) console.error('Error inserting requests:', reqErr);
    else console.log('Leave requests inserted.');

    console.log('--- Seeding Complete ---');
    process.exit(0);
}

seedVacations();
