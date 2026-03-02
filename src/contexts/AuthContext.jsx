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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      // If we're in the middle of creating a new user, ignore the session switch
      if (suppressAuthChange.current) return;
      setSession(s);
      if (s?.user) {
        setProfile(await fetchProfile(s.user.id));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Eagerly fetch profile so navigate happens with profile ready
    if (data?.user) {
      const p = await fetchProfile(data.user.id);
      setProfile(p);
    }
    return data;
  }, [fetchProfile]);

  // signUpSilently: creates an auth user WITHOUT switching the active session
  // Use this when an admin creates a sub-user (HR, employee, etc.)
  const signUpSilently = useCallback(async (email, password, meta = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    // Freeze the auth listener so the new user's session is ignored
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
      // Give Supabase 500ms to finish state propagation, then unfreeze
      setTimeout(() => { suppressAuthChange.current = false; }, 500);
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
