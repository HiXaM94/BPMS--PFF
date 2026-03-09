import { useState, useEffect } from 'react';
import {
    Users, Calendar, Palmtree, CreditCard, Activity, Target
} from 'lucide-react';
import { companyDataService } from '../../services/CompanyDataService';

export default function CompanyKPIDashboard({ entrepriseId }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchKPIs = async () => {
            setLoading(true);
            const res = await companyDataService.getFullCompanyReport(entrepriseId);
            if (!res.error) {
                setData(res);
            }
            setLoading(false);
        };

        fetchKPIs();
    }, [entrepriseId]);

    if (loading || !data) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-32 bg-surface-primary rounded-2xl border border-border-secondary animate-pulse" />
                ))}
            </div>
        );
    }

    const { workforce, hr, tasks, analytics } = data;
    const taskCompletionRate = (tasks.completed / (tasks.todo + tasks.inProgress + tasks.completed)) * 100 || 0;

    const kpis = [
        {
            title: 'Workforce',
            value: workforce.totalEmployees,
            subtext: `${workforce.departmentsCount} Departments`,
            icon: Users,
            color: 'blue'
        },
        {
            title: 'Attendance Rate',
            value: `${analytics.attendanceRate}%`,
            subtext: `${analytics.lateRate}% late arrivals`,
            icon: Calendar,
            color: analytics.attendanceRate >= 90 ? 'green' : 'orange'
        },
        {
            title: 'Leave Requests',
            value: hr.pendingLeaves,
            subtext: 'Pending approval',
            icon: Palmtree,
            color: hr.pendingLeaves > 5 ? 'orange' : 'green'
        },
        {
            title: 'Total Payroll',
            value: `$${analytics.totalPayrollCost.toLocaleString()}`,
            subtext: 'Current period',
            icon: CreditCard,
            color: 'purple'
        },
        {
            title: 'Task Completion',
            value: `${Math.round(taskCompletionRate)}%`,
            subtext: `${tasks.completed} completed recently`,
            icon: Activity,
            color: taskCompletionRate >= 80 ? 'green' : 'orange'
        },
        {
            title: 'Recruitment',
            value: hr.openJobs,
            subtext: `${hr.activeCandidates} active candidates`,
            icon: Target,
            color: 'brand'
        }
    ];

    return (
        <div className="mb-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Company KPIs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map((kpi, index) => {
                    const Icon = kpi.icon;
                    const bgColors = {
                        blue: 'bg-blue-50 text-blue-600',
                        green: 'bg-green-50 text-green-600',
                        orange: 'bg-orange-50 text-orange-600',
                        purple: 'bg-purple-50 text-purple-600',
                        brand: 'bg-brand-50 text-brand-600'
                    };
                    const colorClass = bgColors[kpi.color] || bgColors.blue;

                    return (
                        <div key={index} className="bg-surface-primary rounded-2xl border border-border-secondary p-5 flex items-center justify-between hover:shadow-sm transition-shadow">
                            <div>
                                <p className="text-sm font-medium text-text-tertiary">{kpi.title}</p>
                                <h3 className="text-2xl font-bold text-text-primary mt-1">{kpi.value}</h3>
                                <p className="text-xs font-medium text-text-secondary mt-1">{kpi.subtext}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                                <Icon size={24} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
