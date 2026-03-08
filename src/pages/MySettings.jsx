import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Lock, User, Bell, Globe, Save, Loader2,
  CheckCircle2, AlertCircle, Phone, MapPin, Eye, EyeOff, KeyRound,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabase';

const TABS = [
  { id: 'account', labelKey: 'mySettings.account', icon: Lock },
  { id: 'profile', labelKey: 'mySettings.profile', icon: User },
  { id: 'preferences', labelKey: 'mySettings.preferences', icon: Bell },
];

function CheckItem({ ok, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all
        ${ok ? 'bg-emerald-500 border-emerald-500' : 'bg-surface-secondary border-border-secondary'}`}>
        {ok && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-xs font-medium ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-tertiary'}`}>
        {label}
      </span>
    </div>
  );
}

export default function MySettings() {
  const { profile, session, refreshProfile } = useAuth();
  const { t, locale, switchLanguage, languages } = useLanguage();
  const { theme: appTheme, setTheme: setAppTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  // Profile (user_details)
  const [phone, setPhone] = useState('');
  const [adresse, setAdresse] = useState('');

  // Preferences (user_preferences)
  const [prefLanguage, setPrefLanguage] = useState(locale);
  const [prefTheme, setPrefTheme] = useState(appTheme);
  const [prefEmailNotif, setPrefEmailNotif] = useState(true);
  const [prefPushNotif, setPrefPushNotif] = useState(true);

  // Password form (inline)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const userId = session?.user?.id;

  useEffect(() => {
    setPrefTheme(appTheme);
  }, [appTheme]);

  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[\W_]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword,
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);

  useEffect(() => {
    if (!userId || !supabase) return;
    let cancelled = false;

    async function load() {
      try {
        const [detailsRes, prefRes] = await Promise.all([
          supabase.from('user_details').select('phone, adresse').eq('id_user', userId).maybeSingle(),
          supabase.from('user_preferences').select('language, theme, notifications').eq('user_id', userId).maybeSingle(),
        ]);
        if (cancelled) return;
        if (detailsRes.data) {
          setPhone(detailsRes.data.phone || '');
          setAdresse(detailsRes.data.adresse || '');
        }
        if (prefRes.data) {
          setPrefLanguage(prefRes.data.language || locale);
          setPrefTheme(prefRes.data.theme || 'light');
          const notif = prefRes.data.notifications || {};
          setPrefEmailNotif(notif.email !== false);
          setPrefPushNotif(notif.push !== false);
        }
      } catch (e) {
        console.error('[MySettings] load error:', e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId, locale]);

  const saveProfile = async () => {
    if (!userId) return;
    setLoading(true);
    setSaveStatus(null);
    try {
      const { error: detailsError } = await supabase
        .from('user_details')
        .upsert(
          {
            id_user: userId,
            entreprise_id: profile?.entreprise_id || null,
            phone: phone || null,
            adresse: adresse || null,
          },
          { onConflict: 'id_user' }
        );
      if (detailsError) throw detailsError;
      setSaveStatus('success');
      refreshProfile?.();
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!userId) return;
    setLoading(true);
    setSaveStatus(null);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            language: prefLanguage,
            theme: prefTheme,
            notifications: { email: prefEmailNotif, push: prefPushNotif },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
      switchLanguage(prefLanguage);
      if (setAppTheme) setAppTheme(prefTheme);
      setSaveStatus('success');
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    if (!passwordValid || !session?.user?.id) {
      setPasswordError(t('mySettings.passwordRequirements'));
      return;
    }
    setPasswordLoading(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) throw authError;

      // Also call the RPC to update role-specific profiles
      await supabase.rpc('update_profile_password', {
        p_user_id: session.user.id,
        p_role: profile?.role || 'EMPLOYEE',
        p_new_password: newPassword
      });

      await supabase.from('users').update({ password_changed: true }).eq('id', session.user.id);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || t('mySettings.passwordUpdateFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('mySettings.title')}
        description={t('mySettings.subtitle')}
        icon={SettingsIcon}
        iconColor="from-[#ff9a55] to-[#ffbe7b]"
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border-secondary pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
              ${activeTab === tab.id
                ? 'bg-brand-500 text-white'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'}`}
          >
            <tab.icon size={16} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Status toast */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={20} />
          <span className="text-sm font-medium">{t('mySettings.saved')}</span>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{t('mySettings.saveFailed')}</span>
        </div>
      )}

      {/* Account — Change password */}
      {activeTab === 'account' && (
        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 space-y-6">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <KeyRound size={20} className="text-brand-500" />
            {t('mySettings.changePassword')}
          </h3>
          {passwordSuccess ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 size={24} className="text-emerald-500" />
              <div>
                <p className="font-semibold text-text-primary">{t('mySettings.passwordUpdated')}</p>
                <p className="text-sm text-text-secondary">{t('mySettings.passwordUpdatedDesc')}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              {passwordError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle size={18} />
                  {passwordError}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">{t('mySettings.newPassword')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-secondary border border-border-secondary rounded-xl text-text-primary text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary">
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 bg-surface-secondary rounded-xl border border-border-secondary">
                <CheckItem ok={passwordChecks.length} label="8+ characters" />
                <CheckItem ok={passwordChecks.uppercase} label="Uppercase" />
                <CheckItem ok={passwordChecks.lowercase} label="Lowercase" />
                <CheckItem ok={passwordChecks.number} label="Number" />
                <CheckItem ok={passwordChecks.special} label="Special char" />
                <CheckItem ok={passwordChecks.match} label="Match" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">{t('mySettings.confirmPassword')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-secondary border border-border-secondary rounded-xl text-text-primary text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  />
                  <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary">
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={!passwordValid || passwordLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                {t('mySettings.savePassword')}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Profile — Phone, Address */}
      {activeTab === 'profile' && (
        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 space-y-6">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <User size={20} className="text-brand-500" />
            {t('mySettings.profileDetails')}
          </h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">{t('mySettings.phone')}</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+212 6 00 00 00 00"
                  className="w-full pl-10 py-2.5 bg-surface-secondary border border-border-secondary rounded-xl text-text-primary text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">{t('mySettings.address')}</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3.5 text-text-tertiary" />
                <textarea
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder={t('mySettings.addressPlaceholder')}
                  rows={2}
                  className="w-full pl-10 py-2.5 bg-surface-secondary border border-border-secondary rounded-xl text-text-primary text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
                />
              </div>
            </div>
            <button
              onClick={saveProfile}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {t('mySettings.saveChanges')}
            </button>
          </div>
        </div>
      )}

      {/* Preferences — Language, Theme, Notifications */}
      {activeTab === 'preferences' && (
        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 space-y-6">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Bell size={20} className="text-brand-500" />
            {t('mySettings.preferences')}
          </h3>
          <div className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">{t('mySettings.language')}</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <select
                  value={prefLanguage}
                  onChange={(e) => setPrefLanguage(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-secondary border border-border-secondary rounded-xl text-text-primary text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none appearance-none cursor-pointer"
                >
                  {Object.keys(languages || {}).map((lang) => (
                    <option key={lang} value={lang}>{languages[lang].label || lang}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">{t('mySettings.theme')}</label>
              <div className="flex gap-2">
                {['light', 'dark'].map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setPrefTheme(theme)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all
                      ${prefTheme === theme ? 'bg-brand-500 text-white' : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'}`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <span className="block text-sm font-semibold text-text-secondary">{t('mySettings.notifications')}</span>
              <label className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl border border-border-secondary cursor-pointer">
                <span className="text-sm text-text-primary">{t('mySettings.emailNotifications')}</span>
                <input type="checkbox" checked={prefEmailNotif} onChange={(e) => setPrefEmailNotif(e.target.checked)} className="rounded border-border-secondary text-brand-500 focus:ring-brand-500" />
              </label>
              <label className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl border border-border-secondary cursor-pointer">
                <span className="text-sm text-text-primary">{t('mySettings.pushNotifications')}</span>
                <input type="checkbox" checked={prefPushNotif} onChange={(e) => setPrefPushNotif(e.target.checked)} className="rounded border-border-secondary text-brand-500 focus:ring-brand-500" />
              </label>
            </div>
            <button
              onClick={savePreferences}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {t('mySettings.saveChanges')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
