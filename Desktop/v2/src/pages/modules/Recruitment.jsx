import { useState } from 'react';
import {
  Briefcase, Plus, UserPlus, MapPin, Clock, Eye, Edit,
  Users, CheckCircle2, XCircle, ArrowUpRight, Search,
  Building2, Star, Calendar,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import MiniChart from '../../components/ui/MiniChart';

const jobPostings = [
  { id: 1, title: 'Senior React Developer', department: 'Engineering', location: 'Casablanca', type: 'Full-time', applicants: 48, shortlisted: 12, status: 'open', postedDate: 'Jan 20, 2026', salary: '18K–22K MAD' },
  { id: 2, title: 'Product Manager', department: 'Product', location: 'Rabat', type: 'Full-time', applicants: 35, shortlisted: 8, status: 'open', postedDate: 'Jan 25, 2026', salary: '20K–25K MAD' },
  { id: 3, title: 'UI/UX Designer', department: 'Design', location: 'Remote', type: 'Full-time', applicants: 62, shortlisted: 15, status: 'open', postedDate: 'Feb 1, 2026', salary: '14K–18K MAD' },
  { id: 4, title: 'Data Analyst', department: 'Analytics', location: 'Casablanca', type: 'Full-time', applicants: 28, shortlisted: 6, status: 'closed', postedDate: 'Dec 15, 2025', salary: '13K–16K MAD' },
  { id: 5, title: 'QA Engineer', department: 'Engineering', location: 'Casablanca', type: 'Full-time', applicants: 22, shortlisted: 5, status: 'open', postedDate: 'Feb 5, 2026', salary: '12K–16K MAD' },
  { id: 6, title: 'DevOps Engineer', department: 'Engineering', location: 'Remote', type: 'Contract', applicants: 18, shortlisted: 4, status: 'draft', postedDate: '—', salary: '16K–20K MAD' },
];

const candidates = [
  { id: 1, name: 'Youssef El Amrani', position: 'Senior React Developer', stage: 'Technical Interview', rating: 4.5, appliedDate: 'Jan 22, 2026', status: 'in-progress' },
  { id: 2, name: 'Leila Benyoussef', position: 'UI/UX Designer', stage: 'Portfolio Review', rating: 4.8, appliedDate: 'Feb 2, 2026', status: 'in-progress' },
  { id: 3, name: 'Omar Tazi', position: 'Product Manager', stage: 'Final Interview', rating: 4.2, appliedDate: 'Jan 28, 2026', status: 'in-progress' },
  { id: 4, name: 'Nadia Cherkaoui', position: 'QA Engineer', stage: 'HR Screen', rating: 3.8, appliedDate: 'Feb 7, 2026', status: 'in-progress' },
  { id: 5, name: 'Karim Fassi', position: 'Data Analyst', stage: 'Offer', rating: 4.6, appliedDate: 'Dec 18, 2025', status: 'offer' },
  { id: 6, name: 'Zineb Alaoui', position: 'Senior React Developer', stage: 'Rejected', rating: 3.2, appliedDate: 'Jan 25, 2026', status: 'rejected' },
];

const pipelineData = [
  { label: 'Applied', value: 213 },
  { label: 'Screen', value: 85 },
  { label: 'Interview', value: 42 },
  { label: 'Technical', value: 25 },
  { label: 'Final', value: 12 },
  { label: 'Offer', value: 5 },
];

const jobColumns = [
  { key: 'title', label: 'Position', render: (val, row) => (
    <div>
      <span className="font-semibold text-text-primary block text-sm">{val}</span>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[11px] text-text-tertiary flex items-center gap-1"><Building2 size={10} />{row.department}</span>
        <span className="text-[11px] text-text-tertiary flex items-center gap-1"><MapPin size={10} />{row.location}</span>
      </div>
    </div>
  )},
  { key: 'type', label: 'Type', render: (val) => (
    <StatusBadge variant={val === 'Full-time' ? 'brand' : 'info'} size="sm">{val}</StatusBadge>
  )},
  { key: 'salary', label: 'Salary Range', cellClassName: 'text-text-secondary text-xs font-medium' },
  { key: 'applicants', label: 'Applicants', cellClassName: 'font-semibold text-text-primary text-center' },
  { key: 'shortlisted', label: 'Shortlisted', cellClassName: 'text-text-secondary font-medium text-center' },
  { key: 'status', label: 'Status', render: (val) => {
    const map = { open: 'success', closed: 'danger', draft: 'neutral' };
    return <StatusBadge variant={map[val]} dot size="sm">{val}</StatusBadge>;
  }},
  { key: 'actions', label: '', render: () => (
    <div className="flex items-center gap-1">
      <button className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer"><Eye size={14} className="text-text-tertiary" /></button>
      <button className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer"><Edit size={14} className="text-text-tertiary" /></button>
    </div>
  )},
];

const candidateColumns = [
  { key: 'name', label: 'Candidate', render: (val, row) => (
    <div>
      <span className="font-semibold text-text-primary block text-sm">{val}</span>
      <span className="text-[11px] text-text-tertiary">{row.position}</span>
    </div>
  )},
  { key: 'stage', label: 'Stage', render: (val) => {
    const map = { 'HR Screen': 'neutral', 'Portfolio Review': 'info', 'Technical Interview': 'brand',
                  'Final Interview': 'violet', 'Offer': 'success', 'Rejected': 'danger' };
    return <StatusBadge variant={map[val] || 'neutral'} size="sm">{val}</StatusBadge>;
  }},
  { key: 'rating', label: 'Rating', render: (val) => (
    <div className="flex items-center gap-1">
      <Star size={12} className="text-amber-500" />
      <span className="font-bold text-text-primary text-sm">{val}</span>
    </div>
  )},
  { key: 'appliedDate', label: 'Applied', cellClassName: 'text-text-tertiary text-xs' },
  { key: 'status', label: 'Status', render: (val) => {
    const map = { 'in-progress': 'brand', offer: 'success', rejected: 'danger' };
    return <StatusBadge variant={map[val]} dot size="sm">{val}</StatusBadge>;
  }},
];

export default function Recruitment() {
  const openPositions = jobPostings.filter(j => j.status === 'open').length;
  const totalApplicants = jobPostings.reduce((s, j) => s + j.applicants, 0);
  const totalShortlisted = jobPostings.reduce((s, j) => s + j.shortlisted, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Recruitment"
        description="Job postings, candidate pipeline, and hiring management"
        icon={Briefcase}
        iconColor="from-indigo-500 to-violet-600"
        actionLabel="Post New Job"
        actionIcon={Plus}
        actionColor="from-indigo-500 to-violet-600"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Open Positions" value={openPositions.toString()} icon={Briefcase} iconColor="bg-gradient-to-br from-indigo-500 to-violet-600" delay={0} />
        <StatCard title="Total Applicants" value={totalApplicants.toString()} icon={Users} iconColor="bg-gradient-to-br from-brand-500 to-brand-600" change="+28%" changeType="positive" delay={80} />
        <StatCard title="Shortlisted" value={totalShortlisted.toString()} icon={CheckCircle2} iconColor="bg-gradient-to-br from-emerald-500 to-teal-600" delay={160} />
        <StatCard title="Avg Time to Hire" value="18 days" icon={Clock} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" change="-3d" changeType="positive" delay={240} />
      </div>

      {/* Pipeline Chart */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5 animate-fade-in"
           style={{ animationDelay: '350ms' }}>
        <h2 className="text-sm font-semibold text-text-primary mb-4">Recruitment Pipeline</h2>
        <MiniChart data={pipelineData} label="Candidates at each stage" height={110}
                   colorFrom="oklch(0.48 0.18 280)" colorTo="oklch(0.62 0.16 280)" />
      </div>

      {/* Job Postings */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden animate-fade-in"
           style={{ animationDelay: '450ms' }}>
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Job Postings</h2>
          <StatusBadge variant="success" size="sm" dot>{openPositions} open</StatusBadge>
        </div>
        <DataTable columns={jobColumns} data={jobPostings} />
      </div>

      {/* Candidates */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden animate-fade-in"
           style={{ animationDelay: '550ms' }}>
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Active Candidates</h2>
          <button className="text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors
                             cursor-pointer flex items-center gap-1">
            View All <ArrowUpRight size={12} />
          </button>
        </div>
        <DataTable columns={candidateColumns} data={candidates} />
      </div>
    </div>
  );
}
