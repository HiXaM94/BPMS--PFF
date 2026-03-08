import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { cacheService } from '../services/CacheService';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // When true, onAuthStateChange will NOT update session/profile
  // Used to prevent session switching during HR/user creation
  const suppressAuthChange = useRef(false);

  // Fetch the users row that extends auth.users with retry logic
  const fetchProfile = useCallback(async (userId, email = null, retries = 3) => {
    if (!supabase || !userId) return null;

    let userProfile = null;
    let rlsBlocked = false; // Keep this for the final fallback as per instruction

    // 1. Try to fetch from the standard users table (and immediately fallback to owners before retrying)
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            *,
            entreprise:entreprises(id, name, logo_url, status)
          `)
          .eq('id', userId)
          .maybeSingle(); // Use maybeSingle to prevent 406 Not Acceptable on 0 rows

        if (error) {
          console.error('Profile fetch error:', JSON.stringify(error, null, 2));
          if (error.message?.includes('schema') || error.code === 'PGRST000') {
            return { id: userId, role: 'ADMIN', status: 'active', _fallback: true };
          }
          break; // Stop on real errors
        }

        if (data) {
          // Extra safety check in case the RPC check was bypassed
          if (data.status === 'suspended' || data.entreprise?.status === 'suspended') {
            console.warn('Account or Organization is suspended. Blocking session.');
            cacheService.clear();
            supabase.auth.signOut().catch(() => { });
            return { _suspended: true };
          }
          userProfile = data;
          break; // Found in users
        }

        // 2. If no data in users (maybe it's a Super Admin), check owners NOW before waiting
        let ownerLookup;
        if (email && email.trim() !== '') {
          ownerLookup = await supabase.from('owners').select('*').or(`id.eq.${userId},email.ilike.${email.trim()}`).maybeSingle();
        } else {
          ownerLookup = await supabase.from('owners').select('*').eq('id', userId).maybeSingle();
        }

        if (ownerLookup.data) {
          userProfile = { ...ownerLookup.data, role: 'SUPER_ADMIN', status: 'active' };
          break; // Found in owners
        }

        // 3. If neither found, wait and retry (e.g. Supabase trigger is still running)
        console.log(`Profile not found, retry ${i + 1}/${retries}...`);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        }

      } catch (err) {
        console.error('Profile fetch failed:', err);
        if (i === retries - 1) break;
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
      }
    }

    if (userProfile) {
      cacheService.set(`user:${userId}`, userProfile, 600);
      return userProfile;
    }

    // 4. Default fallback if RLS completely blocked everything
    if (rlsBlocked) {
      return { id: userId, role: 'EMPLOYEE', status: 'active', _rls_blocked: true };
    }

    // 5. If STILL null and we are not in the middle of a signup/suppression,
    // then the user is likely deleted from the database. Sign them out.
    if (!suppressAuthChange.current) {
      console.error(`[AuthContext] Profile for ${userId} not found after retries. Signing out.`);
      supabase.auth.signOut().catch(() => { });
    }

    return null;
  }, []);


  useEffect(() => {
    if (!supabase) {
      console.log('[AuthContext] Supabase not ready, setting loading to false');
      setLoading(false);
      return;
    }

    // Get initial session
    console.log('[AuthContext] Fetching initial session...');
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      console.log('[AuthContext] Session fetched:', s?.user?.email || 'No user');
      setSession(s);
      if (s?.user) {
        console.log('[AuthContext] Fetching profile for user:', s.user.id);
        const profile = await fetchProfile(s.user.id, s.user.email);
        console.log('[AuthContext] Profile fetched:', profile?.email || 'No profile');
        setProfile(profile);
        // Warm up cache with frequent queries after login
        if (profile) cacheService.warmUp(s.user.id, profile.entreprise_id, profile.role);
      }
      console.log('[AuthContext] Setting loading to false');
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      // If we're in the middle of creating a new user, ignore the session switch
      if (suppressAuthChange.current) return;
      setSession(s);
      if (s?.user) {
        // Fire-and-forget: do NOT await fetchProfile here.
        // Awaiting inside onAuthStateChange blocks Supabase's auth state machine
        // and prevents updateUser() / signInWithPassword() from resolving.
        fetchProfile(s.user.id, s.user.email).then(p => { setProfile(p); });
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');

    // ── Step 1: Verify credentials against our DB tables ──
    const { data: dbUser, error: rpcError } = await supabase
      .rpc('verify_login', { p_email: email.trim(), p_password: password });

    if (rpcError) {
      // RPC doesn't exist yet — fall back to Supabase Auth only
      console.warn('[Auth] verify_login RPC unavailable, using Auth fallback:', rpcError.message);
    } else if (!dbUser) {
      // No matching record in DB (JSON RPC returned null) → wrong email or wrong password
      throw new Error('Email or password is incorrect.');
    } else if (dbUser.suspended) {
      throw new Error("This organization's account is suspended. Please contact support.");
    }

    // ── Step 2: Sign in via Supabase Auth to get the JWT session ──
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      // DB matched but Auth did not → passwords are out of sync
      // This happens when password was changed in DB but not in Supabase Auth
      throw new Error('Password was changed but not synced. Please ask your administrator to reset your account, or use the password reset modal to re-save your password.');
    }

    // ── Step 3: Load profile and block if no DB record ──
    if (data?.user) {
      const p = await fetchProfile(data.user.id, email.trim());
      if (p?._suspended) {
        throw new Error("This organization's account is suspended. Please contact support.");
      }
      if (!p || p._fallback) {
        await supabase.auth.signOut();
        throw new Error('There is no account with this email.');
      }
      setProfile(p);
    }

    return data;
  }, [fetchProfile]);

  // signUpSilently: creates an auth user WITHOUT switching the active session.
  // Use this when HR/Admin creates a sub-user (employee, manager, etc.)
  const signUpSilently = useCallback(async (email, password, meta = {}) => {
    if (!supabase) throw new Error('Supabase not configured');

    // ── 1. Snapshot the current (HR/Admin) session BEFORE signUp replaces it ──
    const { data: { session: originalSession } } = await supabase.auth.getSession();

    // ── 2. Freeze React state so auth listener ignores the new user's events ──
    suppressAuthChange.current = true;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: meta },
      });
      if (error) throw error;
      return data;
    } finally {
      // ── 3. Immediately restore the original session token ──
      // This is critical: without it, the Supabase client uses the NEW user's
      // JWT for subsequent calls (RPC, table inserts) → RLS blocks everything
      // and the app falls back to demo/empty state on error.
      if (originalSession?.access_token && originalSession?.refresh_token) {
        try {
          await supabase.auth.setSession({
            access_token: originalSession.access_token,
            refresh_token: originalSession.refresh_token,
          });
        } catch (restoreErr) {
          console.error('[signUpSilently] Session restore failed:', restoreErr);
        }
      }
      // ── 4. Unfreeze auth listener after token propagation settles ──
      setTimeout(() => { suppressAuthChange.current = false; }, 800);
    }
  }, []);

  const signUp = useCallback(async (email, password, meta = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    cacheService.clear();
    await supabase.auth.signOut();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    // Clear cache for this specific user to ensure fresh fetch
    cacheService.delete(`user:${session.user.id}`);
    const p = await fetchProfile(session.user.id, session.user.email);
    setProfile(p);
    return p;
  }, [session, fetchProfile]);

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signUpSilently, signOut, signInWithGoogle, resetPassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
