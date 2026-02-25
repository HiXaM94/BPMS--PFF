import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Workflow, Mail, Lock, Eye, EyeOff, User, Loader2, AlertCircle, CheckCircle2, ArrowRight,
  Globe, Phone, MapPin, Users, BarChart3, FileCheck,
} from 'lucide-react';

export default function Register() {
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const navigateWithTransition = (to) => {
    setLeaving(true);
    setTimeout(() => navigate(to), 350);
  };

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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50/40 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in text-center bg-white rounded-3xl shadow-2xl shadow-black/[0.06] border border-gray-100 p-10">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Check your email</h2>
          <p className="text-text-secondary mb-6">
            We sent a confirmation link to <strong className="text-text-primary">{form.email}</strong>.
            Click it to activate your account.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl
            bg-brand-500 text-white font-semibold text-sm
            shadow-lg shadow-brand-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50/40 flex items-center justify-center p-4">
      {/* Subtle background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#E3EF26]/[0.06] blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/[0.03] blur-[100px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-sky-400/[0.03] blur-[80px]" />
      </div>

      {/* Two-panel card — form LEFT, brand RIGHT (swapped from Login) */}
      <div className={`relative w-full max-w-[960px] min-h-[560px] bg-white rounded-3xl shadow-2xl shadow-black/[0.06] border border-gray-100 overflow-hidden flex
                      transition-all duration-350 ease-[cubic-bezier(0.4,0,0.2,1)]
                      ${leaving ? 'opacity-0 translate-y-4 scale-[0.98]' : 'animate-fade-in'}`}>

        {/* ───── LEFT PANEL — Register Form ───── */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 py-10">
          {/* Mobile-only logo */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500">
              <Workflow size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary tracking-tight">BPMS</span>
          </div>

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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200
                             bg-gray-50/50 text-text-primary text-sm placeholder:text-text-tertiary
                             focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-brand-500/10
                             transition-all duration-200" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('auth.email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input type="email" value={form.email} onChange={set('email')} required placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200
                             bg-gray-50/50 text-text-primary text-sm placeholder:text-text-tertiary
                             focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-brand-500/10
                             transition-all duration-200" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('auth.password')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} required placeholder="Min. 8 chars"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200
                               bg-gray-50/50 text-text-primary text-sm placeholder:text-text-tertiary
                               focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-brand-500/10
                               transition-all duration-200" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('auth.confirmPassword')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input type={showPw ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} required placeholder="Repeat"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200
                               bg-gray-50/50 text-text-primary text-sm placeholder:text-text-tertiary
                               focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-brand-500/10
                               transition-all duration-200" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                         bg-brand-500 text-white font-semibold text-sm
                         shadow-lg shadow-brand-500/20
                         hover:shadow-xl hover:shadow-brand-500/25 hover:-translate-y-0.5
                         active:translate-y-0 active:shadow-md
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                         transition-all duration-200 cursor-pointer mt-1">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? t('common.loading') : t('auth.register')}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            {t('auth.hasAccount')}{' '}
            <button
              type="button"
              onClick={() => navigateWithTransition('/login')}
              className="text-brand-500 hover:text-brand-400 font-semibold transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              {t('auth.login')}
            </button>
          </p>
        </div>

        {/* ───── RIGHT PANEL — Brand + Contact (swapped side) ───── */}
        <div className="hidden md:flex md:w-[420px] flex-col justify-between relative overflow-hidden
                        bg-gradient-to-br from-[#FFFDEE] to-[#E3EF26] p-10 text-gray-900">
          {/* Decorative shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full border border-black/[0.06]" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full border border-black/[0.06]" />
            <div className="absolute top-1/2 left-0 w-32 h-32 rounded-full bg-[#E3EF26]/30 blur-2xl" />
            <div className="absolute bottom-20 right-10 w-20 h-20 rounded-full bg-[#E3EF26]/20" />
          </div>

          {/* Top: Logo + Message */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-black/10 backdrop-blur-sm border border-black/10">
                <Workflow size={24} className="text-gray-900" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight">BPMS</span>
                <span className="block text-xs text-gray-900/50 font-medium tracking-wide">Platform</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold leading-snug mb-3">
              Get Started<br />In Minutes
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed max-w-[280px]">
              Create your account and unlock the full potential of automated business process management.
            </p>

            {/* Feature highlights */}
            <div className="mt-8 space-y-3">
              {[
                { icon: Users, text: 'Team Collaboration' },
                { icon: BarChart3, text: 'Real-time Analytics' },
                { icon: FileCheck, text: 'Compliance Ready' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/[0.06]">
                    <Icon size={15} className="text-gray-800" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: Contact info */}
          <div className="relative z-10 space-y-2.5 pt-6 border-t border-black/10">
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Globe size={14} />
              <span>www.bpms-platform.com</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Mail size={14} />
              <span>contact@bpms-platform.com</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Phone size={14} />
              <span>+212 6 00 00 00 00</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <MapPin size={14} />
              <span>Casablanca, Morocco</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
