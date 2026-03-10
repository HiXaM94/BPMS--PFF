import { useState, useEffect } from 'react';
import {
    Lightbulb, TrendingUp, Users, Settings, Briefcase, RefreshCw, AlertCircle
} from 'lucide-react';
import { aiService } from '../../services/AIService';
import { useAuth } from '../../contexts/AuthContext';

export default function SmartInsightsPanel() {
    const { profile } = useAuth();
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchInsights = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await aiService.getSmartInsights(profile?.entreprise_id);
            if (data) {
                setInsights(data);
            } else {
                setError(true);
            }
        } catch (err) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4 animate-pulse">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-gray-200 rounded-full" />
                    <div className="h-4 bg-gray-200 rounded w-32" />
                </div>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-24" />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-5/6" />
                    </div>
                ))}
            </div>
        );
    }

    if (error || !insights) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <AlertCircle className="mx-auto text-gray-400 mb-2" size={24} />
                <p className="text-sm text-gray-600 mb-4">Unable to generate smart insights at the moment. Please ensure the AI service is properly configured.</p>
                <button
                    onClick={fetchInsights}
                    className="px-4 py-2 bg-brand-50 text-brand-600 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const sections = [
        {
            id: 'productivity',
            title: 'Productivity & Performance',
            icon: TrendingUp,
            color: 'blue',
            data: insights.productivity
        },
        {
            id: 'hiring',
            title: 'Hiring & Recruitment',
            icon: Briefcase,
            color: 'purple',
            data: insights.hiring
        },
        {
            id: 'structure',
            title: 'Company Structure',
            icon: Users,
            color: 'green',
            data: insights.structure
        },
        {
            id: 'operations',
            title: 'Operational Efficiency',
            icon: Settings,
            color: 'orange',
            data: insights.operations
        }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Lightbulb className="text-amber-500" size={20} />
                    <h3 className="font-semibold text-gray-900">AI Business Insights</h3>
                </div>
                <button
                    onClick={fetchInsights}
                    className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    title="Refresh Insights"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {sections.map(section => {
                    const Icon = section.icon;
                    const bgColors = {
                        blue: 'bg-blue-50 text-blue-600 border-blue-100',
                        purple: 'bg-purple-50 text-purple-600 border-purple-100',
                        green: 'bg-green-50 text-green-600 border-green-100',
                        orange: 'bg-orange-50 text-orange-600 border-orange-100'
                    };
                    const colorClass = bgColors[section.color];

                    return (
                        <div key={section.id} className={`p-4 rounded-xl border ${colorClass} bg-opacity-50`}>
                            <div className="flex items-center gap-2 mb-2 text-inherit">
                                <Icon size={16} />
                                <h4 className="font-semibold text-sm">{section.title}</h4>
                            </div>

                            <div className="space-y-3 mt-3">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Detected Issue</span>
                                    <p className="text-sm text-gray-700 leading-relaxed bg-white/60 p-2 rounded-lg border border-white/40">
                                        {section.data?.issue || 'No significant issues detected in this area.'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">AI Recommendation</span>
                                    <p className="text-sm text-gray-800 font-medium leading-relaxed bg-white/60 p-2 rounded-lg border border-white/40">
                                        {section.data?.recommendation || 'Continue monitoring current performance metrics.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
