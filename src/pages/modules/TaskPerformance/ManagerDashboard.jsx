
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRole } from '../../../contexts/RoleContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import { supabase } from '../../../services/supabase';

import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import StatusBadge from '../../../components/ui/StatusBadge';

import {
    LayoutDashboard, Users, CheckCircle, AlertCircle,
    FileText, Briefcase, CheckSquare, XCircle, Plus, Search, Trash2, Edit, Clock, Calendar, TrendingUp, Activity, ArrowUpRight, CheckCircle2, MessageSquare
} from 'lucide-react';

export default function ManagerDashboard() {
    const { profile } = useAuth();
    const { selectedNotification, setSelectedNotification } = useNotifications();
    const managerId = profile?.id;

    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [allTasks, setAllTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState([]);
    const [allCompanyEmployees, setAllCompanyEmployees] = useState([]);
    const [activeMemberId, setActiveMemberId] = useState(null);

    // Admin Notes State
    const [adminNotes, setAdminNotes] = useState([]);
    const [notesCurrentPage, setNotesCurrentPage] = useState(1);
    const [selectedFeedbackNote, setSelectedFeedbackNote] = useState(null);
    const notesPerPage = 6;

    // Rejection State
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [taskToReject, setTaskToReject] = useState(null);

    const fetchData = async () => {
        if (!managerId || !profile?.entreprise_id) return;
        setLoading(true);
        try {
            // 1. Fetch Projects assigned to this manager
            const { data: projectsData, error: projectsError } = await supabase
                .from('projects')
                .select('*')
                .eq('team_manager_assigned', managerId);

            if (projectsError) throw projectsError;

            const normalizedProjects = projectsData.map(p => ({
                id: p.id,
                title: p.name,
                department: 'Engineering',
                deadline: p.end_date ? new Date(p.end_date).toLocaleDateString() : 'N/A',
                status: p.valider ? 'Finished' : (p.status === 'in_progress' ? 'Active' : p.status.charAt(0).toUpperCase() + p.status.slice(1)),
                progress: 0,
                description: p.description,
                members: 0,
                valider: p.valider
            }));

            // 2. Fetch Team Members (via reports_to in user_details table)
            let uniqueTeamUsers = [];
            const { data: companyUsers, error: companyError } = await supabase
                .from('users')
                .select('id, name, role')
                .eq('entreprise_id', profile.entreprise_id);

            if (!companyError && companyUsers) {
                const { data: detailsDocs, error: detailsError } = await supabase
                    .from('user_details')
                    .select('id_user')
                    .eq('reports_to', managerId);

                if (!detailsError && detailsDocs) {
                    const reporterIds = new Set(detailsDocs.map(d => d.id_user));
                    uniqueTeamUsers = companyUsers.filter(u => reporterIds.has(u.id));
                }
            }
            setAllCompanyEmployees(uniqueTeamUsers);

            // 3. Fetch ALL Tasks (let RLS do the work)
            const { data: allTasksQueryResult, error: tasksError } = await supabase
                .from('tasks')
                .select('*, assigned_user:users!tasks_assigned_to_fkey(name, role)');

            if (tasksError) throw tasksError;

            const projectIdsSet = new Set(projectsData.map(p => p.id));
            const teamMemberIdsSet = new Set(uniqueTeamUsers.map(u => u.id));

            const tasksData = (allTasksQueryResult || []).filter(t =>
                projectIdsSet.has(t.project_id) ||
                teamMemberIdsSet.has(t.assigned_to) ||
                t.created_by === managerId
            );

            const normalizedTasks = tasksData.map(t => ({
                id: t.id,
                title: t.title,
                projectId: t.project_id,
                assigneeId: t.assigned_user?.name || 'Unassigned',
                assigneeUuid: t.assigned_to,
                status: t.status === 'completed' ? 'Completed' : t.status === 'in_progress' ? 'In Progress' : 'Not Started',
                validationStatus: t.validated_at ? 'Validated' : (t.status === 'completed' ? 'Pending' : 'None'),
                priority: t.priority.charAt(0).toUpperCase() + t.priority.slice(1),
                deadline: t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A'
            }));

            const finalProjects = normalizedProjects.map(p => {
                const pTasks = normalizedTasks.filter(t => t.projectId === p.id);
                const completed = pTasks.filter(t => t.status === 'Completed' || t.validationStatus === 'Validated').length;

                // Collect unique members for this project
                const memberMap = new Map();
                pTasks.forEach(t => {
                    if (t.assigneeUuid && t.assigneeId !== 'Unassigned') {
                        memberMap.set(t.assigneeUuid, t.assigneeId);
                    }
                });
                const memberData = Array.from(memberMap.entries()).map(([id, name]) => ({ id, name }));

                return {
                    ...p,
                    progress: pTasks.length > 0 ? Math.round((completed / pTasks.length) * 100) : 0,
                    members: memberData.length || 1,
                    memberData: memberData
                };
            });

            // 5. Build Team List for Progression Table
            // Include those from reports_to PLUS anyone already assigned a task in my projects
            const usersWithTasksInMyProjects = tasksData
                .filter(t => projectIdsSet.has(t.project_id))
                .map(t => ({
                    id: t.assigned_to,
                    name: t.assigned_user?.name || 'Unknown',
                    role: t.assigned_user?.role || 'Employee'
                }))
                .filter(u => u.id);

            const mergedTeam = Array.from(new Map([...uniqueTeamUsers, ...usersWithTasksInMyProjects].map(u => [u.id, u])).values());

            const memberStats = {};
            mergedTeam.forEach(u => {
                memberStats[u.id] = {
                    id: u.id,
                    name: u.name,
                    role: u.role,
                    tasksCompleted: 0,
                    tasksActive: 0,
                    status: 'Active'
                };
            });

            // Calculate progression (BY table tasks colonne assigned_to)
            tasksData.forEach(t => {
                if (!t.assigned_to || !memberStats[t.assigned_to]) return;

                if (t.validated_at || t.status === 'completed') {
                    memberStats[t.assigned_to].tasksCompleted++;
                } else {
                    memberStats[t.assigned_to].tasksActive++;
                    // Dynamic status calculation based on tasks
                    const currentStatus = memberStats[t.assigned_to].status;
                    if (t.status === 'in_progress') {
                        memberStats[t.assigned_to].status = 'In Progress';
                    } else if (t.status === 'on_hold' && currentStatus !== 'In Progress') {
                        memberStats[t.assigned_to].status = 'On Hold';
                    } else if (t.status === 'todo' && currentStatus === 'Active') {
                        memberStats[t.assigned_to].status = 'To Do';
                    }
                }
            });

            const finalTeam = Object.values(memberStats).map(m => ({
                ...m,
                efficiency: m.tasksCompleted + m.tasksActive > 0
                    ? Math.round((m.tasksCompleted / (m.tasksCompleted + m.tasksActive)) * 100)
                    : 0
            }));

            setProjects(finalProjects);
            setAllTasks(normalizedTasks);
            setTeamMembers(finalTeam);

            // Fetch admin notes
            const { data: notesData } = await supabase
                .from('admin_notes')
                .select('*')
                .eq('assigned_to', managerId)
                .order('created_at', { ascending: false });
            if (notesData) setAdminNotes(notesData);
        } catch (err) {
            console.error('Error fetching manager dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [managerId]);

    const handleProjectClick = (project) => {
        setSelectedProject(project);
        setIsModalOpen(true);
    };

    const [processing, setProcessing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const refreshTasks = fetchData;

    const confirmDeleteTask = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const { error } = await supabase.from('tasks').delete().eq('id', deleteTarget.id);
        if (error) console.error('Delete error:', error);
        await refreshTasks();
        setDeleting(false);
        setDeleteTarget(null);
    };

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        projectId: '',
        assigneeId: '',
        priority: 'Medium',
        deadline: '',
        description: ''
    });

    const handleValidateProject = async (projectId) => {
        setProcessing(`project-${projectId}`);
        try {
            const { error } = await supabase
                .from('projects')
                .update({ valider: true, status: 'completed' })
                .eq('id', projectId);

            if (error) throw error;

            // Refresh local state
            await fetchData();
            // Close modal if open
            if (selectedProject?.id === projectId) {
                setIsModalOpen(false);
                setSelectedProject(null);
                setActiveMemberId(null);
            }
        } catch (err) {
            console.error('Error validating project:', err);
        } finally {
            setProcessing(null);
        }
    };

    const handleValidation = async (taskId, decision, reason = null) => {
        setProcessing(taskId);
        try {
            if (decision === 'approve') {
                const { error } = await supabase.from('tasks').update({
                    validated_at: new Date().toISOString(),
                    validated_by: managerId,
                    rejection_reason: null, // Clear any old reason
                    finished: true,
                    status: 'completed' // Also ensure status is 'completed'
                }).eq('id', taskId);

                if (error) throw error;
            } else {
                const { data: taskData, error: fetchErr } = await supabase.from('tasks').select('*').eq('id', taskId).single();
                if (fetchErr) throw fetchErr;

                const { error: updateErr } = await supabase.from('tasks').update({
                    status: 'in_progress',
                    validated_at: null,
                    rejection_reason: reason,
                    finished: false
                }).eq('id', taskId);

                if (updateErr) throw updateErr;

                // Send notification to employee
                if (taskData?.assigned_to) {
                    await supabase.from('notifications').insert([{
                        user_id: taskData.assigned_to,
                        type: 'warning',
                        message: `Task Rejected: "${taskData.title}". Reason: ${reason}`,
                        related_entity: 'tasks',
                        related_id: taskId
                    }]);
                }
            }
            await refreshTasks();
        } catch (err) {
            console.error('Validation error:', err);
            // Optionally add a toast or alert here for the user
        }
        setProcessing(null);
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const { data: insertedTasks, error: insertError } = await supabase.from('tasks').insert([{
                title: newTask.title,
                project_id: newTask.projectId,
                assigned_to: newTask.assigneeId,
                priority: newTask.priority.toLowerCase(),
                due_date: newTask.deadline,
                description: newTask.description,
                status: 'todo',
                created_by: managerId
            }]).select();

            if (insertError) throw insertError;

            const createdTask = insertedTasks?.[0];
            if (createdTask && createdTask.assigned_to) {
                await supabase.from('notifications').insert([{
                    user_id: createdTask.assigned_to,
                    type: 'info',
                    message: `New task assigned: "${createdTask.title}"`,
                    related_entity: 'tasks',
                    related_id: createdTask.id
                }]);
            }
            setIsSuccess(true);
            setTimeout(() => {
                setIsCreateOpen(false);
                setIsSuccess(false);
                setNewTask({ title: '', projectId: '', assigneeId: '', priority: 'Medium', deadline: '', description: '' });
            }, 2000);
            await refreshTasks();
        } catch (err) {
            console.error('Create task error:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    const pendingValidation = allTasks?.filter(t => t.validationStatus === 'Pending') || [];
    const myProjects = projects || [];
    const teamTasks = allTasks || [];



    const myProjectsColumns = (onTitleClick) => [

        {

            key: 'title',

            label: 'Project Name',

            render: (val, row) => (

                <button

                    onClick={() => onTitleClick(row)}

                    className="font-semibold text-text-primary text-sm hover:text-brand-500 hover:underline transition-all text-left cursor-pointer"

                >

                    {val}

                </button>

            )

        },

        { key: 'department', label: 'Department', cellClassName: 'text-text-tertiary text-xs uppercase font-bold' },

        {

            key: 'status', label: 'Status', render: (val) => (

                <StatusBadge variant={val === 'Active' ? 'brand' : 'neutral'} size="sm">{val}</StatusBadge>

            )

        },

        {

            key: 'progress', label: 'Progress', render: (_, row) => {

                const projectTasks = allTasks.filter(t => t.projectId === row.id);

                const completed = projectTasks.filter(t => t.status === 'Completed' || t.validationStatus === 'Validated').length;

                const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

                return (

                    <div className="flex items-center gap-2">

                        <div className="w-16 h-1.5 bg-border-secondary rounded-full overflow-hidden">

                            <div className="h-full bg-brand-500" style={{ width: `${progress}%` }} />

                        </div>

                        <span className="text-[10px] font-bold text-text-secondary">{progress}%</span>

                    </div>

                );

            }

        }

    ];



    const taskValidationColumns = [

        {

            key: 'title', label: 'Task', render: (val, row) => (

                <div>

                    <p className="font-semibold text-text-primary text-sm leading-tight">{val}</p>

                    <p className="text-[10px] text-text-tertiary uppercase font-bold mt-0.5">ID: #{row.id}</p>

                </div>

            )

        },

        {

            key: 'assigneeId', label: 'Assignee', render: (val) => (

                <div className="flex items-center gap-2">

                    <div className="w-6 h-6 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 font-bold text-[10px]">

                        {val.charAt(0)}

                    </div>

                    <span className="text-xs text-text-secondary font-medium">{val}</span>

                </div>

            )

        },

        {

            key: 'actions', label: 'Decision', render: (_, row) => (

                <div className="flex items-center gap-2">

                    <button

                        onClick={() => handleValidation(row.id, 'approve')}

                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"

                        disabled={processing === row.id}

                    >

                        {processing === row.id ? <div className="w-3 h-3 border-2 border-current border-t-transparent animate-spin rounded-full" /> : <CheckCircle2 size={14} />}

                    </button>

                    <button
                        onClick={() => {
                            setTaskToReject(row);
                            setIsRejectModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all"
                        disabled={processing === row.id}
                    >
                        <XCircle size={14} />
                    </button>

                    <button
                        onClick={() => setDeleteTarget(row)}
                        className="p-1.5 rounded-lg bg-gray-500/10 text-gray-500 hover:bg-red-500 hover:text-white transition-all"
                        disabled={processing === row.id}
                        title="Delete Task"
                    >
                        <Trash2 size={14} />
                    </button>

                </div>

            )

        }

    ];



    const teamProgressionColumns = [

        {
            key: 'name', label: 'Employee', render: (val, row) => (
                <button
                    onClick={() => {
                        setSelectedEmployee(row);
                        setIsEmployeeModalOpen(true);
                    }}
                    className="flex items-center gap-2 hover:bg-surface-secondary p-1 rounded-xl transition-all group w-full text-left"
                >
                    <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-[10px] border border-orange-500/20 group-hover:scale-110 transition-transform">
                        {(val || 'U').charAt(0)}
                    </div>
                    <div>
                        <p className="font-semibold text-text-primary text-xs group-hover:text-brand-500 group-hover:underline">{val}</p>
                        <p className="text-[9px] text-text-tertiary">{row.role}</p>
                    </div>
                </button>
            )
        },

        {

            key: 'efficiency', label: 'Efficiency', render: (val) => (

                <div className="flex items-center gap-2">

                    <div className="w-12 h-1 bg-border-secondary rounded-full overflow-hidden">

                        <div className="h-full bg-brand-500" style={{ width: `${val}%` }} />

                    </div>

                    <span className="text-[10px] font-bold text-brand-600">{val}%</span>

                </div>

            )

        },

        {

            key: 'tasksCompleted', label: 'Tasks', render: (val, row) => (

                <span className="text-[10px] font-medium text-text-secondary">

                    <b className="text-text-primary">{val}</b>/{val + (row.tasksActive || 0)}

                </span>

            )

        },

        {
            key: 'status', label: 'Status', render: (val) => {
                const map = {
                    'In Progress': 'brand',
                    'On Hold': 'warning',
                    'Active': 'success',
                    'To Do': 'neutral'
                };
                return <StatusBadge variant={map[val] || 'success'} size="xs" dot>{val}</StatusBadge>;
            }
        }

    ];



    return (

        <div className="space-y-8 animate-fade-in pb-10">

            <PageHeader

                title="Manager Portal"

                description="Oversee projects, validate tasks, and monitor team performance."

                icon={Briefcase}

                iconColor="from-orange-500 to-amber-600"

                actionLabel="New Task"

                actionIcon={Plus}

                onAction={() => setIsCreateOpen(true)}

            />



            {/* Stats */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                <StatCard

                    title="Pending Validations"

                    value={pendingValidation.length}

                    icon={CheckSquare}

                    iconColor="bg-gradient-to-br from-amber-500 to-orange-500"

                    subtitle="Requires Attention"

                />

                <StatCard

                    title="Active Projects"

                    value={myProjects.length}

                    icon={LayoutDashboard}

                    iconColor="bg-gradient-to-br from-blue-500 to-indigo-600"

                />

                <StatCard

                    title="Total Team Tasks"

                    value={teamTasks.length}

                    icon={FileText}

                    iconColor="bg-gradient-to-br from-brand-500 to-brand-600"

                />

                <StatCard

                    title="Team Efficiency"

                    value={`${teamMembers.length > 0 ? Math.round(teamMembers.reduce((acc, m) => acc + (m.efficiency || 0), 0) / teamMembers.length) : 0}%`}

                    icon={Users}

                    iconColor="bg-gradient-to-br from-emerald-500 to-teal-600"

                    subtitle="Avg Completion Rate"

                />

            </div>



            {/* 4-Table Layout */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* 1. Projects Linked by Admin (Functional) */}

                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">

                    <div className="p-5 border-b border-border-secondary flex justify-between items-center bg-brand-500/5">

                        <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight">

                            <Briefcase size={16} className="text-brand-500" />

                            Projects Linked to Me

                        </h2>

                    </div>

                    <DataTable

                        columns={myProjectsColumns(handleProjectClick)}

                        data={myProjects}

                        emptyMessage="No projects assigned."

                    />

                </div>



                {/* 2. Team Task Validation (Functional) */}

                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">

                    <div className="p-5 border-b border-border-secondary flex justify-between items-center bg-amber-500/5">

                        <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight">

                            <Clock size={16} className="text-amber-500" />

                            Task Validation Request

                        </h2>

                        <StatusBadge variant="warning" size="sm">{pendingValidation.length} Awaiting</StatusBadge>

                    </div>

                    <DataTable columns={taskValidationColumns} data={pendingValidation} emptyMessage="No tasks waiting for validation." />

                </div>

            </div>

            {/* Admin Feedback */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 shadow-sm flex flex-col justify-center animate-fade-in" style={{ animationDelay: '600ms' }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                            <MessageSquare size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-text-primary">Administrative Feedback</h2>
                            <p className="text-xs text-text-tertiary">Notes from Leadership</p>
                        </div>
                    </div>
                </div>

                {adminNotes.length === 0 ? (
                    <div className="text-center py-6 text-text-tertiary text-sm">No feedback notes yet.</div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {adminNotes
                                .slice((notesCurrentPage - 1) * notesPerPage, notesCurrentPage * notesPerPage)
                                .map((note) => (
                                    <div
                                        key={note.id}
                                        onClick={() => setSelectedFeedbackNote(note)}
                                        className="p-4 bg-surface-secondary rounded-xl border border-border-secondary group relative cursor-pointer hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col justify-between"
                                        style={{ minHeight: '120px' }}
                                    >
                                        <p className="text-sm font-medium text-text-primary italic whitespace-pre-wrap line-clamp-3">"{note.note}"</p>
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-secondary/50">
                                            <div className="flex items-center text-[10px] font-semibold text-text-tertiary">
                                                <Clock size={10} className="mr-1" /> {new Date(note.created_at).toLocaleDateString()} • {note.author_role === 'HR' ? 'HR Team' : 'Admin'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Pagination Controls */}
                        {Math.ceil(adminNotes.length / notesPerPage) > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-4 pt-2 border-t border-border-secondary">
                                {Array.from({ length: Math.ceil(adminNotes.length / notesPerPage) }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setNotesCurrentPage(i + 1)}
                                        className={`w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center transition-all ${notesCurrentPage === i + 1
                                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                            : 'bg-surface-secondary text-text-tertiary hover:text-text-primary'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 3. Team Member Progression (Instant) */}

            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">

                <div className="p-5 border-b border-border-secondary flex justify-between items-center">

                    <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight">

                        <TrendingUp size={16} className="text-emerald-500" />

                        Team Member Progression (Instant)

                    </h2>

                </div>

                <DataTable columns={teamProgressionColumns} data={teamMembers} />

            </div>



            {/* 4. Active Projects Overall Progress */}

            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">

                <div className="p-5 border-b border-border-secondary flex justify-between items-center bg-surface-secondary/30">

                    <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight">

                        <Activity size={16} className="text-brand-500" />

                        Active Projects Overall Progress

                    </h2>

                </div>

                <DataTable

                    columns={[

                        {

                            key: 'title',

                            label: 'Project',

                            render: (val, row) => (

                                <button

                                    onClick={() => handleProjectClick(row)}

                                    className="font-bold text-text-primary text-sm hover:text-brand-500 hover:underline transition-all text-left cursor-pointer"

                                >

                                    {val}

                                </button>

                            )

                        },

                        {

                            key: 'progress', label: 'Progress', render: (_, row) => {

                                const projectTasks = allTasks.filter(t => t.projectId === row.id);

                                const completed = projectTasks.filter(t => t.status === 'Completed' || t.validationStatus === 'Validated').length;

                                const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

                                return (

                                    <div className="flex items-center gap-3">

                                        <div className="flex-1 h-2 bg-border-secondary rounded-full overflow-hidden max-w-[120px]">

                                            <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400" style={{ width: `${progress}%` }} />

                                        </div>

                                        <span className="text-xs font-black text-brand-600">{progress}%</span>

                                    </div>

                                );

                            }

                        },

                        {
                            key: 'status',
                            label: 'Status',
                            render: (val, row) => (
                                <StatusBadge
                                    variant={row.valider ? 'success' : 'brand'}
                                    size="xs"
                                    dot
                                >
                                    {row.valider ? 'Task Finish' : 'In Progress'}
                                </StatusBadge>
                            )
                        }
                    ]}

                    data={myProjects}

                />

            </div>



            {/* Project Detail Modal */}

            {isModalOpen && selectedProject && createPortal(

                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">

                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">

                        {/* Modal Header */}

                        <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-brand-500/10 to-transparent relative">

                            <div className="flex justify-between items-start mb-4">

                                <div className="space-y-1">

                                    <div className="flex items-center gap-3">

                                        <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">

                                            <Briefcase size={24} />

                                        </div>

                                        <div>

                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{selectedProject.title}</h3>

                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{selectedProject.department} • {selectedProject.client || 'Enterprise'}</p>

                                        </div>

                                    </div>

                                </div>

                                <button

                                    onClick={() => setIsModalOpen(false)}

                                    className="p-2 rounded-xl bg-gray-100 text-gray-400 hover:text-gray-900 transition-all active:scale-90"

                                >

                                    <XCircle size={20} />

                                </button>

                            </div>

                            <div className="flex items-center gap-4 mt-6">

                                <StatusBadge variant={selectedProject.status === 'Active' ? 'brand' : 'danger'} size="sm" dot>{selectedProject.status}</StatusBadge>

                                <div className="h-4 w-px bg-gray-200" />

                                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">

                                    <Clock size={14} className="text-brand-500" />

                                    Deadline: {selectedProject.deadline}

                                </div>

                            </div>

                        </div>



                        {/* Modal Body */}

                        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">

                            <div className="space-y-3">

                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Project Overview</h4>

                                <p className="text-sm text-gray-600 leading-relaxed font-medium">

                                    {selectedProject.description || 'Comprehensive project management and execution phase for ' + selectedProject.title + '.'}

                                </p>
                            </div>



                            <div className="space-y-4">

                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Team Composition</h4>

                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {selectedProject.memberData && selectedProject.memberData.length > 0 ? (
                                            selectedProject.memberData.slice(0, 5).map((member, i) => (
                                                <div
                                                    key={member.id}
                                                    onClick={() => setActiveMemberId(activeMemberId === member.id ? null : member.id)}
                                                    className={`w-10 h-10 rounded-full border-2 border-white bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-700 shadow-sm relative group cursor-pointer transition-all ${activeMemberId === member.id ? 'ring-2 ring-brand-500 scale-110 z-20' : 'hover:scale-105 hover:z-10'}`}
                                                    title={member.name}
                                                >
                                                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}

                                                    {/* Tooltip on hover/active */}
                                                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded transition-opacity whitespace-nowrap pointer-events-none z-10 ${activeMemberId === member.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                        {member.name}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                ?
                                            </div>
                                        )}

                                        {selectedProject.memberData && selectedProject.memberData.length > 5 && (
                                            <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm">
                                                +{selectedProject.memberData.length - 5}
                                            </div>
                                        )}
                                    </div>

                                    {/* Name Label for Active Member */}
                                    {activeMemberId ? (
                                        <div className="ml-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-xl text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-left-2 fade-in duration-200 border border-brand-100">
                                            {selectedProject.memberData.find(m => m.id === activeMemberId)?.name}
                                        </div>
                                    ) : (
                                        selectedProject.memberData && selectedProject.memberData.length > 0 && (
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                                {selectedProject.memberData.length} {selectedProject.memberData.length === 1 ? 'Member' : 'Members'}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>



                            <div className="space-y-4">

                                <div className="flex justify-between items-end">

                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Current Progression</h4>

                                    <span className="text-xl font-black text-brand-600">

                                        {(() => {

                                            const projectTasks = allTasks.filter(t => t.projectId === selectedProject.id);

                                            const completed = projectTasks.filter(t => t.status === 'Completed' || t.validationStatus === 'Validated').length;

                                            return projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

                                        })()}%

                                    </span>

                                </div>

                                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">

                                    <div

                                        className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 shadow-lg shadow-brand-500/30 transition-all duration-1000 ease-out"

                                        style={{

                                            width: `${(() => {

                                                const projectTasks = allTasks.filter(t => t.projectId === selectedProject.id);

                                                const completed = projectTasks.filter(t => t.status === 'Completed' || t.validationStatus === 'Validated').length;

                                                return projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

                                            })()}%`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">

                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setActiveMemberId(null);
                                }}
                                className="px-6 py-2.5 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-colors"
                            >
                                Close
                            </button>

                            {!selectedProject.valider ? (
                                <button
                                    onClick={() => handleValidateProject(selectedProject.id)}
                                    disabled={processing === `project-${selectedProject.id}`}
                                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all active:translate-y-0 flex items-center gap-2"
                                >
                                    {processing === `project-${selectedProject.id}` ? (
                                        <Activity size={14} className="animate-spin" />
                                    ) : (
                                        <CheckCircle size={14} />
                                    )}
                                    Mark Finalized
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="px-6 py-2.5 bg-emerald-100 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-200 flex items-center gap-2"
                                >
                                    <CheckCircle2 size={14} />
                                    Validated
                                </button>
                            )}


                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Reject Task Modal */}
            {isRejectModalOpen && taskToReject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50/50">
                            <h3 className="text-xl font-black text-red-600 flex items-center gap-2">
                                <XCircle size={24} />
                                Reject Task
                            </h3>
                            <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-all"><XCircle size={20} /></button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Task Modal */}

            {
                isCreateOpen && createPortal(
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-surface-primary rounded-3xl shadow-2xl w-full max-w-lg border border-border-secondary overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-border-secondary flex justify-between items-center bg-surface-secondary/50">
                                <h3 className="text-lg font-bold text-text-primary uppercase tracking-tight">Create New Task</h3>
                                {!isSuccess && (
                                    <button onClick={() => setIsCreateOpen(false)} className="text-text-tertiary hover:text-text-primary transition-colors p-1 hover:bg-surface-secondary rounded-lg">
                                        <XCircle size={20} />
                                    </button>
                                )}
                            </div>

                            {isSuccess ? (
                                <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                                        <CheckCircle size={48} className="animate-bounce" />
                                    </div>
                                    <h4 className="text-xl font-bold text-text-primary">Task Created Successfully!</h4>
                                    <p className="text-sm text-text-tertiary">The task has been added and assigned to the team member.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateTask} className="p-6 space-y-5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">Task Title</label>
                                        <input
                                            required
                                            type="text"
                                            value={newTask.title}
                                            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                            className="w-full px-4 py-3 text-sm bg-surface-secondary border border-border-secondary rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-text-primary placeholder:text-text-tertiary transition-all"
                                            placeholder="e.g. Update API Documentation"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">Project</label>
                                            <select
                                                required
                                                value={newTask.projectId}
                                                onChange={e => setNewTask({ ...newTask, projectId: e.target.value })}
                                                className="w-full px-4 py-3 text-sm bg-surface-secondary border border-border-secondary rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-text-primary transition-all appearance-none"
                                            >
                                                <option value="">Select Project...</option>
                                                {myProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">Assign To</label>
                                            <select
                                                required
                                                value={newTask.assigneeId}
                                                onChange={e => setNewTask({ ...newTask, assigneeId: e.target.value })}
                                                className="w-full px-4 py-3 text-sm bg-surface-secondary border border-border-secondary rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-text-primary transition-all appearance-none"
                                            >
                                                <option value="">Select Employee...</option>
                                                {allCompanyEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">Priority</label>
                                            <select
                                                value={newTask.priority}
                                                onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                                className="w-full px-4 py-3 text-sm bg-surface-secondary border border-border-secondary rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-text-primary transition-all appearance-none"
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                                <option value="Critical">Critical</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">Deadline</label>
                                            <input
                                                required
                                                type="date"
                                                value={newTask.deadline}
                                                onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                                                className="w-full px-4 py-3 text-sm bg-surface-secondary border border-border-secondary rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-text-primary transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">Description</label>
                                        <textarea
                                            rows="3"
                                            value={newTask.description}
                                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                            className="w-full px-4 py-3 text-sm bg-surface-secondary border border-border-secondary rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-text-primary placeholder:text-text-tertiary transition-all resize-none shadow-sm"
                                            placeholder="Task details..."
                                        ></textarea>
                                    </div>

                                    <div className="pt-4 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreateOpen(false)}
                                            className="px-6 py-2.5 text-sm font-semibold text-text-secondary hover:bg-surface-secondary rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                                        >
                                            Create Task
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>,

                    document.body

                )
            }

            {/* Employee Task Detail Modal */}
            {
                isEmployeeModalOpen && selectedEmployee && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-surface-primary rounded-3xl shadow-2xl w-full max-w-xl border border-border-secondary overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-6 border-b border-border-secondary flex justify-between items-center bg-orange-500/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-sm border border-orange-500/20">
                                        {selectedEmployee.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-text-primary">{selectedEmployee.name}'s Tasks</h3>
                                        <p className="text-[10px] text-text-tertiary uppercase font-bold tracking-widest">{selectedEmployee.role}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsEmployeeModalOpen(false)}
                                    className="p-2 rounded-xl bg-surface-secondary text-text-tertiary hover:text-text-primary transition-all active:scale-90"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                {allTasks.filter(t => t.assigneeUuid === selectedEmployee.id).length > 0 ? (
                                    <div className="space-y-3">
                                        {allTasks
                                            .filter(t => t.assigneeUuid === selectedEmployee.id)
                                            .map(task => (
                                                <div key={task.id} className="p-4 rounded-2xl bg-surface-secondary border border-border-secondary flex items-center justify-between group hover:border-brand-500/30 transition-all">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-text-primary">{task.title}</p>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1 text-[10px] text-text-tertiary font-bold">
                                                                <Calendar size={10} className="text-brand-500" />
                                                                DUE: {task.deadline}
                                                            </div>
                                                            <StatusBadge variant={task.status === 'Completed' ? 'success' : 'brand'} size="xs">{task.status}</StatusBadge>
                                                        </div>
                                                    </div>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'Completed' ? 'bg-emerald-500' : 'bg-brand-500'} group-hover:scale-150 transition-transform`} />
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center space-y-2">
                                        <p className="text-sm font-bold text-text-primary">No tasks assigned yet.</p>
                                        <p className="text-xs text-text-tertiary">Assign a task to see it here.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-border-secondary bg-surface-secondary/30 flex justify-end">
                                <button
                                    onClick={() => setIsEmployeeModalOpen(false)}
                                    className="px-6 py-2.5 bg-text-primary text-surface-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-text-primary/10"
                                >
                                    Close View
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Rejection Modal */}
            {
                isRejectModalOpen && createPortal(
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50/50">
                                <h3 className="text-xl font-black text-red-600 flex items-center gap-2">
                                    <XCircle size={24} />
                                    Reject Task
                                </h3>
                                <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-all"><XCircle size={20} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-gray-600 font-medium">Please provide a reason for rejecting the task <b>"{taskToReject?.title}"</b>. This will be sent to the employee.</p>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Example: Missing documentation, incorrect format, etc."
                                    className="w-full h-32 px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-2xl text-sm font-medium transition-all outline-none resize-none"
                                ></textarea>
                            </div>
                            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={() => setIsRejectModalOpen(false)}
                                    className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!rejectReason.trim()) return alert('Please enter a reason');
                                        await handleValidation(taskToReject.id, 'reject', rejectReason);
                                        setIsRejectModalOpen(false);
                                        setRejectReason('');
                                        setTaskToReject(null);
                                    }}
                                    className="flex-[2] py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 rounded-xl transition-all active:scale-95"
                                >
                                    Send Rejection
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Admin Note Notification Modal */}
            {
                selectedNotification && selectedNotification.message?.startsWith('Admin Note:') && createPortal(
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-surface-primary rounded-3xl shadow-2xl w-full max-w-md border border-border-primary overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-6 border-b border-border-secondary bg-brand-50/50 flex justify-between items-center">
                                <h3 className="text-xl font-black text-brand-600 flex items-center gap-2">
                                    <MessageSquare size={24} />
                                    Administrative Note
                                </h3>
                                <button onClick={() => setSelectedNotification(null)} className="p-2 rounded-xl bg-surface-secondary text-text-tertiary hover:text-text-primary transition-all active:scale-90 cursor-pointer">
                                    <XCircle size={20} />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="p-4 bg-surface-secondary rounded-2xl border border-border-secondary">
                                    <p className="text-sm font-medium text-text-primary whitespace-pre-wrap">
                                        {selectedNotification.message.replace('Admin Note:', '').trim()}
                                    </p>
                                </div>
                                <div className="flex justify-end pt-4 border-t border-border-secondary mt-6">
                                    <button
                                        onClick={() => setSelectedNotification(null)}
                                        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-brand-500/20"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* Admin Feedback Note Modal */}
            {selectedFeedbackNote && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedFeedbackNote(null)}>
                    <div className="bg-surface-primary w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-border-secondary flex flex-col animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-border-secondary flex justify-between items-center bg-indigo-500/5">
                            <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                                <MessageSquare className="text-indigo-500" size={20} />
                                Administrative Feedback
                            </h3>
                            <button onClick={() => setSelectedFeedbackNote(null)} className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-all active:scale-95">
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="flex items-center gap-2 mb-6 text-xs font-semibold text-text-secondary bg-surface-secondary p-2.5 rounded-xl w-fit border border-border-secondary">
                                <Clock size={14} className="text-text-tertiary" />
                                {new Date(selectedFeedbackNote.created_at).toLocaleString()}
                                <span className="mx-2 text-border-secondary">|</span>
                                <span className="text-indigo-600">From: {selectedFeedbackNote.author_role === 'HR' ? 'HR Team' : 'Admin Team'}</span>
                            </div>
                            <div className="bg-surface-secondary/50 p-6 rounded-2xl border border-border-secondary shadow-sm">
                                <p className="text-[15px] text-text-primary whitespace-pre-wrap italic leading-relaxed font-medium">
                                    "{selectedFeedbackNote.note}"
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-border-secondary flex justify-end bg-surface-secondary/30">
                            <button
                                onClick={() => setSelectedFeedbackNote(null)}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-surface-secondary hover:bg-border-secondary text-text-primary transition-all shadow-sm border border-border-secondary active:scale-95"
                            >
                                Close Note
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Task Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDeleteTask}
                title="Delete Task"
                message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.` : ''}
                confirmLabel="Delete Task"
                loading={deleting}
            />

        </div >

    );

}

