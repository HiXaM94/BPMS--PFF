import React, { useState, useEffect } from 'react';

import { createPortal } from 'react-dom';

import {

    Users, TrendingUp, Edit3, Plus, Target,

    CheckCircle2, Clock, ListChecks, Calendar, MessageSquare, Save, FolderGit2, XCircle, Briefcase

} from 'lucide-react';

import PageHeader from '../../../components/ui/PageHeader';

import StatCard from '../../../components/ui/StatCard';

import DataTable from '../../../components/ui/DataTable';

import StatusBadge from '../../../components/ui/StatusBadge';

import { useSearchParams } from 'react-router-dom';

import { supabase } from '../../../services/supabase';

import { useAuth } from '../../../contexts/AuthContext';



const ADMIN_TABS = ['project_tracking', 'managers', 'projects'];



export default function AdminPerformanceView() {

    const [activeTab, setActiveTab] = useState('project_tracking');

    const [employees, setEmployees] = useState([]);

    const [managers, setManagers] = useState([]);

    const [projects, setProjects] = useState([]);

    const [projectValidationProcessing, setProjectValidationProcessing] = useState({});

    const [pendingTaskCount, setPendingTaskCount] = useState(0);

    const [loadingData, setLoadingData] = useState(true);

    const { session, profile } = useAuth();

    const [searchParams, setSearchParams] = useSearchParams();



    useEffect(() => {

        const queryTab = searchParams.get('tab');

        if (queryTab === 'employees') {

            setActiveTab('project_tracking');

            setSearchParams({ tab: 'project_tracking' });

        } else if (queryTab && ADMIN_TABS.includes(queryTab)) {

            setActiveTab(queryTab);

        } else if (!queryTab) {

            setActiveTab('project_tracking');

        }

    }, [searchParams]);



    const handleTabChange = (tabId) => {

        setActiveTab(tabId);

        setSearchParams({ tab: tabId });

    };



    const handleToggleProjectValidation = async (projectId, currentState) => {

        setProjectValidationProcessing(prev => ({ ...prev, [projectId]: true }));

        try {

            const { error } = await supabase

                .from('projects')

                .update({ valider: !currentState })

                .eq('id', projectId);

            if (error) throw error;

            setProjects(prev => prev.map(project => (

                project.id === projectId ? { ...project, valider: !currentState } : project

            )));

        } catch (err) {

            console.error('[AdminPerformanceView] Failed to toggle project validation', err);

        } finally {

            setProjectValidationProcessing(prev => ({ ...prev, [projectId]: false }));

        }

    };



    const fetchData = async () => {

        if (!profile?.entreprise_id) return;

        setLoadingData(true);



        try {

            // 1. Fetch Projects

            const { data: projData, error: projError } = await supabase

                .from('projects')

                .select('*, manager:users!projects_team_manager_assigned_fkey(name)')

                .eq('entreprise_id', profile.entreprise_id)

                .order('created_at', { ascending: false });

            if (projError) throw projError;



            const managerLookup = (projData || []).map(p => ({

                ...p,

                manager_name: p.manager?.name

            }));

            const projectEntrepriseMap = managerLookup.reduce((acc, proj) => {

                if (proj.id) acc[proj.id] = proj.entreprise_id;

                return acc;

            }, {});

            const projectIds = managerLookup.map(p => p.id).filter(Boolean);



            // Progress snapshot via RPC (matches manager dashboard logic)

            let progressMap = {};

            if (profile?.entreprise_id) {

                const { data: progressData, error: progressError } = await supabase

                    .rpc('get_project_progress', { p_entreprise_id: profile.entreprise_id });

                if (progressError) {

                    console.error('[AdminPerformanceView] Failed to fetch project progress via RPC:', progressError);

                } else if (Array.isArray(progressData)) {

                    progressMap = progressData.reduce((acc, row) => {

                        acc[row.project_id] = {

                            total: row.total_tasks ?? 0,

                            completed: row.completed_tasks ?? 0,

                            percent: row.progress_percent ?? 0,

                        };

                        return acc;

                    }, {});

                }

            }



            // 2. Fetch Users

            const { data: usersData, error: usersError } = await supabase

                .from('users')

                .select('id, name, email, role')

                .eq('entreprise_id', profile.entreprise_id);

            if (usersError) throw usersError;

            const allUsers = usersData || [];



            // 3. Fetch User Details

            const { data: detailsData } = await supabase

                .from('user_details')

                .select('id_user, department, reports_to')

                .eq('entreprise_id', profile.entreprise_id);

            const allDetails = detailsData || [];



            // 4. Fetch Tasks

            let allTasks = [];

            if (projectIds.length) {

                const { data: tasksData, error: tasksError } = await supabase

                    .from('tasks')

                    .select('project_id, status, entreprise_id')

                    .in('project_id', projectIds);

                if (tasksError) throw tasksError;

                allTasks = tasksData || [];

            }

            const userIds = new Set(allUsers.map(u => u.id));

            const companyTasks = allTasks.filter(t => userIds.has(t.assigned_to) || userIds.has(t.created_by));



            const taskStatsByProject = allTasks.reduce((acc, task) => {

                if (!task.project_id) return acc;

                const projectEntreprise = projectEntrepriseMap[task.project_id];

                if (projectEntreprise && projectEntreprise !== profile.entreprise_id) return acc;

                if (!acc[task.project_id]) {

                    acc[task.project_id] = { total: 0, completed: 0 };

                }

                acc[task.project_id].total += 1;

                if (

                    task.finished === true ||

                    task.finish === true ||

                    task.status === 'completed' ||

                    task.validated_at

                ) {

                    acc[task.project_id].completed += 1;

                }

                return acc;

            }, {});



            const projectsWithManager = managerLookup.map(p => {

                const stats = progressMap[p.id]

                    || taskStatsByProject[p.id]

                    || { total: 0, completed: 0, percent: undefined };

                const rawProgress = typeof stats.percent === 'number'

                    ? stats.percent

                    : stats.total > 0

                        ? Math.round((stats.completed / stats.total) * 100)

                        : ['completed', 'closed'].includes((p.status || '').toLowerCase()) ? 100 : 0;

                return {

                    ...p,

                    total_tasks: stats.total || 0,

                    completed_tasks: stats.completed || 0,

                    progressPercent: rawProgress,

                };

            });

            setProjects(projectsWithManager);



            // -- AGGREGATE EMPLOYEES --

            // Include anyone whose role is not admin, or anyone who has tasks assigned to them.

            const employeeRoleUsers = allUsers.filter(u => {

                const r = (u.role || '').toUpperCase();

                const hasTasks = companyTasks.some(t => t.assigned_to === u.id);

                return ['EMPLOYEE', 'MANAGER', 'TEAM_MANAGER', 'TEAM MANAGER'].includes(r) || hasTasks;

            });

            const calculatedEmployees = employeeRoleUsers.map(emp => {

                const empTasks = companyTasks.filter(t => t.assigned_to === emp.id);

                const completed = empTasks.filter(t =>

                    t.finished === true ||

                    t.finish === true ||

                    t.status === 'completed' ||

                    t.validated_at

                ).length;

                const total = empTasks.length;



                // Real Progress computation based on task statuses

                let progressScore = 0;

                empTasks.forEach(t => {

                    if (t.finished === true || t.finish === true || t.status === 'completed' || t.validated_at) progressScore += 1;

                    else if (t.status === 'in_progress') progressScore += 0.5;

                    else if (t.status === 'on_hold') progressScore += 0.25;

                });

                const progressPct = total > 0 ? Math.round((progressScore / total) * 100) : 0;



                const baseProductivity = total > 0 ? Math.round((completed / total) * 100) : 0;

                // If they have completed tasks on time (assuming completed tasks)

                const onTimeTasks = empTasks.filter(t => {

                    if (!(t.finished === true || t.finish === true || t.status === 'completed' || t.validated_at)) return false;

                    if (!t.due_date) return true; // No due date = on time

                    const completedDate = new Date(t.validated_at || t.completed_at || t.updated_at || new Date());

                    const dueDate = new Date(t.due_date);

                    return completedDate <= dueDate;

                });

                const onTimePct = completed > 0 ? Math.round((onTimeTasks.length / completed) * 100) : baseProductivity;

                const realProductivity = total > 0 ? Math.round((baseProductivity * 0.5) + (onTimePct * 0.5)) : 0;



                // Overall score: weighted average of progress and productivity

                const overallScore = total > 0 ? Math.round((progressPct * 0.4) + (realProductivity * 0.6)) : 0;



                const userDetail = allDetails.find(d => d.id_user === emp.id);

                const managerName = userDetail?.reports_to

                    ? allUsers.find(u => u.id === userDetail.reports_to)?.name

                    : 'Unassigned';



                return {

                    id: emp.id,

                    name: emp.name,

                    managerName: managerName || 'Unassigned',

                    completedTasks: completed,

                    deadlines: progressPct, // Rendered as 'Progress'

                    productivity: realProductivity,

                    score: overallScore

                };

            });

            setEmployees(calculatedEmployees);

            // Fetch pending task count via RPC (bypasses RLS)

            const { data: pendingCount } = await supabase.rpc('get_pending_task_count', { p_entreprise_id: profile.entreprise_id });

            setPendingTaskCount(pendingCount || 0);



            // -- AGGREGATE MANAGERS --

            const managerRoleUsers = allUsers.filter(u => {

                const r = (u.role || '').toUpperCase();

                return ['TEAM_MANAGER', 'MANAGER', 'TEAM MANAGER'].includes(r);

            });



            const calculatedManagers = managerRoleUsers.map(mgr => {

                // 1. Task Completion (Tasks created by this manager)

                const mgrTasks = companyTasks.filter(t => t.created_by === mgr.id);

                const completedCount = mgrTasks.filter(t =>

                    t.finished === true ||

                    t.status === 'completed' ||

                    t.validated_at

                ).length;

                const total = mgrTasks.length;

                const managerTaskCompletion = total > 0 ? Math.round((completedCount / total) * 100) : 0;



                // 2. Project Progress (Average of all assigned projects' task completion percentages)

                const mgrProjects = projectsWithManager.filter(p => p.team_manager_assigned === mgr.id);

                let totalProgress = 0;

                mgrProjects.forEach(p => {

                    const pTasks = companyTasks.filter(t => t.project_id === p.id);

                    if (pTasks.length > 0) {

                        const completedCount = pTasks.filter(t =>

                            t.finished === true ||

                            t.status === 'completed' ||

                            t.validated_at

                        ).length;

                        totalProgress += (completedCount / pTasks.length) * 100;

                    } else if (['completed', 'closed'].includes(p.status?.toLowerCase())) {

                        totalProgress += 100;

                    }

                });

                const projectProgress = mgrProjects.length > 0

                    ? Math.round(totalProgress / mgrProjects.length)

                    : 0;



                const taskCompletion = mgrProjects.length > 0

                    ? Math.round(mgrProjects.reduce((sum, proj) => sum + (proj.progressPercent || 0), 0) / mgrProjects.length)

                    : 0;



                // 3. Team Productivity (Projects finished by this team vs total projects)

                const completedProjectsCount = mgrProjects.filter(p => ['completed', 'closed'].includes(p.status?.toLowerCase())).length;

                const totalProjectsCount = mgrProjects.length;

                const productivity = totalProjectsCount > 0 ? Math.round((completedProjectsCount / totalProjectsCount) * 100) : 0;



                return {

                    id: mgr.id,

                    name: mgr.name,

                    email: mgr.email,

                    productivity,           // Team Productivity

                    projectProgress,        // Project Progress

                    completedTasks: taskCompletion || managerTaskCompletion,

                    notes: []

                };

            });



            setManagers(prev => {

                return calculatedManagers.map(newMgr => {

                    const existing = prev.find(p => p.id === newMgr.id);

                    return { ...newMgr, notes: existing?.notes || [] };

                });

            });



        } catch (err) {

            console.error('Error fetching data:', err);

        } finally {

            setLoadingData(false);

        }

    };



    useEffect(() => {

        fetchData();

    }, [profile?.entreprise_id]);



    // Notes state

    const [selectedManager, setSelectedManager] = useState(null);

    const [noteText, setNoteText] = useState('');

    const [editingNoteId, setEditingNoteId] = useState(null);



    // Project state

    const [newProject, setNewProject] = useState({ name: '', desc: '', start: '', deadline: '', managerId: '' });

    const [selectedProjectForModal, setSelectedProjectForModal] = useState(null);

    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [successMessage, setSuccessMessage] = useState('');

    const [currentProjectPage, setCurrentProjectPage] = useState(1);

    const projectsPerPage = 2;



    // --- HANDLERS ---

    const handleSaveNote = async () => {

        if (!selectedManager || !noteText.trim()) return;



        // 1. Send Notification to Manager

        if (!editingNoteId) {

            try {

                await supabase.from('notifications').insert([{

                    user_id: selectedManager.id,

                    type: 'info',

                    message: `Admin Note: ${noteText}`,

                    related_entity: 'users',

                    related_id: profile?.id

                }]);

            } catch (err) {

                console.error("Failed to insert notification:", err);

            }

        }



        // 2. Maintain state

        setManagers(prev => prev.map(m => {

            if (m.id === selectedManager.id) {

                if (editingNoteId) {

                    return {

                        ...m, notes: m.notes.map(n => n.id === editingNoteId ? { ...n, text: noteText, updatedAt: new Date().toISOString() } : n)

                    };

                } else {

                    return {

                        ...m, notes: [...m.notes, { id: Date.now(), text: noteText, timestamp: new Date().toISOString() }]

                    };

                }

            }

            return m;

        }));

        setNoteText('');

        setEditingNoteId(null);

    };



    const handleEditNote = (note) => {

        setNoteText(note.text);

        setEditingNoteId(note.id);

    };



    const handleCreateProject = async (e) => {

        e.preventDefault();

        if (!newProject.name || !profile?.entreprise_id) return;



        try {

            const projectToInsert = {

                name: newProject.name,

                description: newProject.desc,

                start_date: newProject.start || null,

                end_date: newProject.deadline || null,

                entreprise_id: profile.entreprise_id,

                created_by: profile?.id,

                team_manager_assigned: newProject.managerId || null,

                status: 'planning' // Default status from enum

            };



            console.log('Project to insert:', projectToInsert);



            const { data, error } = await supabase

                .from('projects')

                .insert([projectToInsert])

                .select();



            if (error) throw error;



            await fetchData(); // Re-fetch all projects to get flattened manager names

            setNewProject({ name: '', desc: '', start: '', deadline: '', managerId: '' });

            setCurrentProjectPage(1);



            setSuccessMessage('Project created and delegated successfully!');

            setShowSuccessModal(true);

            setTimeout(() => setShowSuccessModal(false), 3000);

        } catch (err) {

            console.error('Error creating project:', err);

            alert('Failed to create project: ' + err.message);

        }

    };



    // --- RENDER HELPERS ---

    const getScoreColor = (score) => {

        if (score >= 90) return 'text-emerald-500 bg-emerald-500/10';

        if (score >= 80) return 'text-blue-500 bg-blue-500/10';

        if (score >= 70) return 'text-amber-500 bg-amber-500/10';

        return 'text-red-500 bg-red-500/10';

    };



    const getScoreBg = (score) => {

        if (score >= 90) return 'bg-emerald-500';

        if (score >= 80) return 'bg-blue-500';

        if (score >= 70) return 'bg-amber-500';

        return 'bg-red-500';

    };



    const tabs = [

        { id: 'project_tracking', label: 'Project Tracking', icon: Briefcase },

        { id: 'managers', label: 'Manager Evaluation', icon: Target },

        { id: 'projects', label: 'Projects & Delegation', icon: FolderGit2 },

    ];



    const projectHistoryColumns = [

        { key: 'name', label: 'Title', render: (val, row) => <button onClick={() => { setSelectedProjectForModal(row); setIsProjectModalOpen(true); }} className="font-bold text-text-primary text-sm hover:text-brand-500 hover:underline cursor-pointer">{val}</button> },

        {

            key: 'status',

            label: 'Status',

            render: (val) => (

                <StatusBadge

                    variant={val === 'in_progress' ? 'brand' : val === 'completed' ? 'success' : 'info'}

                    size="sm"

                >

                    {val.replace('_', ' ')}

                </StatusBadge>

            )

        },

        { key: 'manager_name', label: 'Assigned Manager', render: (val) => <span className="text-xs font-semibold text-text-secondary">{val || 'Unassigned'}</span> },

        { key: 'end_date', label: 'Deadline', render: (val) => <span className="text-xs text-text-secondary">{val || 'N/A'}</span> },

    ];



    return (

        <div className="space-y-6 animate-fade-in pb-10">

            <PageHeader

                title="Admin Task & Performance"

                description="Monitor performance metrics, evaluate managers, and oversee project delegation across the organization."

                icon={TrendingUp}

                iconColor="from-brand-500 to-indigo-600"

            />



            {/* Tabs */}

            <div className="flex space-x-2 bg-surface-secondary/50 p-1 rounded-xl w-fit border border-border-secondary shadow-sm">

                {tabs.map((tab) => (

                    <button

                        key={tab.id}

                        onClick={() => handleTabChange(tab.id)}

                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === tab.id

                            ? 'bg-surface-primary dark:text-white shadow-sm ring-1 ring-border-primary'

                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'

                            }`}

                        style={activeTab === tab.id ? { color: 'black', fontWeight: 600 } : undefined}

                    >

                        <tab.icon size={16} />

                        {tab.label}

                    </button>

                ))}

            </div>







            {/* PROJECT TRACKING TAB */}

            {activeTab === 'project_tracking' && (

                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm animate-fade-in">

                    <div className="p-5 border-b border-border-secondary flex flex-col gap-1">

                        <h2 className="text-lg font-bold text-text-primary">Project Tracking</h2>

                        <p className="text-xs text-text-tertiary">Live overview of project ownership, completion rate, and validation status.</p>

                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full text-left border-collapse">

                            <thead>

                                <tr className="bg-surface-secondary/50 border-b border-border-secondary text-xs uppercase text-text-tertiary font-bold tracking-wider">

                                    <th className="px-6 py-4">Project</th>

                                    <th className="px-6 py-4">Manager</th>

                                    <th className="px-6 py-4">Progress</th>

                                    <th className="px-6 py-4">Status</th>

                                    <th className="px-6 py-4 text-right">Validation</th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-border-secondary">

                                {projects.map(project => (

                                    <tr key={project.id} className="hover:bg-surface-secondary/50 transition-colors">

                                        <td className="px-6 py-4 font-medium text-text-primary">

                                            <div className="flex flex-col">

                                                <span>{project.name}</span>

                                                <span className="text-[11px] text-text-tertiary uppercase font-semibold">{project.status?.replace('_', ' ') || 'pending'}</span>

                                            </div>

                                        </td>

                                        <td className="px-6 py-4 text-sm text-text-secondary">{project.manager_name || 'Unassigned'}</td>

                                        <td className="px-6 py-4">

                                            <div className="flex items-center gap-2">

                                                <div className="w-28 h-1.5 bg-surface-secondary rounded-full overflow-hidden border border-border-secondary">

                                                    <div className={`h-full ${project.progressPercent >= 70 ? 'bg-emerald-500' : project.progressPercent >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${project.progressPercent}%` }} />

                                                </div>

                                                <span className="text-xs font-semibold text-text-secondary">{project.progressPercent}%</span>

                                            </div>

                                        </td>

                                        <td className="px-6 py-4">

                                            <StatusBadge variant={project.valider ? 'success' : 'warning'} size="sm" dot>

                                                {project.valider ? 'Validated' : 'Pending'}

                                            </StatusBadge>

                                        </td>

                                        <td className="px-6 py-4 text-right">

                                            <button

                                                onClick={() => handleToggleProjectValidation(project.id, project.valider)}

                                                disabled={projectValidationProcessing[project.id]}

                                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-wait ${project.valider ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}

                                            >

                                                {projectValidationProcessing[project.id]

                                                    ? 'Updating…'

                                                    : project.valider ? 'Set Pending' : 'Validate'}

                                            </button>

                                        </td>

                                    </tr>

                                ))}

                                {projects.length === 0 && (

                                    <tr>

                                        <td colSpan={5} className="px-6 py-6 text-center text-xs font-semibold text-text-tertiary">

                                            No projects available for this enterprise.

                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            )}



            {/* MANAGERS TAB */}

            {activeTab === 'managers' && (

                <div className="space-y-6 animate-fade-in">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        <StatCard title="Total Projects" value={projects.length} icon={FolderGit2} iconColor="bg-brand-500" />

                        <StatCard title="Total Managers" value={managers.length} icon={Target} iconColor="bg-amber-500" />

                        <StatCard title="Pending Tasks" value={pendingTaskCount} icon={ListChecks} iconColor="bg-blue-500" />

                    </div>



                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        <div className="col-span-2 space-y-6">

                            <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 shadow-sm">

                                <h2 className="text-lg font-bold text-text-primary mb-4">Manager Performance Evaluation</h2>

                                <div className="grid gap-4">

                                    {managers.map(mgr => (

                                        <div

                                            key={mgr.id}

                                            onClick={() => setSelectedManager(mgr)}

                                            className={`p-5 rounded-2xl border transition-all cursor-pointer ${selectedManager?.id === mgr.id

                                                ? 'border-brand-500 bg-brand-50/10 shadow-md transform scale-[1.01]'

                                                : 'border-border-secondary bg-surface-secondary hover:border-text-tertiary'

                                                }`}

                                        >

                                            <div className="flex justify-between items-start mb-4">

                                                <div>

                                                    <h3 className="font-bold text-text-primary text-lg">{mgr.name}</h3>

                                                    <p className="text-sm text-text-tertiary">{mgr.email}</p>

                                                </div>

                                                <div className="flex gap-2">

                                                    <StatusBadge variant="success">Active</StatusBadge>

                                                </div>

                                            </div>



                                            <div className="grid grid-cols-3 gap-4">

                                                <div className="space-y-1">

                                                    <span className="text-xs text-text-tertiary font-medium">Team Productivity</span>

                                                    <p className="text-xl font-bold text-text-primary flex items-center gap-1">

                                                        {mgr.productivity}% <TrendingUp size={14} className="text-emerald-500" />

                                                    </p>

                                                </div>

                                                <div className="space-y-1">

                                                    <span className="text-xs text-text-tertiary font-medium">Project Progress</span>

                                                    <p className="text-xl font-bold text-text-primary">{mgr.projectProgress}%</p>

                                                </div>

                                                <div className="space-y-1">

                                                    <span className="text-xs text-text-tertiary font-medium">Task Completion</span>

                                                    <p className="text-xl font-bold text-text-primary">{mgr.completedTasks}%</p>

                                                </div>

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            </div>

                        </div>



                        <div className="col-span-1">

                            <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 shadow-sm h-full flex flex-col">

                                <h2 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-2">

                                    <MessageSquare size={18} className="text-brand-500" /> Administrative Notes

                                </h2>



                                {!selectedManager ? (

                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-tertiary border-2 border-dashed border-border-secondary rounded-xl mt-4">

                                        <Edit3 size={32} className="mb-3 opacity-50" />

                                        <p className="text-sm font-medium">Select a manager to view or add notes.</p>

                                    </div>

                                ) : (

                                    <div className="flex-1 flex flex-col mt-4">

                                        <div className="mb-4">

                                            <h3 className="text-sm font-semibold text-text-primary">Notes for {selectedManager.name}</h3>

                                        </div>



                                        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">

                                            {!selectedManager.notes || selectedManager.notes.length === 0 ? (

                                                <p className="text-xs text-text-tertiary italic">No notes recorded yet.</p>

                                            ) : (

                                                selectedManager.notes.map(note => (

                                                    <div key={note.id} className="p-3 bg-surface-secondary rounded-xl border border-border-secondary group relative">

                                                        <p className="text-sm text-text-primary whitespace-pre-wrap">{note.text}</p>

                                                        <div className="flex justify-between items-center mt-2">

                                                            <span className="text-[10px] text-text-tertiary flex items-center gap-1">

                                                                <Clock size={10} /> {new Date(note.timestamp || note.updatedAt).toLocaleString()}

                                                            </span>

                                                            <button

                                                                onClick={() => handleEditNote(note)}

                                                                className="opacity-0 group-hover:opacity-100 text-xs text-brand-500 hover:text-brand-600 font-medium transition-opacity"

                                                            >

                                                                Edit

                                                            </button>

                                                        </div>

                                                    </div>

                                                ))

                                            )}

                                        </div>



                                        <div className="mt-auto pt-4 border-t border-border-secondary">

                                            <textarea

                                                value={noteText}

                                                onChange={(e) => setNoteText(e.target.value)}

                                                placeholder="Add an evaluation note..."

                                                className="w-full p-3 bg-surface-secondary border border-border-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none min-h-[100px]"

                                            />

                                            <div className="flex justify-end mt-2">

                                                <button

                                                    onClick={handleSaveNote}

                                                    disabled={!noteText.trim()}

                                                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"

                                                >

                                                    <Save size={16} />

                                                    {editingNoteId ? 'Update Note' : 'Save Note'}

                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                )}

                            </div>

                        </div>

                    </div>

                </div>

            )}



            {/* PROJECTS TAB */}

            {activeTab === 'projects' && (

                <div className="space-y-6 animate-fade-in">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">



                        {/* Create Project Form */}

                        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 shadow-sm">

                            <h2 className="text-lg font-bold text-text-primary mb-1">Create New Project</h2>

                            <p className="text-xs text-text-tertiary mb-6">Assign a new project to a team manager.</p>



                            <form onSubmit={handleCreateProject} className="space-y-4">

                                <div>

                                    <label className="block text-xs font-semibold text-text-secondary mb-1">Project Name</label>

                                    <input

                                        type="text" required

                                        value={newProject.name} onChange={r => setNewProject({ ...newProject, name: r.target.value })}

                                        className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"

                                        placeholder="e.g., Q3 Marketing Campaign"

                                    />

                                </div>

                                <div>

                                    <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>

                                    <textarea

                                        value={newProject.desc} onChange={r => setNewProject({ ...newProject, desc: r.target.value })}

                                        className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none h-20"

                                        placeholder="Project objectives..."

                                    />

                                </div>

                                <div className="grid grid-cols-2 gap-4">

                                    <div>

                                        <label className="block text-xs font-semibold text-text-secondary mb-1">Start Date</label>

                                        <input

                                            type="date" required

                                            value={newProject.start} onChange={r => setNewProject({ ...newProject, start: r.target.value })}

                                            className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"

                                        />

                                    </div>

                                    <div>

                                        <label className="block text-xs font-semibold text-text-secondary mb-1">Deadline</label>

                                        <input

                                            type="date" required

                                            value={newProject.deadline} onChange={r => setNewProject({ ...newProject, deadline: r.target.value })}

                                            className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"

                                        />

                                    </div>

                                </div>

                                <div>

                                    <label className="block text-xs font-semibold text-text-secondary mb-1">Assign to Manager</label>

                                    <select

                                        required value={newProject.managerId} onChange={r => setNewProject({ ...newProject, managerId: r.target.value })}

                                        className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"

                                    >

                                        <option value="">Select Manager...</option>

                                        {managers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}

                                    </select>

                                </div>

                                <button

                                    type="submit"

                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-colors mt-2 shadow-md shadow-brand-500/20"

                                >

                                    <Plus size={18} /> Create & Delegate Project

                                </button>

                            </form>

                        </div>



                        {/* Active Projects & Delegation Flow Visual */}

                        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 shadow-sm min-h-full">

                            <div className="flex justify-between items-center mb-4">

                                <h2 className="text-lg font-bold text-text-primary">Active Projects Overview</h2>

                                {(() => {

                                    const activeCount = projects.filter(p => ['planning', 'in_progress'].includes(p.status)).length;

                                    const totalProjectPages = Math.ceil(activeCount / projectsPerPage);

                                    if (totalProjectPages <= 1) return null;

                                    return (

                                        <div className="flex items-center gap-1">

                                            {Array.from({ length: totalProjectPages }).map((_, i) => (

                                                <button

                                                    key={i}

                                                    onClick={() => setCurrentProjectPage(i + 1)}

                                                    className={`w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center transition-all ${currentProjectPage === i + 1 ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-surface-secondary text-text-tertiary hover:text-text-primary'}`}

                                                >

                                                    {i + 1}

                                                </button>

                                            ))}

                                        </div>

                                    );

                                })()}

                            </div>



                            <div className="space-y-4">

                                {(() => {

                                    const filtered = projects.filter(p => ['planning', 'in_progress'].includes(p.status));

                                    if (filtered.length === 0) return <p className="text-sm text-text-tertiary">No active projects.</p>;



                                    const paginated = filtered.slice((currentProjectPage - 1) * projectsPerPage, currentProjectPage * projectsPerPage);



                                    return paginated.map(proj => (

                                        <div key={proj.id} className="p-4 rounded-xl bg-surface-secondary border border-border-secondary hover:border-text-tertiary transition-colors">

                                            <div className="flex justify-between items-start mb-2">

                                                <button onClick={() => { setSelectedProjectForModal(proj); setIsProjectModalOpen(true); }} className="font-bold text-text-primary hover:text-brand-500 hover:underline cursor-pointer text-left">{proj.name}</button>

                                                <StatusBadge variant={proj.status === 'in_progress' ? 'brand' : 'info'}>{proj.status.replace('_', ' ')}</StatusBadge>

                                            </div>

                                            <p className="text-xs text-text-tertiary mb-3 line-clamp-2">{proj.description}</p>



                                            <div className="p-3 bg-surface-primary rounded-lg border border-border-secondary text-xs">

                                                <div className="flex items-center gap-2 font-medium text-text-primary mb-2">

                                                    <Users size={14} className="text-indigo-500" /> Delegation Flow

                                                </div>

                                                <div className="flex items-center text-text-secondary relative">

                                                    <div className="absolute left-[9px] top-4 bottom-[-8px] w-0.5 bg-border-secondary"></div>

                                                    <div className="flex items-center gap-2 mb-2 z-10">

                                                        <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold border border-brand-200">M</div>

                                                        <span>Created by Admin</span>

                                                    </div>

                                                </div>

                                                <div className="flex items-center text-text-secondary relative ml-1 mt-1">

                                                    <div className="flex items-center gap-2 z-10 pl-6">

                                                        {proj.team_manager_assigned ? (

                                                            <>

                                                                <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 border border-brand-200">

                                                                    <Target size={10} />

                                                                </div>

                                                                <span className="font-semibold text-text-primary">

                                                                    Assigned to: {proj.manager_name || managers.find(m => m.id === proj.team_manager_assigned)?.name || 'Team Manager'}

                                                                </span>

                                                            </>

                                                        ) : (

                                                            <>

                                                                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200">

                                                                    <CheckCircle2 size={10} />

                                                                </div>

                                                                <span className="text-text-tertiary italic">Ready for management delegation</span>

                                                            </>

                                                        )}

                                                    </div>

                                                </div>

                                            </div>



                                            <div className="flex items-center gap-4 mt-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">

                                                <span className="flex items-center gap-1"><Calendar size={12} /> Start: {proj.start_date || 'TBD'}</span>

                                                <span className="flex items-center gap-1"><Clock size={12} /> Due: {proj.end_date || 'TBD'}</span>

                                            </div>

                                        </div>

                                    ));

                                })()}

                            </div>

                        </div>

                    </div>



                    {/* Historical Projects Table - Now full width */}

                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">

                        <div className="p-5 border-b border-border-secondary flex justify-between items-center">

                            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">

                                <FolderGit2 size={16} className="text-brand-500" /> Project History

                            </h2>

                        </div>

                        <DataTable columns={projectHistoryColumns} data={projects} />

                    </div>

                </div>

            )}



            {/* Project Details Modal */}

            {isProjectModalOpen && selectedProjectForModal && createPortal(

                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">

                    <div className="bg-surface-primary rounded-3xl shadow-2xl w-full max-w-2xl border border-border-primary overflow-hidden animate-in zoom-in-95 duration-300">

                        <div className="p-8 border-b border-border-secondary bg-gradient-to-br from-brand-500/10 to-transparent relative">

                            <div className="flex justify-between items-start mb-4">

                                <div className="flex items-center gap-3">

                                    <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">

                                        <Briefcase size={24} />

                                    </div>

                                    <div>

                                        <h3 className="text-2xl font-black text-text-primary tracking-tight">{selectedProjectForModal.name}</h3>

                                        <p className="text-xs text-text-tertiary font-bold uppercase tracking-widest">

                                            Delegated to {selectedProjectForModal.manager_name || managers.find(m => m.id === selectedProjectForModal.team_manager_assigned)?.name || (selectedProjectForModal.team_manager_assigned ? 'Team Manager' : 'Unassigned')}

                                        </p>

                                    </div>

                                </div>

                                <button

                                    onClick={() => setIsProjectModalOpen(false)}

                                    className="p-2 rounded-xl bg-surface-secondary text-text-tertiary hover:text-text-primary transition-all active:scale-90 cursor-pointer"

                                >

                                    <XCircle size={20} />

                                </button>

                            </div>

                            <div className="flex items-center gap-4 mt-6">

                                <StatusBadge variant={selectedProjectForModal.status === 'Active' ? 'brand' : 'success'} size="sm" dot>{selectedProjectForModal.status}</StatusBadge>

                                <div className="h-4 w-px bg-border-secondary" />

                                <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">

                                    <Clock size={14} className="text-brand-500" />

                                    Deadline: {selectedProjectForModal.deadline || 'N/A'}

                                </div>

                            </div>

                        </div>

                        <div className="p-8 space-y-6">

                            <div className="space-y-2">

                                <h4 className="text-xs font-black text-text-tertiary uppercase tracking-widest">Description</h4>

                                <p className="text-sm text-text-secondary">{selectedProjectForModal.description || 'No description provided.'}</p>

                            </div>

                            <div className="grid grid-cols-2 gap-4">

                                <div className="space-y-1">

                                    <h4 className="text-xs font-bold text-text-tertiary">Start Date</h4>

                                    <p className="text-sm text-text-primary">{selectedProjectForModal.start_date || 'N/A'}</p>

                                </div>

                                <div className="space-y-1">

                                    <h4 className="text-xs font-bold text-text-tertiary">Deadline</h4>

                                    <p className="text-sm text-text-primary">{selectedProjectForModal.end_date || 'N/A'}</p>

                                </div>

                            </div>

                            <div className="flex justify-end border-t border-border-secondary pt-6 mt-4">

                                <button onClick={() => setIsProjectModalOpen(false)} className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-brand-500/20">

                                    Close Details

                                </button>

                            </div>

                        </div>

                    </div>

                </div>,

                document.body

            )}



            {showSuccessModal && createPortal(

                <div className="fixed top-10 right-10 z-[10000] animate-in slide-in-from-right-10 fade-in duration-500">

                    <div className="bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-500/20 flex items-center gap-3 border border-emerald-400/50">

                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">

                            <CheckCircle2 size={18} />

                        </div>

                        <div>

                            <p className="font-bold text-sm">Success</p>

                            <p className="text-xs opacity-90">{successMessage}</p>

                        </div>

                    </div>

                </div>,

                document.body

            )}



        </div>

    );

}

