import { useState } from 'react';
import {
  Building2, Plus, Users, Globe, MapPin, Phone, Mail,
  MoreHorizontal, Edit, Trash2, Eye, ShieldAlert,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import { useRole } from '../../contexts/RoleContext';

/**
 * Mock enterprise data.
 * Each enterprise has a company_id that matches the companyId on each role.
 */
const defaultEnterprises = [
  { id: 1, company_id: 1, name: 'TechCorp International', industry: 'Technology', employees: 245, location: 'Casablanca, Morocco', email: 'contact@techcorp.ma', phone: '+212 522 123 456', status: 'active', plan: 'Enterprise', created: 'Jan 15, 2025' },
  { id: 2, company_id: 2, name: 'FinServe Global', industry: 'Finance', employees: 189, location: 'Rabat, Morocco', email: 'info@finserve.ma', phone: '+212 537 654 321', status: 'active', plan: 'Business', created: 'Mar 8, 2025' },
  { id: 3, company_id: 3, name: 'MediCare Plus', industry: 'Healthcare', employees: 156, location: 'Marrakech, Morocco', email: 'hello@medicare.ma', phone: '+212 524 789 012', status: 'active', plan: 'Enterprise', created: 'Jun 22, 2025' },
  { id: 4, company_id: 4, name: 'EduLearn Academy', industry: 'Education', employees: 112, location: 'Fes, Morocco', email: 'admin@edulearn.ma', phone: '+212 535 345 678', status: 'trial', plan: 'Starter', created: 'Nov 3, 2025' },
  { id: 5, company_id: 5, name: 'RetailMax Holdings', industry: 'Retail', employees: 198, location: 'Tangier, Morocco', email: 'ops@retailmax.ma', phone: '+212 539 901 234', status: 'active', plan: 'Business', created: 'Sep 14, 2025' },
  { id: 6, company_id: 6, name: 'BuildPro Services', industry: 'Construction', employees: 87, location: 'Agadir, Morocco', email: 'info@buildpro.ma', phone: '+212 528 567 890', status: 'suspended', plan: 'Starter', created: 'Dec 1, 2025' },
  { id: 7, company_id: 7, name: 'LogiTrans SARL', industry: 'Logistics', employees: 134, location: 'Kenitra, Morocco', email: 'contact@logitrans.ma', phone: '+212 537 234 567', status: 'active', plan: 'Business', created: 'Feb 10, 2026' },
];

function getColumns(onView, onEdit) {
  return [
    {
      key: 'name', label: 'Organization',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl
                          bg-gradient-to-br from-brand-500/15 to-brand-600/15 shrink-0">
            <Building2 size={18} className="text-brand-500" />
          </div>
          <div>
            <span className="font-semibold text-text-primary block">{val}</span>
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
        <StatusBadge variant={val === 'Enterprise' ? 'violet' : val === 'Business' ? 'brand' : 'neutral'} size="sm">
          {val}
        </StatusBadge>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (val) => {
        const map = { active: 'success', trial: 'warning', suspended: 'danger' };
        return <StatusBadge variant={map[val]} dot size="sm">{val}</StatusBadge>;
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
          <button onClick={() => onEdit(row)} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer" title="Edit">
            <Edit size={14} className="text-text-tertiary" />
          </button>
        </div>
      ),
    },
  ];
}

const industryStats = [
  { label: 'Technology', count: 1, color: 'brand' },
  { label: 'Finance', count: 1, color: 'violet' },
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
  const { currentRole } = useRole();

  const isAdmin = currentRole.id === 'super_admin' || currentRole.id === 'company_admin';

  // ─── company_id filtering ───
  // Admin sees ALL companies. Other roles see only their own company.
  const visibleEnterprises = isAdmin
    ? enterprises
    : enterprises.filter(e => e.company_id === currentRole.companyId);

  const filtered = visibleEnterprises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.industry.toLowerCase().includes(search.toLowerCase())
  );

  const totalEmployees = visibleEnterprises.reduce((sum, e) => sum + e.employees, 0);
  const activeCount = visibleEnterprises.filter(e => e.status === 'active').length;

  // Derive industry stats from what the user can see
  const visibleIndustries = isAdmin
    ? industryStats
    : visibleEnterprises.map(e => ({
      label: e.industry,
      count: 1,
      color: industryStats.find(i => i.label === e.industry)?.color || 'neutral',
    }));

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    setEnterprises(prev => prev.map(ent =>
      ent.id === editEnterprise.id
        ? { ...ent, name: editForm.name, industry: editForm.industry, location: editForm.location, email: editForm.email, phone: editForm.phone, plan: editForm.plan }
        : ent
    ));
    setEditEnterprise(null);
    setSuccessMsg(`Company "${editForm.name}" updated successfully!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const columns = getColumns(
    (ent) => setViewEnterprise(ent),
    (ent) => { setEditEnterprise(ent); setEditForm({ name: ent.name, industry: ent.industry, location: ent.location, email: ent.email, phone: ent.phone || '', plan: ent.plan }); }
  );

  const handleCreateCompany = (e) => {
    e.preventDefault();
    const newCompany = {
      id: enterprises.length + 1,
      company_id: enterprises.length + 1,
      name: form.name,
      industry: form.industry,
      employees: 0,
      location: form.location,
      email: form.email,
      phone: form.phone,
      status: 'trial',
      plan: form.plan,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setEnterprises(prev => [newCompany, ...prev]);
    setForm(emptyCompanyForm);
    setShowCreateModal(false);
    setSuccessMsg(`Company "${newCompany.name}" created successfully!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Enterprise Management"
        description={isAdmin
          ? 'Manage organizations, tenants, and their configurations'
          : 'View your organization information'}
        icon={Building2}
        iconColor="from-brand-500 to-brand-600"
        actionLabel={isAdmin ? 'Add Organization' : undefined}
        actionIcon={isAdmin ? Plus : undefined}
        onAction={isAdmin ? () => setShowCreateModal(true) : undefined}
      />

      {/* Non-admin notice */}
      {!isAdmin && (
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
          { label: 'Total Organizations', value: visibleEnterprises.length, icon: Building2, color: 'from-brand-500 to-brand-600' },
          { label: 'Active', value: activeCount, icon: Globe, color: 'from-emerald-500 to-teal-600' },
          { label: 'Total Employees', value: totalEmployees.toLocaleString(), icon: Users, color: 'from-violet-500 to-purple-600' },
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
            {isAdmin ? 'All Organizations' : 'My Organization'}
          </h2>
          {isAdmin && (
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
        maxWidth="max-w-md"
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
              {[
                { label: 'Status', value: <StatusBadge variant={{ active: 'success', trial: 'warning', suspended: 'danger' }[viewEnterprise.status]} dot size="sm">{viewEnterprise.status}</StatusBadge> },
                { label: 'Plan', value: <StatusBadge variant={viewEnterprise.plan === 'Enterprise' ? 'violet' : viewEnterprise.plan === 'Business' ? 'brand' : 'neutral'} size="sm">{viewEnterprise.plan}</StatusBadge> },
                { label: 'Location', value: viewEnterprise.location },
                { label: 'Email', value: viewEnterprise.email },
                { label: 'Phone', value: viewEnterprise.phone || '—' },
                { label: 'Employees', value: viewEnterprise.employees },
                { label: 'Created', value: viewEnterprise.created },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between py-2.5 gap-4">
                  <span className="text-xs text-text-tertiary uppercase tracking-wider shrink-0">{label}</span>
                  <span className="text-sm text-text-primary text-right">{value}</span>
                </div>
              ))}
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
              <input type="text" required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputClassName}/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Industry *</label>
                <input type="text" required value={editForm.industry} onChange={e => setEditForm(f => ({ ...f, industry: e.target.value }))} className={inputClassName}/>
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
              <input type="text" required value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} className={inputClassName}/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Email *</label>
                <input type="email" required value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={inputClassName}/>
              </div>
              <div>
                <label className={labelClassName}>Phone</label>
                <input type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className={inputClassName}/>
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
    </div>
  );
}
