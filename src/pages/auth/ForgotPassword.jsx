import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Workflow, Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

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
          {sent ? (
            <div className="text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 mx-auto mb-4">
                <CheckCircle2 size={28} className="text-brand-500" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Email sent!</h2>
              <p className="text-sm text-text-secondary mb-6">
                Check <strong className="text-text-primary">{email}</strong> for a password reset link.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 font-semibold transition-colors">
                <ArrowLeft size={14} /> {t('auth.backToLogin')}
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors mb-5">
                <ArrowLeft size={13} /> {t('auth.backToLogin')}
              </Link>
              <h1 className="text-2xl font-bold text-text-primary mb-1">{t('auth.resetPassword')}</h1>
              <p className="text-sm text-text-secondary mb-6">Enter your email and we'll send you a reset link.</p>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/8 border border-red-500/15 text-red-600 text-sm animate-fade-in">
                  <AlertCircle size={16} className="shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200
                                 bg-gray-50/50 text-text-primary text-sm placeholder:text-text-tertiary
                                 focus:bg-white focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10
                                 transition-all duration-200" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                             bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold text-sm
                             shadow-lg shadow-brand-500/20
                             hover:shadow-xl hover:shadow-brand-500/25 hover:-translate-y-0.5
                             active:translate-y-0 active:shadow-md
                             disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                             transition-all duration-200 cursor-pointer">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? t('common.loading') : t('auth.resetPassword')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
