import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Users, Globe, MapPin, Phone, Mail,
  MoreHorizontal, Edit, Trash2, Eye, ShieldAlert, ToggleLeft, ToggleRight,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useRole } from '../../contexts/RoleContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseReady } from '../../services/supabase';
import { cacheService } from '../../services/CacheService';

/**
 * Mock enterprise data.
 * Each enterprise has a company_id that matches the companyId on each role.
 */
const defaultEnterprises = [
  { id: 1, company_id: 1, name: 'TechCorp International', industry: 'Technology', employees: 245, location: 'Casablanca, Morocco', address: '123 Boulevard Zerktouni', email: 'contact@techcorp.ma', phone: '+212 522 123 456', status: 'active', plan: 'Enterprise', created: 'Jan 15, 2025', rc: '45678', ice: '000123456780001', capital: '500,000 MAD' },
  { id: 2, company_id: 2, name: 'FinServe Global', industry: 'Finance', employees: 189, location: 'Rabat, Morocco', address: '45 Avenue Hassan II', email: 'info@finserve.ma', phone: '+212 537 654 321', status: 'active', plan: 'Business', created: 'Mar 8, 2025', rc: '89012', ice: '000987654320002', capital: '1,000,000 MAD' },
  { id: 3, company_id: 3, name: 'MediCare Plus', industry: 'Healthcare', employees: 156, location: 'Marrakech, Morocco', address: '10 Rue de la Liberté', email: 'hello@medicare.ma', phone: '+212 524 789 012', status: 'active', plan: 'Enterprise', created: 'Jun 22, 2025', rc: '34567', ice: '000555666770003', capital: '250,000 MAD' },
  { id: 4, company_id: 4, name: 'EduLearn Academy', industry: 'Education', employees: 112, location: 'Fes, Morocco', address: 'Zone Universitaire', email: 'admin@edulearn.ma', phone: '+212 535 345 678', status: 'trial', plan: 'Starter', created: 'Nov 3, 2025', rc: '56789', ice: '000111222330004', capital: '100,000 MAD' },
  { id: 5, company_id: 5, name: 'RetailMax Holdings', industry: 'Retail', employees: 198, location: 'Tangier, Morocco', address: 'Centre Commercial Ibn Batouta', email: 'ops@retailmax.ma', phone: '+212 539 901 234', status: 'active', plan: 'Business', created: 'Sep 14, 2025', rc: '67890', ice: '000999888770005', capital: '300,000 MAD' },
  { id: 6, company_id: 6, name: 'BuildPro Services', industry: 'Construction', employees: 87, location: 'Agadir, Morocco', address: 'Quartier Industriel Tassila', email: 'info@buildpro.ma', phone: '+212 528 567 890', status: 'suspended', plan: 'Starter', created: 'Dec 1, 2025', rc: '12345', ice: '000444555660006', capital: '150,000 MAD' },
  { id: 7, company_id: 7, name: 'LogiTrans SARL', industry: 'Logistics', employees: 134, location: 'Kenitra, Morocco', address: 'Route Nationale 1', email: 'contact@logitrans.ma', phone: '+212 537 234 567', status: 'active', plan: 'Business', created: 'Feb 10, 2026', rc: '23456', ice: '000222333440007', capital: '200,000 MAD' },
];

