import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { Workflow, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!supabase) {
      setError('Service unavailable. Please try again later.');
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        readyRef.current = true;
        setReady(true);
        setError('');
      }
    });

    const timeout = setTimeout(() => {
      if (!readyRef.current) {
        setError(t('auth.invalidResetLink'));
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200
                      bg-gray-50/50 text-text-primary text-sm placeholder:text-text-tertiary
                      focus:bg-white focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10
                      transition-all duration-200 disabled:opacity-60`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-500/[0.04] blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-8">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 shrink-0">
              <rect width="32" height="32" rx="8" className="fill-black dark:fill-white" />
              <path d="M8 8 V18 C8 24 16 24 16 18 V8" className="stroke-white dark:stroke-black" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M16 8 V18 C16 24 24 24 24 18 V8" className="stroke-white dark:stroke-black" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
          <div>
            <span className="text-xl font-bold text-text-primary tracking-tight">Flowly</span>
            <span className="block text-xs text-text-tertiary font-medium tracking-wide">Business Suite</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-black/[0.06] p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-50 rounded-2xl mb-4">
              <Lock size={24} className="text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">{t('auth.resetTitle')}</h1>
            <p className="text-sm text-text-secondary mt-1">{t('auth.resetSubtitle')}</p>
          </div>

          {success ? (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-5 text-center">
              <CheckCircle2 size={28} className="text-brand-500 mx-auto mb-2" />
              <p className="text-text-primary font-semibold">{t('auth.resetSuccess')}</p>
              <p className="text-text-secondary text-sm mt-1">{t('auth.resetRedirect')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-red-600 text-sm animate-fade-in">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  {t('auth.newPassword')}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Enter new password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                           bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold text-sm
                           shadow-lg shadow-brand-500/20
                           hover:shadow-xl hover:shadow-brand-500/25 hover:-translate-y-0.5
                           active:translate-y-0 active:shadow-md
                           disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                           transition-all duration-200 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('auth.resetPassword')
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-brand-500 hover:text-brand-600 text-sm font-semibold transition-colors cursor-pointer"
                >
                  {t('auth.backToLogin')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
