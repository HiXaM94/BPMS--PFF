import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Plus, X, Send, Shield } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import StatusBadge from '../../../components/ui/StatusBadge';
import PageHeader from '../../../components/ui/PageHeader';

export default function AdminTickets() {
    const { profile } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });
    const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
    const [expandedTicketId, setExpandedTicketId] = useState(null);

    const fetchTickets = useCallback(async () => {
        if (!profile?.id || !profile?.entreprise_id) return;
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('entreprise_id', profile.entreprise_id)
                .eq('created_by', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (err) {
            console.error('[AdminTickets] Error fetching tickets:', err);
        }
    }, [profile]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const submitTicket = async (e) => {
        e.preventDefault();
        if (!ticketForm.subject.trim() || !ticketForm.message.trim() || !profile?.entreprise_id) return;

        setIsSubmittingTicket(true);
        try {
            const { error } = await supabase.from('tickets').insert([{
                entreprise_id: profile.entreprise_id,
                created_by: profile.id,
                subject: ticketForm.subject,
                message: ticketForm.message
            }]);

            if (error) throw error;
            setTicketForm({ subject: '', message: '' });
            setShowTicketForm(false);
            fetchTickets();
        } catch (err) {
            console.error('[AdminTickets] Error submitting ticket:', err);
        } finally {
            setIsSubmittingTicket(false);
        }
    };

    const markTicketAsRead = async (ticketId, isReadByAdmin) => {
        setExpandedTicketId(prev => prev === ticketId ? null : ticketId);
        if (isReadByAdmin) return;

        try {
            const { error } = await supabase
                .from('tickets')
                .update({ is_read_by_admin: true })
                .eq('id', ticketId);

            if (error) throw error;
            setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, is_read_by_admin: true } : t));
        } catch (err) {
            console.error('[AdminTickets] Error marking ticket as read:', err);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <PageHeader
                title="Support Tickets"
                description="Contact platform support and track your active inquiries."
                icon={MessageSquare}
                iconColor="from-brand-500 to-brand-600"
            />

            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-surface-secondary/50">
                    <div className="flex items-center gap-3">
                        <MessageSquare size={20} className="text-brand-500" />
                        <h2 className="text-base font-bold text-text-primary tracking-tight">Your Tickets</h2>
                    </div>
                    <button
                        onClick={() => setShowTicketForm(!showTicketForm)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${showTicketForm ? 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary' : 'bg-brand-500 text-white hover:bg-brand-600'}`}
                    >
                        {showTicketForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Ticket</>}
                    </button>
                </div>

                {showTicketForm && (
                    <div className="p-5 border-b border-border-secondary bg-surface-secondary/30">
                        <form onSubmit={submitTicket} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-surface-primary border border-border-secondary rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-500 transition-colors"
                                    placeholder="Brief description of your issue"
                                    value={ticketForm.subject}
                                    onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Message</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full bg-surface-primary border border-border-secondary rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-500 transition-colors resize-y"
                                    placeholder="Provide more details here..."
                                    value={ticketForm.message}
                                    onChange={e => setTicketForm({ ...ticketForm, message: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmittingTicket}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                                >
                                    {isSubmittingTicket ? 'Sending...' : <><Send size={16} /> Send Ticket</>}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {tickets.length > 0 ? (
                    <div className="divide-y divide-border-secondary">
                        {tickets.map(ticket => (
                            <div key={ticket.id} className="flex flex-col">
                                <div
                                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-surface-secondary/50 ${!ticket.is_read_by_admin && ticket.status === 'answered' ? 'bg-surface-secondary/80' : ''}`}
                                    onClick={() => markTicketAsRead(ticket.id, ticket.is_read_by_admin)}
                                >
                                    <div className="flex items-center gap-3">
                                        {!ticket.is_read_by_admin && ticket.status === 'answered' && (
                                            <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                                        )}
                                        <div className="flex flex-col gap-0.5">
                                            <span className={`text-sm font-bold text-text-primary ${!ticket.is_read_by_admin && ticket.status === 'answered' ? 'text-brand-600 dark:text-brand-400' : ''}`}>
                                                {ticket.subject}
                                            </span>
                                            <span className="text-xs text-text-tertiary">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <StatusBadge
                                        variant={ticket.status === 'answered' ? 'success' : ticket.status === 'closed' ? 'neutral' : 'warning'}
                                        size="sm"
                                    >
                                        {ticket.status}
                                    </StatusBadge>
                                </div>

                                {/* Expanded Content */}
                                {expandedTicketId === ticket.id && (
                                    <div className="p-4 bg-surface-secondary/30 ml-8 mr-4 mb-4 rounded-xl border border-border-secondary space-y-4 animate-fade-in">
                                        <div>
                                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Your Message</p>
                                            <p className="text-sm text-text-secondary whitespace-pre-wrap">{ticket.message}</p>
                                        </div>
                                        {ticket.reply && (
                                            <div className="pt-3 border-t border-border-secondary">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Shield size={12} className="text-emerald-500" />
                                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                                        Super Admin Reply
                                                    </p>
                                                    <span className="text-[10px] text-text-tertiary ml-auto">
                                                        {new Date(ticket.replied_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-text-primary whitespace-pre-wrap">{ticket.reply}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center flex flex-col items-center justify-center">
                        <MessageSquare size={32} className="text-text-tertiary/50 mb-3" />
                        <p className="text-sm font-medium text-text-secondary">No support tickets yet</p>
                        <p className="text-xs text-text-tertiary mt-1">If you need help, feel free to open a ticket.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