function getColumns(onView, onEdit, onToggleStatus, onDelete, isSuperAdmin) {
  return [
    {
      key: 'name', label: 'Organization',
      render: (val, row) => (
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onView(row)}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl
                          bg-gradient-to-br from-brand-500/15 to-brand-600/15 shrink-0 group-hover:scale-105 transition-transform">
            <Building2 size={18} className="text-brand-500" />
          </div>
          <div>
            <span className="font-semibold text-text-primary block group-hover:text-brand-500 transition-colors">{val}</span>
            <span className="text-[11px] text-text-tertiary">{row.industry}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'location', label: 'Location',
      render: (val) => (
        <div className="flex items-center gap-1.5 text-text-secondary text-xs">
          <MapPin size={12} className="text-text-tertiary" />{val}
        </div>
      ),
    },
    { key: 'employees', label: 'Employees', cellClassName: 'font-semibold text-text-primary' },
    {
      key: 'plan', label: 'Plan',
      render: (val) => (
        <StatusBadge variant={val === 'Enterprise' ? 'brand' : val === 'Business' ? 'brand' : 'neutral'} size="sm">
          {val}
        </StatusBadge>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (val, row) => {
        const map = { active: 'success', trial: 'warning', suspended: 'danger' };
        return (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleStatus(row); }}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            title={val === 'suspended' ? 'Activate' : 'Suspend'}
          >
            <StatusBadge variant={map[val]} dot size="sm">{val}</StatusBadge>
          </button>
        );
      },
    },
    { key: 'created', label: 'Created', cellClassName: 'text-text-tertiary text-xs' },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => onView(row)} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer" title="View">
            <Eye size={14} className="text-text-tertiary" />
          </button>
          {!isSuperAdmin && (
            <button onClick={() => onEdit(row)} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer" title="Edit">
              <Edit size={14} className="text-text-tertiary" />
            </button>
          )}
          <button onClick={() => onDelete(row)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer" title="Delete">
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      ),
    },
  ];
}

const industryStats = [
  { label: 'Technology', count: 1, color: 'brand' },
  { label: 'Finance', count: 1, color: 'brand' },
  { label: 'Healthcare', count: 1, color: 'success' },
  { label: 'Education', count: 1, color: 'info' },
  { label: 'Retail', count: 1, color: 'warning' },
  { label: 'Construction', count: 1, color: 'danger' },
  { label: 'Logistics', count: 1, color: 'pink' },
];

const emptyCompanyForm = {
  name: '',
  industry: '',
  location: '',
  email: '',
  phone: '',
  plan: 'Starter',
};

const inputClassName = `w-full px-3 py-2.5 rounded-xl text-sm bg-surface-secondary border border-border-secondary
                        focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400
                        transition-all duration-200 text-text-primary placeholder:text-text-tertiary`;

const labelClassName = 'block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider';

