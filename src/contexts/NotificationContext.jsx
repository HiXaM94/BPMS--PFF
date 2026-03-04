import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(undefined);
const SYNTHETIC_ID = 'complete-profile-notification';

export function NotificationProvider({ children }) {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);

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
    if (!supabase || !userId) { setNeedsProfile(false); return; }
    supabase
      .from('user_details')
      .select('id_user')
      .eq('id_user', userId)
      .maybeSingle()
      .then(({ data }) => {
        setNeedsProfile(!data); // true = no record found → show notification
      });
  }, [userId]);

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
  const syntheticNotification = needsProfile ? {
    id: SYNTHETIC_ID,
    user_id: userId,
    message: '📋 Complete your profile — fill in your personal details to activate your account.',
    type: 'warning',
    is_read: false,
    created_at: new Date().toISOString(),
    _synthetic: true,
  } : null;

  const allNotifications = syntheticNotification
    ? [syntheticNotification, ...notifications]
    : notifications;

  const markAsRead = useCallback(async (id) => {
    if (id === SYNTHETIC_ID) {
      // Clicking the profile notification opens the profile form
      window.dispatchEvent(new CustomEvent('open-hr-profile-form'));
      return;
    }
    if (!supabase) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }, []);

  // Called by profile form after successful save — removes the notification immediately
  const dismissProfileNotification = useCallback(() => {
    setNeedsProfile(false);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!supabase || !userId) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  }, [userId]);

  const deleteNotification = useCallback(async (id) => {
    if (!supabase) return;
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').delete().eq('id', id);
  }, []);

  const clearAll = useCallback(async () => {
    if (!supabase || !userId) return;
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
