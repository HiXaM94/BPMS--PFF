import { createClient } from '@supabase/supabase-js';

const URL = 'https://zhynmlxiiknrsduevlii.supabase.co';
const KEY = 'sb_publishable_YyQWyQZ_J1gv22fphCH48w_1S_NtMdW';

const supabase = createClient(URL, KEY);

async function diagnose() {
    console.log('--- Database Diagnostics (Simplified) ---');

    // 1. Check all presences
    const { data: allPres, error: presErr } = await supabase
        .from('presences')
        .select('*')
        .limit(10);

    if (presErr) console.error('Presences fetch error:', presErr);
    console.log('Total presences visible (limited to 10):', allPres?.length || 0);
    if (allPres && allPres.length > 0) {
        console.log('Sample presence record:', JSON.stringify(allPres[0], null, 2));
    } else {
        console.log('NO PRESENCES VISIBLE AT ALL.');
    }

    // 2. Check employees
    const { data: allEmps, error: empErr } = await supabase
        .from('employees')
        .select('id, user_id, entreprise_id')
        .limit(5);

    if (empErr) console.error('Employees fetch error:', empErr);
    console.log('Total employees visible (limited to 5):', allEmps?.length || 0);

    if (allEmps && allEmps.length > 0) {
        console.log('Sample employee ID:', allEmps[0].id);
        console.log('Sample employee Entreprise ID:', allEmps[0].entreprise_id);
    }

    // 3. Check for specific date
    const today = new Date().toISOString().split('T')[0];
    const { data: todayPres } = await supabase.from('presences').select('*').eq('date', today);
    console.log(`Presences for date ${today}:`, todayPres?.length || 0);

    // 4. Check ROLE count from users table
    const { data: userRoles, error: uErr } = await supabase.from('users').select('role').limit(10);
    if (uErr) console.error('Users fetch error:', uErr);
    console.log('Sample User Roles:', userRoles?.map(u => u.role));
}

diagnose();
