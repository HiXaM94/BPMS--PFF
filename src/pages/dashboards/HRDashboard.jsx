import { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Clock,
  UserPlus,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import MiniChart from '../../components/ui/MiniChart';
import { hrData } from '../../data/mockData';
import { supabase, isSupabaseReady } from '../../services/supabase';

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const statIcons = [Users, Briefcase, Clock, UserPlus];
const statColors = [
  'bg-gradient-to-br from-[#2a85ff] to-[#6cb4ff]',
  'bg-gradient-to-br from-[#8e55ea] to-[#b38cf5]',
  'bg-gradient-to-br from-[#ff9a55] to-[#ffbe7b]',
  'bg-gradient-to-br from-[#83bf6e] to-[#a8d99a]',
];

const leaveColumns = [
  {
    key: 'employee',
    label: 'Employee',
    render: (val, row) => (
      <div>
        <span className="font-semibold text-text-primary block">{val}</span>
        <span className="text-[11px] text-text-tertiary">{row.department}</span>
      </div>
    ),
  },
  { key: 'type', label: 'Type', render: (val) => (
    <StatusBadge variant={
      val === 'Annual Leave' ? 'brand' :
      val === 'Sick Leave' ? 'danger' :
      val === 'Remote Work' ? 'info' :
      val === 'Maternity' ? 'pink' : 'neutral'
    } size="sm">{val}</StatusBadge>
  )},
  { key: 'dates', label: 'Dates', cellClassName: 'text-text-secondary text-xs' },
  { key: 'days', label: 'Days', cellClassName: 'text-text-secondary font-medium text-center' },
  {
    key: 'status',
    label: 'Status',
    render: (val) => {
      const map = { approved: 'success', pending: 'warning', rejected: 'danger' };
      return <StatusBadge variant={map[val] || 'neutral'} dot size="sm">{val}</StatusBadge>;
    },
  },
];

function OnboardingCard({ item }) {
  const progressPct = (item.step / item.totalSteps) * 100;
  const statusMap = {
    'completed': { badge: 'success', icon: CheckCircle2 },
    'in-progress': { badge: 'brand', icon: Clock },
    'not-started': { badge: 'neutral', icon: XCircle },
  };
  const st = statusMap[item.status] || statusMap['not-started'];

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-secondary border border-border-secondary
                    hover:border-[#2a85ff]/30 transition-all duration-200 group">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl
                      bg-[#edf6ff] dark:bg-blue-500/10">
        <UserPlus size={18} className="text-[#2a85ff]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary truncate">{item.name}</span>
          <StatusBadge variant={st.badge} size="sm">{item.status}</StatusBadge>
        </div>
        <span className="text-xs text-text-tertiary">{item.position} — starts {item.startDate}</span>
        {/* Progress bar */}
        <div className="mt-2 w-full h-1.5 rounded-full bg-border-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2a85ff] to-[#6cb4ff]
                       transition-all duration-500 ease-in-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-[10px] text-text-tertiary mt-0.5 block">
          Step {item.step}/{item.totalSteps}
        </span>
      </div>
    </div>
  );
}

export default function HRDashboard() {
  const [stats, setStats]           = useState(hrData.stats);
  const [leaveRequests, setLeave]   = useState(hrData.leaveRequests);
  const [onboarding, setOnboarding] = useState(hrData.onboarding);
  const [pipeline, setPipeline]     = useState(hrData.recruitmentPipeline);

  useEffect(() => {
    if (!isSupabaseReady) return;

    // Fetch counts in parallel
    Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('recrutements').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('vacances').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('candidates').select('id', { count: 'exact', head: true }),
    ]).then(([users, jobs, pending, cands]) => {
      setStats([
        { id: 1, title: 'Total Employees', value: (users.count ?? 0).toString(), change: '', changeType: 'positive', subtitle: 'active users' },
        { id: 2, title: 'Open Positions',  value: (jobs.count ?? 0).toString(),  change: '', changeType: 'positive', subtitle: 'job postings' },
        { id: 3, title: 'Pending Leaves',  value: (pending.count ?? 0).toString(), change: '', changeType: 'neutral', subtitle: 'awaiting approval' },
        { id: 4, title: 'Active Candidates', value: (cands.count ?? 0).toString(), change: '', changeType: 'positive', subtitle: 'in pipeline' },
      ]);
    });

    // Fetch recent leave requests
    supabase.from('vacances')
      .select('*, users(name)')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (!data) return;
        setLeave(data.map(r => ({
          id: r.id,
          employee: r.users?.name || 'Unknown',
          department: '-',
          type: r.leave_type || 'Annual Leave',
          dates: `${fmtDate(r.start_date)} – ${fmtDate(r.end_date)}`,
          days: r.days_count ?? 0,
          status: r.status || 'pending',
        })));
      });

    // Fetch recruitment pipeline stages
    supabase.from('candidates')
      .select('stage')
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const stages = ['HR Screen', 'Technical Interview', 'Final Interview', 'Offer'];
        setPipeline(stages.map(label => ({
          label,
          value: data.filter(c => c.stage === label).length,
        })));
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            HR Overview
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Employee management, recruitment, and leave tracking
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                           bg-[#1a1d1f] text-white dark:bg-white dark:text-[#1a1d1f]
                           text-sm font-semibold shadow-sm
                           hover:-translate-y-0.5 active:translate-y-0
                           transition-all duration-200 cursor-pointer">
          <UserPlus size={16} />
          New Hire
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            subtitle={stat.subtitle}
            icon={statIcons[i]}
            iconColor={statColors[i]}
            delay={i * 80}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                        animate-fade-in" style={{ animationDelay: '400ms' }}>
          <h2 className="text-sm font-bold text-text-primary mb-4">Recruitment Pipeline</h2>
          <MiniChart
            data={pipeline}
            label="Candidates at each stage"
            height={100}
            colorFrom="#8e55ea"
            colorTo="#b38cf5"
          />
        </div>

        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                        animate-fade-in" style={{ animationDelay: '500ms' }}>
          <h2 className="text-sm font-bold text-text-primary mb-4">Monthly Hiring</h2>
          <MiniChart
            data={hrData.monthlyHiring}
            label="New hires per month"
            height={100}
            colorFrom="#2a85ff"
            colorTo="#6cb4ff"
          />
        </div>
      </div>

      {/* Onboarding */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                      animate-fade-in" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-text-primary">Onboarding Progress</h2>
          <StatusBadge variant="brand" size="sm">{onboarding.length} active</StatusBadge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {onboarding.map(item => (
            <OnboardingCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary
                      animate-fade-in overflow-hidden" style={{ animationDelay: '700ms' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-sm font-bold text-text-primary">Recent Leave Requests</h2>
          <button className="text-xs font-medium text-[#2a85ff] hover:text-[#1a6dff]
                             transition-colors cursor-pointer flex items-center gap-1">
            View All <ArrowUpRight size={12} />
          </button>
        </div>
        <DataTable columns={leaveColumns} data={leaveRequests} />
      </div>
    </div>
  );
}
