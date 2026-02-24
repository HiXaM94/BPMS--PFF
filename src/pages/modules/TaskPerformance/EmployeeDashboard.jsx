
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRole } from '../../../contexts/RoleContext';
import { useController } from '../../../controllers/useController';
import { taskController } from '../../../controllers/TaskController';
import { performanceController } from '../../../controllers/PerformanceController';
import { notificationController } from '../../../controllers/NotificationController';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import { CheckCircle2, Clock, ListChecks, AlertCircle, PlayCircle, Bell } from 'lucide-react';

export default function EmployeeDashboard() {
    const { currentRole } = useRole();
    const employeeId = 'employee';
    const hasCheckedDocs = useRef(false);

    // Fetch Tasks
    const { data: tasks, loading: tasksLoading, refresh: refreshTasks } = useController(
        (id) => taskController.getByEmployee(id),
        [employeeId]
    );

    // Fetch Performance
    const { data: performance, loading: perfLoading } = useController(
        (id) => performanceController.getEmployeePerformance(id),
        [employeeId]
    );

    // Fetch Notifications
    if (!hasCheckedDocs.current) {
        notificationController.checkDeadlines(employeeId);
        hasCheckedDocs.current = true;
    }
    const { data: notifications, refresh: refreshNotes } = useController(
        (id) => notificationController.getUnread(id),
        [employeeId]
    );

    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [updating, setUpdating] = useState(null);

    const getTaskDescription = (task) => task.description || "No additional details provided for this task.";

    const handleNotificationClick = (note) => {
        setSelectedNotification(note);
    };

    const handleStatusChange = async (taskId, newStatus) => {
        setUpdating(taskId);
        await taskController.updateStatus(taskId, newStatus);
        await refreshTasks();
        setUpdating(null);
    };

    // Helper to check if task is locked (Completed > 10 mins ago)
    const isTaskLocked = (task) => {
        if (task.status !== 'Completed' || !task.completedAt) return false;
        const diff = Date.now() - new Date(task.completedAt).getTime();
        return diff > 10 * 60 * 1000; // 10 minutes
    };

    if (tasksLoading || perfLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    // Filter tasks
    // Current: All active tasks (not completed) + Rejected tasks needing rework
    const activeTasks = tasks.filter(t => (t.status !== 'Completed' && t.validationStatus !== 'Validated') || t.validationStatus === 'Rejected');

    // Review: Only 'Completed' tasks waiting for validation
    const reviewTasks = tasks.filter(t => t.status === 'Completed' && t.validationStatus === 'Pending');
    const historyTasks = tasks.filter(t => t.validationStatus === 'Validated');

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
                        const locked = isTaskLocked(row);
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
                                        (row.validationStatus === 'Validated' || (row.status === 'Completed' && locked)) ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-gray-500">Status</span>
                                                <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 inline-flex items-center gap-2 text-xs font-medium text-gray-500">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${row.validationStatus === 'Validated' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    {row.validationStatus === 'Validated' ? 'Validated' : 'Under Review'}
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
                                const locked = isTaskLocked(row);

                                if (row.validationStatus === 'Validated' || (row.status === 'Completed' && locked)) {
                                    return (
                                        <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 inline-flex items-center gap-2 text-xs font-medium text-gray-500">
                                            <div className={`w-1.5 h-1.5 rounded-full ${row.validationStatus === 'Validated' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            {row.validationStatus === 'Validated' ? 'Validated' : 'Under Review'}
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
                        ])
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
                <StatCard title="Completion Rate" value={`${performance?.completionRate || 0}%`} icon={PlayCircle} iconColor="bg-gradient-to-br from-violet-500 to-purple-600" subtitle="Performance Metric" />
            </div>

            {/* Notifications */}
            {notifications?.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-blue-900 flex items-center gap-2 mb-4">
                        <Bell size={18} className="text-blue-600" />
                        New Notifications
                    </h3>
                    <div className="space-y-3">
                        {notifications.map(note => (
                            <div key={note.id} onClick={() => handleNotificationClick(note)} className="flex items-start gap-4 bg-white p-4 rounded-xl border border-blue-100 shadow-sm transition-transform hover:scale-[1.01] cursor-pointer">
                                <span className={`block w-2.5 h-2.5 mt-1.5 rounded-full flex-shrink-0 ${note.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                <div className="flex-1">
                                    <p className="text-sm text-text-primary font-medium">{note.message}</p>
                                    <p className="text-xs text-text-tertiary mt-1">{new Date(note.timestamp).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
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
                                <p className="text-sm text-text-secondary leading-relaxed bg-surface-secondary p-3 rounded-lg border border-border-secondary">
                                    {selectedNotification.message}
                                </p>
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
                            {selectedNotification.targetId && (
                                <button
                                    onClick={() => {
                                        const task = tasks.find(t => t.id == selectedNotification.targetId);
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
        </div>
    );
}
