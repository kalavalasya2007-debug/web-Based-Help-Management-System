import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TicketsQueueView } from './components/TicketsQueueView';
import { RoutingEngineView } from './components/RoutingEngineView';
import { AgentsDirectoryView } from './components/AgentsDirectoryView';
import { RunbooksModal } from './components/RunbooksModal';
import { TicketDetailModal } from './components/TicketDetailModal';
import { CreateTicketModal } from './components/CreateTicketModal';
import { Agent, Priority, RoutingRule, Ticket, TicketCategory, TicketStatus } from './types';
import { INITIAL_AGENTS, INITIAL_RULES, INITIAL_RUNBOOKS, INITIAL_TICKETS } from './data/seedData';
import { evaluateTicketRouting } from './utils/routingEngine';
import { Zap, CheckCircle2, X } from 'lucide-react';

const STORAGE_KEYS = {
  TICKETS: 'opsdesk_tickets_v1',
  RULES: 'opsdesk_rules_v1',
  AGENTS: 'opsdesk_agents_v1',
};

export default function App() {
  // Persistence state
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
      return saved ? JSON.parse(saved) : INITIAL_TICKETS;
    } catch {
      return INITIAL_TICKETS;
    }
  });

  const [rules, setRules] = useState<RoutingRule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RULES);
      return saved ? JSON.parse(saved) : INITIAL_RULES;
    } catch {
      return INITIAL_RULES;
    }
  });

  const [agents, setAgents] = useState<Agent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AGENTS);
      return saved ? JSON.parse(saved) : INITIAL_AGENTS;
    } catch {
      return INITIAL_AGENTS;
    }
  });

  const [runbooks] = useState(INITIAL_RUNBOOKS);

  // Active view
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<TicketCategory | null>(null);

  // Modals
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Real-time incident notification toast
  const [toastNotification, setToastNotification] = useState<{
    id: string;
    ticketId: string;
    title: string;
    ruleName: string;
    agentName: string;
    executionMs: number;
  } | null>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(agents));
  }, [agents]);

  // Recalculate agent activeTicketCounts based on live tickets
  useEffect(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      if (t.assignedTo && t.status !== 'resolved' && t.status !== 'closed') {
        counts[t.assignedTo.id] = (counts[t.assignedTo.id] || 0) + 1;
      }
    });

    setAgents((prev) =>
      prev.map((agent) => ({
        ...agent,
        activeTicketCount: counts[agent.id] || 0,
      }))
    );
  }, [tickets]);

  // Clear toast after 6s
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Handlers
  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleUpdateTicket = (updatedTicket: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
    setSelectedTicket(updatedTicket);
  };

  const handleCreateTicket = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev]);

    // Update rule trigger count
    if (newTicket.routingAudit?.ruleId) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === newTicket.routingAudit.ruleId
            ? { ...r, triggerCount: r.triggerCount + 1, lastTriggeredAt: new Date().toISOString() }
            : r
        )
      );
    }

    setShowCreateModal(false);

    // Show toast
    setToastNotification({
      id: String(Date.now()),
      ticketId: newTicket.id,
      title: newTicket.title,
      ruleName: newTicket.routingAudit?.ruleName || 'Auto-Router',
      agentName: newTicket.assignedTo?.name || 'Unassigned',
      executionMs: newTicket.routingAudit?.executionMs || 45,
    });
  };

  // Re-run router on single ticket
  const handleRerouteSingleTicket = (ticketId: string) => {
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return;

    const evaluation = evaluateTicketRouting(
      {
        title: target.title,
        description: target.description,
        category: target.category,
        department: target.requester.department,
        priority: target.priority,
      },
      rules,
      agents
    );

    const updated: Ticket = {
      ...target,
      assignedTo: evaluation.assignedAgent,
      priority: evaluation.priority,
      sla: evaluation.sla,
      routingAudit: evaluation.audit,
      tags: Array.from(new Set([...target.tags, ...evaluation.tags])),
      updatedAt: new Date().toISOString(),
      messages: [
        ...target.messages,
        {
          id: `msg-${Date.now()}`,
          sender: 'Automated Routing Engine',
          senderRole: 'system',
          isInternalNote: true,
          content: `🔄 Ticket re-evaluated. Assigned to ${
            evaluation.assignedAgent?.name || 'Unassigned'
          } via rule "${evaluation.audit.ruleName}" in ${evaluation.audit.executionMs}ms.`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    handleUpdateTicket(updated);
  };

  // Bulk actions
  const handleBulkUpdateStatus = (ticketIds: string[], newStatus: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) => (ticketIds.includes(t.id) ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t))
    );
  };

  const handleBulkReroute = (ticketIds: string[]) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (!ticketIds.includes(t.id)) return t;
        const evaluation = evaluateTicketRouting(
          {
            title: t.title,
            description: t.description,
            category: t.category,
            department: t.requester.department,
            priority: t.priority,
          },
          rules,
          agents
        );
        return {
          ...t,
          assignedTo: evaluation.assignedAgent,
          priority: evaluation.priority,
          routingAudit: evaluation.audit,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleBulkAssign = (ticketIds: string[], agentId: string) => {
    const agent = agents.find((a) => a.id === agentId) || null;
    setTickets((prev) =>
      prev.map((t) =>
        ticketIds.includes(t.id)
          ? {
              ...t,
              assignedTo: agent,
              status: t.status === 'new' ? 'assigned' : t.status,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  };

  // Rule operations
  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleMoveRuleRank = (ruleId: string, direction: 'up' | 'down') => {
    const index = rules.findIndex((r) => r.id === ruleId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === rules.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newRules = [...rules];
    const temp = newRules[index];
    newRules[index] = newRules[targetIndex];
    newRules[targetIndex] = temp;

    // Re-index priorityRank
    const reindexed = newRules.map((r, i) => ({ ...r, priorityRank: i + 1 }));
    setRules(reindexed);
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules((prev) =>
      prev.filter((r) => r.id !== ruleId).map((r, i) => ({ ...r, priorityRank: i + 1 }))
    );
  };

  const handleAddRule = (newRuleData: Omit<RoutingRule, 'id' | 'triggerCount'>) => {
    const newRule: RoutingRule = {
      ...newRuleData,
      id: `rule-custom-${Date.now()}`,
      triggerCount: 0,
      lastTriggeredAt: new Date().toISOString(),
    };
    setRules((prev) => [...prev, newRule]);
  };

  // Agent operations
  const handleToggleAgentStatus = (agentId: string, status: Agent['status']) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, status } : a))
    );
  };

  const handleUpdateAgentCapacity = (agentId: string, delta: number) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? { ...a, maxCapacity: Math.max(3, Math.min(15, a.maxCapacity + delta)) }
          : a
      )
    );
  };

  // Reset demo data
  const handleResetData = () => {
    if (window.confirm('Reset all help desk tickets, rules, and agents to default factory demo state?')) {
      localStorage.removeItem(STORAGE_KEYS.TICKETS);
      localStorage.removeItem(STORAGE_KEYS.RULES);
      localStorage.removeItem(STORAGE_KEYS.AGENTS);
      setTickets(INITIAL_TICKETS);
      setRules(INITIAL_RULES);
      setAgents(INITIAL_AGENTS);
    }
  };

  // Simulate Inbound Incident
  const handleSimulateIncident = () => {
    const incidentTemplates = [
      {
        title: 'Frankfurt Branch Office Meraki Switch Port 24 Flapping',
        description: 'VLAN 10 VoIP phones losing registration every 90 seconds. Core switch PoE budget maxed out.',
        category: 'Network & VPN' as TicketCategory,
        priority: 'P2' as Priority,
        requester: {
          name: 'Klaus Schmidt',
          email: 'k.schmidt@acme-corp.com',
          department: 'European Operations',
          location: 'Frankfurt Office - 2nd Floor',
        },
        assetTag: 'MRK-MS-250',
      },
      {
        title: 'Emergency: Production Aurora PostgreSQL Connection Pool Exhaustion',
        description: 'Web API latency spiked to 9,200ms. PgBouncer reporting max_client_conn reached in us-east-1.',
        category: 'Cloud & Infrastructure' as TicketCategory,
        priority: 'P1' as Priority,
        requester: {
          name: 'Priya Sharma',
          email: 'p.sharma@acme-corp.com',
          department: 'Platform Engineering',
          location: 'Remote - Bangalore',
        },
        assetTag: 'AWS-RDS-PROD-01',
      },
      {
        title: 'CEO MacBook Pro battery swollen and trackpad click non-functional',
        description: 'Chassis bowing outwards below spacebar. Board meeting presentation in 3 hours.',
        category: 'Hardware & Workstation' as TicketCategory,
        priority: 'P2' as Priority,
        requester: {
          name: 'Victoria Vance',
          email: 'v.vance@acme-corp.com',
          department: 'Executive',
          location: 'Executive Boardroom 8A',
        },
        assetTag: 'MBP-M3-EXEC-01',
      },
      {
        title: 'Okta MFA Push delivery timeout for 18 Sales Reps in Tokyo',
        description: 'Users cannot log in to Salesforce CRM or Slack. Okta system log shows notification gateway 502.',
        category: 'Access & Identity' as TicketCategory,
        priority: 'P2' as Priority,
        requester: {
          name: 'Kenji Sato',
          email: 'k.sato@acme-corp.com',
          department: 'APAC Sales',
          location: 'Tokyo Hub',
        },
      },
    ];

    const pick = incidentTemplates[Math.floor(Math.random() * incidentTemplates.length)];
    const ticketId = `IT-${Math.floor(1065 + Math.random() * 800)}`;
    const now = new Date().toISOString();

    const routing = evaluateTicketRouting(
      {
        title: pick.title,
        description: pick.description,
        category: pick.category,
        department: pick.requester.department,
        priority: pick.priority,
      },
      rules,
      agents
    );

    const simulatedTicket: Ticket = {
      id: ticketId,
      title: pick.title,
      description: pick.description,
      category: pick.category,
      priority: routing.priority,
      status: routing.assignedAgent ? 'assigned' : 'new',
      requester: pick.requester,
      assignedTo: routing.assignedAgent,
      routingAudit: routing.audit,
      sla: routing.sla,
      tags: [...routing.tags, 'Simulated-Alert'],
      assetTag: pick.assetTag,
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: `msg-${Date.now()}-1`,
          sender: pick.requester.name,
          senderRole: 'requester',
          isInternalNote: false,
          content: pick.description,
          timestamp: now,
        },
        {
          id: `msg-${Date.now()}-2`,
          sender: 'Automated Routing Engine',
          senderRole: 'system',
          isInternalNote: true,
          content: `⚡ Inbound alert evaluated in ${routing.audit.executionMs}ms. Matched Rule: "${routing.audit.ruleName}". Auto-assigned to ${routing.assignedAgent?.name || 'Unassigned'}.`,
          timestamp: now,
        },
      ],
    };

    setTickets((prev) => [simulatedTicket, ...prev]);

    // Update rule trigger counter
    setRules((prev) =>
      prev.map((r) =>
        r.id === routing.audit.ruleId
          ? { ...r, triggerCount: r.triggerCount + 1, lastTriggeredAt: now }
          : r
      )
    );

    // Toast notification
    setToastNotification({
      id: String(Date.now()),
      ticketId,
      title: pick.title,
      ruleName: routing.audit.ruleName,
      agentName: routing.assignedAgent?.name || 'Unassigned',
      executionMs: routing.audit.executionMs,
    });
  };

  // Open ticket counts for header
  const openTicketCount = tickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed').length;
  const urgentTicketCount = tickets.filter(
    (t) => (t.priority === 'P1' || t.priority === 'P2') && t.status !== 'resolved' && t.status !== 'closed'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCreateModal={() => setShowCreateModal(true)}
        simulateIncident={handleSimulateIncident}
        resetData={handleResetData}
        openTicketCount={openTicketCount}
        urgentTicketCount={urgentTicketCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'dashboard' && (
          <DashboardView
            tickets={tickets}
            agents={agents}
            onSelectTicket={handleSelectTicket}
            onFilterCategory={(cat) => {
              setSelectedCategoryFilter(cat);
              setActiveTab('tickets');
            }}
            onNavigateToRouting={() => setActiveTab('routing')}
            onNavigateToTickets={() => setActiveTab('tickets')}
          />
        )}

        {activeTab === 'tickets' && (
          <TicketsQueueView
            tickets={tickets}
            agents={agents}
            onSelectTicket={handleSelectTicket}
            onBulkUpdateStatus={handleBulkUpdateStatus}
            onBulkReroute={handleBulkReroute}
            onBulkAssign={handleBulkAssign}
            selectedCategoryFilter={selectedCategoryFilter}
            onClearCategoryFilter={() => setSelectedCategoryFilter(null)}
          />
        )}

        {activeTab === 'routing' && (
          <RoutingEngineView
            rules={rules}
            agents={agents}
            onToggleRule={handleToggleRule}
            onMoveRuleRank={handleMoveRuleRank}
            onDeleteRule={handleDeleteRule}
            onAddRule={handleAddRule}
          />
        )}

        {activeTab === 'team' && (
          <AgentsDirectoryView
            agents={agents}
            onToggleAgentStatus={handleToggleAgentStatus}
            onUpdateAgentCapacity={handleUpdateAgentCapacity}
          />
        )}

        {activeTab === 'runbooks' && (
          <RunbooksModal runbooks={runbooks} />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            OpsDesk IT Service Management System · Automated Skills-Based Dispatch & Real-Time Telemetry
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            SLA Engine Active · 99.98% Service Uptime
          </div>
        </div>
      </footer>

      {/* Ticket Detail Drawer / Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          agents={agents}
          runbooks={runbooks}
          onClose={() => setSelectedTicket(null)}
          onUpdateTicket={handleUpdateTicket}
          onRerouteSingleTicket={handleRerouteSingleTicket}
        />
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal
          agents={agents}
          rules={rules}
          onClose={() => setShowCreateModal(false)}
          onCreateTicket={handleCreateTicket}
        />
      )}

      {/* Floating Inbound Dispatch Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md w-full rounded-xl border border-indigo-700/80 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-indigo-400">
                    {toastNotification.ticketId}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    Auto-Dispatched in {toastNotification.executionMs}ms
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-white line-clamp-1 mt-0.5">
                  {toastNotification.title}
                </h4>
              </div>
            </div>

            <button
              onClick={() => setToastNotification(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span className="truncate max-w-[200px]">
              Rule: <span className="text-slate-200">{toastNotification.ruleName}</span>
            </span>
            <span className="text-indigo-300 font-mono">
              &rarr; {toastNotification.agentName}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
