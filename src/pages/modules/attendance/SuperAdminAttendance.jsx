import { Server, Activity, Users, AlertTriangle, Monitor, HardDrive, Cpu, CheckCircle2, AlertOctagon } from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function SuperAdminAttendance() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Platform Statistics */}
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-brand-500" />
                    Platform Statistics (All Companies)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Active Companies" value="47" icon={Building} iconColor="bg-gradient-to-br from-blue-500 to-cyan-500" />
                    <StatCard title="Total Employees" value="3,842" icon={Users} iconColor="bg-gradient-to-br from-indigo-500 to-purple-500" />
                    <StatCard title="Clock-ins Today" value="3,156" subtitle="82% attendance rate" icon={CheckCircle2} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <StatCard title="Active Kiosks" value="128" icon={Monitor} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
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
                        <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl border border-amber-500/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Monitor size={18} /></div>
                                <div>
                                    <p className="text-sm font-medium text-text-primary">Kiosk KSK-042 (Acme Corp)</p>
                                    <p className="text-xs text-text-secondary">Offline since 8:30 AM</p>
                                </div>
                            </div>
                            <StatusBadge variant="warning">Offline</StatusBadge>
                        </div>
                    </div>
                </div>

                {/* Top Companies */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
                    <h3 className="text-base font-semibold text-text-primary mb-4">Top Companies Usage (Today)</h3>
                    <div className="space-y-4">
                        <div className="p-3 border border-border-secondary rounded-xl">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-text-primary">1. TechStart Solutions</span>
                                <span className="text-xs font-semibold text-text-secondary">441/456 (96%)</span>
                            </div>
                            <div className="w-full bg-surface-secondary rounded-full h-1.5"><div className="bg-brand-500 h-1.5 rounded-full" style={{ width: '96%' }}></div></div>
                        </div>
                        <div className="p-3 border border-border-secondary rounded-xl">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-text-primary">2. Maroc Industries</span>
                                <span className="text-xs font-semibold text-text-secondary">312/389 (80%)</span>
                            </div>
                            <div className="w-full bg-surface-secondary rounded-full h-1.5"><div className="bg-brand-500 h-1.5 rounded-full" style={{ width: '80%' }}></div></div>
                        </div>
                        <div className="p-3 border border-border-secondary rounded-xl">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-text-primary">3. Acme Corporation</span>
                                <span className="text-xs font-semibold text-text-secondary">82/87 (94%)</span>
                            </div>
                            <div className="w-full bg-surface-secondary rounded-full h-1.5"><div className="bg-brand-500 h-1.5 rounded-full" style={{ width: '94%' }}></div></div>
                        </div>
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
                        <button className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors">Resolve Ticket</button>
                        <button className="px-4 py-2 bg-surface-secondary text-text-primary hover:bg-border-secondary rounded-lg font-medium transition-colors">Contact Company</button>
                    </div>
                </div>
            </div>

            {/* Cross-Company Analytics SA-03 */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
                <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Cpu size={18} className="text-purple-500" /> Feature Usage Analytics
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

// Needed to avoid undefined error
const Building = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>;
