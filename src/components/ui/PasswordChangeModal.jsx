import React, { useState } from 'react';
import { KeyRound, UserCheck, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

function CheckItem({ ok, label }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all duration-200
        ${ok ? 'bg-emerald-500 border-emerald-500' : 'bg-surface-secondary border-border-secondary'}`}>
                {ok && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>
            <span className={`text-xs font-medium transition-colors duration-200 ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-tertiary'}`}>
                {label}
            </span>
        </div>
    );
}

export default function PasswordChangeModal({ isOpen, onClose, role }) {
    const { session } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    if (!isOpen) return null;

    // Live password strength checks
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[\W_]/.test(password),
        match: password.length > 0 && password === confirmPassword,
    };
    const allValid = Object.values(checks).every(Boolean);

    // Prevent obvious SQL injection payloads
    const sqlKeywords = /drop |delete |update |select |insert | union | -- /i;
    const isSafe = !sqlKeywords.test(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!allValid) {
            setError('Please satisfy all password requirements below.');
            return;
        }
        if (!isSafe) {
            setError('Password contains invalid characters or sequences.');
            return;
        }

        setLoading(true);
        try {
            if (!session?.user?.id) throw new Error('User session not found. Please log in again.');

            // Update Supabase Auth password
            const { error: authError } = await supabase.auth.updateUser({ password });
            if (authError) throw authError;

            // Mark password_changed = true in the users table (universal, role-agnostic)
            const { error: userFlagError } = await supabase
                .from('users')
                .update({ password_changed: true })
                .eq('id', session.user.id);

            if (userFlagError) {
                console.warn('[PasswordChangeModal] Failed to set password_changed flag on users:', userFlagError.message);
            }

            // Also mark via the role-specific RPC for backward compatibility
            const { error: rpcError } = await supabase.rpc('update_profile_password', {
                p_user_id: session.user.id,
                p_role: role,
                p_password: password,
            });

            if (rpcError) {
                console.warn(`[${role}] password_changed RPC failed:`, rpcError.message);
            }

            setSuccess(true);
            setTimeout(() => {
                if (onClose) onClose();
            }, 2000);
        } catch (err) {
            console.error('Password update failed:', err);
            setError(err.message || 'Failed to update password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-zinc-950/80 backdrop-blur-md pt-8 px-4 overflow-y-auto">
            <div className="w-full max-w-md bg-surface-primary border border-border-secondary rounded-[24px] shadow-2xl overflow-hidden flex flex-col mb-8">

                {/* Header */}
                <div className="relative bg-surface-primary p-6 pb-4 text-center border-b border-border-secondary">
                    <div className="mx-auto w-14 h-14 bg-surface-secondary border border-border-secondary rounded-full flex items-center justify-center mb-3 shadow-sm">
                        {success ? <UserCheck size={24} className="text-emerald-500" /> : <KeyRound size={24} className="text-text-primary" />}
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-text-primary mb-1">
                        {success ? "Password Updated!" : "Secure Your Account"}
                    </h2>
                    <p className="text-text-secondary text-sm">
                        {success ? "Redirecting to your dashboard..." : "Change your temporary password to continue."}
                    </p>
                </div>

                {/* Form Body */}
                {!success && (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {error && (
                            <div className="flex items-start gap-3 p-3 bg-danger-50 text-danger-600 rounded-xl text-sm border border-danger-100">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <p className="font-medium text-xs">{error}</p>
                            </div>
                        )}

                        {/* New Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-text-secondary pl-1 block">New Password</label>
                            <div className="relative group">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-500 transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter a strong password"
                                    className="w-full pl-10 pr-12 py-2.5 bg-surface-secondary border border-border-secondary rounded-xl text-text-primary text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder:text-text-tertiary"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Live Strength Checklist */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 bg-surface-secondary rounded-xl border border-border-secondary">
                            <CheckItem ok={checks.length} label="8+ characters" />
                            <CheckItem ok={checks.uppercase} label="Uppercase (A-Z)" />
                            <CheckItem ok={checks.lowercase} label="Lowercase (a-z)" />
                            <CheckItem ok={checks.number} label="Number (0-9)" />
                            <CheckItem ok={checks.special} label="Special char (!@#)" />
                            <CheckItem ok={checks.match} label="Passwords match" />
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-text-secondary pl-1 block">Confirm Password</label>
                            <div className="relative group">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-500 transition-colors" />
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat your new password"
                                    className="w-full pl-10 pr-12 py-2.5 bg-surface-secondary border border-border-secondary rounded-xl text-text-primary text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder:text-text-tertiary"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors focus:outline-none"
                                >
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !allValid}
                            className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-sm transition-all hover:enabled:bg-zinc-50 dark:hover:enabled:bg-zinc-800 flex justify-center items-center gap-2 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 text-black dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Updating...
                                </>
                            ) : (
                                'Save New Password'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
