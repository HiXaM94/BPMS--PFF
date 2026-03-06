import { useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { CreditCard, Phone as PhoneIcon, Building, Calendar, UserCheck, FileText, AlertCircle } from 'lucide-react';

export default function ProfileDataModal({ isOpen, onClose }) {
  const { session } = useAuth();
  const { dismissProfileNotification } = useNotifications();
  const [form, setForm] = useState({ cnss: '', rib: '', phone: '', department: '', join_date: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const allFilled = Object.values(form).every(v => v.trim() !== '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!allFilled) { setError('All fields are required.'); return; }

    setLoading(true);
    try {
      if (!session?.user?.id) throw new Error('Session not found.');

      const { error: insertError } = await supabase
        .from('user_details')
        .insert({
          id_user: session.user.id,
          cnss: form.cnss,
          rib: form.rib,
          phone: form.phone,
          department: form.department,
          join_date: form.join_date,
        });
      if (insertError) throw insertError;

      dismissProfileNotification();
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error('Profile data insert failed:', err);
      setError(err.message || 'Failed to save data.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { icon: CreditCard, label: 'CNSS Number', placeholder: 'Enter your CNSS number', field: 'cnss', type: 'text' },
    { icon: CreditCard, label: 'RIB (Bank Account)', placeholder: 'Enter your RIB', field: 'rib', type: 'text' },
    { icon: PhoneIcon, label: 'Phone Number', placeholder: '+212 6XX XXX XXX', field: 'phone', type: 'text' },
    { icon: Building, label: 'Department', placeholder: 'e.g. Human Resources', field: 'department', type: 'text' },
    { icon: Calendar, label: 'Join Date', placeholder: '', field: 'join_date', type: 'date' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-zinc-950/80 backdrop-blur-md pt-8 px-4 overflow-y-auto">
      <div className="w-full max-w-md bg-surface-primary border border-border-secondary rounded-[24px] shadow-2xl overflow-hidden flex flex-col mb-8">
        <div className="relative bg-surface-primary p-6 pb-4 text-center border-b border-border-secondary">
          {!success && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <div className="mx-auto w-14 h-14 bg-surface-secondary border border-border-secondary rounded-full flex items-center justify-center mb-3 shadow-sm">
            {success ? <UserCheck size={24} className="text-emerald-500" /> : <FileText size={24} className="text-text-primary" />}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary mb-1">
            {success ? 'Profile Saved!' : 'Complete Your Profile'}
          </h2>
          <p className="text-text-secondary text-sm">
            {success ? 'Redirecting to your dashboard...' : 'Please fill in your personal details to continue.'}
          </p>
        </div>
        {!success && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-3 p-3 bg-danger-50 text-danger-600 rounded-xl text-sm border border-danger-100">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p className="font-medium text-xs">{error}</p>
              </div>
            )}
            {fields.map(({ icon: Icon, label, placeholder, field, type }) => (
              <div key={field} className="space-y-1.5">
                <label className="text-sm font-semibold text-text-secondary pl-1 block">{label}</label>
                <div className="relative group">
                  <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type={type}
                    required
                    value={form[field]}
                    onChange={setField(field)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-secondary border border-border-secondary rounded-xl text-text-primary text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder:text-text-tertiary"
                  />
                </div>
              </div>
            ))}
            <button
              type="submit"
              disabled={loading || !allFilled}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 text-black dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Profile & Continue'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
