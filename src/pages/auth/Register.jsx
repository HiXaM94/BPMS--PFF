import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Workflow, Mail, Lock, Eye, EyeOff, User, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Register() {
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError(t('auth.passwordMismatch')); return; }
    if (form.password.length < 8) { setError(t('auth.passwordMinLength')); return; }
    setLoading(true);
    try {
      await signUp(form.email, form.password, { full_name: form.name });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200
                      bg-gray-50/50 text-text-primary text-sm placeholder:text-text-tertiary
                      focus:bg-white focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10
                      transition-all duration-200`;

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in text-center bg-white rounded-3xl shadow-2xl shadow-black/[0.06] border border-gray-100 p-10">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 mx-auto mb-4">
            <CheckCircle2 size={32} className="text-brand-500" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Check your email</h2>
          <p className="text-text-secondary mb-6">
            We sent a confirmation link to <strong className="text-text-primary">{form.email}</strong>.
            Click it to activate your account.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl
            bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold text-sm
            shadow-lg shadow-brand-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-500/[0.04] blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/[0.04] blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/20">
            <Workflow size={24} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-text-primary tracking-tight">BPMS</span>
            <span className="block text-xs text-text-tertiary font-medium tracking-wide">Platform</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-black/[0.06] p-8">
          <h1 className="text-2xl font-bold text-text-primary mb-1">{t('auth.registerTitle')}</h1>
          <p className="text-sm text-text-secondary mb-6">Join your company's BPMS workspace</p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/8 border border-red-500/15 text-red-600 text-sm animate-fade-in">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input type="text" value={form.name} onChange={set('name')} required placeholder="Ibrahim Rouass"
                  className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('auth.email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input type="email" value={form.email} onChange={set('email')} required placeholder="you@company.com"
                  className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} required placeholder="Min. 8 characters"
                  className={`${inputClass} !pr-11`} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('auth.confirmPassword')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input type={showPw ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} required placeholder="Repeat password"
                  className={inputClass} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                         bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold text-sm
                         shadow-lg shadow-brand-500/20
                         hover:shadow-xl hover:shadow-brand-500/25 hover:-translate-y-0.5
                         active:translate-y-0 active:shadow-md
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                         transition-all duration-200 cursor-pointer mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? t('common.loading') : t('auth.register')}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-600 font-semibold transition-colors">{t('auth.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
