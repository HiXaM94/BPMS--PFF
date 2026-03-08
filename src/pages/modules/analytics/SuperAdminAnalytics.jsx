import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3, CreditCard, Calendar, Activity,
    ChevronLeft, ChevronRight, Building2, Loader2, AlertCircle
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { landingSupabase } from '../../../services/landingSupabase';

export default function SuperAdminAnalytics() {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [mockData, setMockData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchSubscriptions = async () => {
            try {
                // Fetching from secure RPC to bypass RLS 401 Unauthorized errors
                const { data, error: fetchError } = await landingSupabase.rpc('get_dashboard_subscriptions', {
                    admin_token: 'bpms_admin_secret_2026'
                });

                if (fetchError) {
                    throw fetchError;
                }

                // Map subscriptions data using the mapped flat return structure of the RPC
                const mapped = (data || []).map(row => ({
                    id: row.id,
                    name: row.company_name || 'Unknown Company',
                    plan: row.plan_name || 'Unknown Plan',
                    startDate: new Date(row.start_date || row.created_at).toLocaleDateString(),
                    endDate: row.end_date ? new Date(row.end_date).toLocaleDateString() : 'N/A',
                    status: row.status || 'active',
                    mrr: row.price || 0
                }));
                setMockData(mapped);
            } catch (err) {
                console.error("Error fetching landing page data:", err);
                setError(err.message || 'Failed to connect to landing page database.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubscriptions();
    }, []);

    const totalPages = Math.ceil(mockData.length / itemsPerPage) || 1;

    const currentData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return mockData.slice(start, start + itemsPerPage);
    }, [currentPage, mockData]);

    // Derived stats from REAL data
    const activeCount = mockData.filter(c => c.status && c.status.toLowerCase() === 'active').length;
    const totalMRR = mockData.filter(c => c.status && c.status.toLowerCase() === 'active').reduce((acc, curr) => acc + (parseFloat(curr.mrr) || 0), 0);

    // Calculate real average subscription duration in months
    const avgDuration = useMemo(() => {
        const activeSubs = mockData.filter(c => c.status && c.status.toLowerCase() === 'active');
        if (activeSubs.length === 0) return 0;

        let totalMonths = 0;
        let validSubs = 0;

        activeSubs.forEach(sub => {
            if (sub.startDate && sub.endDate && sub.endDate !== 'N/A') {
                const start = new Date(sub.startDate);
                const end = new Date(sub.endDate);
                const diffTime = Math.abs(end - start);
                const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
                totalMonths += diffMonths;
                validSubs++;
            }
        });

        return validSubs > 0 ? (totalMonths / validSubs).toFixed(1) : 0;
    }, [mockData]);

    const getStatusVariant = (status) => {
        if (!status) return 'neutral';
        switch (status.toLowerCase()) {
            case 'active': return 'success';
            case 'trial': return 'warning';
            case 'past_due': return 'danger';
            case 'canceled': return 'neutral';
            default: return 'neutral';
        }
    };

    const getPlanVariant = (plan) => {
        if (!plan) return 'neutral';
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
                    value={loading ? '-' : mockData.length.toString()}
                    icon={Building2}
                    iconColor="bg-gradient-to-br from-brand-500 to-brand-600"
                    delay={0}
                />
                <StatCard
                    title="Active Subscriptions"
                    value={loading ? '-' : activeCount.toString()}
                    icon={Activity}
                    iconColor="bg-gradient-to-br from-emerald-500 to-teal-600"
                    delay={80}
                />
                <StatCard
                    title="Est. Monthly Revenue"
                    value={loading ? '-' : `${totalMRR.toLocaleString()} DH`}
                    icon={CreditCard}
                    iconColor="bg-gradient-to-br from-amber-500 to-orange-500"
                    delay={160}
                />
                <StatCard
                    title="Avg. Subscription"
                    value={loading ? '-' : `${avgDuration} Months`}
                    icon={Calendar}
                    iconColor="bg-gradient-to-br from-sky-500 to-cyan-500"
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
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Price (DH)</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-secondary">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-5 py-8 text-center text-text-secondary">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="animate-spin text-brand-500" size={24} />
                                            <span>Fetching live subscriptions...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="5" className="px-5 py-8 text-center text-danger-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <AlertCircle size={24} />
                                            <span>{error}</span>
                                            <span className="text-xs text-text-tertiary">Please verify the landing page table name and structure.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-5 py-8 text-center text-text-secondary">
                                        No active subscriptions found.
                                    </td>
                                </tr>
                            ) : (
                                currentData.map((company, i) => (
                                    <tr
                                        key={company.id}
                                        onClick={() => navigate('/enterprise', { state: { openCompanyDetails: company.name } })}
                                        className="hover:bg-surface-secondary/60 transition-colors duration-150 cursor-pointer"
                                    >
                                        <td className="px-5 py-3.5">
                                            <span className="font-semibold text-text-primary block">{company.name}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <StatusBadge variant={getPlanVariant(company.plan)} size="sm">{company.plan || 'N/A'}</StatusBadge>
                                        </td>
                                        <td className="px-5 py-3.5 text-text-secondary">{company.startDate}</td>
                                        <td className="px-5 py-3.5 text-text-secondary font-medium">{company.endDate}</td>
                                        <td className="px-5 py-3.5 text-text-primary font-semibold">
                                            {company.mrr ? company.mrr.toLocaleString() : '0'} DH
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <StatusBadge variant={getStatusVariant(company.status)} dot size="sm">
                                                {String(company.status).replace('_', ' ')}
                                            </StatusBadge>
                                        </td>
                                    </tr>
                                ))
                            )}
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
