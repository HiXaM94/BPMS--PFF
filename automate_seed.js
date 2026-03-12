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

async function automateBidayalab() {
    console.log("Starting Automated Bidayalab Setup...");

    // --- 1. CREATE AUTH USERS ---
    console.log("\n1. Creating Auth Users (hr, admin, employee)...");

    const usersToCreate = [
        { email: 'hr@bidayalab.com', password: 'password123', emailConfirm: true, role: 'HR', name: 'Bidayalab HR' },
        { email: 'admin@bidayalab.com', password: 'password123', emailConfirm: true, role: 'ADMIN', name: 'Bidayalab Admin' },
        { email: 'employee@bidayalab.com', password: 'password123', emailConfirm: true, role: 'EMPLOYEE', name: 'Bidayalab Employee' }
    ];

    const createdUsers = {};

    for (const u of usersToCreate) {
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: u.emailConfirm,
            user_metadata: { name: u.name, role: u.role } // Store metadata for triggers if they exist
        });

        if (userError) {
            // If user already exists, we might need to fetch them
            if (userError.message.includes('already been registered')) {
                console.log(`- User ${u.email} already exists. Attempting to fetch their ID...`);
                // Search users
                const { data: listUser, error: listError } = await supabase.auth.admin.listUsers();
                if (listError) {
                    console.error(`  Failed to list users to find existing ID: ${listError.message}`);
                    return;
                }
                const existing = listUser.users.find(x => x.email === u.email);
                if (existing) {
                    createdUsers[u.role] = existing.id;
                    console.log(`  Found existing ID: ${existing.id}`);
                } else {
                    console.error(`  Could not locate existing user id for ${u.email}`);
                    return;
                }
            } else {
                console.error(`- Failed to create ${u.email}:`, userError.message);
                return;
            }
        } else {
            createdUsers[u.role] = userData.user.id;
            console.log(`- Created ${u.email} -> UID: ${userData.user.id}`);
            // Supabase often creates triggers that auto-insert into public.users. 
            // We'll give it a split second to fire before moving on.
            await new Promise(r => setTimeout(r, 500));
        }
    }

    // --- 2. CREATE ENTERPRISE & DEPARTMENTS ---
    console.log("\n2. Creating Enterprise & Departments...");
    const entId = 'b1daaaaa-0000-0000-0000-000000000001';

    await supabase.from('entreprises').upsert([{
        id: entId, name: 'Bidayalab', industry: 'Technology', status: 'active'
    }], { onConflict: 'id' });

    const depEng = 'd1daaaaa-0000-0000-0000-000000000001';
    const depHR = 'd1daaaaa-0000-0000-0000-000000000002';
    const depAdmin = 'd1daaaaa-0000-0000-0000-000000000003';

    await supabase.from('departments').upsert([
        { id: depEng, entreprise_id: entId, name: 'Engineering' },
        { id: depHR, entreprise_id: entId, name: 'Human Resources' },
        { id: depAdmin, entreprise_id: entId, name: 'Management' }
    ], { onConflict: 'id' });
    console.log("- Enterprise and Departments created successfully.");


    // --- 3. FIX PUBLIC.USERS LINKING ---
    // Because we used auth.admin.createUser, the public.users table might have been auto-populated by a trigger.
    // We need to update those rows with the Enterprise ID and Roles.
    console.log("\n3. Linking Users to Enterprise...");
    for (const role in createdUsers) {
        const uId = createdUsers[role];
        const matchEmail = usersToCreate.find(u => u.role === role).email;
        const matchName = usersToCreate.find(u => u.role === role).name;

        const { error: updErr } = await supabase.from('users').upsert({
            id: uId, // Use the required Auth ID
            email: matchEmail,
            name: matchName,
            role: role,
            entreprise_id: entId
        }, { onConflict: 'id' });

        if (updErr) {
            console.error(`- Error updating public user ${matchEmail}:`, updErr.message);
        } else {
            console.log(`- Linked ${matchEmail} to Bidayalab.`);
        }
    }

    // --- 4. CREATE EMPLOYEE PROFILES ---
    console.log("\n4. Creating Employee Records...");
    const empHR = 'e1daaaaa-0000-0000-0000-000000000001';
    const empAdmin = 'e1daaaaa-0000-0000-0000-000000000002';
    const empDev = 'e1daaaaa-0000-0000-0000-000000000003';

    const { error: eErr } = await supabase.from('employees').upsert([
        { id: empHR, user_id: createdUsers['HR'], entreprise_id: entId, department_id: depHR, position: 'HR Manager', hire_date: '2026-01-01', salary_base: 18000, status: 'active' },
        { id: empAdmin, user_id: createdUsers['ADMIN'], entreprise_id: entId, department_id: depAdmin, position: 'Company Admin', hire_date: '2026-01-01', salary_base: 25000, status: 'active' },
        { id: empDev, user_id: createdUsers['EMPLOYEE'], entreprise_id: entId, department_id: depEng, position: 'Developer', hire_date: '2026-02-01', salary_base: 12000, status: 'active' }
    ], { onConflict: 'id' });

    if (eErr) {
        console.error("- Error creating employees:", eErr.message);
        return;
    }
    console.log("- Employees created.");

    // --- 5. CREATE ROLE RESOURCES ---
    console.log("\n5. Creating Role Resources (hr_profiles etc)...");
    await supabase.from('hr_profiles').upsert([{ employee_id: empHR }], { onConflict: 'employee_id' });
    await supabase.from('admin_profiles').upsert([{ user_id: createdUsers['ADMIN'] }], { onConflict: 'user_id' });
    console.log("- Profiles mapped.");

    // --- 6. INSERT PAYROLLS ---
    console.log("\n6. Generating March 2026 Payrolls...");
    const { error: payErr } = await supabase.from('payrolls').insert([
        { employee_id: empHR, user_id: createdUsers['HR'], generated_by: createdUsers['ADMIN'], month: 'March 2026', period: 'March 2026', period_start: '2026-03-01', period_end: '2026-03-31', base_salary: 18000, gross_salary: 18000, net_salary: 16500, deductions: 1500, status: 'GENERATED' },
        { employee_id: empAdmin, user_id: createdUsers['ADMIN'], generated_by: createdUsers['ADMIN'], month: 'March 2026', period: 'March 2026', period_start: '2026-03-01', period_end: '2026-03-31', base_salary: 25000, gross_salary: 25000, net_salary: 22000, deductions: 3000, status: 'GENERATED' },
        { employee_id: empDev, user_id: createdUsers['EMPLOYEE'], generated_by: createdUsers['ADMIN'], month: 'March 2026', period: 'March 2026', period_start: '2026-03-01', period_end: '2026-03-31', base_salary: 12000, gross_salary: 12500, overtime_pay: 500, net_salary: 11000, deductions: 1500, status: 'GENERATED' }
    ]);

    if (payErr) {
        console.error("- Error creating payrolls:", payErr.message);
    } else {
        console.log("- Payrolls successfully generated!");
    }

    console.log("\n✅ Automated Setup Complete!");
    console.log("You can now login with:\n1. hr@bidayalab.com\n2. admin@bidayalab.com\n3. employee@bidayalab.com\n(Password for all: password123)");
}

automateBidayalab();
