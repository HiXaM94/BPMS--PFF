import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhynmlxiiknrsduevlii.supabase.co';
const supabaseKey = 'sb_publishable_YyQWyQZ_J1gv22fphCH48w_1S_NtMdW';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    // Find EMA TECH enterprise
    const { data: ent, error: entErr } = await supabase
        .from('entreprises')
        .select('id, name')
        .eq('name', 'EMA TECH')
        .single();

    if (entErr) {
        console.error('Enterprise Error:', entErr);
        return;
    }
    console.log('Found Enterprise:', ent);

    // Check users
    const { count: userCount, error: userErr } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('entreprise_id', ent.id);
    console.log('Total Users:', userCount);

    // Check employees
    const { count: empCount, error: empErr } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('entreprise_id', ent.id)
        .eq('role', 'EMPLOYEE');
    console.log('Total Employees:', empCount);

    // Check vacancies
    // In the RPC, it joins with employees. Table 'vacances' column 'employee_id'
    const { data: vacancies, error: vacErr } = await supabase
        .from('vacances')
        .select('id, status, employee_id');

    if (vacErr) {
        console.error('Vacancies Error:', vacErr);
    } else {
        // Need to filter by employee entreprise_id
        const { data: employees, error: empsErr } = await supabase
            .from('employees')
            .select('id, entreprise_id')
            .eq('entreprise_id', ent.id);

        if (empsErr) {
            console.error('Employees Error:', empsErr);
        } else {
            const empIds = employees.map(e => e.id);
            const filteredVac = vacancies.filter(v => empIds.includes(v.employee_id));
            const pending = filteredVac.filter(v => v.status === 'pending').length;
            const approved = filteredVac.filter(v => v.status === 'approved').length;
            console.log('Vacancies - Pending:', pending, 'Approved:', approved);
        }
    }

    // Check presences for today
    const today = new Date().toISOString().split('T')[0];
    const { data: presences, error: presErr } = await supabase
        .from('presences')
        .select('id, employee_id');

    if (presErr) {
        console.error('Presences Error:', presErr);
    } else {
        const { data: employees } = await supabase
            .from('employees')
            .select('id')
            .eq('entreprise_id', ent.id);
        const empIds = employees.map(e => e.id);
        const filteredPres = presences.filter(p => empIds.includes(p.employee_id));
        console.log('Presences Today (Total records for this company):', filteredPres.length);
    }
}

checkData();
