import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return new Response(
                JSON.stringify({ error: 'Email and password are required.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Admin client — uses service role key (server-side only, never exposed to frontend)
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // ── Step 1: Find user by email in the users table ──────────────────────
        const { data: user, error: userError } = await adminClient
            .from('users')
            .select('id, email, role, status, entreprise_id')
            .ilike('email', email.trim())
            .maybeSingle();

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'There is no account with this email.' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (user.status === 'inactive' || user.status === 'suspended') {
            return new Response(
                JSON.stringify({ error: 'This account has been deactivated. Contact your administrator.' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ── Step 2: Verify password against the role-specific profile table ─────
        let passwordMatch: boolean | null = false;

        if (user.role === 'HR' || user.role === 'EMPLOYEE' || user.role === 'TEAM_MANAGER') {
            // These roles have passwords stored in hr_profiles via the employee relation
            const { data: hrProfile } = await adminClient
                .from('hr_profiles')
                .select('password_hash, employees!inner(user_id)')
                .eq('employees.user_id', user.id)
                .maybeSingle();

            if (hrProfile?.password_hash) {
                passwordMatch = hrProfile.password_hash === password;
            }
            // if no password_hash stored → passwordMatch stays null → will use Auth fallback
        } else if (user.role === 'ADMIN') {
            // Admin passwords might be stored directly — check admin_profiles
            const { data: adminProfile } = await adminClient
                .from('admin_profiles')
                .select('password_hash')
                .eq('user_id', user.id)
                .maybeSingle();

            if (adminProfile?.password_hash) {
                passwordMatch = adminProfile.password_hash === password;
            }
            // if no password_hash stored → passwordMatch stays null → will use Auth fallback
        }

        // ── Step 3: If no custom password found, use Supabase Auth as fallback ──
        if (passwordMatch === null) {
            // Verify against Supabase Auth by attempting sign-in
            const anonClient = createClient(
                Deno.env.get('SUPABASE_URL')!,
                Deno.env.get('SUPABASE_ANON_KEY')!
            );
            const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (authError || !authData.session) {
                return new Response(
                    JSON.stringify({ error: 'Incorrect password.' }),
                    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            // Return the session directly
            return new Response(
                JSON.stringify({ session: authData.session, user: authData.user }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!passwordMatch) {
            return new Response(
                JSON.stringify({ error: 'Incorrect password.' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ── Step 4: Sync Supabase Auth password so future sessions work ─────────
        // Find the auth user by email
        const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers();
        const authUser = authUsers?.find((u: { email: string }) => u.email?.toLowerCase() === email.trim().toLowerCase());

        if (authUser) {
            // Sync the password to Supabase Auth (so Auth always matches DB)
            await adminClient.auth.admin.updateUserById(authUser.id, { password });
        }

        // ── Step 5: Sign in and return the session ──────────────────────────────
        const anonClient = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!
        );
        const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        if (signInError || !signInData.session) {
            return new Response(
                JSON.stringify({ error: 'Login failed. Please try again.' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ session: signInData.session, user: signInData.user }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        console.error('Custom login error:', err);
        return new Response(
            JSON.stringify({ error: 'Internal server error.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
