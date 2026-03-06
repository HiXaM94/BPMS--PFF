import { useState, useEffect, useCallback } from 'react';
import { BarChart2, Users, CheckSquare, XSquare, Clock, Calendar, PieChart, ChevronLeft, ChevronRight } from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase, isSupabaseReady } from '../../../services/supabase';
import DataTable from '../../../components/ui/DataTable';

export default function CompanyAdminAttendance() {
    const { profile } = useAuth();
    const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, punctuality: '0%' });
    const [recentLogs, setRecentLogs] = useState([]);
    const [deptStats, setDeptStats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 6;

    const fetchAdminStats = useCallback(async () => {
        if (!isSupabaseReady || !profile?.entreprise_id) return;
        setIsLoading(true);

        try {
            // 1. Get Dates
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            console.log('[AdminAttendance] Fetching for:', { today, localToday, company: profile.entreprise_id });

            // 2. Fetch Employees (Base for stats and mapping)
            const { data: employees, error: empErr } = await supabase
                .from('employees')
                .select('id, user_id, users(name, role)')
                .eq('entreprise_id', profile.entreprise_id);

            if (empErr) throw empErr;

            const activeStaff = employees?.filter(e =>
                e.users && !['ADMIN', 'SUPER_ADMIN'].includes(e.users.role?.toUpperCase())
            ) || [];

            const staffIds = activeStaff.map(e => e.id);
            const userIds = activeStaff.map(e => e.user_id).filter(Boolean);

            // 3. Fetch Presences DIRECTLY using entreprise_id (RLS optimized)
            const { data: presenceList, error: presErr } = await supabase
                .from('presences')
                .select('*')
                .eq('entreprise_id', profile.entreprise_id)
                .in('date', [today, localToday]);

            if (presErr) throw presErr;

            // Only count presence for eligible staff
            const staffPresences = presenceList.filter(p => staffIds.includes(p.employee_id));
            console.log('[AdminAttendance] Eligible staff presences:', staffPresences.length);

            // 4. Fetch User Details for Departments
            const { data: details } = await supabase
                .from('user_details')
                .select('id_user, department')
                .in('id_user', userIds);

            const detailMap = new Map(details?.map(d => [d.id_user, d]) || []);

            // 5. Calculate Daily Statistics
            const totalEmps = activeStaff.length;
            const presentCount = staffPresences.length;
            const lateCount = staffPresences.filter(p => p.status === 'late').length;
            const absentCount = Math.max(0, totalEmps - presentCount);
            const punctuality = presentCount > 0 ? Math.round(((presentCount - lateCount) / presentCount) * 100) : 0;

            setStats({
                present: `${presentCount}/${totalEmps}`,
                late: lateCount,
                absent: absentCount,
                punctuality: `${punctuality}%`
            });

            // 6. Department Breakdown
            const depts = {};
            activeStaff.forEach(emp => {
                const d = detailMap.get(emp.user_id)?.department || 'Unassigned';
                if (!depts[d]) depts[d] = { total: 0, present: 0 };
                depts[d].total++;
            });

            staffPresences.forEach(p => {
                const emp = activeStaff.find(e => e.id === p.employee_id);
                if (emp) {
                    const d = detailMap.get(emp.user_id)?.department || 'Unassigned';
                    if (depts[d]) depts[d].present++;
                }
            });

            const breakdown = Object.entries(depts).map(([name, data]) => ({
                name,
                rate: data.total > 0 ? `${Math.round((data.present / data.total) * 100)}%` : '0%',
                color: 'bg-brand-500'
            })).sort((a, b) => parseInt(b.rate) - parseInt(a.rate)).slice(0, 5);

            setDeptStats(breakdown);

            // 7. Recent Activity (Fetching 60 results for local pagination)
            const { data: logs } = await supabase
                .from('presences')
                .select('*')
                .eq('entreprise_id', profile.entreprise_id)
                .order('date', { ascending: false })
                .order('check_in_time', { ascending: false })
                .limit(60);

            const enrichedLogs = (logs || []).map(log => {
                const emp = employees.find(e => e.id === log.employee_id);
                return {
                    ...log,
                    name: emp?.users?.name || 'Unknown'
                };
            });

            setRecentLogs(enrichedLogs);

        } catch (error) {
            console.error('[AdminAttendance] Error fetching stats:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isSupabaseReady, profile?.entreprise_id]);

    useEffect(() => {
        fetchAdminStats();
    }, [fetchAdminStats]);

    const logColumns = [
        { label: 'Employee', key: 'name', render: (val) => val || 'Unknown' },
        { label: 'Check In', key: 'check_in_time', render: (val) => val ? val.slice(0, 5) : 'N/A' },
        {
            label: 'Status',
            key: 'status',
            render: (val) => (
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${val === 'present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                    {val}
                </span>
            )
        }
    ];

    // Pagination Logic
    const totalPages = Math.ceil(recentLogs.length / PAGE_SIZE);
    const paginatedLogs = recentLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
    };

    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Analytic Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                            <BarChart2 size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-primary tracking-tight">
                                Attendance Analytics
                            </h2>
                            <p className="text-text-tertiary text-xs mt-0.5 flex items-center gap-1">
                                <Calendar size={12} /> {currentMonth}
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={fetchAdminStats}
                    className="px-4 py-2 bg-surface-primary border border-border-secondary rounded-xl text-sm font-medium text-text-secondary hover:text-brand-500 transition-colors flex items-center gap-2"
                >
                    <Clock size={16} /> Refresh Data
                </button>
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Present Today" value={stats.present} subtitle="Live turnout" icon={CheckSquare} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                <StatCard title="Late Arrivals" value={stats.late} subtitle="Today's delays" icon={Clock} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                <StatCard title="Absent Today" value={stats.absent} subtitle="Not clocked in" icon={XSquare} iconColor="bg-gradient-to-br from-red-500 to-rose-500" />
                <StatCard title="Avg Punctuality" value={stats.punctuality} subtitle="On-time rate" icon={Users} iconColor="bg-gradient-to-br from-blue-500 to-indigo-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Department Breakdown */}
                <div className="lg:col-span-1 bg-surface-primary rounded-2xl border border-border-secondary p-5 flex flex-col h-full">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-600">
                            <PieChart size={18} />
                        </div>
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight">
                            Department Breakdown
                        </h3>
                    </div>
                    <div className="space-y-5">
                        {deptStats.length > 0 ? deptStats.map(dept => (
                            <div key={dept.name} className="space-y-1.5">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-medium text-text-secondary">{dept.name}</span>
                                    <span className="text-sm font-bold text-text-primary">{dept.rate}</span>
                                </div>
                                <div className="w-full bg-surface-secondary rounded-full h-1.5">
                                    <div className={`${dept.color} h-1.5 rounded-full transition-all duration-500`} style={{ width: dept.rate }}></div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-text-tertiary text-sm">No department data available</div>
                        )}
                    </div>
                </div>

                {/* Recent Activity Log */}
                <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden flex flex-col h-full">
                    <div className="p-5 border-b border-border-secondary flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight">Recent Attendance Activity</h3>
                            <p className="text-[10px] text-text-tertiary font-medium uppercase mt-0.5">Real-time stream of employee check-ins</p>
                        </div>
                    </div>
                    <div className="p-2 flex-grow">
                        <DataTable
                            columns={logColumns}
                            data={paginatedLogs}
                        />
                    </div>

                    {/* Pagination Footer */}
                    {totalPages > 1 && (
                        <div className="px-5 py-3 border-t border-border-secondary flex items-center justify-between bg-surface-secondary/30">
                            <span className="text-xs text-text-tertiary">
                                Page <span className="text-text-secondary font-medium">{currentPage}</span> of {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                    className={`p-1 rounded-md border border-border-secondary transition-colors ${currentPage === 1 ? 'text-text-tertiary cursor-not-allowed' : 'text-text-secondary hover:bg-surface-primary hover:text-brand-500'}`}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className={`p-1 rounded-md border border-border-secondary transition-colors ${currentPage === totalPages ? 'text-text-tertiary cursor-not-allowed' : 'text-text-secondary hover:bg-surface-primary hover:text-brand-500'}`}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
