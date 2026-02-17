import {
  Users,
  Briefcase,
  Clock,
  UserPlus,
  Heart,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import MiniChart from '../../components/ui/MiniChart';
import { hrData } from '../../data/mockData';

const statIcons = [Users, Briefcase, Clock, UserPlus];
const statColors = [
  'bg-gradient-to-br from-pink-500 to-rose-600',
  'bg-gradient-to-br from-violet-500 to-purple-600',
  'bg-gradient-to-br from-amber-500 to-orange-500',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
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
                    hover:border-brand-200 transition-all duration-200 group">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl
                      bg-gradient-to-br from-pink-500/15 to-rose-500/15">
        <UserPlus size={18} className="text-pink-500" />
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
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500
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
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg
                            bg-gradient-to-br from-pink-500 to-rose-600">
              <Heart size={16} className="text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              HR Dashboard
            </h1>
          </div>
          <p className="text-sm text-text-secondary">
            Employee management, recruitment, and leave tracking
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                           bg-gradient-to-r from-pink-500 to-rose-600 text-white
                           text-sm font-semibold shadow-md shadow-pink-500/20
                           hover:shadow-lg hover:shadow-pink-500/30
                           hover:-translate-y-0.5 active:translate-y-0
                           transition-all duration-200 cursor-pointer">
          <UserPlus size={16} />
          New Hire
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        {hrData.stats.map((stat, i) => (
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                        hover:shadow-md transition-shadow duration-300 animate-fade-in"
             style={{ animationDelay: '400ms' }}>
          <h2 className="text-sm font-semibold text-text-primary mb-4">Recruitment Pipeline</h2>
          <MiniChart
            data={hrData.recruitmentPipeline}
            label="Candidates at each stage"
            height={100}
            colorFrom="oklch(0.58 0.22 350)"
            colorTo="oklch(0.72 0.18 350)"
          />
        </div>

        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                        hover:shadow-md transition-shadow duration-300 animate-fade-in"
             style={{ animationDelay: '500ms' }}>
          <h2 className="text-sm font-semibold text-text-primary mb-4">Monthly Hiring</h2>
          <MiniChart
            data={hrData.monthlyHiring}
            label="New hires per month"
            height={100}
            colorFrom="oklch(0.55 0.20 330)"
            colorTo="oklch(0.70 0.16 330)"
          />
        </div>
      </div>

      {/* Onboarding */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                      hover:shadow-md transition-shadow duration-300 animate-fade-in"
           style={{ animationDelay: '600ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Onboarding Progress</h2>
          <StatusBadge variant="pink" size="sm">{hrData.onboarding.length} active</StatusBadge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {hrData.onboarding.map(item => (
            <OnboardingCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary
                      hover:shadow-md transition-shadow duration-300 animate-fade-in overflow-hidden"
           style={{ animationDelay: '700ms' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-sm font-semibold text-text-primary">Leave Requests</h2>
          <button className="text-xs font-medium text-brand-500 hover:text-brand-600
                             transition-colors cursor-pointer flex items-center gap-1">
            View All <ArrowUpRight size={12} />
          </button>
        </div>
        <DataTable columns={leaveColumns} data={hrData.leaveRequests} />
      </div>
    </div>
  );
}
