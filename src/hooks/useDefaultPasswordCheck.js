import { useState, useEffect } from 'react';
import { supabase, isSupabaseReady } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * useDefaultPasswordCheck
 *
 * Checks the `users` table for `password_changed = false`.
 * If it's false (or null), the user still has the default password (000000)
 * and should be prompted to change it.
 *
 * Returns:
 *  - showPasswordModal: boolean — true if the modal should be shown
 *  - hidePasswordModal: () => void — call to dismiss the modal
 */
export function useDefaultPasswordCheck() {
    const { profile, session, loading } = useAuth();
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        if (!isSupabaseReady || loading || !session?.user?.id) return;

        // Exempt Super Admins from the default password check
        if (profile?.role === 'SUPER_ADMIN') {
            setShowPasswordModal(false);
            return;
        }

        // If no profile found for non-super-admins, don't show modal yet
        if (!profile) return;

        supabase
            .from('users')
            .select('password_changed')
            .eq('id', session.user.id)
            .maybeSingle()
            .then(({ data, error }) => {
                if (error) {
                    console.error('[useDefaultPasswordCheck] error:', error.message);
                    return;
                }
                // If password_changed is explicitly false or null/missing, show modal
                if (!data?.password_changed) {
                    setShowPasswordModal(true);
                }
            });
    }, [session?.user?.id, profile, loading]);

    const hidePasswordModal = () => setShowPasswordModal(false);

    return { showPasswordModal, hidePasswordModal };
}
