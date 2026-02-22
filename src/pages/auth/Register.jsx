import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Workflow, Mail, Lock, Eye, EyeOff, User, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const { signUp } = useAuth();
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
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
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
      <div className="min-h-screen bg-sidebar-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/15 mx-auto mb-4">
            <CheckCircle2 size={32} className="text-brand-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-sidebar-text mb-6">
            We sent a confirmation link to <strong className="text-white">{form.email}</strong>.
            Click it to activate your account.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl
            bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold text-sm
            shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sidebar-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#272b30] shadow-lg">
            <Workflow size={24} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-tight">BPMS</span>
            <span className="block text-xs text-sidebar-text font-medium tracking-wide">Platform</span>
          </div>
        </div>

        <div className="bg-surface-primary rounded-2xl border border-border-primary shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-text-primary mb-1">Create account</h1>
          <p className="text-sm text-text-secondary mb-6">Join your company's BPMS workspace</p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-fade-in">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input type="text" value={form.name} onChange={set('name')} required placeholder="Ibrahim Rouass"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-primary bg-surface-secondary
                             text-text-primary text-sm placeholder:text-text-tertiary
                             focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all duration-200" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input type="email" value={form.email} onChange={set('email')} required placeholder="you@company.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-primary bg-surface-secondary
                             text-text-primary text-sm placeholder:text-text-tertiary
                             focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all duration-200" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} required placeholder="Min. 8 characters"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border-primary bg-surface-secondary
                             text-text-primary text-sm placeholder:text-text-tertiary
                             focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all duration-200" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input type={showPw ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} required placeholder="Repeat password"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-primary bg-surface-secondary
                             text-text-primary text-sm placeholder:text-text-tertiary
                             focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all duration-200" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                         bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold text-sm
                         shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                         transition-all duration-200 cursor-pointer mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-600 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
