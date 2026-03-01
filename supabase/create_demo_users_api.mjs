/**
 * Create demo users via Supabase Auth Admin API
 * 
 * Usage:
 *   node supabase/create_demo_users_api.mjs
 * 
 * Requires:
 *   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 *   (NOT the anon key — you need the service_role key from Supabase Dashboard → Settings → API)
 * 
 * You can also pass them inline:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node supabase/create_demo_users_api.mjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zhynmlxiiknrsduevlii.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeW5tbHhpaWtucnNkdWV2bGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc2NzM3OSwiZXhwIjoyMDg3MzQzMzc5fQ.0AynP6jIXQb6Fd18CSXiVkud4NwEhFoWSmFbUKwlzTw';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(`
ERROR: Missing environment variables.

You need TWO values from Supabase Dashboard → Settings → API:
  1. SUPABASE_URL         (Project URL)
  2. SUPABASE_SERVICE_ROLE_KEY  (service_role secret — NOT the anon key)

Run like this:
  $env:SUPABASE_URL="https://zhynmlxiiknrsduevlii.supabase.co"
  $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
  node supabase/create_demo_users_api.mjs
`);
  process.exit(1);
}

const DEMO_USERS = [
  { email: 'admin@techcorp.ma',    password: 'Demo@123456', name: 'Ibrahim Rouass',          role: 'ADMIN' },
  { email: 'hr@techcorp.ma',       password: 'Demo@123456', name: 'Fatima Zahra El Amrani',  role: 'HR' },
  { email: 'manager@techcorp.ma',  password: 'Demo@123456', name: 'Youssef Bennani',         role: 'TEAM_MANAGER' },
  { email: 'employee@techcorp.ma', password: 'Demo@123456', name: 'Ahmed Hassan',            role: 'EMPLOYEE' },
];

async function adminRequest(path, method = 'GET', body = null) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, ok: res.ok, data };
}

async function deleteUserByEmail(email) {
  // List users and find by email
  const { data } = await adminRequest(`/auth/v1/admin/users?page=1&per_page=50`);
  if (data?.users) {
    const user = data.users.find(u => u.email === email);
    if (user) {
      console.log(`  Deleting existing user: ${email} (${user.id})`);
      await adminRequest(`/auth/v1/admin/users/${user.id}`, 'DELETE');
      return true;
    }
  }
  return false;
}

async function createUser({ email, password, name, role }) {
  // Delete existing user first
  await deleteUserByEmail(email);
  
  // Wait a moment for cascading deletes
  await new Promise(r => setTimeout(r, 500));

  // Create via Admin API — this is the PROPER way
  const { status, ok, data } = await adminRequest('/auth/v1/admin/users', 'POST', {
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
    app_metadata: { provider: 'email', providers: ['email'] },
  });

  if (ok) {
    console.log(`  ✓ Created: ${email} (${data.id}) — role: ${role}`);
    // Update public.users row created by trigger
    const patch = await adminRequest(
      `/rest/v1/users?id=eq.${data.id}`,
      'PATCH',
      {
        entreprise_id: '11111111-0001-0001-0001-000000000001',
        name,
        email,
        role,
        status: 'active',
        avatar_initials: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2),
      }
    );
    if (patch.ok || patch.status === 204) {
      console.log(`  ✓ public.users updated for ${email}`);
    } else {
      console.warn(`  ⚠ public.users patch failed for ${email}:`, JSON.stringify(patch.data));
    }
    return data;
  } else {
    console.error(`  ✗ Failed: ${email} — ${status} ${JSON.stringify(data)}`);
    return null;
  }
}

async function main() {
  console.log('=== Creating Demo Users via Supabase Auth Admin API ===\n');
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);

  // Test connection first
  const { ok, data: testData } = await adminRequest('/auth/v1/admin/users?page=1&per_page=1');
  if (!ok) {
    console.error('Failed to connect to Supabase Auth Admin API:', testData);
    console.error('\nMake sure you are using the SERVICE_ROLE key (not the anon key).');
    process.exit(1);
  }
  console.log('Connected to Supabase Auth Admin API.\n');

  for (const user of DEMO_USERS) {
    await createUser(user);
  }

  console.log('\n=== Done! ===');
  console.log('Now try logging in with: admin@techcorp.ma / Demo@123456');
  console.log('\nNote: The handle_new_user() trigger will auto-create public.users rows.');
  console.log('If it does not, run fix_demo_login.sql in the SQL Editor.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
