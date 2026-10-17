import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  CheckSquare, 
  Square, 
  Sparkles, 
  UserCheck, 
  AlertCircle,
  ExternalLink,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { Agent, Priority, Ticket, TicketCategory, TicketStatus } from '../types';
import { formatRelativeTime, formatTimeRemaining, getPriorityMeta, getStatusMeta } from '../utils/formatters';

interface TicketsQueueViewProps {
  tickets: Ticket[];
  agents: Agent[];
  onSelectTicket: (ticket: Ticket) => void;
  onBulkUpdateStatus: (ticketIds: string[], newStatus: TicketStatus) => void;
  onBulkReroute: (ticketIds: string[]) => void;
  onBulkAssign: (ticketIds: string[], agentId: string) => void;
  selectedCategoryFilter?: TicketCategory | null;
  onClearCategoryFilter?: () => void;
  currentUserAgentId?: string;
}

export const TicketsQueueView: React.FC<TicketsQueueViewProps> = ({
  tickets,
  agents,
  onSelectTicket,
  onBulkUpdateStatus,
  onBulkReroute,
  onBulkAssign,
  selectedCategoryFilter,
  onClearCategoryFilter,
  currentUserAgentId = 'agent-alex',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'unassigned' | 'critical' | 'sla_risk' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(selectedCategoryFilter || 'all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [bulkAssignDropdownOpen, setBulkAssignDropdownOpen] = useState(false);

  // Sync prop changes if selectedCategoryFilter passed from dashboard
  React.useEffect(() => {
    if (selectedCategoryFilter) {
      setCategoryFilter(selectedCategoryFilter);
    }
  }, [selectedCategoryFilter]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Tab filter
      if (activeTab === 'my' && ticket.assignedTo?.id !== currentUserAgentId) return false;
      if (activeTab === 'unassigned' && ticket.assignedTo !== null) return false;
      if (activeTab === 'critical' && ticket.priority !== 'P1' && ticket.priority !== 'P2') return false;
      if (activeTab === 'sla_risk') {
        const remaining = new Date(ticket.sla.resolutionDeadline).getTime() - Date.now();
        if (remaining > 2 * 3600 * 1000 || ticket.status === 'resolved' || ticket.status === 'closed') {
          return false;
        }
      }
      if (activeTab === 'resolved' && ticket.status !== 'resolved' && ticket.status !== 'closed') return false;
      if (activeTab === 'all' && (ticket.status === 'resolved' || ticket.status === 'closed') && statusFilter === 'all') {
        // still show in all unless specifically filtered
      }

      // Category filter
      if (categoryFilter !== 'all' && ticket.category !== categoryFilter) return false;

      // Priority filter
      if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ticket.title.toLowerCase().includes(q);
        const matchDesc = ticket.description.toLowerCase().includes(q);
        const matchId = ticket.id.toLowerCase().includes(q);
        const matchReq = ticket.requester.name.toLowerCase().includes(q);
        const matchDept = ticket.requester.department.toLowerCase().includes(q);
        const matchAsset = ticket.assetTag?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchId && !matchReq && !matchDept && !matchAsset) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, activeTab, categoryFilter, priorityFilter, statusFilter, searchQuery, currentUserAgentId]);

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedTicketIds.length === filteredTickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(filteredTickets.map((t) => t.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedTicketIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Requester', 'Department', 'Assigned Specialist', 'SLA Deadline', 'Rule Applied'];
    const rows = filteredTickets.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      t.priority,
      t.status,
      `"${t.requester.name}"`,
      `"${t.requester.department}"`,
      `"${t.assignedTo?.name || 'Unassigned'}"`,
      t.sla.resolutionDeadline,
      `"${t.routingAudit?.ruleName || 'None'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `opsdesk_tickets_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      
      {/* Top Filter Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-900/60 rounded-lg border border-slate-800/80">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Incidents ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'my'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Assigned ({tickets.filter((t) => t.assignedTo?.id === currentUserAgentId).length})
          </button>
          <button
            onClick={() => setActiveTab('unassigned')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'unassigned'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unassigned ({tickets.filter((t) => !t.assignedTo).length})
          </button>
          <button
            onClick={() => setActiveTab('critical')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'critical'
                ? 'bg-slate-800 text-rose-300 shadow-sm'
                : 'text-rose-400/80 hover:text-rose-300'
            }`}
          >
            P1/P2 Criticals ({tickets.filter((t) => t.priority === 'P1' || t.priority === 'P2').length})
          </button>
          <button
            onClick={() => setActiveTab('sla_risk')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'sla_risk'
                ? 'bg-slate-800 text-amber-300 shadow-sm'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            SLA Risk
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'resolved'
                ? 'bg-slate-800 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Resolved ({tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length})
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search and Secondary Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by title, ID, requester, asset tag, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-900/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="Network & VPN">Network & VPN</option>
            <option value="Access & Identity">Access & Identity</option>
            <option value="Hardware & Workstation">Hardware & Workstation</option>
            <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
            <option value="Software & SaaS">Software & SaaS</option>
            <option value="Security & Compliance">Security & Compliance</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="P1">P1 · Critical</option>
            <option value="P2">P2 · High</option>
            <option value="P3">P3 · Normal</option>
            <option value="P4">P4 · Low</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_user">Pending User</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {(categoryFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setCategoryFilter('all');
                setPriorityFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
                if (onClearCategoryFilter) onClearCategoryFilter();
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 px-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar (when rows selected) */}
      {selectedTicketIds.length > 0 && (
        <div className="rounded-lg bg-indigo-950/80 border border-indigo-700/60 p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white font-mono tabular-nums">
              {selectedTicketIds.length}
            </span>
            <span>ticket{selectedTicketIds.length > 1 ? 's' : ''} selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onBulkReroute(selectedTicketIds);
                setSelectedTicketIds([]);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Re-run Auto-Router</span>
            </button>

            <button
              onClick={() => {
                onBulkUpdateStatus(selectedTicketIds, 'resolved');
                setSelectedTicketIds([]);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
            >
              <span>Mark Resolved</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setBulkAssignDropdownOpen(!bulkAssignDropdownOpen)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Assign To Specialist</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </button>

              {bulkAssignDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded-lg bg-slate-900 border border-slate-700 shadow-xl z-20 py-1">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        onBulkAssign(selectedTicketIds, agent.id);
                        setBulkAssignDropdownOpen(false);
                        setSelectedTicketIds([]);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span>{agent.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {agent.activeTicketCount}/{agent.maxCapacity}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTicketIds([])}
              className="px-2 py-1 text-slate-400 hover:text-white"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* High-Density Data Grid / Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-medium select-none">
                <th className="py-3 px-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-200">
                    {selectedTicketIds.length > 0 && selectedTicketIds.length === filteredTickets.length ? (
                      <CheckSquare className="h-4 w-4 text-indigo-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 w-24">Ticket ID</th>
                <th className="py-3 px-3 min-w-[280px]">Subject & Requester</th>
                <th className="py-3 px-3 w-36">Category</th>
                <th className="py-3 px-3 w-28">Priority</th>
                <th className="py-3 px-3 w-28">Status</th>
                <th className="py-3 px-3 w-40">Assigned Specialist</th>
                <th className="py-3 px-3 w-32">SLA Countdown</th>
                <th className="py-3 px-3 w-36">Routing Rule</th>
                <th className="py-3 px-3 w-16 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-6 w-6 text-slate-600" />
                      <span className="text-sm font-medium text-slate-400">No tickets match the selected filters</span>
                      <span className="text-xs text-slate-500">Try adjusting your search terms or filter criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const isSelected = selectedTicketIds.includes(ticket.id);
                  const priorityMeta = getPriorityMeta(ticket.priority);
                  const statusMeta = getStatusMeta(ticket.status);
                  const slaCountdown = formatTimeRemaining(ticket.sla.resolutionDeadline);

                  return (
                    <tr
                      key={ticket.id}
                      className={`hover:bg-slate-800/40 transition-colors group ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(ticket.id)}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-indigo-400" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-600 group-hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* ID */}
                      <td className="py-3 px-3 font-mono font-bold text-indigo-400">
                        <button
                          onClick={() => onSelectTicket(ticket)}
                          className="hover:underline hover:text-indigo-300"
                        >
                          {ticket.id}
                        </button>
                      </td>

                      {/* Subject & Unboxed Metadata */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <button
                            onClick={() => onSelectTicket(ticket)}
                            className="text-left font-medium text-slate-200 hover:text-white line-clamp-1 group-hover:text-indigo-200 transition-colors"
                          >
                            {ticket.title}
                          </button>
                          
                          {/* Zero-Pill Unboxed Text Metadata */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span>{ticket.requester.name}</span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span>{ticket.requester.department}</span>
                            {ticket.assetTag && (
                              <>
                                <span aria-hidden="true" className="text-slate-600">·</span>
                                <span className="font-mono text-slate-400">{ticket.assetTag}</span>
                              </>
                            )}
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="font-mono text-[10px] text-slate-500">{formatRelativeTime(ticket.createdAt)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-300 font-medium whitespace-nowrap">
                        {ticket.category}
                      </td>

                      {/* Priority (clean badge) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono ${priorityMeta.badgeClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${priorityMeta.dotClass}`} />
                          {ticket.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${statusMeta.classNames}`}>
                          {statusMeta.label}
                        </span>
                      </td>

                      {/* Assigned Specialist */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {ticket.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={ticket.assignedTo.avatarUrl}
                              alt={ticket.assignedTo.name}
                              referrerPolicy="no-referrer"
                              className="h-6 w-6 rounded-full object-cover ring-1 ring-slate-700"
                            />
                            <div className="truncate max-w-[110px]">
                              <div className="font-medium text-slate-200 truncate">
                                {ticket.assignedTo.name}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {ticket.assignedTo.tier}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-400/90 font-mono text-[11px]">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* SLA Countdown Timer */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                        {ticket.status === 'resolved' || ticket.status === 'closed' ? (
                          <span className="text-emerald-400">Met SLA</span>
                        ) : (
                          <span
                            className={`tabular-nums font-semibold ${
                              slaCountdown.isBreached
                                ? 'text-rose-400'
                                : slaCountdown.isUrgent
                                ? 'text-amber-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {slaCountdown.text}
                          </span>
                        )}
                      </td>

                      {/* Routing Rule applied */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-block truncate max-w-[130px] text-[11px] text-indigo-300/90 font-mono" title={ticket.routingAudit?.ruleName}>
                          {ticket.routingAudit?.ruleName || 'Auto-Routed'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onSelectTicket(ticket)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Open Ticket"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400 bg-slate-950/40">
          <div>
            Showing <span className="font-mono tabular-nums text-slate-200 font-semibold">{filteredTickets.length}</span> of{' '}
            <span className="font-mono tabular-nums text-slate-200">{tickets.length}</span> total tickets
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-500">Live sync active</span>
          </div>
        </div>
      </div>

    </div>
  );
};
