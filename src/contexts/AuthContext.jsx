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
  const fetchProfile = useCallback(async (userId, retries = 3) => {
    if (!supabase || !userId) return null;

    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Profile not found, wait and retry (trigger might still be running)
            console.log(`Profile not found, retry ${i + 1}/${retries}...`);
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
            continue;
          }
          // 406 = RLS is blocking the read (e.g. new user whose policies aren't set yet)
          // Return a minimal profile so the app doesn't crash or loop
          if (error.status === 406) {
            console.warn('RLS blocking profile read (406) — returning minimal profile');
            return { id: userId, role: 'EMPLOYEE', status: 'active', _rls_blocked: true };
          }
          console.error('Profile fetch error:', JSON.stringify(error, null, 2));
          if (error.message?.includes('schema') || error.code === 'PGRST000') {
            console.warn('PostgREST schema error — using fallback profile');
            return { id: userId, role: 'ADMIN', status: 'active', _fallback: true };
          }
          return null;
        }

        if (data) cacheService.set(`user:${userId}`, data, 600);
        return data ?? null;
      } catch (err) {
        console.error('Profile fetch failed:', err);
        if (i === retries - 1) return null;
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
      }
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
        const profile = await fetchProfile(s.user.id);
        console.log('[AuthContext] Profile fetched:', profile?.email || 'No profile');
        setProfile(profile);
        // Warm up cache with frequent queries after login
        if (profile) cacheService.warmUp(s.user.id, profile.entreprise_id);
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
        fetchProfile(s.user.id).then(p => { if (p) setProfile(p); });
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');

    // ── Step 1: Verify credentials against our DB tables ──
    const { data: dbUsers, error: rpcError } = await supabase
      .rpc('verify_login', { p_email: email.trim(), p_password: password });

    if (rpcError) {
      // RPC doesn't exist yet — fall back to Supabase Auth only
      console.warn('[Auth] verify_login RPC unavailable, using Auth fallback:', rpcError.message);
    } else if (!dbUsers || dbUsers.length === 0) {
      // No matching record in DB → wrong email or wrong password
      throw new Error('Email or password is incorrect.');
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
      const p = await fetchProfile(data.user.id);
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

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signUpSilently, signOut, signInWithGoogle, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
