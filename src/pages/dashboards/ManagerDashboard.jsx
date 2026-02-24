import {
  Users,
  ListChecks,
  ClipboardCheck,
  TrendingUp,
  Star,
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import MiniChart from '../../components/ui/MiniChart';
import { managerData } from '../../data/mockData';

const statIcons = [Users, ListChecks, ClipboardCheck, TrendingUp];
const statColors = [
  'bg-gradient-to-br from-[#ff9a55] to-[#ffbe7b]',
  'bg-gradient-to-br from-[#2a85ff] to-[#6cb4ff]',
  'bg-gradient-to-br from-[#ff6a55] to-[#ff9a7b]',
  'bg-gradient-to-br from-[#83bf6e] to-[#a8d99a]',
];

const approvalColumns = [
  {
    key: 'title',
    label: 'Request',
    render: (val, row) => (
      <div>
        <span className="font-semibold text-text-primary block">{val}</span>
        <span className="text-[11px] text-text-tertiary">by {row.requester}</span>
      </div>
    ),
  },
  { key: 'type', label: 'Type', render: (val) => (
    <StatusBadge variant={
      val === 'Finance' ? 'brand' :
      val === 'Recruitment' ? 'violet' :
      val === 'Expense' ? 'info' :
      val === 'Procurement' ? 'pink' : 'neutral'
    } size="sm">{val}</StatusBadge>
  )},
  {
    key: 'priority',
    label: 'Priority',
    render: (val) => {
      const map = { high: 'danger', medium: 'warning', low: 'neutral' };
      return <StatusBadge variant={map[val] || 'neutral'} size="sm">{val}</StatusBadge>;
    },
  },
  { key: 'amount', label: 'Amount', cellClassName: 'text-text-secondary font-medium',
    render: (val) => val || <span className="text-text-tertiary">—</span>
  },
  { key: 'submitted', label: 'Submitted', cellClassName: 'text-text-tertiary text-xs' },
];

const performanceMap = {
  excellent: { variant: 'success', icon: '🌟' },
  good: { variant: 'brand', icon: '👍' },
  average: { variant: 'warning', icon: '📊' },
  improving: { variant: 'info', icon: '📈' },
};

function TeamMemberCard({ member }) {
  const perf = performanceMap[member.performance] || performanceMap.average;
  const totalTasks = member.tasksCompleted + member.tasksActive;
  const completionPct = totalTasks > 0 ? (member.tasksCompleted / totalTasks) * 100 : 0;

  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-secondary border border-border-secondary
                    hover:border-[#ff9a55]/30 transition-all duration-200 group">
      {/* Avatar */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full
                      bg-[#fff4e6] dark:bg-orange-500/10
                      text-sm font-bold text-[#ff9a55] shrink-0">
        {member.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary truncate">{member.name}</span>
          <StatusBadge variant={perf.variant} size="sm">{perf.icon} {member.performance}</StatusBadge>
        </div>
        <span className="text-xs text-text-tertiary">{member.role}</span>
        {/* Progress */}
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 rounded-full bg-border-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff9a55] to-[#ffbe7b]
                         transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <span className="text-[10px] text-text-tertiary whitespace-nowrap">
            {member.tasksCompleted}/{totalTasks}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Team Overview
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Team performance, approvals, and process oversight
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                           bg-[#1a1d1f] text-white dark:bg-white dark:text-[#1a1d1f]
                           text-sm font-semibold shadow-sm
                           hover:-translate-y-0.5 active:translate-y-0
                           transition-all duration-200 cursor-pointer">
          <ClipboardCheck size={16} />
          Review Approvals
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {managerData.stats.map((stat, i) => (
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
          <h2 className="text-sm font-bold text-text-primary mb-4">Team Performance</h2>
          <MiniChart
            data={managerData.teamPerformance}
            label="Tasks completed per day"
            height={100}
            colorFrom="#ff9a55"
            colorTo="#ffbe7b"
          />
        </div>

        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                        animate-fade-in" style={{ animationDelay: '500ms' }}>
          <h2 className="text-sm font-bold text-text-primary mb-4">Process Completion Trend</h2>
          <MiniChart
            data={managerData.processCompletion}
            label="Processes completed per week"
            height={100}
            colorFrom="#ff6a55"
            colorTo="#ff9a7b"
          />
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                      animate-fade-in" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-text-primary">Team Members</h2>
          <StatusBadge variant="warning" size="sm">
            <Star size={10} /> {managerData.teamMembers.length} members
          </StatusBadge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {managerData.teamMembers.map(member => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>

      {/* Pending Approvals Table */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary
                      animate-fade-in overflow-hidden" style={{ animationDelay: '700ms' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-sm font-bold text-text-primary">Pending Approvals</h2>
          <StatusBadge variant="danger" size="sm" dot>
            {managerData.pendingApprovals.length} pending
          </StatusBadge>
        </div>
        <DataTable columns={approvalColumns} data={managerData.pendingApprovals} />
      </div>
    </div>
  );
}
