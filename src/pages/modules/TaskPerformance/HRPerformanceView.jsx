
import React, { useState, useEffect } from 'react';
import {
    Users, TrendingUp, Activity, Star,
    CheckCircle2, Clock, ListChecks, ArrowUpRight, BarChart3, PieChart, XCircle
} from 'lucide-react';
import { createPortal } from 'react-dom';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import { SkeletonPage } from '../../../components/ui/Skeleton';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { notificationService } from '../../../services/NotificationService';
import { Save } from 'lucide-react';

export default function HRPerformanceView() {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([]);
    const [teamPerformance, setTeamPerformance] = useState([]);
    const [topPerformers, setTopPerformers] = useState([]);
    const [performanceDistribution, setPerformanceDistribution] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teamMembersData, setTeamMembersData] = useState([]);

    const [selectedEmployeeForNote, setSelectedEmployeeForNote] = useState(null);
    const [employeeNoteText, setEmployeeNoteText] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    useEffect(() => {
        if (profile?.entreprise_id) {
            fetchData();
        }
    }, [profile?.entreprise_id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all company users
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('id, name, role')
                .eq('entreprise_id', profile.entreprise_id);

            if (usersError) throw usersError;

            // 2. Fetch all company tasks
            const { data: tasks, error: tasksError } = await supabase
                .from('tasks')
                .select('*');

            if (tasksError) throw tasksError;

            // 3. Fetch all projects with manager assignment
            const { data: projects, error: projectsError } = await supabase
                .from('projects')
                .select('id, status, team_manager_assigned')
                .eq('entreprise_id', profile.entreprise_id);

            if (projectsError) throw projectsError;

            // 4. Fetch user details for reporting hierarchy
            const { data: details, error: detailsError } = await supabase
                .from('user_details')
                .select('id_user, reports_to')
                .eq('entreprise_id', profile.entreprise_id);

            if (detailsError) throw detailsError;

            // --- CALCULATE STATS ---
            const totalTasks = tasks.length;
            const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
            const completionRate = totalTasks > 0 ? ((completedTasksCount / totalTasks) * 100).toFixed(1) : '0';
            const activeProjects = projects.filter(p => !['completed', 'closed'].includes(p.status?.toLowerCase()));

            setStats([
                { title: 'Avg Completion Rate', value: `${completionRate}%`, icon: CheckCircle2, iconColor: 'bg-emerald-500', subtitle: 'Org-wide' },
                { title: 'Active Projects', value: activeProjects.length.toString(), icon: Activity, iconColor: 'bg-blue-500' },
                { title: 'Org Tasks', value: totalTasks.toLocaleString(), icon: ListChecks, iconColor: 'bg-brand-500' },
                { title: 'Team Leaders', value: users.filter(u => u.role === 'TEAM_MANAGER').length.toString(), icon: Users, iconColor: 'bg-violet-500' },
            ]);

            // --- PROCESS TEAM PERFORMANCE ---
            const managers = users.filter(u => u.role === 'TEAM_MANAGER');

            const teamMetrics = managers.map(mgr => {
                // Count tasks created by this manager that are not "finished"
                const activeMgrTasks = tasks.filter(t => t.created_by === mgr.id && t.finish !== true);
                const completedCount = tasks.filter(t => t.created_by === mgr.id && t.status === 'completed').length;
                const efficiency = (activeMgrTasks.length + completedCount) > 0
                    ? Math.round((completedCount / (activeMgrTasks.length + completedCount)) * 100)
                    : 0;

                return {
                    id: mgr.id,
                    label: `Team ${mgr.name.split(' ')[0]}`,
                    managerName: mgr.name,
                    value: efficiency,
                    tasksCount: activeMgrTasks.length,
                    completedCount: completedCount
                };
            }).filter(team => team.tasksCount > 0 || team.completedCount > 0 || managers.length <= 10)
                .sort((a, b) => b.value - a.value);

            setTeamPerformance(teamMetrics);

            // --- PROCESS TOP PERFORMERS ---
            const userTaskCounts = {};
            tasks.forEach(t => {
                if (t.assigned_to) {
                    if (!userTaskCounts[t.assigned_to]) userTaskCounts[t.assigned_to] = { total: 0, completed: 0 };
                    userTaskCounts[t.assigned_to].total++;
                    if (t.status === 'completed') userTaskCounts[t.assigned_to].completed++;
                }
            });

            const performers = users
                .filter(u => userTaskCounts[u.id])
                .map(u => {
                    const counts = userTaskCounts[u.id];
                    return {
                        id: u.id,
                        name: u.name,
                        dept: u.role.replace('_', ' '),
                        completion: `${Math.round((counts.completed / counts.total) * 100)}%`,
                        tasks: counts.total
                    };
                })
                .sort((a, b) => b.tasks - a.tasks)
                .slice(0, 5);

            setTopPerformers(performers);

            // --- PERFORMANCE DISTRIBUTION (TIERS) ---
            const tiers = [
                { label: 'Exceeds', min: 90, color: '#83bf6e', count: 0 },
                { label: 'Meets', min: 70, color: '#2a85ff', count: 0 },
                { label: 'Developing', min: 40, color: '#ff9a55', count: 0 },
                { label: 'Risk', min: 0, color: '#ff6a55', count: 0 }
            ];

            const userEfficiencies = users
                .filter(u => userTaskCounts[u.id])
                .map(u => (userTaskCounts[u.id].completed / userTaskCounts[u.id].total) * 100);

            userEfficiencies.forEach(eff => {
                const tier = tiers.find(t => eff >= t.min);
                if (tier) tier.count++;
            });

            const totalRated = userEfficiencies.length || 1;
            setPerformanceDistribution(tiers.map(t => ({
                label: t.label,
                value: Math.round((t.count / totalRated) * 100),
                color: t.color
            })));

        } catch (error) {
            console.error('Error fetching HR performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEmployeeNote = async () => {
        if (!selectedEmployeeForNote || !employeeNoteText.trim()) return;
        setSavingNote(true);
        try {
            const { data: insertedNote, error } = await supabase
                .from('admin_notes')
                .insert({
                    entreprise_id: profile?.entreprise_id,
                    assigned_to: selectedEmployeeForNote.id,
                    author_user_id: profile?.id,
                    author_role: 'HR',
                    note: employeeNoteText.trim()
                })
                .select()
                .single();

            if (error) throw error;

            notificationService.send(
                selectedEmployeeForNote.id,
                `New administrative note added for you.`,
                'info',
                {
                    source: 'admin_evaluation_note',
                    author_id: profile?.id,
                    author_name: profile?.name || profile?.email || 'HR',
                    note_id: insertedNote?.id,
                }
            );

            setEmployeeNoteText('');
            setSelectedEmployeeForNote(null);
        } catch (err) {
            console.error('Failed to save employee note', err);
            alert('Failed to save note: ' + err.message);
        } finally {
            setSavingNote(false);
        }
    };

    if (loading) return <SkeletonPage />;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <PageHeader
                title="Organizational Performance"
                description="Monitor productivity trends, department efficiency, and top-performing teams across the company."
                icon={Activity}
                iconColor="from-blue-500 to-indigo-600"
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                    <StatCard
                        key={i}
                        title={s.title}
                        value={s.value}
                        icon={s.icon}
                        iconColor={s.iconColor}
                        subtitle={s.subtitle}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Performance Distribution */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">Engagement Distribution</h2>
                            <p className="text-xs text-text-tertiary">Employee task completion tiers</p>
                        </div>
                        <TrendingUp size={20} className="text-brand-500" />
                    </div>
                    <div className="space-y-6">
                        {performanceDistribution.map(item => (
                            <div key={item.label} className="space-y-2">
                                <div className="flex items-center justify-between text-sm font-medium">
                                    <span className="text-text-secondary">{item.label}</span>
                                    <span className="text-text-primary font-bold">{item.value}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-border-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${item.value}%`, backgroundColor: item.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Performers Leaderboard */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border-secondary bg-surface-secondary/30">
                        <h2 className="text-lg font-bold text-text-primary">Top Contributors</h2>
                        <p className="text-xs text-text-tertiary">Employees with highest task volume</p>
                    </div>
                    <div className="p-2 space-y-2">
                        {topPerformers.map((person, i) => (
                            <div key={person.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-primary hover:bg-surface-secondary border border-transparent hover:border-border-secondary transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold
                                                    ${i === 0 ? 'bg-amber-100 text-amber-600 ring-4 ring-amber-50' : 'bg-surface-tertiary text-text-tertiary'}`}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-primary">{person.name}</p>
                                        <p className="text-xs text-text-tertiary font-medium uppercase tracking-wider">{person.dept}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-brand-600">{person.completion} rate</p>
                                    <p className="text-[10px] text-text-tertiary uppercase font-bold">{person.tasks} total tasks</p>
                                </div>
                            </div>
                        ))}

                        {topPerformers.length === 0 && (
                            <div className="p-8 text-center">
                                <p className="text-sm text-text-tertiary">No task data available yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Team Efficiency & Comparison */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border-secondary flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Team Comparison</h2>
                        <p className="text-xs text-text-tertiary">Efficiency levels by management group</p>
                    </div>
                    <Activity size={20} className="text-brand-500" />
                </div>

                {teamPerformance.length > 0 ? (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teamPerformance.map(team => (
                            <div key={team.id} className="p-5 rounded-2xl bg-surface-secondary border border-border-secondary hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-text-primary group-hover:text-brand-600 transition-colors">{team.label}</h3>
                                        <p className="text-[10px] text-text-tertiary font-medium uppercase truncate max-w-[150px]">Mgr: {team.managerName}</p>
                                    </div>
                                    <span className="text-sm font-black text-brand-500">{team.value}%</span>
                                </div>
                                <div className="h-2 w-full bg-border-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-700"
                                        style={{ width: `${team.value}%` }}
                                    />
                                </div>
                                <div className="mt-4 flex justify-between text-[10px] text-text-tertiary font-bold uppercase tracking-widest">
                                    <span>{team.completedCount} / {team.tasksCount} Tasks</span>
                                    <button
                                        onClick={async () => {
                                            setSelectedTeam(team);
                                            // Fetch specific members of this team
                                            const { data: teamDetails } = await supabase
                                                .from('user_details')
                                                .select('id_user')
                                                .eq('reports_to', team.id);

                                            if (teamDetails && teamDetails.length > 0) {
                                                const memberIds = teamDetails.map(d => d.id_user);
                                                const { data: members } = await supabase
                                                    .from('users')
                                                    .select('id, name, role')
                                                    .in('id', memberIds);

                                                const { data: memberTasks } = await supabase
                                                    .from('tasks')
                                                    .select('assigned_to, status, finish')
                                                    .in('assigned_to', memberIds);

                                                if (members) {
                                                    const membersWithStats = members.map(m => {
                                                        const mTasks = memberTasks?.filter(t => t.assigned_to === m.id) || [];
                                                        const total = mTasks.length;
                                                        const completed = mTasks.filter(t => t.status === 'completed' || t.finish === true).length;
                                                        return {
                                                            ...m,
                                                            totalTasks: total,
                                                            completedTasks: completed,
                                                            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
                                                        };
                                                    }).sort((a, b) => b.completionRate - a.completionRate);
                                                    setTeamMembersData(membersWithStats);
                                                }
                                            } else {
                                                setTeamMembersData([]);
                                            }
                                        }}
                                        className="text-brand-600 flex items-center gap-1 hover:text-brand-700 cursor-pointer"
                                    >
                                        Details <ArrowUpRight size={10} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center flex flex-col items-center gap-4">
                        <PieChart className="text-text-tertiary" size={48} strokeWidth={1} />
                        <div>
                            <p className="text-text-primary font-bold">No Team Data</p>
                            <p className="text-sm text-text-tertiary">Once managers are assigned teams via reports, their data will appear here.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Team Details Modal */}
            {selectedTeam && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedTeam(null)}>
                    <div className="bg-surface-primary w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-border-secondary flex flex-col animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-border-secondary flex justify-between items-center bg-brand-500/5">
                            <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                                <Users className="text-brand-500" size={20} />
                                {selectedTeam.label} Details
                            </h3>
                            <button onClick={() => setSelectedTeam(null)} className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-all active:scale-95">
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex-1 p-4 bg-surface-secondary rounded-2xl border border-border-secondary">
                                    <p className="text-xs text-text-tertiary font-bold uppercase tracking-widest">Manager</p>
                                    <p className="text-lg font-black text-text-primary">{selectedTeam.managerName}</p>
                                </div>
                                <div className="flex-1 p-4 bg-surface-secondary rounded-2xl border border-border-secondary">
                                    <p className="text-xs text-text-tertiary font-bold uppercase tracking-widest">Overall Efficiency</p>
                                    <p className="text-lg font-black text-brand-600">{selectedTeam.value}%</p>
                                </div>
                            </div>

                            <h4 className="text-sm font-bold text-text-primary mb-3">Team Members ({teamMembersData.length})</h4>

                            <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                                {teamMembersData.length > 0 ? (
                                    teamMembersData.map(member => (
                                        <div
                                            key={member.id}
                                            onClick={() => setSelectedEmployeeForNote(member)}
                                            className="p-4 bg-surface-primary border border-border-secondary hover:border-brand-500 rounded-xl flex items-center justify-between shadow-sm cursor-pointer transition-all hover:bg-brand-50/50"
                                        >
                                            <div>
                                                <p className="font-bold text-sm text-text-primary group-hover:text-brand-600 transition-colors">{member.name}</p>
                                                <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">{member.role.replace('_', ' ')}</p>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-text-secondary">{member.completedTasks} / {member.totalTasks} Tasks</p>
                                                    <p className="text-[10px] text-text-tertiary uppercase font-bold tracking-widest">Completed</p>
                                                </div>
                                                <div className="flex flex-col items-center gap-1 w-16">
                                                    <span className="text-sm font-black text-brand-600">{member.completionRate}%</span>
                                                    <div className="w-full h-1.5 bg-border-secondary rounded-full overflow-hidden">
                                                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${member.completionRate}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center bg-surface-secondary/50 rounded-xl border border-dashed border-border-secondary">
                                        <p className="text-sm font-medium text-text-tertiary">No members found reporting directly to this manager.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-border-secondary flex justify-end bg-surface-secondary/30">
                            <button
                                onClick={() => setSelectedTeam(null)}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-surface-secondary hover:bg-border-secondary text-text-primary transition-all shadow-sm border border-border-secondary active:scale-95"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Employee Note Modal */}
            {selectedEmployeeForNote && createPortal(
                <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedEmployeeForNote(null)}>
                    <div className="bg-surface-primary w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-border-secondary flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-border-secondary flex justify-between items-center bg-brand-500/5">
                            <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                                <Star className="text-brand-500" size={20} />
                                Add Team Note
                            </h3>
                            <button onClick={() => { setSelectedEmployeeForNote(null); setEmployeeNoteText(''); }} className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-all active:scale-95">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-surface-secondary rounded-xl border border-border-secondary">
                                <p className="text-xs text-text-tertiary font-bold uppercase tracking-widest">Employee</p>
                                <p className="text-sm font-bold text-text-primary">{selectedEmployeeForNote.name}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Note Content</label>
                                <textarea
                                    value={employeeNoteText}
                                    onChange={(e) => setEmployeeNoteText(e.target.value)}
                                    placeholder="Write your feedback or administrative note here..."
                                    className="w-full min-h-[120px] p-4 bg-surface-secondary border border-border-secondary rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none transition-all shadow-sm placeholder:text-text-tertiary"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-border-secondary flex justify-end gap-3 bg-surface-secondary/30">
                            <button
                                onClick={() => { setSelectedEmployeeForNote(null); setEmployeeNoteText(''); }}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEmployeeNote}
                                disabled={!employeeNoteText.trim() || savingNote}
                                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-500/20 active:scale-95"
                            >
                                {savingNote ? (
                                    <Activity size={18} className="animate-spin" />
                                ) : (
                                    <Save size={18} />
                                )}
                                {savingNote ? 'Saving...' : 'Save Note'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
