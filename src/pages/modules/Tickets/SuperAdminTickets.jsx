import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Shield } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import StatusBadge from '../../../components/ui/StatusBadge';
import PageHeader from '../../../components/ui/PageHeader';

export default function SuperAdminTickets() {
    const [tickets, setTickets] = useState([]);
    const [expandedTicketId, setExpandedTicketId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const fetchTickets = async () => {
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select(`
                    *,
                    entreprises:entreprise_id (name)
                `)
                .order('created_at', { ascending: false });
            if (!error) setTickets(data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const unreadTicketsCount = tickets.filter(t => !t.is_read_by_super).length;

    const submitReply = async (ticketId, currentReply) => {
        if (!currentReply.trim()) return;
        setIsSubmittingReply(true);
        try {
            const { error } = await supabase
                .from('tickets')
                .update({
                    reply: currentReply,
                    replied_at: new Date().toISOString(),
                    status: 'answered',
                    is_read_by_super: true,
                    is_read_by_admin: false
                })
                .eq('id', ticketId);

            if (error) throw error;
            setReplyText('');
            setExpandedTicketId(null);
            fetchTickets();
        } catch (err) {
            console.error('[SuperAdminTickets] Error sending reply:', err);
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const toggleTicket = async (ticket) => {
        const isExpanded = expandedTicketId === ticket.id;

        if (isExpanded) {
            setExpandedTicketId(null);
            setReplyText('');
        } else {
            setExpandedTicketId(ticket.id);
            setReplyText('');
            if (!ticket.is_read_by_super) {
                try {
                    await supabase.from('tickets').update({ is_read_by_super: true }).eq('id', ticket.id);
                    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, is_read_by_super: true } : t));
                } catch (err) { console.error('Failed to mark read', err); }
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <PageHeader
                title="Global Support Inbox"
                description="Manage and respond to support tickets from company administrators."
                icon={MessageSquare}
                iconColor="from-brand-500 to-brand-600"
            />

            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border-secondary flex items-center gap-3 bg-surface-secondary/50">
                    <MessageSquare size={20} className="text-brand-500" />
                    <h2 className="text-base font-bold text-text-primary uppercase tracking-tight">Support Tickets</h2>
                    {unreadTicketsCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                            {unreadTicketsCount} New
                        </span>
                    )}
                </div>

                {tickets.length > 0 ? (
                    <div className="divide-y divide-border-secondary">
                        {tickets.map(ticket => (
                            <div key={ticket.id} className="flex flex-col">
                                <div
                                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-surface-secondary/50 ${!ticket.is_read_by_super ? 'bg-surface-secondary/80' : ''}`}
                                    onClick={() => toggleTicket(ticket)}
                                >
                                    <div className="flex items-center gap-3">
                                        {!ticket.is_read_by_super && (
                                            <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                                        )}
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold text-text-primary ${!ticket.is_read_by_super ? 'text-brand-600 dark:text-brand-400' : ''}`}>
                                                    {ticket.subject}
                                                </span>
                                                <span className="text-[10px] font-medium text-text-secondary bg-surface-secondary px-2 py-0.5 rounded-md border border-border-secondary">
                                                    {ticket.entreprises?.name || 'Unknown Company'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-text-tertiary mt-0.5">
                                                {new Date(ticket.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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

                                {/* Expanded Content & Reply Form */}
                                {expandedTicketId === ticket.id && (
                                    <div className="p-4 bg-surface-secondary/30 ml-8 mr-4 mb-4 rounded-xl border border-border-secondary space-y-4 animate-fade-in">
                                        <div>
                                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Admin Message</p>
                                            <p className="text-sm text-text-primary whitespace-pre-wrap">{ticket.message}</p>
                                        </div>

                                        {ticket.reply ? (
                                            <div className="pt-3 border-t border-border-secondary">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Shield size={12} className="text-emerald-500" />
                                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                                        Your Reply
                                                    </p>
                                                    <span className="text-[10px] text-text-tertiary ml-auto">
                                                        {new Date(ticket.replied_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-text-secondary whitespace-pre-wrap">{ticket.reply}</p>
                                            </div>
                                        ) : (
                                            <div className="pt-3 border-t border-border-secondary">
                                                <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2">Write a Reply</label>
                                                <div className="flex flex-col gap-3">
                                                    <textarea
                                                        rows={3}
                                                        className="w-full bg-surface-primary border border-border-secondary rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-500 transition-colors resize-y"
                                                        placeholder="Type your response to the admin..."
                                                        value={replyText}
                                                        onChange={e => setReplyText(e.target.value)}
                                                    />
                                                    <div className="flex justify-end">
                                                        <button
                                                            disabled={isSubmittingReply || !replyText.trim()}
                                                            onClick={(e) => { e.stopPropagation(); submitReply(ticket.id, replyText); }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                                                        >
                                                            {isSubmittingReply ? 'Sending...' : <><Send size={14} /> Send Reply</>}
                                                        </button>
                                                    </div>
                                                </div>
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
                        <p className="text-sm font-medium text-text-secondary">No support tickets</p>
                        <p className="text-xs text-text-tertiary mt-1">When admins submit tickets, they will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
