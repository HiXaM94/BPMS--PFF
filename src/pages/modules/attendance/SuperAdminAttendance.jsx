import { useState, useEffect } from 'react';
import { Server, Activity, Users, Monitor, HardDrive, Cpu, CheckCircle2, AlertOctagon, Building } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { landingSupabase } from '../../../services/landingSupabase';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function SuperAdminAttendance() {
    const [stats, setStats] = useState({
        companies: '0',
        employees: '0',
        attendance: '0',
        rate: '0%',
        activeKiosks: '128'
    });
    const [topCompanies, setTopCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [ticketStatus, setTicketStatus] = useState(null);
    const [toast, setToast] = useState('');
    const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    useEffect(() => {
        const fetchGlobalStats = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Global Counts from both databases
                const [{ count: companiesCountMain }, { count: employeesCountMain }, { count: attendanceCountMain }] = await Promise.all([
                    supabase.from('entreprises').select('*', { count: 'exact', head: true }),
                    supabase.from('employees').select('*', { count: 'exact', head: true }),
                    supabase.from('presences').select('*', { count: 'exact', head: true }).eq('date', new Date().toISOString().split('T')[0])
                ]);
                const [{ count: companiesCountLanding }, { count: employeesCountLanding }, { count: attendanceCountLanding }] = await Promise.all([
                    landingSupabase.from('entreprises').select('*', { count: 'exact', head: true }),
                    landingSupabase.from('employees').select('*', { count: 'exact', head: true }),
                    landingSupabase.from('presences').select('*', { count: 'exact', head: true }).eq('date', new Date().toISOString().split('T')[0])
                ]);

                const totalCompanies = (companiesCountMain || 0) + (companiesCountLanding || 0);
                const totalEmployees = (employeesCountMain || 0) + (employeesCountLanding || 0);
                const totalAttendance = (attendanceCountMain || 0) + (attendanceCountLanding || 0);
                const rate = totalEmployees > 0 ? Math.round((totalAttendance / totalEmployees) * 100) : 0;

                setStats(prev => ({
                    ...prev,
                    companies: totalCompanies?.toString() || '0',
                    employees: totalEmployees?.toString() || '0',
                    attendance: totalAttendance?.toString() || '0',
                    rate: `${rate}%`
                }));

                // 2. Fetch Companies and usage from both DBs
                const [{ data: mainCompanies }, { data: landingCompanies }] = await Promise.all([
                    supabase.from('entreprises').select('id, name'),
                    landingSupabase.from('entreprises').select('id, name')
                ]);
                const allCompanies = [...(mainCompanies || []), ...(landingCompanies || [])];

                const [{ data: mainPresences }, { data: landingPresences }] = await Promise.all([
                    supabase.from('presences').select('entreprise_id').eq('date', new Date().toISOString().split('T')[0]),
                    landingSupabase.from('presences').select('entreprise_id').eq('date', new Date().toISOString().split('T')[0])
                ]);
                const presencesToday = [...(mainPresences || []), ...(landingPresences || [])];

                const [{ data: mainEmpCounts }, { data: landingEmpCounts }] = await Promise.all([
                    supabase.from('employees').select('entreprise_id'),
                    landingSupabase.from('employees').select('entreprise_id')
                ]);
                const employeeCounts = [...(mainEmpCounts || []), ...(landingEmpCounts || [])];

                const usageMap = allCompanies.reduce((acc, comp) => {
                    const totalEmps = employeeCounts.filter(e => e.entreprise_id === comp.id).length;
                    const presentToday = presencesToday.filter(p => p.entreprise_id === comp.id).length;
                    const usageRate = totalEmps > 0 ? Math.round((presentToday / totalEmps) * 100) : 0;
                    acc.push({ id: comp.id, name: comp.name, present: presentToday, total: totalEmps, rate: usageRate });
                    return acc;
                }, []);
                const top = usageMap.sort((a, b) => b.rate - a.rate).slice(0, 3);
                setTopCompanies(top);

            } catch (err) {
                console.error('Error fetching global attendance stats:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGlobalStats();
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            {toast && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium animate-fade-in">
                    <CheckCircle2 size={16} /> {toast}
                </div>
            )}

            {/* Global Statistics */}
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-brand-500" />
                    Global Statistics (All Companies)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Active Companies" value={stats.companies} icon={Building} iconColor="bg-gradient-to-br from-blue-500 to-cyan-500" />
                    <StatCard title="Total Employees" value={stats.employees} icon={Users} iconColor="bg-gradient-to-br from-brand-500 to-brand-600" />
                    <StatCard title="Clock-ins Today" value={stats.attendance} subtitle={isLoading ? "Loading..." : `${stats.rate} attendance rate`} icon={CheckCircle2} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <StatCard title="Active Kiosks" value={stats.activeKiosks} icon={Monitor} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Health */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
                    <h3 className="text-base font-semibold text-text-primary mb-4">System Health</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Server size={18} /></div>
                                <div>
                                    <p className="text-sm font-medium text-text-primary">QR Generation Service</p>
                                    <p className="text-xs text-text-secondary">Operational</p>
                                </div>
                            </div>
                            <StatusBadge variant="success">Healthy</StatusBadge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><HardDrive size={18} /></div>
                                <div>
                                    <p className="text-sm font-medium text-text-primary">Database</p>
                                    <p className="text-xs text-text-secondary">Response time: 45ms</p>
                                </div>
                            </div>
                            <StatusBadge variant="success">Healthy</StatusBadge>
                        </div>
                        <StatusBadge variant="warning" className="hidden">Offline</StatusBadge>
                    </div>
                </div>

                {/* Top Companies */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
                    <h3 className="text-base font-semibold text-text-primary mb-4 text-xs font-bold uppercase tracking-wider">Top Companies Usage (Today)</h3>
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : topCompanies.length > 0 ? topCompanies.map((comp, idx) => (
                            <div key={comp.id} className="p-3 border border-border-secondary rounded-xl hover:bg-surface-secondary transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-text-primary truncate max-w-[200px]">{idx + 1}. {comp.name}</span>
                                    <span className="text-xs font-semibold text-text-secondary">{comp.present}/{comp.total} ({comp.rate}%)</span>
                                </div>
                                <div className="w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-brand-500 h-1.5 rounded-full transition-all duration-700" style={{ width: `${comp.rate}%` }}></div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-text-tertiary text-sm">No usage data found for today</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Support Ticket SA-02 */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                <div className="bg-amber-500/5 p-4 border-b border-border-secondary flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertOctagon size={24} className="text-amber-500" />
                        <div>
                            <h3 className="text-sm font-bold text-text-primary">SUPPORT TICKET #1247</h3>
                            <p className="text-xs text-text-secondary">Acme Corporation • Submitted by: Amina (HR Manager)</p>
                        </div>
                    </div>
                    <StatusBadge variant="danger">HIGH PRIORITY</StatusBadge>
                </div>
                <div className="p-5 text-sm text-text-secondary space-y-4">
                    <p><strong className="text-text-primary">Issue:</strong> Kiosk not working - employees cannot clock in (March 18, 2026 - 8:45 AM)</p>
                    <div className="bg-surface-secondary p-4 rounded-xl space-y-2">
                        <p className="font-semibold text-text-primary">SUPER ADMIN DIAGNOSTICS:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Kiosk ID: KSK-042-ACME-HQ (Offline)</li>
                            <li>Last Heartbeat: 8:28 AM (17 minutes ago)</li>
                            <li>Connection: Wi-Fi disconnected</li>
                        </ul>
                    </div>
                    <div className="space-y-1 border-l-2 border-emerald-500 pl-4 py-1">
                        <p className="font-semibold text-text-primary">ACTIONS TAKEN:</p>
                        <p>✅ Checked server status: Operational</p>
                        <p>✅ Pinged kiosk device: No response</p>
                        <p className="text-brand-500 mt-2 font-medium">→ Temporary Workaround Activated: Enabled direct mobile clock-in (bypass kiosk) for Acme Corp</p>
                    </div>
                    <div className="pt-2 flex gap-3">
                        {ticketStatus === 'resolved' ? (
                            <div className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-lg font-medium text-sm">Ticket #1247 Resolved</div>
                        ) : (
                            <>
                                <button onClick={() => { setTicketStatus('resolved'); flash('Ticket #1247 resolved. Acme Corporation notified.'); }} className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors cursor-pointer">Resolve Ticket</button>
                                <button onClick={() => flash('Contacting Acme Corporation admin...')} className="px-4 py-2 bg-surface-secondary text-text-primary hover:bg-border-secondary rounded-lg font-medium transition-colors cursor-pointer">Contact Company</button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Cross-Company Analytics SA-03 */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
                <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Cpu size={18} className="text-brand-500" /> Feature Usage Analytics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm"><span className="text-text-secondary">Clock In/Out</span><span className="font-medium text-text-primary">100% (47/47)</span></div>
                        <div className="flex justify-between text-sm"><span className="text-text-secondary">GPS Geofencing</span><span className="font-medium text-text-primary">91% (43/47)</span></div>
                        <div className="flex justify-between text-sm"><span className="text-text-secondary">Break Tracking</span><span className="font-medium text-text-primary">85% (40/47)</span></div>
                        <div className="flex justify-between text-sm"><span className="text-text-secondary">Overtime Tracking</span><span className="font-medium text-text-primary">68% (32/47)</span></div>
                        <div className="flex justify-between text-sm"><span className="text-text-secondary">Selfie Verification</span><span className="font-medium text-text-primary">53% (25/47)</span></div>
                    </div>
                    <div className="space-y-3 border-l pl-8 border-border-secondary">
                        <h4 className="text-sm font-semibold text-text-primary mb-2">MOROCCO-SPECIFIC INSIGHTS:</h4>
                        <div className="flex justify-between text-sm"><span className="text-text-secondary">Prayer Break Usage</span><span className="font-medium text-brand-500">89% (42/47)</span></div>
                        <div className="flex justify-between text-sm"><span className="text-text-secondary">Avg Prayer Breaks/Day</span><span className="font-medium text-text-primary">3.2</span></div>
                        <div className="flex justify-between text-sm"><span className="text-text-secondary">Most Common Break</span><span className="font-medium text-text-primary">Dhuhr (1 PM)</span></div>
                    </div>
                </div>
            </div>

        </div>
    );
}
