import { useState } from 'react';
import {
  Palmtree, Plus, Calendar, Clock, CheckCircle2, XCircle,
  AlertCircle, CalendarDays, Send,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';

const vacationRequests = [
  { id: 1, employee: 'Ibrahim Rouass', type: 'Annual Leave', startDate: 'Feb 20, 2026', endDate: 'Feb 24, 2026', days: 5, reason: 'Family vacation', status: 'pending', submittedAt: 'Feb 10, 2026' },
  { id: 2, employee: 'Sarah Martinez', type: 'Sick Leave', startDate: 'Feb 14, 2026', endDate: 'Feb 14, 2026', days: 1, reason: 'Medical appointment', status: 'approved', submittedAt: 'Feb 13, 2026' },
  { id: 3, employee: 'Ahmed Hassan', type: 'Annual Leave', startDate: 'Mar 3, 2026', endDate: 'Mar 7, 2026', days: 5, reason: 'Personal time off', status: 'pending', submittedAt: 'Feb 12, 2026' },
  { id: 4, employee: 'Fatima Zahra', type: 'Maternity', startDate: 'Mar 1, 2026', endDate: 'May 31, 2026', days: 90, reason: 'Maternity leave', status: 'approved', submittedAt: 'Jan 15, 2026' },
  { id: 5, employee: 'Carlos Ruiz', type: 'Annual Leave', startDate: 'Feb 25, 2026', endDate: 'Feb 26, 2026', days: 2, reason: 'Moving to new apartment', status: 'rejected', submittedAt: 'Feb 8, 2026' },
  { id: 6, employee: 'Bob Tanaka', type: 'Remote Work', startDate: 'Feb 17, 2026', endDate: 'Feb 21, 2026', days: 5, reason: 'Working from home', status: 'approved', submittedAt: 'Feb 5, 2026' },
  { id: 7, employee: 'Diana Kim', type: 'Unpaid Leave', startDate: 'Mar 10, 2026', endDate: 'Mar 14, 2026', days: 5, reason: 'Personal emergency', status: 'pending', submittedAt: 'Feb 13, 2026' },
];

const leaveBalance = [
  { type: 'Annual Leave', total: 22, used: 8, remaining: 14, color: 'brand' },
  { type: 'Sick Leave', total: 10, used: 2, remaining: 8, color: 'danger' },
  { type: 'Remote Work', total: 24, used: 15, remaining: 9, color: 'info' },
  { type: 'Unpaid Leave', total: 10, used: 0, remaining: 10, color: 'neutral' },
];

const columns = [
  { key: 'employee', label: 'Employee', cellClassName: 'font-semibold text-text-primary text-sm' },
  { key: 'type', label: 'Type', render: (val) => {
    const map = { 'Annual Leave': 'brand', 'Sick Leave': 'danger', 'Remote Work': 'info', 'Maternity': 'pink', 'Unpaid Leave': 'neutral' };
    return <StatusBadge variant={map[val] || 'neutral'} size="sm">{val}</StatusBadge>;
  }},
  { key: 'startDate', label: 'From', cellClassName: 'text-text-secondary text-xs' },
  { key: 'endDate', label: 'To', cellClassName: 'text-text-secondary text-xs' },
  { key: 'days', label: 'Days', cellClassName: 'font-semibold text-text-primary text-center' },
  { key: 'status', label: 'Status', render: (val) => {
    const map = { approved: 'success', pending: 'warning', rejected: 'danger' };
    const icons = { approved: CheckCircle2, pending: AlertCircle, rejected: XCircle };
    const Icon = icons[val];
    return (
      <div className="flex items-center gap-1.5">
        <Icon size={14} className={val === 'approved' ? 'text-emerald-500' : val === 'pending' ? 'text-amber-500' : 'text-red-500'} />
        <StatusBadge variant={map[val]} size="sm">{val}</StatusBadge>
      </div>
    );
  }},
  { key: 'submittedAt', label: 'Submitted', cellClassName: 'text-text-tertiary text-xs' },
];

export default function VacationRequest() {
  const pendingCount = vacationRequests.filter(r => r.status === 'pending').length;
  const approvedCount = vacationRequests.filter(r => r.status === 'approved').length;
  const totalDays = vacationRequests.filter(r => r.status === 'approved').reduce((s, r) => s + r.days, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Vacation Requests"
        description="Submit and manage leave requests and time-off balances"
        icon={Palmtree}
        iconColor="from-emerald-500 to-teal-600"
        actionLabel="New Request"
        actionIcon={Send}
        actionColor="from-emerald-500 to-teal-600"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Pending Requests" value={pendingCount.toString()} icon={AlertCircle} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" delay={0} />
        <StatCard title="Approved" value={approvedCount.toString()} icon={CheckCircle2} iconColor="bg-gradient-to-br from-emerald-500 to-teal-600" delay={80} />
        <StatCard title="Days Approved" value={totalDays.toString()} icon={CalendarDays} iconColor="bg-gradient-to-br from-brand-500 to-brand-600" subtitle="total across all" delay={160} />
        <StatCard title="Total Requests" value={vacationRequests.length.toString()} icon={Calendar} iconColor="bg-gradient-to-br from-violet-500 to-purple-600" delay={240} />
      </div>

      {/* Leave Balance Cards */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5 animate-fade-in"
           style={{ animationDelay: '350ms' }}>
        <h2 className="text-sm font-semibold text-text-primary mb-4">My Leave Balance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {leaveBalance.map(lb => {
            const usedPct = (lb.used / lb.total) * 100;
            return (
              <div key={lb.type} className="p-4 rounded-xl bg-surface-secondary border border-border-secondary
                                            hover:border-brand-200 transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge variant={lb.color} size="sm">{lb.type}</StatusBadge>
                </div>
                <div className="flex items-end justify-between mt-2 mb-2">
                  <span className="text-2xl font-bold text-text-primary">{lb.remaining}</span>
                  <span className="text-xs text-text-tertiary">of {lb.total} days</span>
                </div>
                <div className="h-2 rounded-full bg-border-secondary overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500
                    ${lb.color === 'brand' ? 'bg-brand-500' :
                      lb.color === 'danger' ? 'bg-red-500' :
                      lb.color === 'info' ? 'bg-blue-500' : 'bg-gray-400'}`}
                    style={{ width: `${usedPct}%` }} />
                </div>
                <span className="text-[10px] text-text-tertiary mt-1 block">{lb.used} days used</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden animate-fade-in"
           style={{ animationDelay: '450ms' }}>
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">All Requests</h2>
          <div className="flex gap-1.5">
            <StatusBadge variant="warning" size="sm" dot>{pendingCount} pending</StatusBadge>
          </div>
        </div>
        <DataTable columns={columns} data={vacationRequests} />
      </div>
    </div>
  );
}
