import React, { useState } from 'react';
import { 
  X, 
  Workflow, 
  Clock, 
  Send, 
  Lock, 
  MessageSquare, 
  User, 
  Tag, 
  Laptop, 
  CheckCircle, 
  RefreshCw, 
  BookOpen, 
  AlertTriangle,
  ChevronDown,
  Layers
} from 'lucide-react';
import { Agent, Priority, Runbook, Ticket, TicketCategory, TicketStatus } from '../types';
import { formatRelativeTime, formatTimeRemaining, getPriorityMeta, getStatusMeta } from '../utils/formatters';

interface TicketDetailModalProps {
  ticket: Ticket;
  agents: Agent[];
  runbooks: Runbook[];
  onClose: () => void;
  onUpdateTicket: (updatedTicket: Ticket) => void;
  onRerouteSingleTicket: (ticketId: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  agents,
  runbooks,
  onClose,
  onUpdateTicket,
  onRerouteSingleTicket,
}) => {
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [selectedRunbookId, setSelectedRunbookId] = useState('');
  const [showRunbookDropdown, setShowRunbookDropdown] = useState(false);

  const priorityMeta = getPriorityMeta(ticket.priority);
  const statusMeta = getStatusMeta(ticket.status);
  const slaStatus = formatTimeRemaining(ticket.sla.resolutionDeadline);

  // Handle send message
  const handleSendMessage = (newStatus?: TicketStatus) => {
    if (!replyText.trim()) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: isInternalNote ? 'Internal Staff' : (ticket.assignedTo?.name || 'Support Specialist'),
      senderRole: isInternalNote ? ('agent' as const) : ('agent' as const),
      isInternalNote,
      content: replyText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated: Ticket = {
      ...ticket,
      status: newStatus || ticket.status,
      updatedAt: new Date().toISOString(),
      messages: [...ticket.messages, newMessage],
    };

    onUpdateTicket(updated);
    setReplyText('');
  };

  // Insert Runbook / SOP
  const handleInsertRunbook = (rb: Runbook) => {
    setReplyText((prev) => (prev ? `${prev}\n\n${rb.cannedReply}` : rb.cannedReply));
    setShowRunbookDropdown(false);
  };

  // Property update handlers
  const handleStatusChange = (newStatus: TicketStatus) => {
    const updated: Ticket = {
      ...ticket,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    onUpdateTicket(updated);
  };

  const handlePriorityChange = (newPriority: Priority) => {
    const updated: Ticket = {
      ...ticket,
      priority: newPriority,
      updatedAt: new Date().toISOString(),
    };
    onUpdateTicket(updated);
  };

  const handleAssigneeChange = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId) || null;
    const updated: Ticket = {
      ...ticket,
      assignedTo: agent,
      status: ticket.status === 'new' ? 'assigned' : ticket.status,
      updatedAt: new Date().toISOString(),
    };
    onUpdateTicket(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-5xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold text-indigo-400">
              {ticket.id}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono ${priorityMeta.badgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${priorityMeta.dotClass}`} />
              {ticket.priority}
            </span>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusMeta.classNames}`}>
              {statusMeta.label}
            </span>
            <span className="hidden sm:inline-block text-xs text-slate-400 font-medium">
              {ticket.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRerouteSingleTicket(ticket.id)}
              title="Re-run Automated Routing Engine"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Re-run Auto-Router</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Split: 2 Columns */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Left Column (7 cols): Main Thread & Reply */}
          <div className="lg:col-span-7 p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Title & Requester Metadata Header */}
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white leading-snug">
                  {ticket.title}
                </h2>

                {/* Zero-Pill Unboxed Text Metadata */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="font-medium text-slate-200">{ticket.requester.name}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span>{ticket.requester.email}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span>{ticket.requester.department}</span>
                  {ticket.requester.location && (
                    <>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span>{ticket.requester.location}</span>
                    </>
                  )}
                  {ticket.assetTag && (
                    <>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="font-mono text-indigo-300">{ticket.assetTag}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Initial Incident Description */}
              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-4 text-xs text-slate-300 leading-relaxed space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  Initial Intake Description
                </div>
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {/* Activity / Conversation Thread */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>Activity & Conversation History</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {ticket.messages.length} event{ticket.messages.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3">
                  {ticket.messages.map((msg) => {
                    if (msg.senderRole === 'system') {
                      return (
                        <div
                          key={msg.id}
                          className="rounded-lg bg-indigo-950/30 border border-indigo-800/40 p-3 text-xs text-indigo-200 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px] text-indigo-400">
                            <span className="font-semibold flex items-center gap-1.5">
                              <Workflow className="h-3.5 w-3.5" /> {msg.sender}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {formatRelativeTime(msg.timestamp)}
                            </span>
                          </div>
                          <p>{msg.content}</p>
                        </div>
                      );
                    }

                    if (msg.isInternalNote) {
                      return (
                        <div
                          key={msg.id}
                          className="rounded-lg bg-amber-950/20 border border-amber-800/40 p-3 text-xs text-amber-200 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px] text-amber-400">
                            <span className="font-semibold flex items-center gap-1.5">
                              <Lock className="h-3.5 w-3.5" /> Internal Private Note ({msg.sender})
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {formatRelativeTime(msg.timestamp)}
                            </span>
                          </div>
                          <p className="text-amber-100/90 whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`rounded-lg p-3 text-xs space-y-1 border ${
                          msg.senderRole === 'agent'
                            ? 'bg-slate-800/60 border-slate-700/70 text-slate-200'
                            : 'bg-slate-950/80 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-white">
                            {msg.sender} {msg.senderRole === 'agent' ? '(IT Support)' : '(Requester)'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {formatRelativeTime(msg.timestamp)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Response Composer */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(false)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      !isInternalNote
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Public Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(true)}
                    className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      isInternalNote
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/60 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Lock className="h-3 w-3" />
                    <span>Internal Note</span>
                  </button>
                </div>

                {/* SOP Insert Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowRunbookDropdown(!showRunbookDropdown)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Insert IT Runbook / SOP</span>
                    <ChevronDown className="h-3 w-3 ml-0.5" />
                  </button>

                  {showRunbookDropdown && (
                    <div className="absolute right-0 bottom-full mb-1 w-72 rounded-lg bg-slate-900 border border-slate-700 shadow-xl z-30 py-1">
                      <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        Canned SOP Responses
                      </div>
                      {runbooks.map((rb) => (
                        <button
                          key={rb.id}
                          type="button"
                          onClick={() => handleInsertRunbook(rb)}
                          className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 transition-colors flex flex-col gap-0.5"
                        >
                          <span className="font-semibold text-indigo-300">{rb.title}</span>
                          <span className="text-[10px] text-slate-400 line-clamp-1">{rb.summary}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <textarea
                rows={3}
                placeholder={
                  isInternalNote
                    ? 'Write private note visible only to IT support engineers...'
                    : 'Compose reply to requester...'
                }
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className={`w-full rounded-lg p-3 text-xs text-white focus:outline-none transition-colors ${
                  isInternalNote
                    ? 'bg-amber-950/20 border border-amber-800/60 focus:border-amber-600 placeholder-amber-500/50'
                    : 'bg-slate-950 border border-slate-800 focus:border-indigo-500 placeholder-slate-500'
                }`}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  Ctrl+Enter to dispatch reply
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendMessage('in_progress')}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  >
                    Reply & In Progress
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage('resolved')}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  >
                    Reply & Resolve
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (5 cols): Inspector & Automated Routing Audit */}
          <div className="lg:col-span-5 p-6 space-y-6 bg-slate-950/40">
            
            {/* Automated Routing Audit Chain */}
            <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Workflow className="h-4 w-4" /> Automated Routing Audit
                </span>
                <span className="font-mono text-emerald-400 text-xs tabular-nums">
                  {ticket.routingAudit?.executionMs || 48}ms dispatch
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-indigo-900/40">
                  <span className="text-slate-400">Triggered Rule:</span>
                  <span className="font-semibold text-white font-mono text-right truncate max-w-[170px]">
                    {ticket.routingAudit?.ruleName || 'Standard Routing'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-indigo-900/40">
                  <span className="text-slate-400">Strategy:</span>
                  <span className="font-mono text-indigo-300 uppercase text-[10px]">
                    {ticket.routingAudit?.routingStrategy.replace('_', ' ') || 'Workload-Balanced'}
                  </span>
                </div>

                <div className="py-1 border-b border-indigo-900/40 space-y-1">
                  <span className="text-slate-400 block">Matched Conditions:</span>
                  <div className="flex flex-wrap gap-1">
                    {ticket.routingAudit?.matchedConditions.map((cond, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-900 text-indigo-200 text-[10px] border border-indigo-900/50">
                        {cond}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {ticket.routingAudit?.timestamp.slice(11, 19)} UTC
                  </span>
                </div>
              </div>
            </div>

            {/* SLA Tracker */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-400" /> SLA Target Countdown
                </span>
                <span className={`font-mono text-xs font-bold tabular-nums ${slaStatus.isBreached ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {slaStatus.text}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>First Response Target:</span>
                  <span className="font-mono text-slate-200 tabular-nums">
                    {ticket.sla.responseTimeHours * 60} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Resolution Target:</span>
                  <span className="font-mono text-slate-200 tabular-nums">
                    {ticket.sla.resolutionTimeHours} hours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Deadline:</span>
                  <span className="font-mono text-slate-300 text-[11px]">
                    {new Date(ticket.sla.resolutionDeadline).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Properties Inspector & Controls */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Ticket Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="new">New</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending_user">Pending User Action</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Priority Tier</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="P1">P1 · Critical Outage (15m SLA)</option>
                  <option value="P2">P2 · High Impact (1h SLA)</option>
                  <option value="P3">P3 · Normal Service (4h SLA)</option>
                  <option value="P4">P4 · Low / Inquiry (12h SLA)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Assigned Support Specialist</label>
                <select
                  value={ticket.assignedTo?.id || ''}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {a.tier} ({a.activeTicketCount}/{a.maxCapacity} load)
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-medium">Applied Tags</label>
                <div className="flex flex-wrap gap-1">
                  {ticket.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono text-[10px] border border-slate-700/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
