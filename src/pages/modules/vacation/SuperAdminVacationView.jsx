import React, { useEffect, useMemo, useState } from 'react';
import { Palmtree, Users, Building2, CalendarX, TrendingUp } from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import { supabase, isSupabaseReady } from '../../../services/supabase';

const FALLBACK_COMPANY_VACATIONS = [
    { id: 1, name: 'Acme Corp', totalEmployees: 1250, onVacation: 45, pendingRequests: 12, avgBalance: 14, status: 'Active' },
    { id: 2, name: 'Global Tech', totalEmployees: 340, onVacation: 25, pendingRequests: 4, avgBalance: 16, status: 'Active' },
    { id: 3, name: 'Nexus Industries', totalEmployees: 890, onVacation: 60, pendingRequests: 18, avgBalance: 12, status: 'Active' },
    { id: 4, name: 'Stark Enterprises', totalEmployees: 2100, onVacation: 120, pendingRequests: 35, avgBalance: 15, status: 'Active' },
    { id: 5, name: 'Wayne Corp', totalEmployees: 50, onVacation: 2, pendingRequests: 0, avgBalance: 18, status: 'Active' },
];

export default function SuperAdminVacationView() {
    const [companyRows, setCompanyRows] = useState(FALLBACK_COMPANY_VACATIONS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const totals = useMemo(() => {
        const employees = companyRows.reduce((acc, curr) => acc + (curr.totalEmployees || 0), 0);
        const onVacation = companyRows.reduce((acc, curr) => acc + (curr.onVacation || 0), 0);
        const pending = companyRows.reduce((acc, curr) => acc + (curr.pendingRequests || 0), 0);
        const vacationRate = employees > 0 ? Math.round((onVacation / employees) * 100) : 0;
        return { employees, onVacation, pending, vacationRate };
    }, [companyRows]);

    useEffect(() => {
        let cancelled = false;

        const fetchVacationData = async () => {
            if (!isSupabaseReady) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const today = new Date().toISOString().split('T')[0];

                const [entreprisesRes, employeesRes, approvedRes, pendingRes, balancesRes] = await Promise.all([
                    supabase.from('entreprises').select('id, name').order('name'),
                    supabase.from('employees').select('id, entreprise_id'),
                    supabase
                        .from('vacances')
                        .select('id, start_date, end_date, employees!inner(entreprise_id)')
                        .eq('status', 'approved')
                        .lte('start_date', today)
                        .gte('end_date', today),
                    supabase
                        .from('vacances')
                        .select('id, employees!inner(entreprise_id)')
                        .eq('status', 'pending'),
                    supabase
                        .from('leave_balances')
                        .select('remaining_days, employees!inner(entreprise_id)'),
                ]);

                if (entreprisesRes.error) throw entreprisesRes.error;
                if (employeesRes.error) throw employeesRes.error;
                if (approvedRes.error) throw approvedRes.error;
                if (pendingRes.error) throw pendingRes.error;
                if (balancesRes.error) throw balancesRes.error;

                const entreprises = entreprisesRes.data || [];
                const employees = employeesRes.data || [];
                const approvedLeaves = approvedRes.data || [];
                const pendingLeaves = pendingRes.data || [];
                const balances = balancesRes.data || [];

                const employeeCountMap = employees.reduce((acc, emp) => {
                    if (!emp.entreprise_id) return acc;
                    acc[emp.entreprise_id] = (acc[emp.entreprise_id] || 0) + 1;
                    return acc;
                }, {});

                const onVacationMap = approvedLeaves.reduce((acc, leave) => {
                    const entId = leave.employees?.entreprise_id;
                    if (!entId) return acc;
                    acc[entId] = (acc[entId] || 0) + 1;
                    return acc;
                }, {});

                const pendingMap = pendingLeaves.reduce((acc, leave) => {
                    const entId = leave.employees?.entreprise_id;
                    if (!entId) return acc;
                    acc[entId] = (acc[entId] || 0) + 1;
                    return acc;
                }, {});

                const balanceSums = {};
                const balanceCounts = {};
                balances.forEach(balance => {
                    const entId = balance.employees?.entreprise_id;
                    if (!entId) return;
                    const remaining = Number(balance.remaining_days) || 0;
                    balanceSums[entId] = (balanceSums[entId] || 0) + remaining;
                    balanceCounts[entId] = (balanceCounts[entId] || 0) + 1;
                });

                const derivedRows = entreprises.map(ent => {
                    const totalEmployees = employeeCountMap[ent.id] || 0;
                    const onVacation = onVacationMap[ent.id] || 0;
                    const pendingRequests = pendingMap[ent.id] || 0;
                    const avgBalance = balanceCounts[ent.id]
                        ? Math.round((balanceSums[ent.id] / balanceCounts[ent.id]) * 10) / 10
                        : 0;

                    if (totalEmployees === 0 && onVacation === 0 && pendingRequests === 0) {
                        return null;
                    }

                    return {
                        id: ent.id,
                        name: ent.name,
                        totalEmployees,
                        onVacation,
                        pendingRequests,
                        avgBalance,
                        status: pendingRequests > 15 ? 'At Risk' : 'Active'
                    };
                }).filter(Boolean);

                if (!cancelled) {
                    setCompanyRows(derivedRows.length > 0 ? derivedRows : FALLBACK_COMPANY_VACATIONS);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('[SuperAdminVacationView] Failed to load vacation data', err);
                    setError('Unable to load live vacation data. Showing cached sample.');
                    setCompanyRows(FALLBACK_COMPANY_VACATIONS);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchVacationData();

        return () => {
            cancelled = true;
        };
    }, []);

    const columns = [
        {
            key: 'name', label: 'Company Name', render: (val) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-white border border-indigo-500/20 dark:border-white/20 font-bold text-[10px]">
                        {val.charAt(0)}
                    </div>
                    <span className="font-semibold text-text-primary text-sm">{val}</span>
                </div>
            )
        },
        { key: 'totalEmployees', label: 'Total Employees', cellClassName: 'text-text-secondary font-medium' },
        {
            key: 'onVacation', label: 'Currently On Vacation', render: (val, row) => (
                <div className="flex items-center gap-2">
                    <span className="text-text-primary font-bold">{val}</span>
                    <span className="text-xs text-text-tertiary">({Math.round((val / row.totalEmployees) * 100)}%)</span>
                </div>
            )
        },
        {
            key: 'pendingRequests', label: 'Pending Requests', render: (val) => (
                <StatusBadge variant={val > 10 ? 'warning' : 'neutral'} size="sm">
                    {val} Pending
                </StatusBadge>
            )
        },
        {
            key: 'avgBalance', label: 'Avg Remaining Balance', render: (val) => (
                <span className="text-text-secondary font-medium">{val} Days</span>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Platform Employees" value={loading ? '...' : totals.employees.toLocaleString()} icon={Users} iconColor="bg-blue-500" subtitle="Across all tenants" />
                <StatCard title="Global Employees On Leave" value={loading ? '...' : totals.onVacation.toLocaleString()} icon={Palmtree} iconColor="bg-emerald-500" subtitle="Currently absent" />
                <StatCard title="Global Out-of-Office Rate" value={loading ? '...' : `${totals.vacationRate}%`} icon={TrendingUp} iconColor="bg-brand-500" subtitle="Platform average" />
                <StatCard title="Global Pending Requests" value={loading ? '...' : totals.pending.toLocaleString()} icon={CalendarX} iconColor="bg-amber-500" subtitle="Awaiting HR approval" />
            </div>

            <div className="bg-surface-primary rounded-2xl border border-border-secondary shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-border-secondary flex items-center gap-3 bg-emerald-500/5">
                    <Building2 size={20} className="text-emerald-500" />
                    <h2 className="text-base font-bold text-text-primary uppercase tracking-tight">Cross-Company Leave Analytics</h2>
                </div>

                {error && (
                    <div className="px-5 pt-4 text-sm text-amber-600 font-semibold">
                        {error}
                    </div>
                )}
                <div className="flex-1 overflow-x-auto">
                    <DataTable columns={columns} data={companyRows} emptyLabel={loading ? 'Loading data...' : 'No vacation data available'} />
                </div>
            </div>
        </div>
    );
}
