import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { cacheService } from '../../services/CacheService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import PageHeader from '../../components/ui/PageHeader';
import { Briefcase, Calendar, CreditCard, Hash, Phone, Building, UserCheck, Loader2, CheckCircle2 } from 'lucide-react';

const EMPLOYEE_FIELDS = [
  { field: 'employee_code', label: 'Employee Code', type: 'text', icon: Hash, placeholder: 'EMP-2026-001' },
  { field: 'hire_date', label: 'Hire Date', type: 'date', icon: Calendar },
  { field: 'salary_base', label: 'Salary Base (MAD)', type: 'number', step: '0.01', icon: CreditCard, placeholder: '0.00' },
  { field: 'phone', label: 'Phone Number', type: 'text', icon: Phone, placeholder: '+212 6XX XXX XXX' },
  { field: 'location', label: 'Location', type: 'text', icon: Building, placeholder: 'Casablanca, Morocco' },
  { field: 'rib', label: 'RIB', type: 'text', icon: CreditCard, placeholder: 'MA76 0011 1110 0000 0123 4567 890' },
  { field: 'bio', label: 'Short Bio', type: 'text', icon: UserCheck, placeholder: 'Tell us briefly about your role.' },
  { field: 'cnss', label: 'CNSS Number', type: 'text', icon: CreditCard, placeholder: '1234567890' },
  { field: 'join_date', label: 'Join Date', type: 'date', icon: Calendar },
  { field: 'department', label: 'Department', type: 'text', icon: Building, placeholder: 'Engineering' },
];

const MANAGER_FIELDS = [
  { field: 'salary_base', label: 'Salary Base (MAD)', type: 'number', step: '0.01', icon: CreditCard, placeholder: '0.00' },
  { field: 'location', label: 'Location', type: 'text', icon: Building, placeholder: 'Casablanca, Morocco' },
  { field: 'cnss', label: 'CNSS Number', type: 'text', icon: CreditCard, placeholder: '1234567890' },
  { field: 'rib', label: 'RIB', type: 'text', icon: CreditCard, placeholder: 'MA76 0011 1110 0000 0123 4567 890' },
  { field: 'join_date', label: 'Join Date', type: 'date', icon: Calendar },
  { field: 'department', label: 'Department', type: 'text', icon: Building, placeholder: 'Engineering' },
  { field: 'phone', label: 'Phone Number', type: 'text', icon: Phone, placeholder: '+212 6XX XXX XXX' },
];

const INITIAL_FORM = {
  employee_code: '',
  hire_date: '',
  salary_base: '',
  phone: '',
  location: '',
  rib: '',
  bio: '',
  cnss: '',
  join_date: '',
  department: '',
};

