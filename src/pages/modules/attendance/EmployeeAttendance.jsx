import { Clock, Download, CheckCircle2, History, AlertCircle, ScanLine, LogIn, Maximize2 } from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function EmployeeAttendance() {
    return (
        <div className="space-y-6 animate-fade-in">

            {/* Employee Greeting */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Hello, Ahmed! 👋</h2>
                    <p className="text-sm text-text-secondary mt-1">IT • Software Developer</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* EMP-01: Clock In Kiosk/Success Block */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-brand-500 rounded-3xl p-6 text-white shadow-lg shadow-brand-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none"></div>

                        <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><CheckCircle2 size={20} /> Clock In Successful!</h3>
                        <p className="text-white/80 text-sm mb-6">You are on time today. Have a great shift!</p>

                        <div className="space-y-3 mb-6 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <div className="flex justify-between">
                                <span className="text-white/70 text-sm">Time</span>
                                <span className="font-semibold">8:55 AM</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/70 text-sm">Location</span>
                                <span className="font-semibold">Main Entrance</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/70 text-sm">Shift</span>
                                <span className="font-semibold">9:00 - 17:00</span>
                            </div>
                        </div>

                        <button className="w-full py-3 bg-white text-brand-500 font-bold rounded-xl shadow-md hover:scale-[1.02] transition-transform">
                            Start Lunch Break
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-primary border border-border-secondary p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                            <Clock size={24} className="text-text-tertiary mb-2" />
                            <span className="text-2xl font-bold text-text-primary">144h</span>
                            <span className="text-xs font-medium text-text-secondary mt-1">Worked This Month</span>
                        </div>
                        <div className="bg-surface-primary border border-border-secondary p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                            <History size={24} className="text-text-tertiary mb-2" />
                            <span className="text-2xl font-bold text-text-primary">4h</span>
                            <span className="text-xs font-medium text-text-secondary mt-1">Pending Overtime</span>
                        </div>
                    </div>
                </div>


                <div className="lg:col-span-2 space-y-6">
                    {/* EMP-02: Personal History Table */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden h-fit">
                        <div className="p-5 border-b border-border-secondary flex items-center justify-between">
                            <h3 className="text-base font-semibold text-text-primary">My History (March 2026)</h3>
                            <button className="text-xs flex items-center gap-1.5 text-brand-500 font-medium hover:text-brand-600 transition-colors">
                                <Download size={14} /> Download PDF
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-surface-secondary text-text-secondary">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">Date</th>
                                        <th className="px-5 py-3 font-medium">Clock In</th>
                                        <th className="px-5 py-3 font-medium">Clock Out</th>
                                        <th className="px-5 py-3 font-medium">Hours</th>
                                        <th className="px-5 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-text-primary divide-y divide-border-secondary">
                                    {[
                                        { date: 'Mar 18', in: '8:55 AM', out: '—', hours: '—', status: 'Present', color: 'emerald' },
                                        { date: 'Mar 17', in: '8:55 AM', out: '5:00 PM', hours: '8h', status: 'Complete', color: 'emerald' },
                                        { date: 'Mar 15', in: '9:22 AM', out: '5:15 PM', hours: '7.9h', status: 'Late', color: 'amber' },
                                        { date: 'Mar 14', in: '8:50 AM', out: '5:05 PM', hours: '8.2h', status: 'Complete', color: 'emerald' },
                                        { date: 'Mar 13', in: '8:58 AM', out: '5:00 PM', hours: '8h', status: 'Complete', color: 'emerald' },
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-surface-secondary/50">
                                            <td className="px-5 py-3/5 my-1.5 font-medium">{row.date}</td>
                                            <td className="px-5 py-3/5 my-1.5 text-text-secondary">{row.in}</td>
                                            <td className="px-5 py-3/5 my-1.5 text-text-secondary">{row.out}</td>
                                            <td className="px-5 py-3/5 my-1.5 font-medium">{row.hours}</td>
                                            <td className="px-5 py-3/5 my-1.5">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-md bg-${row.color}-500/10 text-${row.color}-500 inline-block`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* EMP-03: Request Correction Form */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
                        <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <AlertCircle size={18} className="text-amber-500" /> Request Attendance Correction
                        </h3>
                        <div className="bg-surface-secondary rounded-xl p-4 border border-border-secondary">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm font-medium">
                                <div>
                                    <label className="text-xs text-text-tertiary block mb-1">Date</label>
                                    <select className="w-full bg-surface-primary border border-border-secondary rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-500" disabled>
                                        <option>March 17, 2026</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-text-tertiary block mb-1">Issue</label>
                                    <select className="w-full bg-surface-primary border border-border-secondary rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-500" disabled>
                                        <option>Missing Clock-Out</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="text-xs text-text-tertiary block mb-1">Reason for request</label>
                                <textarea
                                    className="w-full bg-surface-primary border border-border-secondary rounded-lg px-3 py-2 text-text-primary text-sm h-20 resize-none focus:outline-none focus:border-brand-500"
                                    placeholder="I forgot to clock out when leaving yesterday..."
                                    readOnly
                                    value="I forgot to clock out when leaving yesterday. I left the office at exactly 5:00 PM after completing my tasks. I went directly to the parking lot and forgot to scan at the kiosk on my way out."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button className="flex-1 py-2 bg-text-secondary text-white rounded-lg font-bold hover:bg-text-tertiary transition-colors opacity-50 cursor-not-allowed">Submitted</button>
                                <div className="flex-1 py-2 text-center text-xs text-amber-500 font-medium flex items-center justify-center">Pending Review (Manager)</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
