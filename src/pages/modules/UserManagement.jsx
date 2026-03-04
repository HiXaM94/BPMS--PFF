import { useState, useEffect, useCallback } from 'react';

import {
  Users, UserPlus, Shield, Mail, Eye, Edit, Trash2,
  Search, Filter, UserCheck, UserX, UserCog,
  Phone, MapPin, Building2, Calendar, Briefcase,
  Lock,
} from 'lucide-react';

import PageHeader from '../../components/ui/PageHeader';

import DataTable from '../../components/ui/DataTable';

import StatusBadge from '../../components/ui/StatusBadge';

import StatCard from '../../components/ui/StatCard';

import Modal from '../../components/ui/Modal';

import ConfirmDialog from '../../components/ui/ConfirmDialog';

import { useRole } from '../../contexts/RoleContext';

import { useAuth } from '../../contexts/AuthContext';

import { supabase, isSupabaseReady } from '../../services/supabase';

import { cacheService } from '../../services/CacheService';



// No demo/fallback users — always show real data or empty list
const defaultUsers = [];




const superAdminUsers = [

  { id: 101, name: 'Ibrahim Rouass', email: 'ibrahim@techcorp.ma', role: 'Admin', department: 'Management', company: 'TechCorp International', status: 'active', lastLogin: '2 min ago', avatar: 'IR' },

  { id: 102, name: 'Amina Bennis', email: 'amina@finserve.ma', role: 'Admin', department: 'Management', company: 'FinServe Global', status: 'active', lastLogin: '1h ago', avatar: 'AB' },

  { id: 103, name: 'Youssef Alaoui', email: 'youssef@medicare.ma', role: 'Admin', department: 'Management', company: 'MediCare Plus', status: 'active', lastLogin: '3h ago', avatar: 'YA' },

  { id: 104, name: 'Salma Tazi', email: 'salma@edulearn.ma', role: 'Admin', department: 'Management', company: 'EduLearn Academy', status: 'active', lastLogin: '1 day ago', avatar: 'ST' },

  { id: 105, name: 'Karim Chraibi', email: 'karim@retailmax.ma', role: 'Admin', department: 'Management', company: 'RetailMax Holdings', status: 'active', lastLogin: '5 days ago', avatar: 'KC' },

];



const roleColors = { Admin: 'brand', Manager: 'warning', HR: 'pink', Employee: 'info', Observer: 'neutral' };

const avatarColors = {

  Admin: 'from-brand-500 to-brand-600',

  Manager: 'from-amber-500 to-orange-600',

  HR: 'from-pink-500 to-rose-600',

  Employee: 'from-brand-500 to-brand-600',

  Observer: 'from-gray-400 to-gray-500',

};