export default function CompleteProfile() {
  const { profile, session } = useAuth();
  const { dismissProfileNotification } = useNotifications();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [employeeId, setEmployeeId] = useState(null);

  const roleHint = useMemo(() => searchParams.get('role')?.toUpperCase() || profile?.role || 'EMPLOYEE', [searchParams, profile]);
  const targetRole = roleHint === 'MANAGER' ? 'TEAM_MANAGER' : roleHint;
  const userId = session?.user?.id;
  const isEmployee = targetRole === 'EMPLOYEE';
  const isManager = targetRole === 'TEAM_MANAGER';
  const isHR = targetRole === 'HR';
  const isIndividualContributor = isEmployee || isHR;
  const fields = isManager ? MANAGER_FIELDS : EMPLOYEE_FIELDS;
  const formComplete = fields.every(({ field }) => String(form[field] ?? '').trim().length > 0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!userId) {
        setInitialLoading(false);
        return;
      }
      setInitialLoading(true);
      try {
        if (isEmployee) {
          const [{ data: employee }, { data: details }, { data: userBio }] = await Promise.all([
            supabase
              .from('employees')
              .select('id, employee_code, hire_date, salary_base, phone, location, rib')
              .eq('user_id', userId)
              .maybeSingle(),
            supabase
              .from('user_details')
              .select('cnss, rib, join_date, department, phone, adresse')
              .eq('id_user', userId)
              .maybeSingle(),
            supabase
              .from('users')
              .select('bio')
              .eq('id', userId)
              .maybeSingle(),
          ]);

          if (cancelled) return;
          setEmployeeId(employee?.id ?? null);
          setForm(prev => ({
            ...prev,
            employee_code: employee?.employee_code || prev.employee_code,
            hire_date: employee?.hire_date ? employee.hire_date.slice(0, 10) : prev.hire_date,
            salary_base: employee?.salary_base ? String(employee.salary_base) : prev.salary_base,
            phone: employee?.phone || details?.phone || prev.phone,
            department: details?.department || prev.department,
            location: employee?.location || details?.adresse || prev.location,
            bio: userBio?.bio || prev.bio,
          }));
        }

        if (isManager) {
          const [{ data: details }, { data: managerProfile }, { data: employee }] = await Promise.all([
            supabase
              .from('user_details')
              .select('cnss, rib, join_date, department, phone, adresse')
              .eq('id_user', userId)
              .maybeSingle(),
            supabase
              .from('team_manager_profiles')
              .select('salary_base, location')
              .eq('user_id', userId)
              .maybeSingle(),
            supabase
              .from('employees')
              .select('id')
              .eq('user_id', userId)
              .maybeSingle(),
          ]);
          if (cancelled) return;
          setEmployeeId(employee?.id ?? null);
          setForm(prev => ({
            ...prev,
            salary_base: managerProfile?.salary_base ? String(managerProfile.salary_base) : prev.salary_base,
            department: details?.department || prev.department,
            phone: details?.phone || prev.phone,
            location: managerProfile?.location || details?.adresse || prev.location,
          }));
        }
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [userId, isEmployee, isManager]);

  const updateField = (field) => (event) => setForm(prev => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!userId || (!isEmployee && !isManager)) {
      setError('Unable to resolve your account.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (form.department) {
        const deptName = form.department.trim();
        if (deptName && profile?.entreprise_id) {
          try {
            const { data: existingDept } = await supabase
              .from('departments')
              .select('id')
              .eq('entreprise_id', profile.entreprise_id)
              .ilike('name', deptName)
              .maybeSingle();

            if (!existingDept) {
              await supabase.from('departments').insert({
                entreprise_id: profile.entreprise_id,
                name: deptName
              });
            }
          } catch (deptErr) {
            console.error('Error inserting department:', deptErr);
          }
        }
      }

      if (isIndividualContributor) {
        const employeePayload = {
          employee_code: form.employee_code || null,
          hire_date: form.hire_date || new Date().toISOString().split('T')[0],
          salary_base: Number(form.salary_base) || 0,
          phone: form.phone || null,
          location: form.location || null,
          rib: form.rib || null,
          position: 'Employee',
        };

        const { error: employeeError } = employeeId
          ? await supabase.from('employees').update(employeePayload).eq('id', employeeId)
          : (isEmployee
            ? await supabase.from('employees').insert({ ...employeePayload, user_id: userId, entreprise_id: profile?.entreprise_id })
            : { error: null } // HR does not necessarily need a row in employees table if they have hr_profiles
          );
        if (employeeError) throw employeeError;

        const { error: detailError } = await supabase
          .from('user_details')
          .upsert({
            id_user: userId,
            cnss: form.cnss || null,
            rib: form.rib || null,
            join_date: form.join_date || null,
            department: form.department || null,
            phone: form.phone || null,
            adresse: form.location || null,
            entreprise_id: profile?.entreprise_id || null,
          }, { onConflict: 'id_user' });
        if (detailError) throw detailError;

        if (form.bio !== undefined) {
          const { error: bioError } = await supabase.from('users').update({ bio: form.bio || null }).eq('id', userId);
          if (bioError) throw bioError;
        }
      }

      if (isManager) {
        const salaryValue = Number(form.salary_base) || 0;
        const { error: managerError } = await supabase.rpc('rpc_complete_manager_profile', {
          p_user_id: userId,
          p_salary_base: salaryValue,
          p_location: form.location || null,
          p_cnss: form.cnss || null,
          p_rib: form.rib || null,
          p_join_date: form.join_date || null,
          p_department: form.department || null,
          p_phone: form.phone || null,
        });
        if (managerError) throw managerError;
      }

      // Invalidate users cache to show new adresse/phone in lists
      cacheService.invalidatePattern('^users:');

      dismissProfileNotification();
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 1300);
    } catch (submitError) {
      setError(submitError?.message || 'Failed to save your onboarding data.');
    } finally {
      setLoading(false);
    }
  };

  const headerTitle = isEmployee ? 'Complete Your Employee Profile' : 'Finalize Your Manager Setup';
  const headerDescription = isEmployee
    ? 'We need a few extra details (salary, CNSS, RIB) so your HR record stays active.'
    : 'Tell us your salary base so payroll knows how to treat your team.';

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 bg-surface-secondary">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title={headerTitle}
          description={headerDescription}
          icon={Briefcase}
          iconColor="from-brand-500 to-brand-600"
        />
        <div className="grid gap-6">
          <div className="rounded-3xl border border-border-secondary bg-surface-primary p-6 shadow-2xl">
            {initialLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-brand-500" size={32} />
              </div>
            ) : success ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <CheckCircle2 size={52} className="text-emerald-500" />
                <p className="text-lg font-semibold text-text-primary">Thanks, your profile is now complete.</p>
                <p className="text-sm text-text-tertiary">You will be redirected back to your dashboard shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                    {error}
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  {fields.map(({ field, label, type, placeholder, icon: Icon, step }) => (
                    <label key={field} className="space-y-1 text-sm font-semibold uppercase tracking-wide text-text-tertiary">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-text-tertiary" />
                        <span className="text-xs font-bold text-text-primary">{label}</span>
                      </div>
                      <input
                        autoComplete="off"
                        type={type}
                        step={step}
                        placeholder={placeholder}
                        value={form[field]}
                        onChange={updateField(field)}
                        className="w-full rounded-2xl border border-border-secondary bg-surface-secondary py-3 px-4 text-sm font-medium text-text-primary placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </label>
                  ))}
                </div>
                <div className="flex flex-col gap-3 pt-2 text-sm text-text-secondary">
                  <div className="rounded-2xl border border-dashed border-border-secondary bg-surface-muted p-4">
                    <p>
                      These details feed the <span className="font-semibold text-text-primary">employees</span>,
                      <span className="font-semibold text-text-primary"> user_details</span> and,
                      {isManager && ' team_manager_profiles'} tables in a single shot.
                    </p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!formComplete || loading}
                  className="w-full rounded-2xl border border-transparent bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Saving your profile…' : 'Save and continue'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
