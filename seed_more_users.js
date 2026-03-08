import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://zhynmlxiiknrsduevlii.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc2NzM3OSwiZXhwIjoyMDg3MzQzMzc5fQ.0AynP6jIXQb6Fd18CSXiVkud4NwEhFoWSmFbUKwlzTw';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log('--- Seeding Bidayalab with additional Employees and Overlapping Leaves ---');

    // 1. Get Bidayalab Enterprise ID
    const { data: bidayalab } = await supabaseAdmin.from('entreprises').select('id, name').ilike('name', '%Bidayalab%').single();
    if (!bidayalab) {
        console.error("Bidayalab enterprise not found! Looking for any...");
        process.exit(1);
    }
    const entId = bidayalab.id;
    console.log(`Found Bidayalab : ${entId}`);

    // 2. Get Engineering Dept ID (or any other)
    const { data: dept } = await supabaseAdmin.from('departments').select('id').eq('entreprise_id', entId).ilike('name', '%Engineering%').single();
    const deptId = dept ? dept.id : null;
    console.log(`Found Engineering Dept ID: ${deptId}`);

    // Create 10 mock employees
    const employeesData = [
        { name: 'Sarah Connor', email: 'sarah.c@bidayalab.com', role: 'Team Manager' },
        { name: 'John Smith', email: 'john.s@bidayalab.com', role: 'Developer' },
        { name: 'Emily Clark', email: 'emily.c@bidayalab.com', role: 'QA Engineer' },
        { name: 'David Lee', email: 'david.l@bidayalab.com', role: 'UX Designer' },
        { name: 'Laura Martinez', email: 'laura.m@bidayalab.com', role: 'Developer' },
        { name: 'James Wilson', email: 'james.w@bidayalab.com', role: 'Systems Analyst' },
        { name: 'Olivia Brown', email: 'olivia.b@bidayalab.com', role: 'DevOps Engineer' },
        { name: 'William Davis', email: 'william.d@bidayalab.com', role: 'Frontend Developer' },
        { name: 'Sophia Miller', email: 'sophia.m@bidayalab.com', role: 'Backend Developer' },
        { name: 'Benjamin Taylor', email: 'benjamin.t@bidayalab.com', role: 'Product Manager' }
    ];

    const today = new Date();

    // Create tomorrow, day after tomorrow, etc. for overlap
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today); dayAfter.setDate(dayAfter.getDate() + 2);
    const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekPlus2 = new Date(nextWeek); nextWeekPlus2.setDate(nextWeekPlus2.getDate() + 2);

    const formatDate = (d) => d.toISOString().split('T')[0];

    const leaveSchedules = [
        { type: 'Annual Leave', start: formatDate(today), end: formatDate(nextWeek), status: 'approved' },
        { type: 'Sick Leave', start: formatDate(tomorrow), end: formatDate(dayAfter), status: 'approved' },
        { type: 'Annual Leave', start: formatDate(tomorrow), end: formatDate(nextWeek), status: 'approved' },
        { type: 'Remote Work', start: formatDate(today), end: formatDate(dayAfter), status: 'pending' },
        { type: 'Annual Leave', start: formatDate(dayAfter), end: formatDate(nextWeekPlus2), status: 'pending' },
    ];

    for (let i = 0; i < employeesData.length; i++) {
        const emp = employeesData[i];
        console.log(`Processing ${emp.name}...`);

        // 3. Create Auth User
        const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email: emp.email,
            password: 'password123',
            email_confirm: true,
            user_metadata: { name: emp.name }
        });

        if (authErr && !authErr.message.includes('already exists')) {
            console.error(`Error creating auth user for ${emp.email}:`, authErr);
            continue;
        }

        let userId = authUser?.user?.id;
        if (!userId) { // fallback if exists
            const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
            const existing = allUsers.users.find(u => u.email === emp.email);
            if (existing) userId = existing.id;
        }

        if (!userId) continue;

        // 4. Upsert into public.users
        await supabaseAdmin.from('users').upsert({
            id: userId,
            email: emp.email,
            name: emp.name,
            role: 'EMPLOYEE',
            entreprise_id: entId
        });

        // 5. Insert into employees
        const { data: dbEmp, error: empErr } = await supabaseAdmin.from('employees').insert({
            user_id: userId,
            entreprise_id: entId,
            department_id: deptId,
            position: emp.role,
            hire_date: '2025-01-01',
            salary_base: 15000 + (Math.random() * 5000),
            status: 'active'
        }).select('id').single();

        if (empErr && empErr.code !== '23505') { // ignore duplicate
            console.error(`Error inserting employee ${emp.name}:`, empErr);
            continue;
        }

        // Get the actual employee ID if it was duplicate
        const { data: realEmp } = await supabaseAdmin.from('employees').select('id').eq('user_id', userId).single();
        if (!realEmp) continue;

        const employeeId = realEmp.id;

        // 6. Seed balances
        await supabaseAdmin.from('leave_balances').upsert([
            { employee_id: employeeId, year: 2026, leave_type: 'annual', total_days: 22, used_days: Math.floor(Math.random() * 10) },
            { employee_id: employeeId, year: 2026, leave_type: 'sick', total_days: 10, used_days: Math.floor(Math.random() * 3) },
            { employee_id: employeeId, year: 2026, leave_type: 'remote_work', total_days: 24, used_days: Math.floor(Math.random() * 5) },
        ]);

        // 7. Seed vacation requests (half of them get a request)
        if (i < leaveSchedules.length) {
            const sched = leaveSchedules[i];
            const daysCount = Math.ceil((new Date(sched.end) - new Date(sched.start)) / (1000 * 60 * 60 * 24)) + 1;

            await supabaseAdmin.from('vacances').insert({
                employee_id: employeeId,
                leave_type: sched.type,
                start_date: sched.start,
                end_date: sched.end,
                days_count: daysCount,
                reason: 'Family matters and rest',
                status: sched.status
            });
            console.log(`Inserted ${sched.type} for ${emp.name} (${sched.start} to ${sched.end})`);
        }
    }

    console.log('Done!');
    process.exit(0);
}

main();
