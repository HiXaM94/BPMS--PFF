import { useState } from 'react';
import { Briefcase, Plus, MapPin, Clock, Eye, Edit, Users, CheckCircle2, ArrowUpRight, Building2, Star } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import MiniChart from '../../components/ui/MiniChart';
import Modal from '../../components/ui/Modal';

const initialJobs = [
  { id: 1, title: 'Senior React Developer', department: 'Engineering', location: 'Casablanca', type: 'Full-time', applicants: 48, shortlisted: 12, status: 'open', postedDate: 'Jan 20, 2026', salary: '18K-22K MAD', description: 'Build and maintain React applications for our BPMS platform.' },
  { id: 2, title: 'Product Manager', department: 'Product', location: 'Rabat', type: 'Full-time', applicants: 35, shortlisted: 8, status: 'open', postedDate: 'Jan 25, 2026', salary: '20K-25K MAD', description: 'Lead product strategy and roadmap for our SaaS platform.' },
  { id: 3, title: 'UI/UX Designer', department: 'Design', location: 'Remote', type: 'Full-time', applicants: 62, shortlisted: 15, status: 'open', postedDate: 'Feb 1, 2026', salary: '14K-18K MAD', description: 'Design intuitive user experiences for enterprise software.' },
  { id: 4, title: 'Data Analyst', department: 'Analytics', location: 'Casablanca', type: 'Full-time', applicants: 28, shortlisted: 6, status: 'closed', postedDate: 'Dec 15, 2025', salary: '13K-16K MAD', description: 'Analyze business data and produce actionable insights.' },
  { id: 5, title: 'QA Engineer', department: 'Engineering', location: 'Casablanca', type: 'Full-time', applicants: 22, shortlisted: 5, status: 'open', postedDate: 'Feb 5, 2026', salary: '12K-16K MAD', description: 'Build automated test suites and ensure product quality.' },
  { id: 6, title: 'DevOps Engineer', department: 'Engineering', location: 'Remote', type: 'Contract', applicants: 18, shortlisted: 4, status: 'draft', postedDate: '-', salary: '16K-20K MAD', description: 'Manage CI/CD pipelines and cloud infrastructure.' },
];

const initialCandidates = [
  { id: 1, name: 'Youssef El Amrani', position: 'Senior React Developer', stage: 'Technical Interview', rating: 4.5, appliedDate: 'Jan 22, 2026', status: 'in-progress', email: 'youssef@email.com', phone: '+212 661 111 222' },
  { id: 2, name: 'Leila Benyoussef', position: 'UI/UX Designer', stage: 'Portfolio Review', rating: 4.8, appliedDate: 'Feb 2, 2026', status: 'in-progress', email: 'leila@email.com', phone: '+212 662 222 333' },
  { id: 3, name: 'Omar Tazi', position: 'Product Manager', stage: 'Final Interview', rating: 4.2, appliedDate: 'Jan 28, 2026', status: 'in-progress', email: 'omar@email.com', phone: '+212 663 333 444' },
  { id: 4, name: 'Nadia Cherkaoui', position: 'QA Engineer', stage: 'HR Screen', rating: 3.8, appliedDate: 'Feb 7, 2026', status: 'in-progress', email: 'nadia@email.com', phone: '+212 664 444 555' },
  { id: 5, name: 'Karim Fassi', position: 'Data Analyst', stage: 'Offer', rating: 4.6, appliedDate: 'Dec 18, 2025', status: 'offer', email: 'karim@email.com', phone: '+212 665 555 666' },
  { id: 6, name: 'Zineb Alaoui', position: 'Senior React Developer', stage: 'Rejected', rating: 3.2, appliedDate: 'Jan 25, 2026', status: 'rejected', email: 'zineb@email.com', phone: '+212 666 666 777' },
];

const pipelineData = [
  { label: 'Applied', value: 213 }, { label: 'Screen', value: 85 }, { label: 'Interview', value: 42 },
  { label: 'Technical', value: 25 }, { label: 'Final', value: 12 }, { label: 'Offer', value: 5 },
];

