import {
  CheckCircle2,
  ListChecks,
  Clock,
  TrendingUp,
  ArrowUpRight,
  CircleDot,
  FileText,
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import MiniChart from '../../components/ui/MiniChart';
import { employeeData } from '../../data/mockData';

const statIcons = [ListChecks, CheckCircle2, Clock, TrendingUp];
const statColors = [
  'bg-gradient-to-br from-[#83bf6e] to-[#a8d99a]',
  'bg-gradient-to-br from-[#2a85ff] to-[#6cb4ff]',
  'bg-gradient-to-br from-[#ff9a55] to-[#ffbe7b]',
  'bg-gradient-to-br from-[#8e55ea] to-[#b38cf5]',
];

const taskColumns = [
  {
    key: 'title',
    label: 'Task',
    render: (val, row) => (
      <div>
        <span className="font-semibold text-text-primary block">{val}</span>
        <span className="text-[11px] text-text-tertiary">{row.process}</span>
      </div>
    ),
  },
  {
    key: 'priority',
    label: 'Priority',
    render: (val) => {
      const map = { high: 'danger', medium: 'warning', low: 'neutral' };
      return <StatusBadge variant={map[val] || 'neutral'} size="sm">{val}</StatusBadge>;
    },
  },
  { key: 'deadline', label: 'Deadline', cellClassName: 'text-text-secondary text-xs font-medium' },
  {
    key: 'status',
    label: 'Status',
    render: (val) => {
      const map = {
        'in-progress': 'brand',
        'pending': 'warning',
        'not-started': 'neutral',
        'completed': 'success',
      };
      return <StatusBadge variant={map[val] || 'neutral'} dot size="sm">{val}</StatusBadge>;
    },
  },
];

const requestColumns = [
  { key: 'type', label: 'Request Type', cellClassName: 'font-semibold text-text-primary' },
  { key: 'submitted', label: 'Submitted', cellClassName: 'text-text-secondary text-xs' },
  {
    key: 'details',
    label: 'Details',
    render: (val, row) => (
      <span className="text-text-secondary text-xs">{val || row.dates || '—'}</span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (val) => {
      const map = { approved: 'success', pending: 'warning', rejected: 'danger' };
      return <StatusBadge variant={map[val] || 'neutral'} dot size="sm">{val}</StatusBadge>;
    },
  },
];

export default function EmployeeDashboard() {
  // Calculate task summary
  const inProgress = employeeData.myTasks.filter(t => t.status === 'in-progress').length;
  const pending = employeeData.myTasks.filter(t => t.status === 'pending').length;
  const notStarted = employeeData.myTasks.filter(t => t.status === 'not-started').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            My Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Your tasks, requests, and personal workflow overview
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                           bg-[#1a1d1f] text-white dark:bg-white dark:text-[#1a1d1f]
                           text-sm font-semibold shadow-sm
                           hover:-translate-y-0.5 active:translate-y-0
                           transition-all duration-200 cursor-pointer">
          <FileText size={16} />
          New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {employeeData.stats.map((stat, i) => (
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

      {/* Activity Chart + Task Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary p-5
                        animate-fade-in" style={{ animationDelay: '400ms' }}>
          <h2 className="text-sm font-bold text-text-primary mb-4">Weekly Activity</h2>
          <MiniChart
            data={employeeData.weeklyActivity}
            label="Tasks completed per day"
            height={100}
            colorFrom="#83bf6e"
            colorTo="#a8d99a"
          />
        </div>

        {/* Task summary */}
        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                        animate-fade-in" style={{ animationDelay: '500ms' }}>
          <h2 className="text-sm font-bold text-text-primary mb-4">Task Summary</h2>
          <div className="flex flex-col gap-3">
            {[
              { label: 'In Progress', count: inProgress, variant: 'brand', color: 'bg-[#2a85ff]', pct: (inProgress / employeeData.myTasks.length) * 100 },
              { label: 'Pending', count: pending, variant: 'warning', color: 'bg-[#ff9a55]', pct: (pending / employeeData.myTasks.length) * 100 },
              { label: 'Not Started', count: notStarted, variant: 'neutral', color: 'bg-[#9a9fa5]', pct: (notStarted / employeeData.myTasks.length) * 100 },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <StatusBadge variant={item.variant} size="sm" dot>{item.label}</StatusBadge>
                <div className="flex-1 h-2 rounded-full bg-border-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-text-secondary w-5 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* My Tasks Table */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary
                      animate-fade-in overflow-hidden" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-sm font-bold text-text-primary">My Tasks</h2>
          <StatusBadge variant="brand" size="sm">
            {employeeData.myTasks.length} total
          </StatusBadge>
        </div>
        <DataTable columns={taskColumns} data={employeeData.myTasks} />
      </div>

      {/* My Requests + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Requests */}
        <div className="bg-surface-primary rounded-2xl border border-border-secondary
                        animate-fade-in overflow-hidden" style={{ animationDelay: '700ms' }}>
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <h2 className="text-sm font-bold text-text-primary">My Requests</h2>
            <button className="text-xs font-medium text-[#2a85ff] hover:text-[#1a6dff]
                               transition-colors cursor-pointer flex items-center gap-1">
              View All <ArrowUpRight size={12} />
            </button>
          </div>
          <DataTable columns={requestColumns} data={employeeData.myRequests} />
        </div>

        {/* Recent Activity */}
        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                        animate-fade-in" style={{ animationDelay: '800ms' }}>
          <h2 className="text-sm font-bold text-text-primary mb-3">Recent Activity</h2>
          <div className="space-y-3">
            {employeeData.recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 group">
                <div className="mt-1.5">
                  <CircleDot size={10} className="text-[#2a85ff] group-hover:text-[#1a6dff] transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{item.action}</p>
                </div>
                <span className="text-[11px] text-text-tertiary whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
