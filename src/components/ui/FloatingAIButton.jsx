import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useRole } from '../../contexts/RoleContext';

/**
 * FloatingAIButton — A premium floating button that redirects to the AI Assistant.
 * Used in specific dashboards (Admin/HR) to provide quick access to AI features.
 */
const FloatingAIButton = () => {
    const navigate = useNavigate();
    const { currentRole } = useRole();

    const handleNavigation = () => {
        // HR goes to the Recruitment Assistant section
        // Admin goes to the AI Assistant (Chat/Insights) page
        if (currentRole?.id === 'hr') {
            navigate('/ai-recruitment');
        } else {
            navigate('/ai-assistant');
        }
    };

    return (
        <button
            onClick={handleNavigation}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 
                       bg-brand-600 hover:bg-brand-700 text-white rounded-2xl 
                       shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(42,133,255,0.3)]
                       transition-all duration-300 transform hover:-translate-y-1 active:scale-95
                       group overflow-hidden border border-white/10"
        >
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                    <Sparkles size={18} className="animate-pulse-slow" />
                </div>
                <span className="font-bold text-sm tracking-tight">AI Assistant</span>
            </div>

            {/* Subtle glow effect */}
            <div className="absolute -inset-1 bg-brand-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
        </button>
    );
};

export default FloatingAIButton;
