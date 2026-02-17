import {
  Building2,
  Users,
  Activity,
  Server,
  Zap,
  AlertTriangle,
  ArrowUpRight,
  Shield,
  Database,
  Globe,
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import MiniChart from '../../components/ui/MiniChart';
import { adminData } from '../../data/mockData';

const statIcons = [Building2, Users, Activity, Server, Zap, AlertTriangle];
const statColors = [
  'bg-gradient-to-br from-violet-500 to-purple-600',
  'bg-gradient-to-br from-brand-500 to-brand-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-cyan-500 to-blue-600',
  'bg-gradient-to-br from-amber-500 to-orange-500',
  'bg-gradient-to-br from-red-500 to-rose-600',
];

const orgColumns = [
  {
    key: 'name',
    label: 'Organization',
    render: (val) => (
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg
                        bg-gradient-to-br from-brand-500/20 to-brand-600/20">
          <Globe size={14} className="text-brand-500" />
        </div>
        <span className="font-semibold text-text-primary">{val}</span>
      </div>
    ),
  },
  { key: 'plan', label: 'Plan', render: (val) => (
    <StatusBadge variant={val === 'Enterprise' ? 'violet' : val === 'Business' ? 'brand' : 'neutral'} size="sm">
      {val}
    </StatusBadge>
  )},
  { key: 'users', label: 'Users', cellClassName: 'text-text-secondary font-medium' },
  { key: 'processes', label: 'Processes', cellClassName: 'text-text-secondary font-medium' },
  {
    key: 'status',
    label: 'Status',
    render: (val) => {
      const map = { active: 'success', trial: 'warning', suspended: 'danger' };
      return <StatusBadge variant={map[val] || 'neutral'} dot size="sm">{val}</StatusBadge>;
    },
  },
];

const logSeverityMap = { success: 'success', warning: 'warning', danger: 'danger', info: 'info' };

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg
                            bg-gradient-to-br from-violet-500 to-purple-600">
              <Shield size={16} className="text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-sm text-text-secondary">
            Platform overview — all organizations, users, and system health
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                           bg-gradient-to-r from-violet-500 to-purple-600 text-white
                           text-sm font-semibold shadow-md shadow-violet-500/20
                           hover:shadow-lg hover:shadow-violet-500/30
                           hover:-translate-y-0.5 active:translate-y-0
                           transition-all duration-200 cursor-pointer">
          <Database size={16} />
          System Settings
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {adminData.stats.map((stat, i) => (
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                        hover:shadow-md transition-shadow duration-300 animate-fade-in"
             style={{ animationDelay: '500ms' }}>
          <h2 className="text-sm font-semibold text-text-primary mb-4">Weekly Process Volume</h2>
          <MiniChart
            data={adminData.weeklyProcesses}
            label="Processes executed per day"
            height={100}
            colorFrom="oklch(0.50 0.20 280)"
            colorTo="oklch(0.65 0.18 280)"
          />
        </div>

        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                        hover:shadow-md transition-shadow duration-300 animate-fade-in"
             style={{ animationDelay: '600ms' }}>
          <h2 className="text-sm font-semibold text-text-primary mb-4">User Growth</h2>
          <MiniChart
            data={adminData.monthlyUsers}
            label="Total active users per month"
            height={100}
            colorFrom="oklch(0.55 0.18 250)"
            colorTo="oklch(0.68 0.15 250)"
          />
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary
                      hover:shadow-md transition-shadow duration-300 animate-fade-in overflow-hidden"
           style={{ animationDelay: '700ms' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-sm font-semibold text-text-primary">Organizations</h2>
          <button className="text-xs font-medium text-brand-500 hover:text-brand-600
                             transition-colors cursor-pointer flex items-center gap-1">
            Manage All <ArrowUpRight size={12} />
          </button>
        </div>
        <DataTable columns={orgColumns} data={adminData.organizations} />
      </div>

      {/* System Logs */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                      hover:shadow-md transition-shadow duration-300 animate-fade-in"
           style={{ animationDelay: '800ms' }}>
        <h2 className="text-sm font-semibold text-text-primary mb-3">System Logs</h2>
        <div className="space-y-3">
          {adminData.systemLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 group">
              <StatusBadge variant={logSeverityMap[log.severity]} size="sm" dot>
                {log.severity}
              </StatusBadge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{log.event}</p>
                <p className="text-xs text-text-tertiary">{log.details}</p>
              </div>
              <span className="text-[11px] text-text-tertiary whitespace-nowrap">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
