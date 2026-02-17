import { useState } from 'react';
import {
  Clock, CalendarCheck, CalendarClock, AlertCircle, LogIn, LogOut,
  Timer, Coffee, CheckCircle2, XCircle,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';

const attendanceRecords = [
  { id: 1, date: 'Feb 13, 2026', day: 'Friday', checkIn: '08:55', checkOut: '17:32', hours: '8h 37m', status: 'present', overtime: '0h 37m' },
  { id: 2, date: 'Feb 12, 2026', day: 'Thursday', checkIn: '09:02', checkOut: '18:15', hours: '9h 13m', status: 'present', overtime: '1h 13m' },
  { id: 3, date: 'Feb 11, 2026', day: 'Wednesday', checkIn: '08:48', checkOut: '17:05', hours: '8h 17m', status: 'present', overtime: '0h 17m' },
  { id: 4, date: 'Feb 10, 2026', day: 'Tuesday', checkIn: '09:30', checkOut: '17:02', hours: '7h 32m', status: 'late', overtime: '—' },
  { id: 5, date: 'Feb 9, 2026', day: 'Monday', checkIn: '—', checkOut: '—', hours: '—', status: 'absent', overtime: '—' },
  { id: 6, date: 'Feb 7, 2026', day: 'Friday', checkIn: '08:45', checkOut: '17:00', hours: '8h 15m', status: 'present', overtime: '0h 15m' },
  { id: 7, date: 'Feb 6, 2026', day: 'Thursday', checkIn: '09:15', checkOut: '17:45', hours: '8h 30m', status: 'late', overtime: '0h 30m' },
  { id: 8, date: 'Feb 5, 2026', day: 'Wednesday', checkIn: '08:30', checkOut: '12:00', hours: '3h 30m', status: 'half-day', overtime: '—' },
];

const teamAttendance = [
  { id: 1, name: 'Sarah Martinez', status: 'present', checkIn: '08:45', department: 'Marketing' },
  { id: 2, name: 'Ahmed Hassan', status: 'present', checkIn: '09:00', department: 'Engineering' },
  { id: 3, name: 'Clara Dupont', status: 'late', checkIn: '09:35', department: 'HR' },
  { id: 4, name: 'Bob Tanaka', status: 'absent', checkIn: '—', department: 'Engineering' },
  { id: 5, name: 'Fatima Zahra', status: 'present', checkIn: '08:50', department: 'QA' },
  { id: 6, name: 'Diana Kim', status: 'remote', checkIn: '08:30', department: 'Engineering' },
];

const columns = [
  { key: 'date', label: 'Date', render: (val, row) => (
    <div>
      <span className="font-medium text-text-primary block text-sm">{val}</span>
      <span className="text-[11px] text-text-tertiary">{row.day}</span>
    </div>
  )},
  { key: 'checkIn', label: 'Check In', render: (val) => (
    <div className="flex items-center gap-1.5 text-sm">
      <LogIn size={12} className="text-emerald-500" /><span className="text-text-primary">{val}</span>
    </div>
  )},
  { key: 'checkOut', label: 'Check Out', render: (val) => (
    <div className="flex items-center gap-1.5 text-sm">
      <LogOut size={12} className="text-red-400" /><span className="text-text-primary">{val}</span>
    </div>
  )},
  { key: 'hours', label: 'Total Hours', cellClassName: 'font-semibold text-text-primary text-sm' },
  { key: 'overtime', label: 'Overtime', cellClassName: 'text-text-secondary text-xs' },
  { key: 'status', label: 'Status', render: (val) => {
    const map = { present: 'success', late: 'warning', absent: 'danger', 'half-day': 'info' };
    return <StatusBadge variant={map[val] || 'neutral'} dot size="sm">{val}</StatusBadge>;
  }},
];

export default function Attendance() {
  const [currentTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'late').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Attendance"
        description="Track check-ins, check-outs, and attendance patterns"
        icon={Clock}
        iconColor="from-cyan-500 to-blue-600"
        actionLabel="Check In"
        actionIcon={LogIn}
        actionColor="from-emerald-500 to-teal-600"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Present Days" value={`${presentCount}/8`} icon={CalendarCheck} iconColor="bg-gradient-to-br from-emerald-500 to-teal-600" subtitle="this period" delay={0} />
        <StatCard title="Late Arrivals" value={lateCount.toString()} icon={CalendarClock} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" subtitle="this period" delay={80} />
        <StatCard title="Avg Hours/Day" value="8h 12m" icon={Timer} iconColor="bg-gradient-to-br from-brand-500 to-brand-600" change="+0.3h" changeType="positive" delay={160} />
        <StatCard title="Overtime" value="2h 52m" icon={Coffee} iconColor="bg-gradient-to-br from-violet-500 to-purple-600" subtitle="total this period" delay={240} />
      </div>

      {/* Today's status + Team */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Clock Card */}
        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6
                        flex flex-col items-center justify-center text-center animate-fade-in"
             style={{ animationDelay: '350ms' }}>
          <Clock size={32} className="text-brand-500 mb-3" />
          <span className="text-3xl font-bold text-text-primary">{currentTime}</span>
          <span className="text-sm text-text-secondary mt-1">Current Time</span>
          <div className="flex items-center gap-2 mt-4">
            <StatusBadge variant="success" dot>Checked In — 08:55</StatusBadge>
          </div>
          <button className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600
                             text-white text-sm font-semibold shadow-md hover:shadow-lg
                             hover:-translate-y-0.5 transition-all duration-200 cursor-pointer
                             flex items-center gap-2">
            <LogOut size={14} /> Check Out
          </button>
        </div>

        {/* Team Today */}
        <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary p-5
                        animate-fade-in" style={{ animationDelay: '450ms' }}>
          <h2 className="text-sm font-semibold text-text-primary mb-3">Team — Today</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {teamAttendance.map(member => {
              const statusMap = { present: 'success', late: 'warning', absent: 'danger', remote: 'info' };
              const iconMap = { present: CheckCircle2, late: AlertCircle, absent: XCircle, remote: Coffee };
              const Icon = iconMap[member.status] || CheckCircle2;
              return (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary
                                                border border-border-secondary">
                  <Icon size={16} className={`${
                    member.status === 'present' ? 'text-emerald-500' :
                    member.status === 'late' ? 'text-amber-500' :
                    member.status === 'absent' ? 'text-red-500' : 'text-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-primary truncate block">{member.name}</span>
                    <span className="text-[11px] text-text-tertiary">{member.department}</span>
                  </div>
                  <StatusBadge variant={statusMap[member.status]} size="sm">{member.status}</StatusBadge>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Attendance Log */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden animate-fade-in"
           style={{ animationDelay: '550ms' }}>
        <div className="px-5 pt-5 pb-2">
          <h2 className="text-sm font-semibold text-text-primary">Attendance Log</h2>
        </div>
        <DataTable columns={columns} data={attendanceRecords} />
      </div>
    </div>
  );
}
