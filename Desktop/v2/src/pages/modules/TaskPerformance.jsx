import { useState } from 'react';
import {
  ListChecks, Target, TrendingUp, Award, Plus, Eye,
  CheckCircle2, Clock, AlertTriangle, BarChart3,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import MiniChart from '../../components/ui/MiniChart';

const tasks = [
  { id: 1, title: 'Implement Authentication Module', assignee: 'Ibrahim R.', priority: 'high', sprint: 'Sprint 14', deadline: 'Feb 18', progress: 85, status: 'in-progress' },
  { id: 2, title: 'Design Workflow Builder UI', assignee: 'Carlos R.', priority: 'high', sprint: 'Sprint 14', deadline: 'Feb 20', progress: 60, status: 'in-progress' },
  { id: 3, title: 'API Rate Limiting', assignee: 'Ahmed H.', priority: 'medium', sprint: 'Sprint 14', deadline: 'Feb 16', progress: 100, status: 'completed' },
  { id: 4, title: 'Unit Tests — Rules Engine', assignee: 'Fatima Z.', priority: 'high', sprint: 'Sprint 14', deadline: 'Feb 19', progress: 45, status: 'in-progress' },
  { id: 5, title: 'Dashboard Analytics Charts', assignee: 'Diana K.', priority: 'medium', sprint: 'Sprint 14', deadline: 'Feb 21', progress: 30, status: 'in-progress' },
  { id: 6, title: 'Email Notification Service', assignee: 'Bob T.', priority: 'low', sprint: 'Sprint 15', deadline: 'Feb 28', progress: 0, status: 'not-started' },
  { id: 7, title: 'Multi-tenant Data Isolation', assignee: 'Ibrahim R.', priority: 'critical', sprint: 'Sprint 14', deadline: 'Feb 17', progress: 72, status: 'in-progress' },
  { id: 8, title: 'Mobile Responsive Layout', assignee: 'Carlos R.', priority: 'medium', sprint: 'Sprint 15', deadline: 'Mar 1', progress: 0, status: 'not-started' },
];

const performanceReviews = [
  { id: 1, employee: 'Ibrahim R.', period: 'Q4 2025', rating: 4.8, goals: '12/12', status: 'completed' },
  { id: 2, employee: 'Sarah M.', period: 'Q4 2025', rating: 4.5, goals: '10/11', status: 'completed' },
  { id: 3, employee: 'Ahmed H.', period: 'Q4 2025', rating: 4.2, goals: '9/10', status: 'completed' },
  { id: 4, employee: 'Fatima Z.', period: 'Q1 2026', rating: null, goals: '3/10', status: 'in-progress' },
  { id: 5, employee: 'Carlos R.', period: 'Q1 2026', rating: null, goals: '5/12', status: 'in-progress' },
];

const sprintVelocity = [
  { label: 'S9', value: 32 }, { label: 'S10', value: 38 }, { label: 'S11', value: 35 },
  { label: 'S12', value: 42 }, { label: 'S13', value: 40 }, { label: 'S14', value: 45 },
];

const taskColumns = [
  { key: 'title', label: 'Task', render: (val, row) => (
    <div>
      <span className="font-semibold text-text-primary block text-sm">{val}</span>
      <span className="text-[11px] text-text-tertiary">{row.sprint} • {row.assignee}</span>
    </div>
  )},
  { key: 'priority', label: 'Priority', render: (val) => {
    const map = { critical: 'danger', high: 'warning', medium: 'brand', low: 'neutral' };
    return <StatusBadge variant={map[val]} size="sm">{val}</StatusBadge>;
  }},
  { key: 'deadline', label: 'Deadline', cellClassName: 'text-text-secondary text-xs font-medium' },
  { key: 'progress', label: 'Progress', render: (val) => (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 rounded-full bg-border-secondary overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500
          ${val === 100 ? 'bg-emerald-500' : val > 60 ? 'bg-brand-500' : val > 30 ? 'bg-amber-500' : 'bg-red-400'}`}
          style={{ width: `${val}%` }} />
      </div>
      <span className="text-xs font-medium text-text-secondary w-8 text-right">{val}%</span>
    </div>
  )},
  { key: 'status', label: 'Status', render: (val) => {
    const map = { 'completed': 'success', 'in-progress': 'brand', 'not-started': 'neutral' };
    return <StatusBadge variant={map[val]} dot size="sm">{val}</StatusBadge>;
  }},
];

const reviewColumns = [
  { key: 'employee', label: 'Employee', cellClassName: 'font-semibold text-text-primary text-sm' },
  { key: 'period', label: 'Period', cellClassName: 'text-text-secondary text-xs' },
  { key: 'rating', label: 'Rating', render: (val) => val
    ? <div className="flex items-center gap-1"><Award size={14} className="text-amber-500" /><span className="font-bold text-text-primary">{val}</span><span className="text-text-tertiary text-xs">/5</span></div>
    : <span className="text-text-tertiary text-xs">Pending</span>
  },
  { key: 'goals', label: 'Goals', cellClassName: 'text-text-secondary text-sm font-medium' },
  { key: 'status', label: 'Status', render: (val) => {
    const map = { 'completed': 'success', 'in-progress': 'brand' };
    return <StatusBadge variant={map[val]} size="sm">{val}</StatusBadge>;
  }},
];

export default function TaskPerformance() {
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const avgProgress = Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Task & Performance"
        description="Track tasks, sprints, and individual performance reviews"
        icon={Target}
        iconColor="from-orange-500 to-red-600"
        actionLabel="New Task"
        actionIcon={Plus}
        actionColor="from-orange-500 to-red-600"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Tasks" value={tasks.length.toString()} icon={ListChecks} iconColor="bg-gradient-to-br from-brand-500 to-brand-600" delay={0} />
        <StatCard title="In Progress" value={inProgress.toString()} icon={Clock} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" delay={80} />
        <StatCard title="Completed" value={completed.toString()} icon={CheckCircle2} iconColor="bg-gradient-to-br from-emerald-500 to-teal-600" change={`${completed}/${tasks.length}`} changeType="positive" subtitle="tasks done" delay={160} />
        <StatCard title="Avg Progress" value={`${avgProgress}%`} icon={TrendingUp} iconColor="bg-gradient-to-br from-violet-500 to-purple-600" delay={240} />
      </div>

      {/* Chart + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary p-5 animate-fade-in"
             style={{ animationDelay: '350ms' }}>
          <h2 className="text-sm font-semibold text-text-primary mb-4">Sprint Velocity</h2>
          <MiniChart data={sprintVelocity} label="Story points per sprint" height={100}
                     colorFrom="oklch(0.60 0.18 30)" colorTo="oklch(0.75 0.15 30)" />
        </div>
        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5 animate-fade-in"
             style={{ animationDelay: '450ms' }}>
          <h2 className="text-sm font-semibold text-text-primary mb-4">Task Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: 'Completed', count: completed, total: tasks.length, color: 'bg-emerald-500' },
              { label: 'In Progress', count: inProgress, total: tasks.length, color: 'bg-brand-500' },
              { label: 'Not Started', count: tasks.length - completed - inProgress, total: tasks.length, color: 'bg-gray-400' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-secondary">{item.label}</span>
                  <span className="font-semibold text-text-primary">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-border-secondary overflow-hidden">
                  <div className={`h-full rounded-full ${item.color} transition-all duration-500`}
                       style={{ width: `${(item.count / item.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden animate-fade-in"
           style={{ animationDelay: '550ms' }}>
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">All Tasks</h2>
          <StatusBadge variant="brand" size="sm">{tasks.length} tasks</StatusBadge>
        </div>
        <DataTable columns={taskColumns} data={tasks} />
      </div>

      {/* Performance Reviews */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden animate-fade-in"
           style={{ animationDelay: '650ms' }}>
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Performance Reviews</h2>
          <StatusBadge variant="violet" size="sm"><Award size={10} /> Reviews</StatusBadge>
        </div>
        <DataTable columns={reviewColumns} data={performanceReviews} />
      </div>
    </div>
  );
}
