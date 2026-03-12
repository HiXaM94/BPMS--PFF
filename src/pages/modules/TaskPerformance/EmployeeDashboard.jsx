
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../services/supabase';
import { useRole } from '../../../contexts/RoleContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import NotificationDropdown from '../../../components/ui/NotificationDropdown';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import { CheckCircle2, Clock, ListChecks, AlertCircle, PlayCircle, Bell, Trash2, MessageSquare, XCircle } from 'lucide-react';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { SkeletonPage } from '../../../components/ui/Skeleton';

export default function EmployeeDashboard() {
    const { profile } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { notifications, unreadCount, markAsRead } = useNotifications();

    // Administrative Notes state
    const [adminNotes, setAdminNotes] = useState([]);
    const [notesCurrentPage, setNotesCurrentPage] = useState(1);
    const [selectedFeedbackNote, setSelectedFeedbackNote] = useState(null);
    const notesPerPage = 6;

    const fetchData = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            // 1. Fetch Tasks assigned to me
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .eq('assigned_to', profile.id)
                .order('created_at', { ascending: false });

            if (tasksError) throw tasksError;

            // Normalize tasks for UI
            const normalizedTasks = (tasksData || []).map(t => ({
                ...t,
                deadline: t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date',
                priority: t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : 'Medium',
                completedAt: t.completed_at,
                // Keep raw status for logic, but maybe capitalize for display if needed
                // The UI seems to use capitalized strings for status check in some places?
                // Actually TaskStatusSelect uses 'Completed', 'In Progress' etc.
                status: t.status === 'in_progress' ? 'In Progress' :
                    t.status === 'on_hold' ? 'On Hold' :
                        t.status === 'completed' ? 'Completed' : 'Not Started',
                validationStatus: t.validated_at ? 'Validated' : (t.status === 'completed' ? 'Pending' : 'None')
            }));

            setTasks(normalizedTasks);

            // 2. Calculate simple performance metrics
            const completedCount = normalizedTasks.filter(t => t.validationStatus === 'Validated').length;
            const totalCount = normalizedTasks.length;
            setPerformance({
                completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
                completedCount,
                totalCount
            });

            // 3. Fetch Admin Notes
            const { data: notesData } = await supabase
                .from('admin_notes')
                .select('*')
                .eq('assigned_to', profile.id)
                .order('created_at', { ascending: false });

            if (notesData) {
                setAdminNotes(notesData);
            }

        } catch (err) {
            console.error('Error fetching employee dashboard data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
    }, [profile?.id]);

    const refreshTasks = fetchData;

    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [updating, setUpdating] = useState(null);


    const getTaskDescription = (task) => task.description || "No additional details provided for this task.";

    const handleNotificationClick = async (note) => {
        setSelectedNotification({
            ...note,
            timestamp: note.created_at // Map for existing modal
        });

        // Mark as read in global context
        if (!note.is_read) {
            await markAsRead(note.id);
        }
    };


    const handleStatusChange = async (taskId, newStatus) => {
        setUpdating(taskId);
        try {
            // Map UI status back to DB enum
            let dbStatus = newStatus.toLowerCase().replace(' ', '_');
            if (newStatus === 'Not Started') dbStatus = 'todo';

            const updates = {
                status: dbStatus,
                updated_at: new Date().toISOString()
            };

            // If moving back to work, clear rejection reasons
            if (newStatus !== 'Completed') {
                updates.rejection_reason = null;
            }

            // If status is 'Completed', set completed_at
            if (newStatus === 'Completed') {
                updates.completed_at = new Date().toISOString();
            }

            const { error: updateError } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', taskId);

            if (updateError) throw updateError;
            await refreshTasks();
        } catch (err) {
            console.error('Error updating task status:', err);
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return <SkeletonPage title="Project Workspace" />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-red-500 bg-red-50 rounded-2xl border border-red-100 m-6">
                <AlertCircle size={32} className="mb-2" />
                <p className="font-medium">Error loading data</p>
                <p className="text-sm opacity-70">{error}</p>
                <button onClick={refreshTasks} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">Retry</button>
            </div>
        );
    }

    // Filter tasks
    // Current: All active tasks (not completed) + Rejected tasks needing rework
    const activeTasks = tasks.filter(t => (t.status !== 'Completed' && !t.validated_at));

    // Review: Only 'Completed' tasks waiting for validation
    const reviewTasks = tasks.filter(t => t.status === 'Completed' && !t.validated_at);
    const historyTasks = tasks.filter(t => t.validated_at);

    // Custom Pro Dropdown Component
    // Custom Pro Dropdown Component
    const TaskStatusSelect = ({ task, onUpdate, disabled }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);
        const menuRef = useRef(null);
        // Changed state to track bottom position for "dropup" behavior
        const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

        // Close when clicking outside or scrolling
        React.useEffect(() => {
            const handleGlobalClick = (event) => {
                if (
                    dropdownRef.current &&
                    !dropdownRef.current.contains(event.target) &&
                    (!menuRef.current || !menuRef.current.contains(event.target))
                ) {
                    setIsOpen(false);
                }
            };
            const handleScroll = () => setIsOpen(false);

            if (isOpen) {
                document.addEventListener('mousedown', handleGlobalClick);
                window.addEventListener('scroll', handleScroll, true);
            }

            return () => {
                document.removeEventListener('mousedown', handleGlobalClick);
                window.removeEventListener('scroll', handleScroll, true);
            };
        }, [isOpen]);

        // Calculate position for fixed menu to open DOWNWARDS (Dropdown)
        const toggleDropdown = (e) => {
            if (disabled) return;
            e.stopPropagation();

            if (!isOpen) {
                const rect = dropdownRef.current.getBoundingClientRect();
                setMenuPosition({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: rect.width
                });
            }
            setIsOpen(!isOpen);
        };

        const options = [
            { value: 'Not Started', label: 'Acknowledge', icon: AlertCircle, color: 'text-neutral-500', bg: 'bg-neutral-50' },
            { value: 'In Progress', label: 'In Progress', icon: PlayCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
            { value: 'On Hold', label: 'On Hold', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
            { value: 'Completed', label: 'Mark Completed', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' }
        ];

        const currentOption = options.find(o => o.value === task.status) || options[0];

        const handleSelect = (newValue) => {
            if (newValue !== task.status) {
                onUpdate(task.id, newValue);
            }
            setIsOpen(false);
        };

        return (
            <div className="relative w-full" ref={dropdownRef}>
                <button
                    onClick={toggleDropdown}
                    disabled={disabled}
                    className={`group flex items-center justify-between gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border shadow-sm
                        ${disabled
                            ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                            : 'bg-white border-gray-200 hover:border-brand-300 hover:ring-2 hover:ring-brand-500/10 hover:shadow-md'
                        }`}
                >
                    <div className="flex items-center gap-2 truncate">
                        <div className={`p-1 rounded-full flex-shrink-0 ${disabled ? 'bg-gray-100' : currentOption.bg}`}>
                            <currentOption.icon size={12} className={disabled ? 'text-gray-400' : currentOption.color} />
                        </div>
                        <span className={`truncate ${disabled ? '' : 'text-gray-700'}`}>
                            {task.status === 'Not Started' ? 'Not Started' : currentOption.label}
                        </span>
                    </div>
                    <svg
                        className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-500' : 'group-hover:text-gray-600'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && createPortal(
                    <div
                        ref={menuRef}
                        className="fixed z-[9999] bg-white rounded-xl shadow-xl border border-gray-100 ring-1 ring-black/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                        style={{
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                            width: `${menuPosition.width}px`
                        }}
                    >
                        {/* Increased max-height to ensure all 4 options fit (approx 160px needed), keeping scroll just in case */}
                        <div className="p-1 space-y-0.5 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {options.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={(e) => { e.stopPropagation(); handleSelect(opt.value); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs text-left rounded-lg transition-all duration-150 group shrink-0
                                        ${task.status === opt.value
                                            ? 'bg-brand-50 text-brand-700 font-semibold'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    <div className={`p-1.5 rounded-md flex-shrink-0 transition-colors ${task.status === opt.value ? 'bg-white shadow-sm' : 'bg-gray-50 group-hover:bg-white group-hover:shadow-sm'}`}>
                                        <opt.icon size={14} className={task.status === opt.value ? 'text-brand-600' : opt.color} />
                                    </div>
                                    <span className="truncate">{opt.label}</span>
                                    {task.status === opt.value && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 shadow-sm flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    };

    const renderTaskTable = (dataSet, showActions = true) => (
        <>
            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
                {dataSet.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No tasks found.
                    </div>
                ) : (
                    dataSet.map(row => {
                        return (
                            <div key={row.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3" onClick={() => setSelectedTask(row)}>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-gray-400">#{row.id}</span>
                                            {(() => {
                                                const map = { Critical: 'danger', High: 'warning', Medium: 'brand', Low: 'neutral' };
                                                return <StatusBadge variant={map[row.priority] || 'neutral'} size="sm">{row.priority}</StatusBadge>;
                                            })()}
                                        </div>
                                        <h4 className="font-semibold text-sm text-gray-900 truncate">{row.title}</h4>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock size={12} className="text-gray-400" />
                                    <span>Due: {row.deadline}</span>
                                </div>

                                <div className="pt-3 border-t border-gray-50 mt-1" onClick={e => e.stopPropagation()}>
                                    {showActions ? (
                                        (row.validationStatus === 'Validated') ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-gray-500">Status</span>
                                                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 inline-flex items-center gap-2 text-xs font-medium text-emerald-600">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Validated
                                                </div>
                                            </div>
                                        ) : row.status === 'Completed' ? (
                                            <div className="flex items-center justify-between">
                                                <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100 inline-flex items-center gap-2 text-xs font-medium text-amber-600">
                                                    <Clock size={12} />
                                                    Under Review
                                                </div>
                                            </div>
                                        ) : (
                                            <TaskStatusSelect
                                                task={row}
                                                onUpdate={handleStatusChange}
                                                disabled={updating === row.id}
                                            />
                                        )
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-500">Status</span>
                                            <StatusBadge variant={row.validationStatus === 'Validated' ? 'success' : 'neutral'} size="sm">{row.status}</StatusBadge>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block">
                <DataTable
                    columns={[
                        {
                            key: 'title', label: 'Task', render: (val, row) => (
                                <div onClick={() => setSelectedTask(row)} className="cursor-pointer group flex items-start gap-3">
                                    <div className="mt-1 p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                                        <ListChecks size={16} />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-text-primary block text-sm group-hover:text-brand-600 transition-colors">{val}</span>
                                        <span className="text-[11px] text-text-tertiary font-mono">ID: #{row.id}</span>
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: 'priority', label: 'Priority', render: (val) => {
                                const map = { Critical: 'danger', High: 'warning', Medium: 'brand', Low: 'neutral' };
                                return <StatusBadge variant={map[val] || 'neutral'} size="sm">{val}</StatusBadge>;
                            }
                        },
                        {
                            key: 'deadline', label: 'Deadline', render: (val) => (
                                <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
                                    <Clock size={12} className="text-gray-400" />
                                    {val}
                                </div>
                            )
                        },
                        ...(showActions ? [{
                            key: 'status', label: 'Action', render: (val, row) => {
                                if (row.validationStatus === 'Validated') {
                                    return (
                                        <div className="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-100 inline-flex items-center gap-2 text-xs font-medium text-gray-500">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Validated
                                        </div>
                                    );
                                }

                                if (row.status === 'Completed') {
                                    return (
                                        <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100 inline-flex items-center gap-2 text-xs font-medium text-amber-600 w-fit">
                                            <Clock size={12} />
                                            Under Review
                                        </div>
                                    );
                                }

                                return (
                                    <TaskStatusSelect
                                        task={row}
                                        onUpdate={handleStatusChange}
                                        disabled={updating === row.id}
                                    />
                                );
                            }
                        }] : [
                            {
                                key: 'status', label: 'Status', render: (val, row) => (
                                    <StatusBadge variant={row.validationStatus === 'Validated' ? 'success' : 'neutral'} size="sm">{val}</StatusBadge>
                                )
                            }
                        ]),
                    ]}
                    data={dataSet}
                    emptyMessage="No tasks found."
                />
            </div>
        </>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <PageHeader
                title="Employee Workspace"
                description="Manage your daily tasks, track progress, and view performance history."
                icon={ListChecks}
                iconColor="from-brand-500 to-blue-600"
            />


            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Active Tasks" value={activeTasks.length} icon={ListChecks} iconColor="bg-gradient-to-br from-brand-500 to-brand-600" subtitle="To Do & In Progress" />
                <StatCard title="Pending Validation" value={reviewTasks.length} icon={Clock} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" subtitle="Awaiting Manager" />
                <StatCard title="Tasks Validated" value={historyTasks.length} icon={CheckCircle2} iconColor="bg-gradient-to-br from-emerald-500 to-teal-600" subtitle="All time" />
                <StatCard title="Completion Rate" value={`${performance?.completionRate || 0}%`} icon={PlayCircle} iconColor="bg-gradient-to-br from-brand-500 to-brand-600" subtitle="Performance Metric" />
            </div>



            {/* Admin Feedback */}
            {adminNotes.length > 0 && (
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 shadow-sm flex flex-col justify-center animate-fade-in" style={{ animationDelay: '300ms' }}>
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
                </div>
            )}

            {/* Tabs & Table */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
                <div className="border-b border-border-secondary">
                    <div className="flex items-center px-6 gap-8">
                        {['active', 'review', 'history'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 text-sm font-medium border-b-2 transition-colors duration-200 capitalize ${activeTab === tab ? 'border-brand-500 text-brand-600' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                            >
                                {tab === 'active' && 'Current Tasks'}
                                {tab === 'review' && 'Under Review'}
                                {tab === 'history' && 'Task History'}
                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-surface-secondary text-text-tertiary">
                                    {tab === 'active' ? activeTasks.length : tab === 'review' ? reviewTasks.length : historyTasks.length}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-2">
                    {/* Show actions/dropdown for Active AND Review tasks (until locked) */}
                    {activeTab === 'active' && renderTaskTable(activeTasks, true)}
                    {activeTab === 'review' && renderTaskTable(reviewTasks, true)}
                    {activeTab === 'history' && renderTaskTable(historyTasks, false)}
                </div>
            </div>

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface-primary rounded-2xl shadow-2xl w-full max-w-lg border border-border-secondary max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-border-secondary flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-text-primary">{selectedTask.title}</h2>
                                <p className="text-sm text-text-tertiary mt-1">ID: #{selectedTask.id} • {selectedTask.priority} Priority</p>
                            </div>
                            <button onClick={() => setSelectedTask(null)} className="text-text-tertiary hover:text-text-primary"><span className="font-bold text-xl">&times;</span></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-text-primary mb-2">Description</h3>
                                <p className="text-sm text-text-secondary leading-relaxed bg-surface-secondary p-3 rounded-lg border border-border-secondary">{getTaskDescription(selectedTask)}</p>
                            </div>

                            {selectedTask.rejection_reason && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider">
                                        <AlertCircle size={14} />
                                        Rejection Reason
                                    </div>
                                    <p className="text-sm text-red-700 font-medium leading-relaxed">
                                        {selectedTask.rejection_reason}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div><h3 className="text-sm font-semibold text-text-primary mb-1">Deadline</h3><p className="text-sm text-text-secondary flex items-center gap-1.5"><Clock size={14} className="text-brand-500" />{selectedTask.deadline}</p></div>
                                <div><h3 className="text-sm font-semibold text-text-primary mb-1">Current Status</h3><StatusBadge variant="brand">{selectedTask.status}</StatusBadge></div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-border-secondary flex justify-end">
                            <button onClick={() => setSelectedTask(null)} className="px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary rounded-lg transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Detail Modal */}
            {selectedNotification && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-surface-primary rounded-2xl shadow-2xl w-full max-w-sm border border-border-secondary overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-border-secondary flex justify-between items-center bg-surface-secondary/30">
                            <h3 className="font-bold text-text-primary flex items-center gap-2">
                                <Bell size={18} className="text-brand-500" />
                                Notification
                            </h3>
                            <button onClick={() => setSelectedNotification(null)} className="text-text-tertiary hover:text-text-primary">
                                &times;
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold text-text-primary mb-2">Message</h4>
                                <div className="text-sm text-text-secondary leading-relaxed bg-surface-secondary p-3 rounded-lg border border-border-secondary">
                                    {selectedNotification?.message?.includes('Reason: ') ? (
                                        <>
                                            <p className="mb-3">{selectedNotification.message.split('. Reason: ')[0].trim()}</p>
                                            <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-red-700">
                                                <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-1.5">
                                                    <AlertCircle size={14} /> Reason for Rejection
                                                </span>
                                                <p className="font-medium text-xs leading-relaxed">
                                                    {selectedNotification.message.split('. Reason: ')[1]?.trim() || 'No reason provided'}
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <p>{selectedNotification?.message}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-text-tertiary">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={12} />
                                    {new Date(selectedNotification.timestamp).toLocaleString()}
                                </div>
                                <span className={`px-2 py-0.5 rounded-full capitalize ${selectedNotification.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {selectedNotification.type}
                                </span>
                            </div>
                        </div>
                        <div className="p-4 border-t border-border-secondary flex gap-3 justify-end bg-surface-secondary/30">
                            <button
                                onClick={() => setSelectedNotification(null)}
                                className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
                            >
                                Close
                            </button>
                            {selectedNotification.related_id && (
                                <button
                                    onClick={() => {
                                        const task = tasks.find(t => t.id == selectedNotification.related_id);
                                        if (task) {
                                            setSelectedTask(task);
                                            setSelectedNotification(null);
                                        } else {
                                            alert("Related task not found.");
                                        }
                                    }}
                                    className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-all"
                                >
                                    View Task
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

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

        </div>
    );
}
