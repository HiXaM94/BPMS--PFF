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
          <svg viewBox="0 0 30.54 21.4" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 shrink-0">
              <path className="fill-[#231f20] stroke-[#231f20] dark:fill-white dark:stroke-white" strokeMiterlimit="10" strokeWidth="2" d="M26.58,1v6.31c0,1.84-1.49,3.32-3.32,3.32s-3.32-1.49-3.32-3.32v-1.81c0-1.12-.41-2.14-1.08-2.93-.82-.96-2.05-1.57-3.42-1.57-1.87,0-3.47,1.14-4.15,2.75-.2.46-.32.96-.35,1.49,0,.09,0,.17,0,.26s0,.17,0,.26v8.47c-.22,1.62-1.61,2.86-3.29,2.86-1.83,0-3.32-1.49-3.32-3.32V1H1v12.94c0,3.57,2.9,6.47,6.47,6.47s6.47-2.9,6.47-6.47c0-.22-.01-.43-.03-.64v-3.56s.02,0,.03.01v-4.66c0-.74.6-1.34,1.34-1.34s1.34.6,1.34,1.34v2.38c0,.79.14,1.55.4,2.25.92,2.46,3.29,4.22,6.07,4.22,3.44,0,6.26-2.69,6.46-6.09h.01V1h-2.96Z"/>
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
