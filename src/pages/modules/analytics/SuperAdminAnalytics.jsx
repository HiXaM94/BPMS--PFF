import React, { useState, useMemo } from 'react';
import {
    BarChart3, CreditCard, Calendar, Activity,
    ChevronLeft, ChevronRight, Building2
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';

// Mock generator for 45 companies to demonstrate pagination
const generateMockSubscriptions = () => {
    const plans = ['Starter', 'Business', 'Enterprise'];
    const statuses = ['active', 'active', 'active', 'trial', 'past_due', 'canceled'];
    const companies = [];

    const today = new Date();

    for (let i = 1; i <= 45; i++) {
        const startOffset = Math.floor(Math.random() * 365); // up to a year ago
        const duration = [30, 90, 365][Math.floor(Math.random() * 3)]; // 1mo, 3mo, 1yr

        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - startOffset);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration);

        const plan = plans[Math.floor(Math.random() * plans.length)];
        let status = statuses[Math.floor(Math.random() * statuses.length)];

        // adjust status based on date
        if (endDate < today && status === 'active') {
            status = 'past_due';
        }

        companies.push({
            id: i,
            name: `Company ${i} ${['LLC', 'Inc', 'Group', 'Solutions', 'Global'][Math.floor(Math.random() * 5)]}`,
            plan,
            startDate: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            endDate: endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            status,
            // For random value
            mrr: plan === 'Starter' ? 99 : plan === 'Business' ? 299 : 999
        });
    }

    // Sort by end date by default (closest first)
    return companies.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
};

const mockData = generateMockSubscriptions();

export default function SuperAdminAnalytics() {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(mockData.length / itemsPerPage);

    const currentData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return mockData.slice(start, start + itemsPerPage);
    }, [currentPage]);

    // Derived stats
    const activeCount = mockData.filter(c => c.status === 'active' || c.status === 'trial').length;
    const totalMRR = mockData.filter(c => c.status === 'active').reduce((acc, curr) => acc + curr.mrr, 0);

    const getStatusVariant = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'trial': return 'warning';
            case 'past_due': return 'danger';
            case 'canceled': return 'neutral';
            default: return 'neutral';
        }
    };

    const getPlanVariant = (plan) => {
        switch (plan) {
            case 'Enterprise': return 'brand';
            case 'Business': return 'info';
            case 'Starter': return 'neutral';
            default: return 'neutral';
        }
    };

    const generatePageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Subscription Analytics"
                description="Global overview of all company subscriptions, plans, and renewals"
                icon={BarChart3}
                iconColor="from-brand-500 to-brand-600"
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Subscriptions"
                    value={mockData.length.toString()}
                    icon={Building2}
                    iconColor="bg-gradient-to-br from-brand-500 to-brand-600"
                    delay={0}
                />
                <StatCard
                    title="Active & Trial"
                    value={activeCount.toString()}
                    icon={Activity}
                    iconColor="bg-gradient-to-br from-emerald-500 to-teal-600"
                    delay={80}
                />
                <StatCard
                    title="Est. Monthly Revenue"
                    value={`$${totalMRR.toLocaleString()}`}
                    icon={CreditCard}
                    iconColor="bg-gradient-to-br from-amber-500 to-orange-500"
                    delay={160}
                />
                <StatCard
                    title="Avg. Subscription"
                    value="4.2 Months"
                    icon={Calendar}
                    iconColor="bg-gradient-to-br from-pink-500 to-rose-500"
                    delay={240}
                />
            </div>

            {/* Subscriptions Table directly implemented for Custom Pagination Controls */}
            <div className="bg-surface-primary border border-border-secondary rounded-2xl overflow-hidden shadow-sm animate-fade-in" style={{ animationDelay: '350ms' }}>
                <div className="p-5 border-b border-border-secondary flex items-center justify-between">
                    <h2 className="text-sm font-bold text-text-primary px-1 tracking-tight">All Subscriptions Directory</h2>
                    <div className="text-xs text-text-tertiary">
                        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, mockData.length)} of {mockData.length}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border-secondary bg-surface-secondary/30">
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Company</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Plan Type</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Start Date</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">End Date</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-secondary">
                            {currentData.map((company, i) => (
                                <tr key={company.id} className="hover:bg-surface-secondary/40 transition-colors duration-150">
                                    <td className="px-5 py-3.5">
                                        <span className="font-semibold text-text-primary block">{company.name}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <StatusBadge variant={getPlanVariant(company.plan)} size="sm">{company.plan}</StatusBadge>
                                    </td>
                                    <td className="px-5 py-3.5 text-text-secondary">{company.startDate}</td>
                                    <td className="px-5 py-3.5 text-text-secondary font-medium">{company.endDate}</td>
                                    <td className="px-5 py-3.5">
                                        <StatusBadge variant={getStatusVariant(company.status)} dot size="sm">
                                            {company.status.replace('_', ' ')}
                                        </StatusBadge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Custom Pagination Footer - specifically requested */}
                <div className="px-5 py-4 border-t border-border-secondary flex items-center justify-between bg-surface-secondary/20">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                       text-brand-600 hover:text-brand-700 hover:bg-brand-50/50 
                       dark:text-brand-400 dark:hover:text-brand-300 dark:hover:bg-brand-500/10
                       disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed
                       transition-colors cursor-pointer"
                    >
                        <ChevronLeft size={16} /> Previous
                    </button>

                    <div className="flex items-center gap-2">
                        {generatePageNumbers().map(num => (
                            <button
                                key={num}
                                onClick={() => setCurrentPage(num)}
                                className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all cursor-pointer
                  ${currentPage === num
                                        ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md scale-105'
                                        : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary border border-transparent hover:border-border-secondary'
                                    }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                       text-brand-600 hover:text-brand-700 hover:bg-brand-50/50 
                       dark:text-brand-400 dark:hover:text-brand-300 dark:hover:bg-brand-500/10
                       disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed
                       transition-colors cursor-pointer"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
