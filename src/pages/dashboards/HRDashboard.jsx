import { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Clock,
  UserPlus,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Activity,
  Star,
  TrendingUp,
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
    key: 'employeeName',
    label: 'Employee',
    render: (val, row) => (
      <div>
        <span className="font-semibold text-text-primary block">{val}</span>
        <span className="text-[11px] text-text-tertiary">{row.department}</span>
      </div>
    ),
  },
  {
    key: 'type', label: 'Type', render: (val) => (
      <StatusBadge variant={
        val === 'Annual Leave' ? 'brand' :
          val === 'Sick Leave' ? 'danger' :
            val === 'Remote Work' ? 'info' :
              val === 'Maternity' ? 'pink' : 'neutral'
      } size="sm">{val}</StatusBadge>
    )
  },
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
  const [stats, setStats] = useState(hrData.stats);
  const [leaveRequests, setLeave] = useState(hrData.leaveRequests);
  const [onboarding, setOnboarding] = useState(hrData.onboarding);
  const [pipeline, setPipeline] = useState(hrData.recruitmentPipeline);

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
        { id: 2, title: 'Open Positions', value: (jobs.count ?? 0).toString(), change: '', changeType: 'positive', subtitle: 'job postings' },
        { id: 3, title: 'Pending Leaves', value: (pending.count ?? 0).toString(), change: '', changeType: 'neutral', subtitle: 'awaiting approval' },
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
          employeeName: r.users?.name || 'Unknown',
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
          <h2 className="text-sm font-bold text-text-primary mb-4">Employee Attendance</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-surface-secondary border border-border-secondary">
              <span className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Present</span>
              <span className="text-lg font-black text-emerald-600">92%</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-secondary border border-border-secondary">
              <span className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">On Leave</span>
              <span className="text-lg font-black text-amber-600">8%</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border-secondary">
            <p className="text-xs text-text-secondary"><span className="text-emerald-500 font-bold">Optimal</span> capacity for current projects.</p>
          </div>
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

      {/* Action Required (Pending Approvals) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-500/20 p-5 animate-fade-in"
        style={{ animationDelay: '650ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock size={18} />
            </div>
            <h2 className="text-sm font-bold text-text-primary">Action Required (Pending Approvals)</h2>
          </div>
          <StatusBadge variant="warning" size="sm">{leaveRequests.filter(r => r.status === 'pending').length} Awaiting</StatusBadge>
        </div>

        <div className="space-y-3">
          {leaveRequests.filter(r => r.status === 'pending').length > 0 ? (
            leaveRequests.filter(r => r.status === 'pending').map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border border-border-secondary group hover:border-brand-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 font-bold text-xs">
                    {(req.employeeName || 'U').charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{req.employeeName}</p>
                    <p className="text-[10px] text-text-tertiary uppercase font-bold">{req.type} • {req.dates || `${fmtDate(req.startDate)} – ${fmtDate(req.endDate)}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.location.href = '/modules/vacation'} className="px-3 py-1.5 bg-brand-500 text-white text-[10px] font-bold rounded-lg hover:bg-brand-600 transition-colors uppercase">
                    Review
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-text-tertiary text-xs italic bg-surface-secondary/50 rounded-xl border border-dashed border-border-secondary">
              No pending requests at the moment.
            </div>
          )}
        </div>
      </div>

      {/* Performance & Productivity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '680ms' }}>
        {/* Performance Distribution */}
        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-tighter">Performance Distribution</h2>
            <TrendingUp size={16} className="text-brand-500" />
          </div>
          <div className="space-y-4">
            {hrData.performanceDistribution.map(item => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-text-secondary">{item.label}</span>
                  <span className="text-text-primary font-bold">{item.value}%</span>
                </div>
                <div className="h-2 w-full bg-border-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-border-secondary">
            <p className="text-[10px] text-text-tertiary leading-relaxed italic text-center">
              "AI identifies <strong>Good</strong> to <strong>Excellent</strong> performance as the dominant organizational trend."
            </p>
          </div>
        </div>

        {/* Department Efficiency */}
        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-tighter">Department Efficiency</h2>
            <Activity size={16} className="text-emerald-500" />
          </div>
          <div className="space-y-4">
            {hrData.departmentEfficiency.map(dept => (
              <div key={dept.label} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold text-text-primary">{dept.label}</span>
                    <span className="text-xs font-bold text-brand-500">{dept.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-border-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full"
                      style={{ width: `${dept.value}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers Leaderboard */}
        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-tighter">Top Performers</h2>
            <Star size={16} className="text-amber-500 fill-amber-500" />
          </div>
          <div className="space-y-3">
            {hrData.topPerformers.map((person, i) => (
              <div key={person.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border border-border-secondary group hover:border-brand-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold
                                  ${i === 0 ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-500/20' : 'bg-surface-tertiary text-text-tertiary'}`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary leading-none">{person.name}</p>
                    <p className="text-[10px] text-text-tertiary mt-1 uppercase font-bold">{person.dept}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-brand-600">{person.completion}</p>
                  <p className="text-[9px] text-text-tertiary uppercase font-medium">{person.tasks} tasks</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 bg-surface-secondary border border-border-secondary rounded-xl text-[10px] font-bold text-text-secondary uppercase tracking-widest hover:bg-surface-tertiary transition-all">
            View Performance Report
          </button>
        </div>
      </div>

      {/* Leave Requests Table (Archive/History) */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary
                      animate-fade-in overflow-hidden" style={{ animationDelay: '700ms' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-sm font-bold text-text-primary">Leave History & Archive</h2>
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