function getColumns(onView, onEdit, onDelete, isSuperAdmin) {

  return [

    {

      key: 'name', label: 'User',

      render: (val, row) => (

        <div className="flex items-center gap-3">

          <div className={`flex items-center justify-center w-9 h-9 rounded-full

                           bg-gradient-to-br ${avatarColors[row.role] || avatarColors.Employee} text-white text-xs font-bold shrink-0`}>

            {row.avatar}

          </div>

          <div>

            <span className="font-semibold text-text-primary block text-sm">{val}</span>

            <span className="text-[11px] text-text-tertiary flex items-center gap-1">

              <Mail size={10} />{row.email}

            </span>

          </div>

        </div>

      ),

    },

    {

      key: 'role', label: 'Role',

      render: (val) => <StatusBadge variant={roleColors[val] || 'neutral'} size="sm">{val}</StatusBadge>,

    },

    isSuperAdmin

      ? { key: 'company', label: 'Company', cellClassName: 'text-text-secondary text-sm font-medium' }

      : { key: 'department', label: 'Department', cellClassName: 'text-text-secondary text-sm' },

    {

      key: 'status', label: 'Status',

      render: (val) => {

        const map = { active: 'success', inactive: 'danger', pending: 'warning', suspended: 'danger' };

        return <StatusBadge variant={map[val] || 'neutral'} dot size="sm">{val}</StatusBadge>;

      },

    },

    { key: 'lastLogin', label: 'Last Login', cellClassName: 'text-text-tertiary text-xs' },

    {

      key: 'actions', label: '',

      render: (_, row) => (

        <div className="flex items-center gap-1">

          <button onClick={() => onView(row)} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer" title="View"><Eye size={14} className="text-text-tertiary" /></button>

          {!isSuperAdmin && (

            <>

              <button onClick={() => onEdit(row)} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer" title="Edit"><Edit size={14} className="text-text-tertiary" /></button>

              <button onClick={() => onDelete(row)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer" title="Delete"><Trash2 size={14} className="text-red-400" /></button>

            </>

          )}

        </div>

      ),

    },

  ];

}



const departments = ['Engineering', 'Marketing', 'Design', 'Human Resources', 'Finance', 'QA', 'Sales', 'Operations'];



const inputClassName = `w-full px-3 py-2.5 rounded-xl text-sm bg-surface-secondary border border-border-secondary

                        focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400

                        transition-all duration-200 text-text-primary placeholder:text-text-tertiary`;



const labelClassName = 'block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider';



export default function UserManagement() {

  const { currentRole } = useRole();

  const { profile, signUpSilently } = useAuth();

  const isAdmin = currentRole.id === 'super_admin' || currentRole.id === 'company_admin';

  const isSuperAdmin = currentRole.id === 'super_admin';

  const isHR = currentRole.id === 'hr';



  const [search, setSearch] = useState('');

  const [roleFilter, setRoleFilter] = useState('all');

  const [users, setUsers] = useState(isSuperAdmin ? superAdminUsers : defaultUsers);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');

  // ── HR-specific modal state ──
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const emptyHrForm = { fullName: '', email: '' };
  const [hrForm, setHrForm] = useState(emptyHrForm);
  const [isCreating, setIsCreating] = useState(false);
  const [hrError, setHrError] = useState('');

  // View / Edit modal state

  const [viewUser, setViewUser] = useState(null);

  const [editUser, setEditUser] = useState(null);

  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', department: '', status: '' });

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [deleting, setDeleting] = useState(false);



  const showToast = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };



  // ── Map DB role enums to display labels ──

  const roleMap = { ADMIN: 'Admin', HR: 'HR', TEAM_MANAGER: 'Manager', EMPLOYEE: 'Employee' };

  const roleMapReverse = { Admin: 'ADMIN', HR: 'HR', Manager: 'TEAM_MANAGER', Employee: 'EMPLOYEE', Observer: 'EMPLOYEE' };



  // ── Fetch users from Supabase ──

  const fetchUsers = useCallback(async () => {

    if (!isSupabaseReady) { setUsers(defaultUsers); return; }

    if (!profile?.entreprise_id) { setUsers([]); return; } // logged in but company not loaded yet

    const cacheKey = `users:list:${profile.entreprise_id}`;

    const data = await cacheService.getOrSet(cacheKey, async () => {

      const { data, error } = await supabase.from('users')

        .select('*')

        .eq('entreprise_id', profile.entreprise_id)

        .order('created_at', { ascending: false });

      if (error) { console.error('Fetch users error:', error.message); return null; }

      return data;

    }, 90);

    setUsers((data ?? []).map(u => ({

      id: u.id,

      name: u.name || u.email?.split('@')[0],

      email: u.email,

      role: u.role ? (roleMap[u.role.toUpperCase()] || u.role) : 'Employee',

      department: '-',

      status: u.status || 'active',

      lastLogin: u.last_login_at ? new Date(u.last_login_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never',

      avatar: u.avatar_initials || u.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??',

    })));

  }, [profile]);



  useEffect(() => { fetchUsers(); }, [fetchUsers]);



  // Determine what type of account can be created

  const canCreate = !isSuperAdmin && (isAdmin || isHR);

  const createRoleType = isAdmin ? 'HR' : 'Employee';

  const createLabel = isAdmin ? 'Create HR Account' : 'Create Employee';



  const emptyForm = {

    firstName: '',

    lastName: '',

    email: '',

    department: '',

  };

  const [form, setForm] = useState(emptyForm);



  // ── HR: Add Employee ──
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!isSupabaseReady) { showToast('Supabase not configured.'); return; }
    setIsCreating(true);
    setHrError('');
    const DEFAULT_PASSWORD = '000000';
    const initials = hrForm.fullName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
    try {
      // 1. Create auth user silently (HR session is preserved by signUpSilently)
      const authData = await signUpSilently(hrForm.email.trim(), DEFAULT_PASSWORD, {
        name: hrForm.fullName.trim(),
        role: 'EMPLOYEE',
        entreprise_id: profile?.entreprise_id,
      });
      const newUserId = authData?.user?.id;
      if (!newUserId) throw new Error('Failed to create auth user.');

      // 2. Call SECURITY DEFINER RPC — UPSERTS users row then inserts employees (no timing dep)
      const { data: rpcData, error: rpcErr } = await supabase.rpc('create_employee', {
        p_user_id: newUserId,
        p_entreprise_id: profile.entreprise_id,
        p_full_name: hrForm.fullName.trim(),
        p_email: hrForm.email.trim(),
        p_avatar: initials,
        p_password: DEFAULT_PASSWORD,
      });
      if (rpcErr) throw new Error(rpcErr.message);

      // 4. Update local list
      setUsers(prev => [{
        id: newUserId, name: hrForm.fullName.trim(), email: hrForm.email.trim(),
        role: 'Employee', department: '-', status: 'active', lastLogin: 'Never', avatar: initials,
      }, ...prev]);

      cacheService.invalidatePattern('^users:');
      setShowEmployeeModal(false);
      setHrForm(emptyHrForm);
      showToast(`Employee "${hrForm.fullName.trim()}" created! Default password: 000000`);
    } catch (err) {
      console.error('[AddEmployee]', err);
      setHrError(err.message || 'Failed to create employee.');
    } finally {
      setIsCreating(false);
    }
  };

  // ── HR: Add Team Manager ──
  const handleAddManager = async (e) => {
    e.preventDefault();
    if (!isSupabaseReady) { showToast('Supabase not configured.'); return; }
    setIsCreating(true);
    setHrError('');
    const DEFAULT_PASSWORD = '000000';
    const initials = hrForm.fullName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
    try {
      // 1. Create auth user silently (HR session preserved)
      const authData = await signUpSilently(hrForm.email.trim(), DEFAULT_PASSWORD, {
        name: hrForm.fullName.trim(),
        role: 'TEAM_MANAGER',
        entreprise_id: profile?.entreprise_id,
      });
      const newUserId = authData?.user?.id;
      if (!newUserId) throw new Error('Failed to create auth user.');

      // 2. Call SECURITY DEFINER RPC — UPSERTS users row + inserts employees + team_manager_profiles
      const { data: rpcData, error: rpcErr } = await supabase.rpc('create_team_manager', {
        p_user_id: newUserId,
        p_entreprise_id: profile.entreprise_id,
        p_full_name: hrForm.fullName.trim(),
        p_email: hrForm.email.trim(),
        p_avatar: initials,
        p_password: DEFAULT_PASSWORD,
      });
      if (rpcErr) throw new Error(rpcErr.message);

      // 4. Update local list
      setUsers(prev => [{
        id: newUserId, name: hrForm.fullName.trim(), email: hrForm.email.trim(),
        role: 'Manager', department: '-', status: 'active', lastLogin: 'Never', avatar: initials,
      }, ...prev]);

      cacheService.invalidatePattern('^users:');
      setShowManagerModal(false);
      setHrForm(emptyHrForm);
      showToast(`Team Manager "${hrForm.fullName.trim()}" created! Default password: 000000`);
    } catch (err) {
      console.error('[AddManager]', err);
      setHrError(err.message || 'Failed to create team manager.');
    } finally {
      setIsCreating(false);
    }
  };

  // ── Delete user ──

  const handleDeleteUser = (user) => setDeleteTarget(user);

  const confirmDeleteUser = async () => {

    if (!deleteTarget) return;

    setDeleting(true);

    setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));

    showToast(`User "${deleteTarget.name}" deleted.`);



    if (isSupabaseReady) {

      const { error } = await supabase.from('users').delete().eq('id', deleteTarget.id);

      if (error) {

        showToast(`Error: ${error.message}`);

        fetchUsers();

      }

      cacheService.invalidatePattern('^users:');

      cacheService.invalidatePattern('^admin:');

    }

    setDeleting(false);

    setDeleteTarget(null);

  };



  // Build columns with action callbacks

  const columns = getColumns(

    (user) => setViewUser(user),

    (user) => {

      setEditUser(user);

      setEditForm({ name: user.name, email: user.email, role: user.role, department: user.department, status: user.status });

    },

    handleDeleteUser,

    isSuperAdmin

  );



  const filtered = users.filter(u => {

    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||

      u.email.toLowerCase().includes(search.toLowerCase());

    const matchRole = roleFilter === 'all' || u.role === roleFilter;

    return matchSearch && matchRole;

  });



  const activeCount = users.filter(u => u.status === 'active').length;

  const pendingCount = users.filter(u => u.status === 'pending').length;



  const handleInputChange = (field, value) => {

    setForm(prev => ({ ...prev, [field]: value }));

  };



  const handleCreateUser = async (e) => {

    e.preventDefault();

    const fullName = `${form.firstName} ${form.lastName}`.trim();

    const initials = `${form.firstName.charAt(0)}${form.lastName.charAt(0)}`.toUpperCase();

    const emailPrefix = `${form.firstName.toLowerCase()}.${form.lastName.charAt(0).toLowerCase()}`;

    const email = form.email || `${emailPrefix}@flowly.io`;



    if (!isSupabaseReady) {

      const newUser = {

        id: users.length + 1, name: fullName, email,

        role: createRoleType, department: form.department || (createRoleType === 'HR' ? 'Human Resources' : 'Engineering'),

        status: 'pending', lastLogin: 'Never', avatar: initials,

      };

      setUsers(prev => [newUser, ...prev]);

      setForm(emptyForm); setShowCreateModal(false);

      showToast(`${createRoleType} account for "${fullName}" created successfully!`);

      return;

    }



    // Create auth user silently — preserves the current admin session
    const dbRole = roleMapReverse[createRoleType] || 'EMPLOYEE';
    const tempPassword = form.password || crypto.randomUUID().slice(0, 12);

    const authData = await signUpSilently(email, tempPassword, {
      name: fullName,
      role: dbRole,
      entreprise_id: profile?.entreprise_id,
      phone: form.phone || '',
    });

    if (!authData?.user) { showToast('Error: Failed to create auth user.'); return; }


    const newUserId = authData.user?.id;

    // Trigger auto-creates the public.users row; session is already restored by signUpSilently


    // The trigger on auth.users auto-creates the public.users row

    setUsers(prev => [{

      id: newUserId || Date.now(),

      name: fullName, email, role: createRoleType,

      department: form.department || '-', status: 'pending',

      lastLogin: 'Never', avatar: initials,

    }, ...prev]);

    setForm(emptyForm); setShowCreateModal(false);

    showToast(`${createRoleType} account for "${fullName}" created! Confirmation email sent.`);

    cacheService.invalidatePattern('^users:');

    cacheService.invalidatePattern('^admin:');

  };



  const handleEditSave = async (e) => {

    e.preventDefault();

    const newAvatar = editForm.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    // Optimistic

    setUsers(prev => prev.map(u =>

      u.id === editUser.id

        ? { ...u, name: editForm.name, email: editForm.email, role: editForm.role, department: editForm.department, status: editForm.status, avatar: newAvatar }

        : u

    ));

    showToast(`User "${editForm.name}" updated successfully!`);

    setEditUser(null);



    if (isSupabaseReady) {

      const dbRole = roleMapReverse[editForm.role] || 'EMPLOYEE';

      const { error } = await supabase.from('users').update({

        name: editForm.name,

        email: editForm.email,

        role: dbRole,

        status: editForm.status,

        avatar_initials: newAvatar,

      }).eq('id', editUser.id);

      if (error) {

        showToast(`Error: ${error.message}`);

        fetchUsers(); // rollback

        return;

      }

      cacheService.invalidatePattern('^users:');

      cacheService.invalidatePattern('^admin:');

    }

  };



  return (

    <div className="space-y-6 animate-fade-in">

      <PageHeader
        title={isSuperAdmin ? "Companies Admin" : "User Management"}
        description={isSuperAdmin ? "Global view of all tenant administrators" : "Manage users, roles, and access permissions"}
        icon={Users}
        iconColor="from-brand-500 to-brand-600"
        actionLabel={canCreate && !isHR ? createLabel : undefined}
        actionIcon={canCreate && !isHR ? UserPlus : undefined}
        actionColor="from-brand-500 to-brand-600"
        onAction={canCreate && !isHR ? () => setShowCreateModal(true) : undefined}
      >
        {isHR && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setHrForm(emptyHrForm); setHrError(''); setShowEmployeeModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                         bg-gradient-to-r from-brand-500 to-brand-600 text-white
                         text-sm font-semibold shadow-sm hover:-translate-y-0.5
                         active:translate-y-0 transition-all duration-200 cursor-pointer"
            >
              <UserPlus size={15} />
              Add Employee
            </button>
            <button
              onClick={() => { setHrForm(emptyHrForm); setHrError(''); setShowManagerModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                         bg-gradient-to-r from-violet-500 to-purple-600 text-white
                         text-sm font-semibold shadow-sm hover:-translate-y-0.5
                         active:translate-y-0 transition-all duration-200 cursor-pointer"
            >
              <UserCog size={15} />
              Add Team Manager
            </button>
          </div>
        )}
      </PageHeader>



      {/* Success message */}

      {successMsg && (

        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10

                        border border-emerald-500/20 text-emerald-500 text-sm font-medium animate-fade-in">

          <span>✓</span> {successMsg}

        </div>

      )}



      {/* Stats */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <StatCard title="Total Users" value={users.length.toString()} icon={Users} iconColor="bg-gradient-to-br from-brand-500 to-brand-600" delay={0} />

        <StatCard title="Active Users" value={activeCount.toString()} icon={UserCheck} iconColor="bg-gradient-to-br from-emerald-500 to-teal-600" delay={80} />

        <StatCard title="Pending Invites" value={pendingCount.toString()} icon={UserCog} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" delay={160} />

        <StatCard title="Roles Defined" value="5" icon={Shield} iconColor="bg-gradient-to-br from-brand-500 to-brand-600" subtitle="Admin, Manager, HR, Employee, Observer" delay={240} />

      </div>



      {/* Role Distribution */}

      <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5 animate-fade-in"

        style={{ animationDelay: '350ms' }}>

        <h2 className="text-sm font-semibold text-text-primary mb-3">Role Distribution</h2>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">

          {Object.entries(roleColors).map(([role, color]) => {

            const count = users.filter(u => u.role === role).length;

            return (

              <div key={role} className="flex items-center gap-2 p-3 rounded-xl bg-surface-secondary

                                         border border-border-secondary">

                <StatusBadge variant={color} size="sm">{role}</StatusBadge>

                <span className="text-lg font-bold text-text-primary">{count}</span>

              </div>

            );

          })}

        </div>

      </div>



      {/* Users Table */}

      <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden animate-fade-in"

        style={{ animationDelay: '450ms' }}>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 pt-5 pb-3">

          <h2 className="text-sm font-semibold text-text-primary flex-1">

            {isSuperAdmin ? "All Company Admins" : "All Users"}

          </h2>

          <div className="flex items-center gap-2 flex-wrap">

            <div className="relative">

              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />

              <input

                type="text"

                placeholder="Search users..."

                value={search}

                onChange={e => setSearch(e.target.value)}

                className="pl-9 pr-3 py-2 rounded-xl text-sm bg-surface-secondary border border-border-secondary

                           focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400

                           transition-all duration-200 w-56 text-text-primary placeholder:text-text-tertiary"

              />

            </div>

            <select

              value={roleFilter}

              onChange={e => setRoleFilter(e.target.value)}

              className="px-3 py-2 rounded-xl text-sm bg-surface-secondary border border-border-secondary

                         focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer

                         text-text-primary"

            >

              <option value="all">All Roles</option>

              {Object.keys(roleColors).map(r => <option key={r} value={r}>{r}</option>)}

            </select>

          </div>

        </div>



        {isSuperAdmin ? (

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-surface-secondary/20">

            {filtered.length > 0 ? filtered.map(user => (

              <div

                key={user.id}

                onClick={() => setViewUser(user)}

                className="bg-surface-primary rounded-2xl border border-border-secondary p-5 

                           hover:shadow-md hover:border-brand-500/40 transition-all cursor-pointer group"

              >

                <div className="flex items-center gap-3 mb-4">

                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColors[user.role] || avatarColors.Employee} 

                                  text-white flex items-center justify-center font-bold text-lg 

                                  group-hover:scale-105 transition-transform shadow-sm shrink-0`}>

                    {user.avatar}

                  </div>

                  <div className="min-w-0">

                    <h3 className="font-bold text-text-primary text-base group-hover:text-brand-500 transition-colors truncate">

                      {user.company || 'Unknown Company'}

                    </h3>

                    <p className="text-sm font-medium text-text-secondary truncate">{user.name}</p>

                  </div>

                </div>

                <div className="space-y-2.5 pt-3 border-t border-border-secondary">

                  <div className="flex items-center justify-between gap-2 overflow-hidden">

                    <span className="text-xs text-text-tertiary uppercase tracking-wider shrink-0">Admin Email</span>

                    <span className="text-sm font-medium text-text-primary truncate">{user.email}</span>

                  </div>

                  <div className="flex items-center justify-between gap-2">

                    <span className="text-xs text-text-tertiary uppercase tracking-wider">Status</span>

                    <StatusBadge variant={{ active: 'success', inactive: 'danger', pending: 'warning' }[user.status]} dot size="sm">

                      {user.status}

                    </StatusBadge>

                  </div>

                </div>

              </div>

            )) : (

              <div className="col-span-full py-10 text-center text-text-tertiary text-sm">

                No company admins found matching your search.

              </div>

            )}

          </div>

        ) : (

          <DataTable columns={columns} data={filtered} emptyMessage="No users found" />

        )}

      </div>



      {/* Create User Modal (Admin creates HR) */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={`Create ${createRoleType} Account`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {/* Role badge */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-secondary border border-border-secondary">
            <Shield size={14} className="text-text-tertiary" />
            <span className="text-xs font-medium text-text-secondary">Account role:</span>
            <StatusBadge variant={roleColors[createRoleType]} size="sm">{createRoleType}</StatusBadge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>First Name *</label>
              <input type="text" required value={form.firstName}
                onChange={e => handleInputChange('firstName', e.target.value)}
                placeholder="e.g. Sarah" className={inputClassName} />
            </div>
            <div>
              <label className={labelClassName}>Last Name *</label>
              <input type="text" required value={form.lastName}
                onChange={e => handleInputChange('lastName', e.target.value)}
                placeholder="e.g. Martinez" className={inputClassName} />
            </div>
          </div>

          <div>
            <label className={labelClassName}>Email *</label>
            <input type="email" required value={form.email}
              onChange={e => handleInputChange('email', e.target.value)}
              placeholder="e.g. sarah.m@flowly.io" className={inputClassName} />
          </div>

          <div>
            <label className={labelClassName}>Department *</label>
            <select required value={form.department}
              onChange={e => handleInputChange('department', e.target.value)}
              className={inputClassName + ' cursor-pointer'}>
              <option value="" disabled>Select department</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-secondary">
            <button type="button" onClick={() => setShowCreateModal(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary
                         hover:bg-surface-tertiary border border-border-secondary
                         transition-all duration-200 cursor-pointer">Cancel</button>
            <button type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                         bg-gradient-to-r from-brand-500 to-brand-600
                         shadow-md hover:shadow-lg hover:-translate-y-0.5
                         active:translate-y-0 transition-all duration-200 cursor-pointer">
              Create {createRoleType} Account
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══ HR: Add Employee Modal ═══ */}
      <Modal
        isOpen={showEmployeeModal}
        onClose={() => { setShowEmployeeModal(false); setHrError(''); }}
        title="Add Employee"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          {/* Role badge */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-secondary border border-border-secondary">
            <Shield size={14} className="text-text-tertiary" />
            <span className="text-xs font-medium text-text-secondary">Account role:</span>
            <StatusBadge variant="info" size="sm">Employee</StatusBadge>
          </div>

          <div>
            <label className={labelClassName}>Full Name *</label>
            <input
              type="text" required
              value={hrForm.fullName}
              onChange={e => setHrForm(f => ({ ...f, fullName: e.target.value }))}
              placeholder="e.g. Ahmed Hassan"
              className={inputClassName}
            />
          </div>

          <div>
            <label className={labelClassName}>Email *</label>
            <input
              type="email" required
              value={hrForm.email}
              onChange={e => setHrForm(f => ({ ...f, email: e.target.value }))}
              placeholder="e.g. ahmed.h@company.com"
              className={inputClassName}
            />
          </div>

          {/* Password notice */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Lock size={14} className="text-amber-500 shrink-0" />
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Password is automatically set to <span className="font-bold tracking-widest">000000</span>
            </span>
          </div>

          {hrError && (
            <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
              {hrError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-secondary">
            <button type="button"
              onClick={() => { setShowEmployeeModal(false); setHrError(''); }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary
                         hover:bg-surface-tertiary border border-border-secondary
                         transition-all duration-200 cursor-pointer">Cancel</button>
            <button type="submit" disabled={isCreating}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                         bg-gradient-to-r from-brand-500 to-brand-600
                         shadow-md hover:shadow-lg hover:-translate-y-0.5
                         active:translate-y-0 transition-all duration-200 cursor-pointer
                         disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
              {isCreating ? (
                <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating...</>
              ) : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══ HR: Add Team Manager Modal ═══ */}
      <Modal
        isOpen={showManagerModal}
        onClose={() => { setShowManagerModal(false); setHrError(''); }}
        title="Add Team Manager"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddManager} className="space-y-4">
          {/* Role badge */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-secondary border border-border-secondary">
            <Shield size={14} className="text-text-tertiary" />
            <span className="text-xs font-medium text-text-secondary">Account role:</span>
            <StatusBadge variant="warning" size="sm">Team Manager</StatusBadge>
          </div>

          <div>
            <label className={labelClassName}>Full Name *</label>
            <input
              type="text" required
              value={hrForm.fullName}
              onChange={e => setHrForm(f => ({ ...f, fullName: e.target.value }))}
              placeholder="e.g. Fatima Zahra"
              className={inputClassName}
            />
          </div>

          <div>
            <label className={labelClassName}>Email *</label>
            <input
              type="email" required
              value={hrForm.email}
              onChange={e => setHrForm(f => ({ ...f, email: e.target.value }))}
              placeholder="e.g. fatima.z@company.com"
              className={inputClassName}
            />
          </div>

          {/* Password notice */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Lock size={14} className="text-amber-500 shrink-0" />
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Password is automatically set to <span className="font-bold tracking-widest">000000</span>
            </span>
          </div>

          {hrError && (
            <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
              {hrError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-secondary">
            <button type="button"
              onClick={() => { setShowManagerModal(false); setHrError(''); }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary
                         hover:bg-surface-tertiary border border-border-secondary
                         transition-all duration-200 cursor-pointer">Cancel</button>
            <button type="submit" disabled={isCreating}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                         bg-gradient-to-r from-violet-500 to-purple-600
                         shadow-md hover:shadow-lg hover:-translate-y-0.5
                         active:translate-y-0 transition-all duration-200 cursor-pointer
                         disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
              {isCreating ? (
                <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating...</>
              ) : 'Add Team Manager'}
            </button>
          </div>
        </form>
      </Modal>



      {/* ═══ View User Modal (read-only) ═══ */}

      <Modal

        isOpen={!!viewUser}

        onClose={() => setViewUser(null)}

        title="User Details"

        maxWidth="max-w-lg"

      >

        {viewUser && (

          <div className="space-y-5">

            {/* Header */}

            <div className="flex items-start gap-4">

              <div className={`flex items-center justify-center w-14 h-14 rounded-2xl

                               bg-gradient-to-br ${avatarColors[viewUser.role] || avatarColors.Employee}

                               text-white text-lg font-bold shadow-lg shrink-0`}>

                {viewUser.avatar}

              </div>

              <div className="flex-1 min-w-0">

                <h3 className="text-lg font-bold text-text-primary">{viewUser.name}</h3>

                <div className="flex items-center gap-2 mt-1">

                  <StatusBadge variant={roleColors[viewUser.role] || 'neutral'} size="sm">{viewUser.role}</StatusBadge>

                  <StatusBadge variant={{ active: 'success', inactive: 'danger', pending: 'warning' }[viewUser.status]} dot size="sm">{viewUser.status}</StatusBadge>

                </div>

              </div>

            </div>



            {/* Details */}

            <div className="space-y-0.5 divide-y divide-border-secondary">

              <div className="flex items-start gap-3 py-2.5">

                <Mail size={16} className="text-text-tertiary mt-0.5 shrink-0" />

                <div>

                  <span className="text-[11px] text-text-tertiary uppercase tracking-wider block">Email</span>

                  <span className="text-sm font-medium text-text-primary">{viewUser.email}</span>

                </div>

              </div>

              <div className="flex items-start gap-3 py-2.5">

                <Building2 size={16} className="text-text-tertiary mt-0.5 shrink-0" />

                <div>

                  <span className="text-[11px] text-text-tertiary uppercase tracking-wider block">

                    {isSuperAdmin ? 'Company' : 'Department'}

                  </span>

                  <span className="text-sm font-medium text-text-primary">

                    {isSuperAdmin ? (viewUser.company || '—') : viewUser.department}

                  </span>

                </div>

              </div>

              <div className="flex items-start gap-3 py-2.5">

                <Shield size={16} className="text-text-tertiary mt-0.5 shrink-0" />

                <div>

                  <span className="text-[11px] text-text-tertiary uppercase tracking-wider block">Role</span>

                  <span className="text-sm font-medium text-text-primary">{viewUser.role}</span>

                </div>

              </div>

              <div className="flex items-start gap-3 py-2.5">

                <Calendar size={16} className="text-text-tertiary mt-0.5 shrink-0" />

                <div>

                  <span className="text-[11px] text-text-tertiary uppercase tracking-wider block">Last Login</span>

                  <span className="text-sm font-medium text-text-primary">{viewUser.lastLogin}</span>

                </div>

              </div>

            </div>



            {/* Close button */}

            <div className="flex justify-end pt-3 border-t border-border-secondary">

              <button

                onClick={() => setViewUser(null)}

                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white

                           bg-gradient-to-r from-brand-500 to-brand-600

                           shadow-md hover:shadow-lg hover:-translate-y-0.5

                           active:translate-y-0 transition-all duration-200 cursor-pointer"

              >

                Close

              </button>

            </div>

          </div>

        )}

      </Modal>



      {/* ═══ Edit User Modal ═══ */}

      <Modal

        isOpen={!!editUser}

        onClose={() => setEditUser(null)}

        title="Edit User"

        maxWidth="max-w-xl"

      >

        {editUser && (

          <form onSubmit={handleEditSave} className="space-y-4">

            <div>

              <label className={labelClassName}>Full Name *</label>

              <input

                type="text"

                required

                value={editForm.name}

                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}

                className={inputClassName}

              />

            </div>



            <div>

              <label className={labelClassName}>Email *</label>

              <input

                type="email"

                required

                value={editForm.email}

                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}

                className={inputClassName}

              />

            </div>



            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>

                <label className={labelClassName}>Role</label>

                <select

                  value={editForm.role}

                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}

                  className={inputClassName + ' cursor-pointer'}

                >

                  {Object.keys(roleColors).map(r => <option key={r} value={r}>{r}</option>)}

                </select>

              </div>

              <div>

                <label className={labelClassName}>Department</label>

                <select

                  value={editForm.department}

                  onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}

                  className={inputClassName + ' cursor-pointer'}

                >

                  {departments.map(d => <option key={d} value={d}>{d}</option>)}

                </select>

              </div>

            </div>



            <div>

              <label className={labelClassName}>Status</label>

              <select

                value={editForm.status}

                onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}

                className={inputClassName + ' cursor-pointer'}

              >

                <option value="active">Active</option>

                <option value="inactive">Inactive</option>

                <option value="pending">Pending</option>

              </select>

            </div>



            {/* Footer */}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-secondary">

              <button

                type="button"

                onClick={() => setEditUser(null)}

                className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary

                           hover:bg-surface-tertiary border border-border-secondary

                           transition-all duration-200 cursor-pointer"

              >

                Cancel

              </button>

              <button

                type="submit"

                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white

                           bg-gradient-to-r from-brand-500 to-brand-600

                           shadow-md hover:shadow-lg hover:-translate-y-0.5

                           active:translate-y-0 transition-all duration-200 cursor-pointer"

              >

                Save Changes

              </button>

            </div>

          </form>

        )}

      </Modal>



      {/* Delete Confirmation */}

      <ConfirmDialog

        isOpen={!!deleteTarget}

        onClose={() => setDeleteTarget(null)}

        onConfirm={confirmDeleteUser}

        title="Delete User"

        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.` : ''}

        confirmLabel="Delete User"

        loading={deleting}

      />

    </div>

  );

}

