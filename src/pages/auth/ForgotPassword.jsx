import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Workflow, Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
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
    <div className="min-h-screen bg-sidebar-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
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
          {sent ? (
            <div className="text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/15 mx-auto mb-4">
                <CheckCircle2 size={28} className="text-brand-500" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Email sent!</h2>
              <p className="text-sm text-text-secondary mb-6">
                Check <strong className="text-text-primary">{email}</strong> for a password reset link.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors mb-5">
                <ArrowLeft size={13} /> Back to Sign In
              </Link>
              <h1 className="text-2xl font-bold text-text-primary mb-1">Reset password</h1>
              <p className="text-sm text-text-secondary mb-6">Enter your email and we'll send you a reset link.</p>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  <AlertCircle size={16} className="shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-primary bg-surface-secondary
                                 text-text-primary text-sm placeholder:text-text-tertiary
                                 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all duration-200" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                             bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold text-sm
                             shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed
                             transition-all duration-200 cursor-pointer">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
