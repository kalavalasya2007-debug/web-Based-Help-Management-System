import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Zap, 
  Workflow, 
  ChevronRight, 
  ArrowUpRight,
  TrendingDown,
  Layers,
  ShieldCheck,
  Server
} from 'lucide-react';
import { Agent, Ticket, TicketCategory } from '../types';
import { formatTimeRemaining, getPriorityMeta } from '../utils/formatters';

interface DashboardViewProps {
  tickets: Ticket[];
  agents: Agent[];
  onSelectTicket: (ticket: Ticket) => void;
  onFilterCategory: (category: TicketCategory) => void;
  onNavigateToRouting: () => void;
  onNavigateToTickets: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tickets,
  agents,
  onSelectTicket,
  onFilterCategory,
  onNavigateToRouting,
  onNavigateToTickets,
}) => {
  // Compute real-time analytics
  const openTickets = tickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed');
  const p1Count = openTickets.filter((t) => t.priority === 'P1').length;
  const p2Count = openTickets.filter((t) => t.priority === 'P2').length;
  const unassignedCount = openTickets.filter((t) => !t.assignedTo).length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

  // SLA risk: tickets with deadline in next 2 hours or breached
  const slaRiskTickets = openTickets.filter((t) => {
    const remaining = new Date(t.sla.resolutionDeadline).getTime() - Date.now();
    return remaining < 2 * 3600 * 1000;
  });

  // Category counts
  const categoryCounts: Record<TicketCategory, number> = {
    'Network & VPN': 0,
    'Access & Identity': 0,
    'Hardware & Workstation': 0,
    'Cloud & Infrastructure': 0,
    'Software & SaaS': 0,
    'Security & Compliance': 0,
  };
  tickets.forEach((t) => {
    if (categoryCounts[t.category] !== undefined) {
      categoryCounts[t.category]++;
    }
  });

  const totalTickets = tickets.length || 1;
  const autoRoutedCount = tickets.filter((t) => t.routingAudit && t.routingAudit.ruleId !== 'default-fallback').length;
  const autoRoutingRate = Math.round((autoRoutedCount / totalTickets) * 100);

  // Average routing execution time
  const totalMs = tickets.reduce((acc, t) => acc + (t.routingAudit?.executionMs || 50), 0);
  const avgExecutionMs = Math.round(totalMs / totalTickets);

  return (
    <div className="space-y-6">
      
      {/* SLA Risk Alert Strip (if any tickets at risk) */}
      {slaRiskTickets.length > 0 && (
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-900/40 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-rose-200">
                  {slaRiskTickets.length} Incident{slaRiskTickets.length > 1 ? 's' : ''} Approaching SLA Resolution Deadline
                </div>
                <div className="text-xs text-rose-300/80 mt-0.5">
                  Critical path items require immediate supervisor attention or re-routing.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {slaRiskTickets.slice(0, 3).map((ticket) => {
                const slaStatus = formatTimeRemaining(ticket.sla.resolutionDeadline);
                return (
                  <button
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-mono rounded bg-rose-950/60 hover:bg-rose-900/70 border border-rose-800/60 text-rose-200 transition-colors"
                  >
                    <span className="font-bold">{ticket.id}</span>
                    <span className="text-rose-300">·</span>
                    <span className="tabular-nums font-semibold">{slaStatus.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* KPI Overview Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Open Incidents */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Open Queue</span>
            <span className="text-rose-400 font-mono font-medium">
              {p1Count > 0 ? `${p1Count} P1 Critical` : '0 P1 Outages'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono tabular-nums">
              {openTickets.length}
            </span>
            <span className="text-xs text-slate-400">tickets pending</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>{p2Count} High (P2) · {unassignedCount} Unassigned</span>
            <button 
              onClick={onNavigateToTickets} 
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
            >
              Queue <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Metric 2: SLA Compliance Rate */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>SLA Compliance Rate</span>
            <span className="text-emerald-400 flex items-center gap-1 font-mono text-xs">
              <ShieldCheck className="h-3.5 w-3.5" /> Target &ge;95%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-emerald-400 font-mono tabular-nums">
              96.8%
            </span>
            <span className="text-xs text-slate-400">on-time resolutions</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>0 Breaches past 24 hrs</span>
            <span className="text-emerald-400/90 font-mono">+1.2% this week</span>
          </div>
        </div>

        {/* Metric 3: Automated Routing Dispatch Rate */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Automated Routing Efficiency</span>
            <span className="text-indigo-400 flex items-center gap-1 font-mono text-xs">
              <Workflow className="h-3.5 w-3.5" /> 6 Active Rules
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-indigo-300 font-mono tabular-nums">
              {autoRoutingRate}%
            </span>
            <span className="text-xs text-slate-400">auto-dispatched</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>Avg dispatch: <span className="font-mono tabular-nums text-slate-200">{avgExecutionMs}ms</span></span>
            <button 
              onClick={onNavigateToRouting}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
            >
              Rules <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Metric 4: First Response & Resolution Velocity */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg First Response Time</span>
            <span className="text-emerald-400 flex items-center gap-1 font-mono text-xs">
              <TrendingDown className="h-3.5 w-3.5" /> -4.2m
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono tabular-nums">
              13.8<span className="text-lg font-normal text-slate-400">m</span>
            </span>
            <span className="text-xs text-slate-400">vs 30m SLA</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span>{resolvedCount} resolved today</span>
            <span className="text-slate-400 font-mono">98.2% CSAT</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Category Analytics & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 spans): Category Breakdown & Volume */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Incident Distribution by Category</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time ticket volume classified across IT infrastructure domains</p>
            </div>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              Total {tickets.length} Incidents
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {(Object.entries(categoryCounts) as [TicketCategory, number][]).map(([cat, count]) => {
              const percentage = Math.round((count / totalTickets) * 100);
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => onFilterCategory(cat)}
                      className="font-medium text-slate-300 hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
                    >
                      <span>{cat}</span>
                      <ArrowUpRight className="h-3 w-3 text-slate-500" />
                    </button>
                    <div className="flex items-center gap-2 text-slate-400 font-mono">
                      <span className="text-slate-200 font-semibold tabular-nums">{count}</span>
                      <span className="text-slate-600">|</span>
                      <span className="tabular-nums">{percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat === 'Network & VPN'
                          ? 'bg-sky-500'
                          : cat === 'Access & Identity'
                          ? 'bg-indigo-500'
                          : cat === 'Hardware & Workstation'
                          ? 'bg-amber-500'
                          : cat === 'Security & Compliance'
                          ? 'bg-rose-500'
                          : cat === 'Cloud & Infrastructure'
                          ? 'bg-purple-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Routing Summary Note */}
          <div className="mt-4 rounded-lg bg-slate-950/60 border border-slate-800/80 p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Zap className="h-4 w-4 text-indigo-400 shrink-0" />
              <span>
                Automated Routing Engine matches category keywords and routes directly to certified engineers in <span className="font-mono text-indigo-300">~60ms</span>.
              </span>
            </div>
            <button
              onClick={onNavigateToRouting}
              className="text-indigo-400 hover:text-indigo-300 font-medium whitespace-nowrap ml-3"
            >
              Inspect Rules &rarr;
            </button>
          </div>
        </div>

        {/* Right Column (1 span): Priority Severity & SLA Target Standards */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">Priority & SLA Matrix</h2>
            <p className="text-xs text-slate-400 mt-0.5">Contractual response & resolution boundaries</p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-400 font-mono">P1 · Critical Outage</span>
                <span className="text-xs font-mono text-rose-300/90 font-bold tabular-nums">15m / 2h SLA</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Company-wide blocker, security breach, or cluster failure. Direct pager dispatch.</p>
            </div>

            <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400 font-mono">P2 · High Impact</span>
                <span className="text-xs font-mono text-amber-300/90 font-bold tabular-nums">1h / 8h SLA</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Impaired workflow with no workaround, VIP executive issues, or regional VPN drop.</p>
            </div>

            <div className="rounded-lg border border-sky-900/40 bg-sky-950/20 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-400 font-mono">P3 · Normal Service</span>
                <span className="text-xs font-mono text-sky-300/90 font-bold tabular-nums">4h / 24h SLA</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Standard hardware or software configuration, peripheral repair, license requests.</p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 font-mono">P4 · Low / Inquiries</span>
                <span className="text-xs font-mono text-slate-400 font-bold tabular-nums">12h / 48h SLA</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">General IT advisory, scheduled software upgrades, future asset inquiries.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Support Team Workload & Live Auto-Routing Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Support Agent Capacity (2 spans) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Support Specialist Active Workload</h2>
              <p className="text-xs text-slate-400 mt-0.5">Live ticket capacity balancing for automated routing algorithms</p>
            </div>
            <span className="text-xs text-slate-400">
              {agents.filter((a) => a.status === 'available').length} of {agents.length} On Duty
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {agents.map((agent) => {
              const loadPercent = Math.round((agent.activeTicketCount / agent.maxCapacity) * 100);
              const isHigh = loadPercent >= 75;

              return (
                <div
                  key={agent.id}
                  className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-3.5 space-y-2.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={agent.avatarUrl}
                        alt={agent.name}
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {agent.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {agent.role}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                        agent.status === 'available'
                          ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50'
                          : agent.status === 'busy'
                          ? 'text-amber-400 bg-amber-950/40 border-amber-800/50'
                          : 'text-slate-400 bg-slate-900 border-slate-700'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Queue load</span>
                      <span className="font-mono tabular-nums text-slate-300">
                        {agent.activeTicketCount}/{agent.maxCapacity} ({loadPercent}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isHigh ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(loadPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap items-center gap-1 pt-1 text-[10px] text-slate-400">
                    {agent.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {skill}
                      </span>
                    ))}
                    {agent.skills.length > 3 && (
                      <span className="text-slate-500">+{agent.skills.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Auto-Routed Ingestion Log (1 span) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Recent Auto-Dispatches</h2>
              <p className="text-xs text-slate-400 mt-0.5">Automated rule decision audit trail</p>
            </div>
            <Zap className="h-4 w-4 text-indigo-400" />
          </div>

          <div className="space-y-3 pt-1">
            {tickets.slice(0, 5).map((ticket) => {
              const priorityMeta = getPriorityMeta(ticket.priority);
              return (
                <button
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className="w-full text-left rounded-lg border border-slate-800/80 bg-slate-950/40 p-3 hover:border-slate-700 hover:bg-slate-950/80 transition-colors space-y-1.5 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-indigo-400 group-hover:text-indigo-300">
                      {ticket.id}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                      {ticket.routingAudit?.executionMs || 42}ms
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium line-clamp-1">
                    {ticket.title}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span className="truncate max-w-[140px] text-slate-400">
                      Rule: {ticket.routingAudit?.ruleName || 'Default Router'}
                    </span>
                    <span className="text-slate-300 font-mono text-[10px]">
                      &rarr; {ticket.assignedTo?.name || 'Unassigned'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={onNavigateToRouting}
            className="w-full py-2 text-xs text-center text-indigo-400 hover:text-indigo-300 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors font-medium"
          >
            Open Routing Rule Simulator &rarr;
          </button>
        </div>

      </div>

    </div>
  );
};
