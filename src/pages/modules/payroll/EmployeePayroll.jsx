import { useState, useEffect } from 'react';
import {
    Download, Wallet, TrendingUp,
    FileCheck, Receipt, Clock, CheckCircle2, ShieldCheck,
    Mail, Building, Loader2
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase, isSupabaseReady } from '../../../services/supabase';

const MOCK_PAYROLL = {
    period: 'March 2026',
    net_salary: 15880,
    gross_salary: 17800,
    base_salary: 15000,
    housing_allowance: 1500,
    transport_allowance: 500,
    meal_allowance: 300,
    overtime_pay: 500,
    cnss_deduction: 268,
    amo_deduction: 402,
    tax_deduction: 250,
    advance_deduction: 1000,
    status: 'paid',
    payment_date: '2026-03-31',
    bank_name: 'Attijariwafa',
};

const MOCK_HISTORY = [
    { period: 'February 2026', net_salary: 15380 },
    { period: 'January 2026', net_salary: 15380 },
    { period: 'December 2025', net_salary: 22380, note: '+ Bonus' },
];

function fmt(n) { return n?.toLocaleString('fr-MA') + ' MAD'; }
function fmtDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EmployeePayroll() {
    const { profile } = useAuth();
    const [payroll, setPayroll] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPayroll() {
            if (!isSupabaseReady || !profile?.id) {
                setPayroll(MOCK_PAYROLL);
                setHistory(MOCK_HISTORY);
                setLoading(false);
                return;
            }
            const { data } = await supabase
                .from('payrolls')
                .select('*')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(4);

            if (data && data.length > 0) {
                const [latest, ...rest] = data;
                setPayroll(latest);
                setHistory(rest.map(p => ({
                    period: p.period || fmtDate(p.created_at),
                    net_salary: p.net_salary,
                    note: p.bonus ? '+ Bonus' : undefined,
                })));
            } else {
                setPayroll(MOCK_PAYROLL);
                setHistory(MOCK_HISTORY);
            }
            setLoading(false);
        }
        fetchPayroll();
    }, [profile?.id]);

    const firstName = profile?.name?.split(' ')[0] || 'there';

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 size={28} className="animate-spin text-text-tertiary" />
            </div>
        );
    }

    const p = payroll || MOCK_PAYROLL;

    return (
        <div className="space-y-6 animate-fade-in">

            {/* Employee Greeting & Overview */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Hello, {firstName}! 👋</h2>
                    <p className="text-sm text-text-secondary mt-1">Next pay date expected on the last day of this month</p>
                </div>
            </div>

            {/* EMP-PAY-01: Timeline Events */}
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                {/* History Card 1 */}
                <div className="min-w-[280px] snap-start bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3">
                    <Mail size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded text-uppercase mb-1 inline-block">{fmtDate(p.payment_date)}</span>
                        <p className="text-sm font-bold text-emerald-700">Salary Transferred</p>
                        <p className="text-xs text-emerald-600/80 mt-1">A transfer of {fmt(p.net_salary)} was sent to {p.bank_name || 'your bank'}.</p>
                    </div>
                </div>
                {/* History Card 2 */}
                <div className="min-w-[280px] snap-start bg-surface-primary border border-border-secondary p-4 rounded-xl flex items-start gap-3 opacity-60">
                    <Building size={18} className="text-text-tertiary shrink-0 mt-0.5" />
                    <div>
                        <span className="text-[10px] font-bold text-text-secondary bg-surface-secondary border border-border-secondary px-1.5 py-0.5 rounded text-uppercase mb-1 inline-block">Mar 28, 12:00 PM</span>
                        <p className="text-sm font-bold text-text-primary">Payment Processing</p>
                        <p className="text-xs text-text-secondary mt-1">Payment file accepted by bank. Pending final transfer.</p>
                    </div>
                </div>
                {/* History Card 3 */}
                <div className="min-w-[280px] snap-start bg-surface-primary border border-border-secondary p-4 rounded-xl flex items-start gap-3 opacity-60">
                    <FileCheck size={18} className="text-brand-500 shrink-0 mt-0.5" />
                    <div>
                        <span className="text-[10px] font-bold text-text-secondary bg-surface-secondary border border-border-secondary px-1.5 py-0.5 rounded text-uppercase mb-1 inline-block">Mar 28, 10:20 AM</span>
                        <p className="text-sm font-bold text-text-primary">Payslip Ready</p>
                        <p className="text-xs text-text-secondary mt-1">Your March 2026 payslip has been successfully generated.</p>
                    </div>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* EMP-PAY-02: Payslip Details */}
                <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                    <div className="p-6 border-b border-border-secondary flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-surface-secondary border border-border-secondary rounded-xl flex items-center justify-center shrink-0">
                                <Receipt size={24} className="text-text-tertiary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-primary">{p.period || 'Current'} Payslip</h3>
                                <p className="text-sm text-text-secondary mt-1">Employee: {profile?.name || 'Employee'}</p>
                            </div>
                        </div>
                        <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm font-semibold hover:bg-border-secondary transition-colors">
                            <Download size={16} /> Print / PDF
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-5 mb-8 text-center flex flex-col items-center">
                            <span className="text-sm text-text-secondary font-medium mb-1">YOUR NET SALARY</span>
                            <span className="text-3xl font-black text-brand-500 tracking-tight">{fmt(p.net_salary)}</span>
                            <span className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 font-semibold transform hover:scale-105 transition-transform cursor-default">
                                <CheckCircle2 size={14} /> {p.status === 'paid' ? `PAID ${fmtDate(p.payment_date)} (${p.bank_name || 'Bank'})` : p.status?.toUpperCase() || 'PENDING'}
                            </span>
                        </div>

                        <div className="space-y-6 text-sm">
                            <div>
                                <h4 className="font-bold text-text-primary mb-3">EARNINGS</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-text-secondary pb-2 border-b border-surface-secondary">
                                        <span>Base Salary</span>
                                        <span className="font-semibold text-text-primary">{fmt(p.base_salary)}</span>
                                    </div>
                                    {p.housing_allowance > 0 && <div className="flex justify-between text-text-secondary pb-2 border-b border-surface-secondary">
                                        <span>Housing Allowance</span>
                                        <span className="font-semibold text-text-primary">{fmt(p.housing_allowance)}</span>
                                    </div>}
                                    {p.transport_allowance > 0 && <div className="flex justify-between text-text-secondary pb-2 border-b border-surface-secondary">
                                        <span>Transport Allowance</span>
                                        <span className="font-semibold text-text-primary">{fmt(p.transport_allowance)}</span>
                                    </div>}
                                    {p.meal_allowance > 0 && <div className="flex justify-between text-text-secondary pb-2 border-b border-surface-secondary">
                                        <span>Meal Allowance</span>
                                        <span className="font-semibold text-text-primary">{fmt(p.meal_allowance)}</span>
                                    </div>}
                                    {p.overtime_pay > 0 && <div className="flex justify-between text-text-secondary pb-2 border-b border-border-secondary">
                                        <span>Overtime Pay</span>
                                        <span className="font-semibold text-brand-500">+{fmt(p.overtime_pay)}</span>
                                    </div>}
                                    <div className="flex justify-between font-bold pt-1 text-text-primary">
                                        <span>TOTAL GROSS</span>
                                        <span>{fmt(p.gross_salary)}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold text-text-primary mb-3 mt-6">DEDUCTIONS</h4>
                                <div className="space-y-2">
                                    {p.cnss_deduction > 0 && <div className="flex justify-between text-text-secondary pb-2 border-b border-surface-secondary">
                                        <span>CNSS <span className="text-xs opacity-70">(4.48%)</span></span>
                                        <span className="font-medium">-{fmt(p.cnss_deduction)}</span>
                                    </div>}
                                    {p.amo_deduction > 0 && <div className="flex justify-between text-text-secondary pb-2 border-b border-surface-secondary">
                                        <span>AMO <span className="text-xs opacity-70">(2.26%)</span></span>
                                        <span className="font-medium">-{fmt(p.amo_deduction)}</span>
                                    </div>}
                                    {p.tax_deduction > 0 && <div className="flex justify-between text-text-secondary pb-2 border-b border-surface-secondary">
                                        <span>Income Tax (IR)</span>
                                        <span className="font-medium">-{fmt(p.tax_deduction)}</span>
                                    </div>}
                                    {p.advance_deduction > 0 && <div className="flex justify-between text-text-secondary pb-2 border-b border-border-secondary">
                                        <span className="text-amber-500 font-medium">Salary Advance</span>
                                        <span className="font-semibold text-amber-500">-{fmt(p.advance_deduction)}</span>
                                    </div>}
                                    <div className="flex justify-between font-bold pt-1 text-text-primary">
                                        <span>TOTAL DEDUCTIONS</span>
                                        <span>-{fmt((p.cnss_deduction||0)+(p.amo_deduction||0)+(p.tax_deduction||0)+(p.advance_deduction||0))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border border-brand-500/20 bg-brand-500/5 rounded-xl p-4 mt-8 flex justify-between items-center text-sm">
                            <span className="font-bold text-text-primary tracking-wide">NET PAY</span>
                            <span className="font-black text-brand-500 text-lg">{fmt(p.net_salary)}</span>
                        </div>

                    </div>
                </div>

                {/* Info & History */}
                <div className="space-y-6">
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
                        <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                            <ShieldCheck size={18} className="text-text-tertiary" /> Need an Advance?
                        </h3>
                        <p className="text-sm text-text-secondary mb-4">
                            You can request a partial salary advance before the next pay cycle. Advance deductions are taken directly from next month's net pay.
                        </p>
                        <button className="w-full py-2 bg-surface-secondary border border-border-secondary text-text-primary font-medium rounded-xl hover:bg-border-secondary transition-colors text-sm">
                            Request Salary Advance
                        </button>
                    </div>

                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                        <h3 className="font-bold text-text-primary p-5 border-b border-border-secondary">Past Payslips</h3>
                        <div className="divide-y divide-border-secondary">
                            {history.map((slip, i) => (
                                <div key={i} className="p-4 flex justify-between items-center hover:bg-surface-secondary cursor-pointer transition-colors group">
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">{slip.period}</p>
                                        <p className="text-xs text-text-secondary mt-0.5">{fmt(slip.net_salary)} {slip.note && <span className="text-emerald-500 font-medium ml-1">{slip.note}</span>}</p>
                                    </div>
                                    <Download size={16} className="text-text-tertiary group-hover:text-brand-500 scale-90 group-hover:scale-110 transition-all" />
                                </div>
                            ))}
                        </div>
                        <button className="w-full p-3 text-xs font-semibold text-brand-500 hover:bg-surface-secondary transition-colors text-center border-t border-border-secondary">
                            View All History
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
