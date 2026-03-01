import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Workflow, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle,
  Globe, Phone, MapPin, ArrowRight, Sparkles, Shield, Zap,
  User, CheckCircle2, Users, BarChart3, FileCheck, Copy, Check,
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'Admin',    email: 'admin@techcorp.ma' },
  { role: 'HR',       email: 'hr@techcorp.ma' },
  { role: 'Manager',  email: 'manager@techcorp.ma' },
  { role: 'Employee', email: 'employee@techcorp.ma' },
];
const DEMO_PASSWORD = 'Demo@123456';

const inputCls = `w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200
                  bg-gray-50/50 text-text-primary text-sm placeholder:text-text-tertiary
                  focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-brand-500/10
                  transition-all duration-200`;

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Determine initial mode from URL
  const [isRegister, setIsRegister] = useState(location.pathname === '/register');
  const [animating, setAnimating]   = useState(false);

  // Login state
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Register state
  const [regForm, setRegForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [regShowPw, setRegShowPw]   = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError]     = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Demo copy feedback
  const [copiedIdx, setCopiedIdx] = useState(null);

  const setReg = (k) => (e) => setRegForm(f => ({ ...f, [k]: e.target.value }));

  // Smooth swap toggle
  const toggleMode = () => {
    setAnimating(true);
    setError('');
    setRegError('');
    setTimeout(() => {
      setIsRegister(prev => !prev);
      // Update URL without reload
      window.history.replaceState(null, '', isRegister ? '/login' : '/register');
      setTimeout(() => setAnimating(false), 50);
    }, 300);
  };

  // Sync URL on popstate
  useEffect(() => {
    setIsRegister(location.pathname === '/register');
  }, [location.pathname]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message || '';
      console.error('Login error:', msg, err);
      setError(msg || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (regForm.password !== regForm.confirm) { setRegError(t('auth.passwordMismatch')); return; }
    if (regForm.password.length < 8) { setRegError(t('auth.passwordMinLength')); return; }
    setRegLoading(true);
    try {
      await signUp(regForm.email, regForm.password, { full_name: regForm.name });
      setRegSuccess(true);
    } catch (err) {
      setRegError(err.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  const fillDemo = (acct) => {
    setEmail(acct.email);
    setPassword(DEMO_PASSWORD);
    setCopiedIdx(acct.email);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  // ──── Success screen after registration ────
  if (regSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50/40 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in text-center bg-white rounded-3xl shadow-2xl shadow-black/[0.06] border border-gray-100 p-10">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Check your email</h2>
          <p className="text-text-secondary mb-6">
            We sent a confirmation link to <strong className="text-text-primary">{regForm.email}</strong>.
          </p>
          <button onClick={() => { setRegSuccess(false); setIsRegister(false); window.history.replaceState(null, '', '/login'); }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-sm
              shadow-lg shadow-brand-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
            {t('auth.backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  // ──── Brand Panel (reused for both sides) ────
  const BrandPanel = ({ heading, description, features }) => (
    <div className="hidden md:flex md:w-[420px] shrink-0 flex-col justify-between relative overflow-hidden
                    bg-gradient-to-br from-[#FFFDEE] to-[#E3EF26] p-10 text-gray-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full border border-black/[0.06]" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full border border-black/[0.06]" />
        <div className="absolute top-1/2 right-0 w-32 h-32 rounded-full bg-[#E3EF26]/30 blur-2xl" />
        <div className="absolute bottom-20 left-10 w-20 h-20 rounded-full bg-[#E3EF26]/20" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 shrink-0">
              <rect width="32" height="32" rx="8" fill="black" />
              <path d="M8 8 V18 C8 24 16 24 16 18 V8" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M16 8 V18 C16 24 24 24 24 18 V8" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
          <div>
            <span className="text-xl font-bold tracking-tight">Flowly</span>
            <span className="block text-xs text-gray-900/50 font-medium tracking-wide">Business Suite</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold leading-snug mb-3">{heading}</h2>
        <p className="text-sm text-gray-700 leading-relaxed max-w-[280px]">{description}</p>
        <div className="mt-8 space-y-3">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/[0.06]">
                <Icon size={15} className="text-gray-800" />
              </div>
              <span className="text-sm text-gray-700 font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 space-y-2.5 pt-6 border-t border-black/10">
        <div className="flex items-center gap-2.5 text-sm text-gray-600"><Globe size={14} /><span>www.flowly.io</span></div>
        <div className="flex items-center gap-2.5 text-sm text-gray-600"><Mail size={14} /><span>contact@flowly.io</span></div>
        <div className="flex items-center gap-2.5 text-sm text-gray-600"><Phone size={14} /><span>+212 5 24 43 67 89</span></div>
        <div className="flex items-center gap-2.5 text-sm text-gray-600"><MapPin size={14} /><span>Marrakech, Morocco</span></div>
      </div>
    </div>
  );

  const loginFeatures = [
    { icon: Zap, text: 'Automated HR Workflows' },
    { icon: Shield, text: 'Enterprise-grade Security' },
    { icon: Sparkles, text: 'AI-powered Insights' },
  ];
  const registerFeatures = [
    { icon: Users, text: 'Team Collaboration' },
    { icon: BarChart3, text: 'Real-time Analytics' },
    { icon: FileCheck, text: 'Compliance Ready' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50/40 flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#E3EF26]/[0.06] blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/[0.03] blur-[100px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-sky-400/[0.03] blur-[80px]" />
      </div>

      {/* Two-panel card with swap */}
      <div className={`relative w-full max-w-[960px] min-h-[560px] bg-white rounded-3xl shadow-2xl shadow-black/[0.06]
                       border border-gray-100 overflow-hidden flex animate-fade-in
                       transition-opacity duration-300 ${animating ? 'opacity-0 scale-[0.99]' : 'opacity-100 scale-100'}
                       ${isRegister ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* ───── Brand Panel ───── */}
        <BrandPanel
          heading={isRegister ? <><span>Get Started</span><br /><span>In Minutes</span></> : <><span>Streamline Your</span><br /><span>Business Processes</span></>}
          description={isRegister
            ? 'Create your account and unlock the full potential of automated business process management.'
            : 'The all-in-one HR management and workflow automation suite built for modern enterprises.'}
          features={isRegister ? registerFeatures : loginFeatures}
        />

        {/* ───── Form Panel ───── */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 py-10 overflow-y-auto">
          {/* Mobile-only logo */}
          <div className="flex items-center gap-3 mb-6 md:hidden">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 shrink-0">
              <rect width="32" height="32" rx="8" className="fill-black dark:fill-white" />
              <path d="M8 8 V18 C8 24 16 24 16 18 V8" className="stroke-white dark:stroke-black" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M16 8 V18 C16 24 24 24 24 18 V8" className="stroke-white dark:stroke-black" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
            <span className="text-lg font-bold text-text-primary tracking-tight">Flowly</span>
          </div>

          {!isRegister ? (
            /* ════════ LOGIN FORM ════════ */
            <>
              <h1 className="text-2xl font-bold text-text-primary mb-1">{t('auth.signInTitle')}</h1>
              <p className="text-sm text-text-secondary mb-6">{t('auth.signInSubtitle')}</p>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/8 border border-red-500/15 text-red-600 text-sm animate-fade-in">
                  <AlertCircle size={16} className="shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="you@company.com" className={inputCls} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-text-secondary">{t('auth.password')}</label>
                    <Link to="/forgot-password" className="text-xs text-brand-500 hover:text-brand-400 font-medium transition-colors">
                      {t('auth.forgotPassword')}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="••••••••" className={`${inputCls} !pr-11`} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                             bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/20
                             hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md
                             disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                             transition-all duration-200 cursor-pointer">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? t('common.loading') : t('auth.login')}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>

              <p className="text-center text-sm text-text-secondary mt-5">
                {t('auth.noAccount')}{' '}
                <button type="button" onClick={toggleMode}
                  className="text-brand-500 hover:text-brand-400 font-semibold transition-colors cursor-pointer bg-transparent border-none p-0">
                  {t('auth.register')}
                </button>
              </p>

              {/* Demo credentials */}
              <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs font-medium text-text-secondary mb-2 text-center">Demo Accounts <span className="text-text-tertiary">(password: <code className="bg-gray-200 px-1 rounded text-[11px]">{DEMO_PASSWORD}</code>)</span></p>
                <div className="grid grid-cols-2 gap-1.5">
                  {DEMO_ACCOUNTS.map((acct) => (
                    <button key={acct.email} onClick={() => fillDemo(acct)} type="button"
                      className="flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg text-xs
                                 bg-white border border-gray-100 hover:border-gray-300 hover:bg-gray-50
                                 transition-all duration-150 cursor-pointer group">
                      <span>
                        <span className="font-semibold text-text-primary">{acct.role}</span>
                        <span className="text-text-tertiary ml-1 hidden sm:inline">{acct.email.split('@')[0]}</span>
                      </span>
                      {copiedIdx === acct.email
                        ? <Check size={12} className="text-emerald-500 shrink-0" />
                        : <Copy size={12} className="text-text-tertiary group-hover:text-text-secondary shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* ════════ REGISTER FORM ════════ */
            <>
              <h1 className="text-2xl font-bold text-text-primary mb-1">{t('auth.registerTitle')}</h1>
              <p className="text-sm text-text-secondary mb-5">Join your company's Flowly workspace</p>

              {regError && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/8 border border-red-500/15 text-red-600 text-sm animate-fade-in">
                  <AlertCircle size={16} className="shrink-0" />{regError}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Full name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input type="text" value={regForm.name} onChange={setReg('name')} required
                      placeholder="Ibrahim Rouass" className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input type="email" value={regForm.email} onChange={setReg('email')} required
                      placeholder="you@company.com" className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('auth.password')}</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                      <input type={regShowPw ? 'text' : 'password'} value={regForm.password} onChange={setReg('password')} required
                        placeholder="Min. 8 chars" className={`${inputCls} !pr-10`} />
                      <button type="button" onClick={() => setRegShowPw(!regShowPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer">
                        {regShowPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('auth.confirmPassword')}</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                      <input type={regShowPw ? 'text' : 'password'} value={regForm.confirm} onChange={setReg('confirm')} required
                        placeholder="Repeat" className={inputCls} />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={regLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                             bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/20
                             hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md
                             disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                             transition-all duration-200 cursor-pointer">
                  {regLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {regLoading ? t('common.loading') : t('auth.register')}
                  {!regLoading && <ArrowRight size={16} />}
                </button>
              </form>

              <p className="text-center text-sm text-text-secondary mt-5">
                {t('auth.hasAccount')}{' '}
                <button type="button" onClick={toggleMode}
                  className="text-brand-500 hover:text-brand-400 font-semibold transition-colors cursor-pointer bg-transparent border-none p-0">
                  {t('auth.login')}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
