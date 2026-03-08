import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(undefined);
const SYNTHETIC_ID = 'complete-profile-notification';

export function NotificationProvider({ children }) {
  const { session, profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profileReminder, setProfileReminder] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const userId = session?.user?.id;

  const fetchNotifications = useCallback(async () => {
    if (!supabase || !userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
    setLoading(false);
  }, [userId]);

  // Check if user has a user_details record on login
  useEffect(() => {
    if (!supabase || !userId || !profile) {
      setProfileReminder(null);
      return;
    }

    let cancelled = false;

    const checkReminder = async () => {
      // 0. If user already completed onboarding, never show any reminder again
      if (profile.onboarding_completed) {
        setProfileReminder(null);
        return;
      }

      // 1. General account completion check for all roles
      if (!profile.name || !profile.email) {
        setProfileReminder({
          id: 'complete_profile_basic',
          user_id: userId,
          message: '👋 Welcome! Please visit your profile to ensure your account details are complete.',
          type: 'info',
          metadata: { event: 'complete_profile', redirectTo: '/profile' },
        });
        return;
      }

      if (profile.role === 'EMPLOYEE') {
        const { data } = await supabase
          .from('user_details')
          .select('*')
          .eq('id_user', userId)
          .maybeSingle();

        if (cancelled) return;

        // Check if record is missing OR key fields are empty
        const isMissingFields = !data || !data.cnss || !data.rib || !data.department;

        if (isMissingFields) {
          setProfileReminder({
            id: 'complete_profile_employee',
            user_id: userId,
            message: '📋 Almost there! Complete your onboarding profile (CNSS, RIB, etc.) to unlock all features.',
            type: 'warning',
            metadata: { event: 'complete_profile', role: 'EMPLOYEE', redirectTo: '/complete-profile' },
          });
        } else {
          setProfileReminder(null);
        }
        return;
      }

      if (profile.role === 'TEAM_MANAGER') {
        const { data: userDetails } = await supabase
          .from('user_details')
          .select('*')
          .eq('id_user', userId)
          .maybeSingle();

        if (cancelled) return;

        const { data: emp } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (cancelled || !emp) return;

        const { data: profileData } = await supabase
          .from('team_manager_profiles')
          .select('salary_base')
          .eq('employee_id', emp.id)
          .maybeSingle();

        if (cancelled) return;

        const isMissingUserDetails = !userDetails || !userDetails.cnss || !userDetails.rib;
        const isMissingManagerProfile = !profileData || (profileData.salary_base === null || profileData.salary_base === undefined);

        if (isMissingUserDetails || isMissingManagerProfile) {
          setProfileReminder({
            id: 'complete_profile_manager',
            user_id: userId,
            message: '💼 Manager Setup: Please complete your profile details (Salary, CNSS, RIB) to finish account setup.',
            type: 'warning',
            metadata: { event: 'complete_profile', role: 'TEAM_MANAGER', redirectTo: '/complete-profile' },
          });
        } else {
          setProfileReminder(null);
        }
        return;
      }

      setProfileReminder(null);
    };

    checkReminder();
    return () => { cancelled = true; };
  }, [userId, profile]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!supabase || !userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Synthetic notification — appears when user has no user_details record
  const syntheticNotification = profileReminder ? {
    ...profileReminder,
    created_at: new Date().toISOString(),
    is_read: false,
    _synthetic: true,
  } : null;

  const allNotifications = syntheticNotification
    ? [syntheticNotification, ...notifications]
    : notifications;

  const markAsRead = useCallback(async (id) => {
    if (syntheticNotification && id === syntheticNotification.id) {
      const redirectTo = syntheticNotification.metadata?.redirectTo || '/complete-profile';
      const roleQuery = syntheticNotification.metadata?.role ? `?role=${syntheticNotification.metadata.role}` : '';
      window.location.href = `${redirectTo}${roleQuery}`;
      return;
    }
    if (!supabase) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }, [syntheticNotification]);

  // Called by profile form after successful save — removes the notification immediately
  const dismissProfileNotification = useCallback(async () => {
    setProfileReminder(null);
    if (!supabase || !userId) return;

    // Also mark any real notifications in DB about profile completion as read
    setNotifications(prev => prev.map(n =>
      n.metadata?.event === 'complete_profile' ? { ...n, is_read: true } : n
    ));

    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    // Note: We don't filter by metadata here because Postgres filter for JSONB is slow/complex, 
    // marking all unread as read is safer for this 'completion' step.
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    if (!supabase || !userId) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  }, [userId]);

  const deleteNotification = useCallback(async (id) => {
    if (!supabase) return;
    const notif = allNotifications.find(n => n.id === id);
    if (notif?._synthetic || notif?.metadata?.event === 'complete_profile') {
      console.log('[NotificationContext] Deletion pinned for profile alert:', id);
      return;
    }

    console.log('[NotificationContext] Deleting notification:', id);
    setNotifications(prev => prev.filter(n => n.id !== id));

    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) {
      console.error('[NotificationContext] DB Delete Error:', error.message);
      fetchNotifications(); // Refresh on error
    }
  }, [allNotifications, fetchNotifications]);

  const clearAll = useCallback(async () => {
    if (!supabase || !userId) return;
    // Keep only synthetic/profile notifications in the local state
    setNotifications([]);
    await supabase.from('notifications').delete().eq('user_id', userId);
  }, [userId]);

  const unreadCount = allNotifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{
      notifications: allNotifications,
      loading,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      refetch: fetchNotifications,
      dismissProfileNotification,
      selectedNotification,
      setSelectedNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