export default function EnterpriseManagement() {
  const [search, setSearch] = useState('');
  const [enterprises, setEnterprises] = useState(defaultEnterprises);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(emptyCompanyForm);
  const [successMsg, setSuccessMsg] = useState('');
  const [viewEnterprise, setViewEnterprise] = useState(null);
  const [editEnterprise, setEditEnterprise] = useState(null);
  const [editForm, setEditForm] = useState(emptyCompanyForm);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { currentRole } = useRole();
  const { profile } = useAuth();

  const isAdmin = currentRole.id === 'super_admin' || currentRole.id === 'company_admin';
  const isSuperAdmin = currentRole.id === 'super_admin';
  const showToast = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };

  // ── Fetch enterprises from Supabase ──
  const fetchEnterprises = useCallback(async () => {
    if (!isSupabaseReady) {
      setEnterprises(defaultEnterprises);
      return;
    }
    setLoading(true);
    const cacheKey = isSuperAdmin ? 'enterprises:list' : `enterprises:${profile?.entreprise_id}`;
    const data = await cacheService.getOrSet(cacheKey, async () => {
      let query = supabase.from('entreprises').select('*');
      if (!isSuperAdmin && profile?.entreprise_id) {
        query = query.eq('id', profile.entreprise_id);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        console.error('Fetch entreprises error:', error.message);
        return null;
      }
      return data;
    }, 90);

    if (data) {
      setEnterprises(data.map(e => {
        const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
        return {
          ...e,
          employees: e.employees ?? 0,
          location: e.location ?? e.address ?? '—',
          status: e.status || 'active',
          plan: e.plan || 'Starter',
          created: formatDate(e.created_at),
          updated: formatDate(e.updated_at),
          country: e.country || '—',
          legal_form: e.legal_form || '—',
          if_number: e.if_number || '—',
          cnss: e.cnss || '—',
          ice: e.ice || '—',
          rc: e.rc || '—',
          patente: e.patente || '—',
          logo_url: e.logo_url || '—',
          capital: e.capital || '—',
        };
      }));
    } else {
      setEnterprises([]);
    }
    setLoading(false);
  }, [isSuperAdmin, profile?.entreprise_id]);

  useEffect(() => { fetchEnterprises(); }, [fetchEnterprises]);

  const filtered = enterprises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.industry.toLowerCase().includes(search.toLowerCase())
  );

  const totalEmployees = enterprises.reduce((sum, e) => sum + e.employees, 0);
  const activeCount = enterprises.filter(e => e.status === 'active').length;

  // Derive industry stats from what the user can see
  const visibleIndustries = isSuperAdmin
    ? industryStats
    : enterprises.map(e => ({
      label: e.industry,
      count: 1,
      color: industryStats.find(i => i.label === e.industry)?.color || 'neutral',
    }));

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    // Optimistic UI update
    setEnterprises(prev => prev.map(ent =>
      ent.id === editEnterprise.id
        ? { ...ent, name: editForm.name, industry: editForm.industry, location: editForm.location, email: editForm.email, phone: editForm.phone, plan: editForm.plan }
        : ent
    ));
    setEditEnterprise(null);
    showToast(`Company "${editForm.name}" updated successfully!`);

    if (isSupabaseReady) {
      const { error } = await supabase.from('entreprises').update({
        name: editForm.name,
        industry: editForm.industry,
        location: editForm.location,
        email: editForm.email,
        phone: editForm.phone,
        plan: editForm.plan,
      }).eq('id', editEnterprise.id);
      if (error) {
        showToast(`Error updating: ${error.message}`);
        fetchEnterprises(); // rollback
        return;
      }
      cacheService.invalidatePattern('^enterprises:');
      cacheService.invalidatePattern('^admin:');
    }
  };

  // ── Toggle status: active ⇄ suspended ──
  const handleToggleStatus = async (ent) => {
    const newStatus = ent.status === 'suspended' ? 'active' : 'suspended';
    // Optimistic
    setEnterprises(prev => prev.map(e => e.id === ent.id ? { ...e, status: newStatus } : e));
    showToast(`${ent.name} ${newStatus === 'active' ? 'activated' : 'suspended'}.`);

    if (isSupabaseReady) {
      const { error } = await supabase.from('entreprises')
        .update({ status: newStatus }).eq('id', ent.id);
      if (error) {
        showToast(`Error: ${error.message}`);
        fetchEnterprises(); // rollback
        return;
      }
      cacheService.invalidatePattern('^enterprises:');
      cacheService.invalidatePattern('^admin:');
    }
  };

  // ── Delete enterprise ──
  const handleDeleteEnterprise = (ent) => setDeleteTarget(ent);
  const confirmDeleteEnterprise = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setEnterprises(prev => prev.filter(e => e.id !== deleteTarget.id));
    showToast(`"${deleteTarget.name}" deleted.`);
    if (isSupabaseReady) {
      const { error } = await supabase.from('entreprises').delete().eq('id', deleteTarget.id);
      if (error) { showToast(`Error: ${error.message}`); fetchEnterprises(); }
      cacheService.invalidatePattern('^enterprises:');
      cacheService.invalidatePattern('^admin:');
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const columns = getColumns(
    (ent) => setViewEnterprise(ent),
    (ent) => { setEditEnterprise(ent); setEditForm({ name: ent.name, industry: ent.industry, location: ent.location, email: ent.email, phone: ent.phone || '', plan: ent.plan }); },
    handleToggleStatus,
    handleDeleteEnterprise,
    isSuperAdmin
  );

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    const fmtDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (!isSupabaseReady) {
      const newCompany = {
        id: enterprises.length + 1,
        company_id: enterprises.length + 1,
        name: form.name, industry: form.industry, employees: 0,
        location: form.location, email: form.email, phone: form.phone,
        status: 'trial', plan: form.plan, created: fmtDate,
      };
      setEnterprises(prev => [newCompany, ...prev]);
      setForm(emptyCompanyForm); setShowCreateModal(false);
      showToast(`Company "${newCompany.name}" created successfully!`);
      return;
    }

    const { data: inserted, error } = await supabase.from('entreprises').insert({
      name: form.name,
      industry: form.industry,
      location: form.location,
      email: form.email,
      phone: form.phone,
      plan: form.plan,
      status: 'trial',
    }).select().single();

    if (error) { showToast(`Error: ${error.message}`); return; }

    setEnterprises(prev => [{
      id: inserted.id, company_id: inserted.company_id,
      name: inserted.name, industry: inserted.industry || '-',
      employees: 0, location: inserted.location || '-',
      email: inserted.email || '-', phone: inserted.phone || '',
      status: inserted.status || 'trial', plan: inserted.plan || 'Starter',
      created: fmtDate,
    }, ...prev]);
    setForm(emptyCompanyForm); setShowCreateModal(false);
    showToast(`Company "${inserted.name}" created successfully!`);
    cacheService.invalidatePattern('^enterprises:');
    cacheService.invalidatePattern('^admin:');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Enterprise Management"
        description={isSuperAdmin
          ? 'Manage organizations, tenants, and their configurations'
          : 'View your organization information'}
        icon={Building2}
        iconColor="from-brand-500 to-brand-600"
        actionLabel={isSuperAdmin ? 'Add Organization' : undefined}
        actionIcon={isSuperAdmin ? Plus : undefined}
        onAction={isSuperAdmin ? () => setShowCreateModal(true) : undefined}
      />

      {/* Non-admin notice */}
      {!isSuperAdmin && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10
                        border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm animate-fade-in">
          <ShieldAlert size={18} className="shrink-0" />
          <span>
            <strong>Restricted view.</strong> You can only see your own company information.
          </span>
        </div>
      )}

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10
                        border border-emerald-500/20 text-emerald-500 text-sm font-medium animate-fade-in">
          <span>✓</span> {successMsg}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Organizations', value: enterprises.length, icon: Building2, color: 'from-brand-500 to-brand-600' },
          { label: 'Active', value: activeCount, icon: Globe, color: 'from-emerald-500 to-teal-600' },
          { label: 'Total Employees', value: totalEmployees.toLocaleString(), icon: Users, color: 'from-brand-500 to-brand-600' },
          { label: 'Industries', value: visibleIndustries.length, icon: Globe, color: 'from-amber-500 to-orange-600' },
        ].map((card, i) => (
          <div key={i} className="bg-surface-primary rounded-2xl border border-border-secondary p-4
                                  hover:shadow-md transition-all duration-300 group animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color}
                              flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <card.icon size={14} className="text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold text-text-primary mt-2 block">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Industries */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5 animate-fade-in"
        style={{ animationDelay: '350ms' }}>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Industries</h2>
        <div className="flex flex-wrap gap-2">
          {visibleIndustries.map(ind => (
            <StatusBadge key={ind.label} variant={ind.color} size="md">
              {ind.label} ({ind.count})
            </StatusBadge>
          ))}
        </div>
      </div>

      {/* Search + Table */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden animate-fade-in"
        style={{ animationDelay: '450ms' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-text-primary">
            {isSuperAdmin ? 'All Organizations' : 'My Organization'}
          </h2>
          {isSuperAdmin && (
            <input
              type="text"
              placeholder="Search organizations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm bg-surface-secondary border border-border-secondary
                         focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400
                         transition-all duration-200 w-full sm:w-64 text-text-primary placeholder:text-text-tertiary"
            />
          )}
        </div>
        <DataTable columns={columns} data={filtered} emptyMessage="No organizations found" />
      </div>

      {/* View Enterprise Modal */}
      <Modal
        isOpen={!!viewEnterprise}
        onClose={() => setViewEnterprise(null)}
        title="Organization Details"
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-end">
            <button onClick={() => setViewEnterprise(null)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                         bg-gradient-to-r from-brand-500 to-brand-600
                         shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
              Close
            </button>
          </div>
        }
      >
        {viewEnterprise && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/15 to-brand-600/15 shrink-0">
                <Building2 size={22} className="text-brand-500" />
              </div>
              <div>
                <p className="font-bold text-text-primary text-base">{viewEnterprise.name}</p>
                <p className="text-xs text-text-tertiary">{viewEnterprise.industry}</p>
              </div>
            </div>
            <div className="divide-y divide-border-secondary">
              <div className="grid gap-3 py-3 sm:grid-cols-2">
                {[
                  { label: 'Status', value: <StatusBadge variant={{ active: 'success', trial: 'warning', suspended: 'danger' }[viewEnterprise.status]} dot size="sm">{viewEnterprise.status}</StatusBadge> },
                  { label: 'Plan', value: <StatusBadge variant={viewEnterprise.plan === 'Enterprise' ? 'brand' : viewEnterprise.plan === 'Business' ? 'brand' : 'neutral'} size="sm">{viewEnterprise.plan}</StatusBadge> },
                  { label: 'Location', value: viewEnterprise.location },
                  { label: 'Email', value: viewEnterprise.email },
                  { label: 'Phone', value: viewEnterprise.phone || '—' },
                  { label: 'RC', value: viewEnterprise.rc },
                  { label: 'ICE', value: viewEnterprise.ice },
                  { label: 'IF Number', value: viewEnterprise.if_number },
                  { label: 'CNSS', value: viewEnterprise.cnss },
                  { label: 'Patente', value: viewEnterprise.patente },
                  { label: 'Legal Form', value: viewEnterprise.legal_form },
                  { label: 'Country', value: viewEnterprise.country },
                  { label: 'Capital', value: viewEnterprise.capital },
                  { label: 'Employees', value: viewEnterprise.employees },
                  { label: 'Created', value: viewEnterprise.created },
                  { label: 'Updated', value: viewEnterprise.updated },
                  { label: 'Logo URL', value: viewEnterprise.logo_url ? <a href={viewEnterprise.logo_url} target="_blank" rel="noreferrer" className="text-brand-500 underline break-all">{viewEnterprise.logo_url}</a> : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5 rounded-lg border border-border-secondary/40 px-3 py-2">
                    <span className="text-[11px] text-text-tertiary uppercase tracking-wider">{label}</span>
                    <span className="text-sm text-text-primary">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Enterprise Modal */}
      <Modal
        isOpen={!!editEnterprise}
        onClose={() => setEditEnterprise(null)}
        title="Edit Organization"
        maxWidth="max-w-xl"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => setEditEnterprise(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary
                         hover:bg-surface-tertiary border border-border-secondary transition-all cursor-pointer">
              Cancel
            </button>
            <button type="submit" form="edit-enterprise-form"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                         bg-gradient-to-r from-brand-500 to-brand-600
                         shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
              Save Changes
            </button>
          </div>
        }
      >
        {editEnterprise && (
          <form id="edit-enterprise-form" onSubmit={handleEditSave} className="space-y-4">
            <div>
              <label className={labelClassName}>Company Name *</label>
              <input type="text" required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputClassName} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Industry *</label>
                <input type="text" required value={editForm.industry} onChange={e => setEditForm(f => ({ ...f, industry: e.target.value }))} className={inputClassName} />
              </div>
              <div>
                <label className={labelClassName}>Plan</label>
                <select value={editForm.plan} onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))} className={inputClassName + ' cursor-pointer'}>
                  <option>Starter</option><option>Business</option><option>Enterprise</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClassName}>Location *</label>
              <input type="text" required value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} className={inputClassName} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Email *</label>
                <input type="email" required value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={inputClassName} />
              </div>
              <div>
                <label className={labelClassName}>Phone</label>
                <input type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className={inputClassName} />
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Create Company Modal (Admin only) */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Company"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <div>
            <label className={labelClassName}>Company Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder="e.g. TechCorp International"
              className={inputClassName}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>Industry *</label>
              <input
                type="text"
                required
                value={form.industry}
                onChange={e => handleInputChange('industry', e.target.value)}
                placeholder="e.g. Technology"
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Plan</label>
              <select
                value={form.plan}
                onChange={e => handleInputChange('plan', e.target.value)}
                className={inputClassName + ' cursor-pointer'}
              >
                <option value="Starter">Starter</option>
                <option value="Business">Business</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClassName}>Location *</label>
            <input
              type="text"
              required
              value={form.location}
              onChange={e => handleInputChange('location', e.target.value)}
              placeholder="e.g. Casablanca, Morocco"
              className={inputClassName}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => handleInputChange('email', e.target.value)}
                placeholder="e.g. contact@company.ma"
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                placeholder="e.g. +212 522 123 456"
                className={inputClassName}
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-secondary">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
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
              Create Company
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteEnterprise}
        title="Delete Organization"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? All associated data will be permanently removed.` : ''}
        confirmLabel="Delete Organization"
        loading={deleting}
      />
    </div>
  );
}