const depts = ['Engineering', 'Product', 'Design', 'Analytics', 'Marketing', 'HR', 'Finance', 'Operations'];
const locs  = ['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Remote'];
const types = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const stageColors  = { 'HR Screen': 'neutral', 'Portfolio Review': 'info', 'Technical Interview': 'brand', 'Final Interview': 'violet', 'Offer': 'success', 'Rejected': 'danger' };
const candColors = { 'in-progress': 'brand', offer: 'success', rejected: 'danger' };
const jobColors  = { open: 'success', closed: 'danger', draft: 'neutral' };

const inp = 'w-full px-3 py-2.5 rounded-xl text-sm bg-surface-secondary border border-border-secondary focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-200 text-text-primary placeholder:text-text-tertiary';
const lbl = 'block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider';
const emptyForm = { title: '', department: 'Engineering', location: 'Casablanca', type: 'Full-time', salaryMin: '', salaryMax: '', description: '' };
const btnPrimary = (g = 'from-indigo-500 to-violet-600') => `px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${g} shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer flex items-center gap-2`;
const btnSecondary = 'px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-tertiary border border-border-secondary transition-all cursor-pointer';

export default function Recruitment() {
  const [jobs, setJobs] = useState(initialJobs);
  const [showNew, setShowNew]   = useState(false);
  const [viewJob, setViewJob]   = useState(null);
  const [editJob, setEditJob]   = useState(null);
  const [viewCand, setViewCand] = useState(null);
  const [form, setForm]         = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [toast, setToast]       = useState('');
  const [saving, setSaving]     = useState(false);

  const openCount  = jobs.filter(j => j.status === 'open').length;
  const totalApps  = jobs.reduce((s, j) => s + j.applicants, 0);
  const totalShort = jobs.reduce((s, j) => s + j.shortlisted, 0);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const handlePost = (e) => {
    e.preventDefault(); setSaving(true);
    setTimeout(() => {
      setJobs(prev => [{
        id: Date.now(), title: form.title, department: form.department, location: form.location,
        type: form.type, applicants: 0, shortlisted: 0, status: 'open',
        postedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        salary: form.salaryMin && form.salaryMax ? `${form.salaryMin}K-${form.salaryMax}K MAD` : 'Negotiable',
        description: form.description,
      }, ...prev]);
      setForm(emptyForm); setShowNew(false); setSaving(false);
      flash('Job posted successfully!');
    }, 600);
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    setJobs(prev => prev.map(j => j.id === editJob.id
      ? { ...j, title: editForm.title, department: editForm.department, location: editForm.location, type: editForm.type, description: editForm.description }
      : j));
    setEditJob(null); flash('Job posting updated.');
  };

  const jobCols = [
    { key: 'title', label: 'Position', render: (val, row) => (
      <div>
        <span className="font-semibold text-text-primary block text-sm">{val}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-text-tertiary flex items-center gap-1"><Building2 size={10}/>{row.department}</span>
          <span className="text-[11px] text-text-tertiary flex items-center gap-1"><MapPin size={10}/>{row.location}</span>
        </div>
      </div>
    )},
    { key: 'type', label: 'Type', render: (val) => <StatusBadge variant={val === 'Full-time' ? 'brand' : 'info'} size="sm">{val}</StatusBadge> },
    { key: 'salary', label: 'Salary', cellClassName: 'text-text-secondary text-xs font-medium' },
    { key: 'applicants', label: 'Applicants', cellClassName: 'font-semibold text-text-primary text-center' },
    { key: 'shortlisted', label: 'Shortlisted', cellClassName: 'text-text-secondary font-medium text-center' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge variant={jobColors[val]} dot size="sm">{val}</StatusBadge> },
    { key: 'actions', label: '', render: (_, row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => setViewJob(row)} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer" title="View"><Eye size={14} className="text-text-tertiary"/></button>
        <button onClick={() => { setEditJob(row); setEditForm({ title: row.title, department: row.department, location: row.location, type: row.type, salaryMin: '', salaryMax: '', description: row.description || '' }); }} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer" title="Edit"><Edit size={14} className="text-text-tertiary"/></button>
      </div>
    )},
  ];

  const candCols = [
    { key: 'name', label: 'Candidate', render: (val, row) => (
      <div>
        <span className="font-semibold text-text-primary block text-sm">{val}</span>
        <span className="text-[11px] text-text-tertiary">{row.position}</span>
      </div>
    )},
    { key: 'stage', label: 'Stage', render: (val) => <StatusBadge variant={stageColors[val] || 'neutral'} size="sm">{val}</StatusBadge> },
    { key: 'rating', label: 'Rating', render: (val) => (
      <div className="flex items-center gap-1"><Star size={12} className="text-amber-500"/><span className="font-bold text-text-primary text-sm">{val}</span></div>
    )},
    { key: 'appliedDate', label: 'Applied', cellClassName: 'text-text-tertiary text-xs' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge variant={candColors[val]} dot size="sm">{val}</StatusBadge> },
    { key: 'actions', label: '', render: (_, row) => (
      <button onClick={() => setViewCand(row)} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer" title="View"><Eye size={14} className="text-text-tertiary"/></button>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Recruitment" description="Job postings, candidate pipeline, and hiring management"
        icon={Briefcase} iconColor="from-indigo-500 to-violet-600"
        actionLabel="Post New Job" actionIcon={Plus} actionColor="from-indigo-500 to-violet-600"
        onAction={() => setShowNew(true)} />

      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium animate-fade-in">
          <CheckCircle2 size={16}/> {toast}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Open Positions" value={openCount.toString()} icon={Briefcase} iconColor="bg-gradient-to-br from-indigo-500 to-violet-600" delay={0}/>
        <StatCard title="Total Applicants" value={totalApps.toString()} icon={Users} iconColor="bg-gradient-to-br from-brand-500 to-brand-600" change="+28%" changeType="positive" delay={80}/>
        <StatCard title="Shortlisted" value={totalShort.toString()} icon={CheckCircle2} iconColor="bg-gradient-to-br from-emerald-500 to-teal-600" delay={160}/>
        <StatCard title="Avg Time to Hire" value="18 days" icon={Clock} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" change="-3d" changeType="positive" delay={240}/>
      </div>

      <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5 animate-fade-in" style={{ animationDelay: '350ms' }}>
        <h2 className="text-sm font-semibold text-text-primary mb-4">Recruitment Pipeline</h2>
        <MiniChart data={pipelineData} label="Candidates at each stage" height={110} colorFrom="oklch(0.48 0.18 280)" colorTo="oklch(0.62 0.16 280)"/>
      </div>

      <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden animate-fade-in" style={{ animationDelay: '450ms' }}>
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Job Postings</h2>
          <StatusBadge variant="success" size="sm" dot>{openCount} open</StatusBadge>
        </div>
        <DataTable columns={jobCols} data={jobs}/>
      </div>

      <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden animate-fade-in" style={{ animationDelay: '550ms' }}>
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Active Candidates</h2>
          <button className="text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors cursor-pointer flex items-center gap-1">View All <ArrowUpRight size={12}/></button>
        </div>
        <DataTable columns={candCols} data={initialCandidates}/>
      </div>

      {/* Post New Job Modal */}
      <Modal isOpen={showNew} onClose={() => { setShowNew(false); setForm(emptyForm); }} title="Post New Job" maxWidth="max-w-xl"
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowNew(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" form="job-form" disabled={saving} className={btnPrimary() + ' disabled:opacity-60'}>
              {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Posting...</> : <><Briefcase size={14}/>Post Job</>}
            </button>
          </div>
        }>
        <form id="job-form" onSubmit={handlePost} className="space-y-4">
          <div>
            <label className={lbl}>Job Title *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Senior React Developer" className={inp}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Department *</label>
              <select required value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className={inp + ' cursor-pointer'}>
                {depts.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Location *</label>
              <select required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inp + ' cursor-pointer'}>
                {locs.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inp + ' cursor-pointer'}>
                {types.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Min Salary (K)</label>
              <input type="number" value={form.salaryMin} onChange={e => setForm(f => ({ ...f, salaryMin: e.target.value }))} placeholder="15" className={inp}/>
            </div>
            <div>
              <label className={lbl}>Max Salary (K)</label>
              <input type="number" value={form.salaryMax} onChange={e => setForm(f => ({ ...f, salaryMax: e.target.value }))} placeholder="22" className={inp}/>
            </div>
          </div>
          <div>
            <label className={lbl}>Description *</label>
            <textarea required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the role and responsibilities..." className={inp + ' resize-none'}/>
          </div>
        </form>
      </Modal>

      {/* View Job Modal */}
      <Modal isOpen={!!viewJob} onClose={() => setViewJob(null)} title="Job Details" maxWidth="max-w-md"
        footer={<div className="flex justify-end"><button onClick={() => setViewJob(null)} className={btnPrimary('from-brand-500 to-brand-600')}>Close</button></div>}>
        {viewJob && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-text-primary">{viewJob.title}</span>
              <StatusBadge variant={jobColors[viewJob.status]} dot size="sm">{viewJob.status}</StatusBadge>
            </div>
            <div className="divide-y divide-border-secondary">
              {[
                { label: 'Department', value: viewJob.department },
                { label: 'Location', value: viewJob.location },
                { label: 'Type', value: <StatusBadge variant={viewJob.type === 'Full-time' ? 'brand' : 'info'} size="sm">{viewJob.type}</StatusBadge> },
                { label: 'Salary', value: viewJob.salary },
                { label: 'Applicants', value: viewJob.applicants },
                { label: 'Shortlisted', value: viewJob.shortlisted },
                { label: 'Posted', value: viewJob.postedDate },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between py-2.5 gap-4">
                  <span className="text-xs text-text-tertiary uppercase tracking-wider shrink-0">{label}</span>
                  <span className="text-sm text-text-primary text-right">{value}</span>
                </div>
              ))}
            </div>
            {viewJob.description && (
              <div className="pt-1">
                <span className="text-xs text-text-tertiary uppercase tracking-wider block mb-1">Description</span>
                <p className="text-sm text-text-secondary leading-relaxed">{viewJob.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Job Modal */}
      <Modal isOpen={!!editJob} onClose={() => setEditJob(null)} title="Edit Job Posting" maxWidth="max-w-xl"
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditJob(null)} className={btnSecondary}>Cancel</button>
            <button type="submit" form="edit-job-form" className={btnPrimary()}>Save Changes</button>
          </div>
        }>
        {editJob && (
          <form id="edit-job-form" onSubmit={handleEditSave} className="space-y-4">
            <div>
              <label className={lbl}>Job Title *</label>
              <input required value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className={inp}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Department</label>
                <select value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} className={inp + ' cursor-pointer'}>
                  {depts.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Location</label>
                <select value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} className={inp + ' cursor-pointer'}>
                  {locs.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={lbl}>Type</label>
              <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} className={inp + ' cursor-pointer'}>
                {types.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Description</label>
              <textarea rows={3} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className={inp + ' resize-none'}/>
            </div>
          </form>
        )}
      </Modal>

      {/* View Candidate Modal */}
      <Modal isOpen={!!viewCand} onClose={() => setViewCand(null)} title="Candidate Profile" maxWidth="max-w-md"
        footer={<div className="flex justify-end"><button onClick={() => setViewCand(null)} className={btnPrimary('from-brand-500 to-brand-600')}>Close</button></div>}>
        {viewCand && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-lg shrink-0">
                {viewCand.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="font-bold text-text-primary">{viewCand.name}</p>
                <p className="text-xs text-text-tertiary">{viewCand.position}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Star size={12} className="text-amber-500"/>
                  <span className="text-sm font-bold text-text-primary">{viewCand.rating}</span>
                  <StatusBadge variant={stageColors[viewCand.stage] || 'neutral'} size="sm">{viewCand.stage}</StatusBadge>
                </div>
              </div>
            </div>
            <div className="divide-y divide-border-secondary">
              {[
                { label: 'Email', value: viewCand.email },
                { label: 'Phone', value: viewCand.phone },
                { label: 'Applied', value: viewCand.appliedDate },
                { label: 'Status', value: <StatusBadge variant={candColors[viewCand.status]} dot size="sm">{viewCand.status}</StatusBadge> },
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
    </div>
  );
}
