import {
  Banknote, DollarSign, TrendingUp, Calendar, Download, Eye,
  Receipt, CreditCard, PiggyBank, ArrowUpRight,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import MiniChart from '../../components/ui/MiniChart';

const payrollRecords = [
  { id: 1, employee: 'Ibrahim Rouass', position: 'Sr. Full Stack Developer', baseSalary: '18,000 MAD', bonus: '2,500 MAD', deductions: '3,200 MAD', netPay: '17,300 MAD', status: 'paid', payDate: 'Jan 31, 2026' },
  { id: 2, employee: 'Sarah Martinez', position: 'Marketing Manager', baseSalary: '16,000 MAD', bonus: '1,800 MAD', deductions: '2,800 MAD', netPay: '15,000 MAD', status: 'paid', payDate: 'Jan 31, 2026' },
  { id: 3, employee: 'Ahmed Hassan', position: 'Data Analyst', baseSalary: '14,000 MAD', bonus: '1,000 MAD', deductions: '2,400 MAD', netPay: '12,600 MAD', status: 'paid', payDate: 'Jan 31, 2026' },
  { id: 4, employee: 'Fatima Zahra', position: 'QA Engineer', baseSalary: '15,000 MAD', bonus: '1,200 MAD', deductions: '2,600 MAD', netPay: '13,600 MAD', status: 'processing', payDate: 'Feb 28, 2026' },
  { id: 5, employee: 'Carlos Ruiz', position: 'UI/UX Designer', baseSalary: '13,500 MAD', bonus: '800 MAD', deductions: '2,200 MAD', netPay: '12,100 MAD', status: 'processing', payDate: 'Feb 28, 2026' },
  { id: 6, employee: 'Bob Tanaka', position: 'Backend Developer', baseSalary: '15,500 MAD', bonus: '1,500 MAD', deductions: '2,700 MAD', netPay: '14,300 MAD', status: 'pending', payDate: 'Feb 28, 2026' },
  { id: 7, employee: 'Diana Kim', position: 'Frontend Developer', baseSalary: '14,500 MAD', bonus: '1,100 MAD', deductions: '2,500 MAD', netPay: '13,100 MAD', status: 'pending', payDate: 'Feb 28, 2026' },
];

const monthlyCosts = [
  { label: 'Sep', value: 420 },
  { label: 'Oct', value: 435 },
  { label: 'Nov', value: 440 },
  { label: 'Dec', value: 465 },
  { label: 'Jan', value: 458 },
  { label: 'Feb', value: 472 },
];

const columns = [
  { key: 'employee', label: 'Employee', render: (val, row) => (
    <div>
      <span className="font-semibold text-text-primary block text-sm">{val}</span>
      <span className="text-[11px] text-text-tertiary">{row.position}</span>
    </div>
  )},
  { key: 'baseSalary', label: 'Base', cellClassName: 'text-text-primary text-sm font-medium' },
  { key: 'bonus', label: 'Bonus', render: (val) => (
    <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">+{val}</span>
  )},
  { key: 'deductions', label: 'Deductions', render: (val) => (
    <span className="text-red-500 text-sm font-medium">-{val}</span>
  )},
  { key: 'netPay', label: 'Net Pay', cellClassName: 'font-bold text-text-primary text-sm' },
  { key: 'status', label: 'Status', render: (val) => {
    const map = { paid: 'success', processing: 'brand', pending: 'warning' };
    return <StatusBadge variant={map[val]} dot size="sm">{val}</StatusBadge>;
  }},
  { key: 'payDate', label: 'Pay Date', cellClassName: 'text-text-tertiary text-xs' },
  { key: 'actions', label: '', render: (_, row) => (
    <div className="flex items-center gap-1">
      {row.status === 'paid' && (
        <button className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer" title="Download Payslip">
          <Download size={14} className="text-emerald-500" />
        </button>
      )}
      <button className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer" title="View">
        <Eye size={14} className="text-text-tertiary" />
      </button>
    </div>
  )},
];

export default function Payroll() {
  const totalPayroll = '472,000 MAD';
  const paidCount = payrollRecords.filter(r => r.status === 'paid').length;
  const pendingCount = payrollRecords.filter(r => r.status !== 'paid').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Payroll"
        description="Salary management, payslips, and compensation overview"
        icon={Banknote}
        iconColor="from-green-500 to-emerald-600"
        actionLabel="Run Payroll"
        actionIcon={CreditCard}
        actionColor="from-green-500 to-emerald-600"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Payroll" value={totalPayroll} icon={DollarSign} iconColor="bg-gradient-to-br from-green-500 to-emerald-600" change="+3.1%" changeType="positive" delay={0} />
        <StatCard title="Employees Paid" value={`${paidCount}/${payrollRecords.length}`} icon={Receipt} iconColor="bg-gradient-to-br from-brand-500 to-brand-600" subtitle="this cycle" delay={80} />
        <StatCard title="Pending Payslips" value={pendingCount.toString()} icon={Calendar} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" subtitle="to process" delay={160} />
        <StatCard title="Avg Net Salary" value="14,000 MAD" icon={PiggyBank} iconColor="bg-gradient-to-br from-violet-500 to-purple-600" change="+2.5%" changeType="positive" delay={240} />
      </div>

      {/* Cost Chart + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary p-5 animate-fade-in"
             style={{ animationDelay: '350ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Monthly Payroll Cost</h2>
            <span className="text-xs text-text-tertiary">in thousands MAD</span>
          </div>
          <MiniChart data={monthlyCosts} label="Total payroll cost per month" height={100}
                     colorFrom="oklch(0.55 0.18 150)" colorTo="oklch(0.70 0.15 150)" />
        </div>

        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5 animate-fade-in"
             style={{ animationDelay: '450ms' }}>
          <h2 className="text-sm font-semibold text-text-primary mb-4">Compensation Breakdown</h2>
          <div className="space-y-4">
            {[
              { label: 'Base Salaries', value: '380K MAD', pct: 80, color: 'bg-brand-500' },
              { label: 'Bonuses', value: '56K MAD', pct: 12, color: 'bg-emerald-500' },
              { label: 'Deductions', value: '36K MAD', pct: 8, color: 'bg-red-400' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-text-secondary">{item.label}</span>
                  <span className="font-semibold text-text-primary">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-border-secondary overflow-hidden">
                  <div className={`h-full rounded-full ${item.color} transition-all duration-500`}
                       style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden animate-fade-in"
           style={{ animationDelay: '550ms' }}>
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Payroll Records — February 2026</h2>
          <button className="text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors
                             cursor-pointer flex items-center gap-1">
            Export <ArrowUpRight size={12} />
          </button>
        </div>
        <DataTable columns={columns} data={payrollRecords} />
      </div>
    </div>
  );
}
