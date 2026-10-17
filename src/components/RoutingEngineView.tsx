import React, { useState } from 'react';
import { 
  Workflow, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Zap, 
  ShieldAlert, 
  Sliders, 
  Tag, 
  Clock, 
  Info,
  ChevronRight,
  Layers,
  Sparkles,
  Edit2,
  Trash2
} from 'lucide-react';
import { Agent, Priority, RoutingRule, TicketCategory } from '../types';
import { evaluateTicketRouting, detectCategoryFromText } from '../utils/routingEngine';

interface RoutingEngineViewProps {
  rules: RoutingRule[];
  agents: Agent[];
  onToggleRule: (ruleId: string) => void;
  onMoveRuleRank: (ruleId: string, direction: 'up' | 'down') => void;
  onDeleteRule: (ruleId: string) => void;
  onAddRule: (newRule: Omit<RoutingRule, 'id' | 'triggerCount'>) => void;
}

export const RoutingEngineView: React.FC<RoutingEngineViewProps> = ({
  rules,
  agents,
  onToggleRule,
  onMoveRuleRank,
  onDeleteRule,
  onAddRule,
}) => {
  // Simulator State
  const [testTitle, setTestTitle] = useState('Production Kubernetes ingress gateway connection timeout 504');
  const [testDescription, setTestDescription] = useState('All external API client requests to api.acme-corp.com failing with 504 Gateway Timeout. Multiple services down.');
  const [testCategory, setTestCategory] = useState<TicketCategory>('Cloud & Infrastructure');
  const [testDepartment, setTestDepartment] = useState('Site Reliability Engineering');
  const [testPriority, setTestPriority] = useState<Priority>('P1');
  const [simulationResult, setSimulationResult] = useState<ReturnType<typeof evaluateTicketRouting> | null>(null);

  // New Rule Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<TicketCategory | ''>('');
  const [newRuleKeywords, setNewRuleKeywords] = useState('');
  const [newRuleDept, setNewRuleDept] = useState('');
  const [newRulePriority, setNewRulePriority] = useState<Priority | ''>('');
  const [newRuleStrategy, setNewRuleStrategy] = useState<RoutingRule['actions']['targetStrategy']>('skills_match');
  const [newRuleRequiredSkill, setNewRuleRequiredSkill] = useState('');
  const [newRuleTargetAgent, setNewRuleTargetAgent] = useState('');

  // Run simulation
  const handleRunSimulation = () => {
    const result = evaluateTicketRouting(
      {
        title: testTitle,
        description: testDescription,
        category: testCategory,
        department: testDepartment,
        priority: testPriority,
      },
      rules,
      agents
    );
    setSimulationResult(result);
  };

  // Load canned scenario into simulator
  const loadScenario = (
    title: string,
    desc: string,
    cat: TicketCategory,
    dept: string,
    prio: Priority
  ) => {
    setTestTitle(title);
    setTestDescription(desc);
    setTestCategory(cat);
    setTestDepartment(dept);
    setTestPriority(prio);
    const result = evaluateTicketRouting(
      {
        title,
        description: desc,
        category: cat,
        department: dept,
        priority: prio,
      },
      rules,
      agents
    );
    setSimulationResult(result);
  };

  const handleCreateRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const keywords = newRuleKeywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const departments = newRuleDept
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    onAddRule({
      name: newRuleName,
      description: newRuleDesc || 'Custom automated routing rule',
      enabled: true,
      priorityRank: rules.length + 1,
      conditions: {
        categories: newRuleCategory ? [newRuleCategory] : undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
        departments: departments.length > 0 ? departments : undefined,
        priorities: newRulePriority ? [newRulePriority] : undefined,
      },
      actions: {
        targetStrategy: newRuleStrategy,
        requiredSkill: newRuleRequiredSkill || undefined,
        targetAgentId: newRuleTargetAgent || undefined,
        addTags: ['Custom-Rule'],
      },
    });

    // Reset & close
    setNewRuleName('');
    setNewRuleDesc('');
    setNewRuleCategory('');
    setNewRuleKeywords('');
    setNewRuleDept('');
    setNewRulePriority('');
    setNewRuleRequiredSkill('');
    setNewRuleTargetAgent('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-8">
      
      {/* Overview Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
                <Workflow className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">Automated Ticket Routing Engine</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Incoming IT incidents are parsed in real time against priority-ranked rules, skills matrices, and current specialist capacity to ensure sub-100ms dispatch with zero triage bottlenecks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>New Routing Rule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Section: Live Simulator Sandbox & Active Rules Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 cols): Interactive Live Routing Simulator Sandbox */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-indigo-900/40 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-indigo-400" />
                <h2 className="text-base font-semibold text-white">Routing Sandbox Simulator</h2>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                Live Engine
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Test how new or existing tickets evaluate against the live rule pipeline without altering real ticket queues.
            </p>

            {/* Canned Scenario Quick Selectors */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Quick Test Scenarios:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    loadScenario(
                      'P1 Cluster Outage: Kubernetes staging ingress 504 gateway timeout',
                      'Database connection pool exhausted. All internal microservices returning 503/504.',
                      'Cloud & Infrastructure',
                      'DevOps Platform',
                      'P1'
                    )
                  }
                  className="text-left px-2 py-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 hover:text-white truncate transition-colors"
                >
                  ⚡ P1 Infra Outage
                </button>

                <button
                  type="button"
                  onClick={() =>
                    loadScenario(
                      'Okta FastPass biometric auth loop on CEO iPad',
                      'User stuck in MFA login loop accessing corporate email. Executive traveling in Zurich.',
                      'Access & Identity',
                      'Executive',
                      'P2'
                    )
                  }
                  className="text-left px-2 py-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 hover:text-white truncate transition-colors"
                >
                  👑 VIP Executive Auth
                </button>

                <button
                  type="button"
                  onClick={() =>
                    loadScenario(
                      'VPN tunnel dropped packet loss on EMEA Palo Alto gateway',
                      'Remote engineers in Frankfurt cannot pull Git repositories over corporate tunnel.',
                      'Network & VPN',
                      'Engineering',
                      'P2'
                    )
                  }
                  className="text-left px-2 py-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 hover:text-white truncate transition-colors"
                >
                  🌐 Palo Alto VPN Flap
                </button>

                <button
                  type="button"
                  onClick={() =>
                    loadScenario(
                      'MacBook Pro 16 trackpad swollen and chassis bulging',
                      'Lower aluminum case deformed below spacebar. Battery health warning in System Settings.',
                      'Hardware & Workstation',
                      'Product Design',
                      'P2'
                    )
                  }
                  className="text-left px-2 py-1.5 rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 hover:text-white truncate transition-colors"
                >
                  💻 Battery Chassis RMA
                </button>
              </div>
            </div>

            {/* Sandbox Inputs */}
            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Incident Title / Alert Text</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    value={testCategory}
                    onChange={(e) => setTestCategory(e.target.value as TicketCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Network & VPN">Network & VPN</option>
                    <option value="Access & Identity">Access & Identity</option>
                    <option value="Hardware & Workstation">Hardware & Workstation</option>
                    <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
                    <option value="Software & SaaS">Software & SaaS</option>
                    <option value="Security & Compliance">Security & Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Requester Department</label>
                  <input
                    type="text"
                    value={testDepartment}
                    onChange={(e) => setTestDepartment(e.target.value)}
                    placeholder="e.g. Executive, DevOps"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Incident Description</label>
                <textarea
                  rows={2}
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={handleRunSimulation}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-colors"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Execute Routing Evaluation</span>
              </button>
            </div>

            {/* Simulation Results Output */}
            {simulationResult && (
              <div className="rounded-lg border border-indigo-700/60 bg-indigo-950/30 p-4 space-y-3 mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Evaluation Complete
                  </span>
                  <span className="font-mono text-emerald-400 tabular-nums">
                    Executed in {simulationResult.audit.executionMs}ms
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-indigo-900/50">
                    <span className="text-slate-400">Winning Rule:</span>
                    <span className="font-semibold text-white font-mono text-right truncate max-w-[200px]">
                      {simulationResult.ruleMatched?.name || 'Default Workload Router'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-indigo-900/50">
                    <span className="text-slate-400">Matched Conditions:</span>
                    <span className="text-slate-200 text-right truncate max-w-[200px]">
                      {simulationResult.audit.matchedConditions.join(', ')}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-indigo-900/50">
                    <span className="text-slate-400">Routing Strategy:</span>
                    <span className="font-mono text-indigo-300 uppercase text-[10px]">
                      {simulationResult.audit.routingStrategy.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-indigo-900/50">
                    <span className="text-slate-400">Designated Specialist:</span>
                    {simulationResult.assignedAgent ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={simulationResult.assignedAgent.avatarUrl}
                          alt={simulationResult.assignedAgent.name}
                          referrerPolicy="no-referrer"
                          className="h-5 w-5 rounded-full object-cover"
                        />
                        <span className="font-semibold text-white">
                          {simulationResult.assignedAgent.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-amber-400">Unassigned</span>
                    )}
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Calculated SLA:</span>
                    <span className="font-mono text-emerald-300 tabular-nums">
                      {simulationResult.sla.responseTimeHours * 60}m Response / {simulationResult.sla.resolutionTimeHours}h Resolution
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Active Rules Pipeline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Rule Execution Hierarchy</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rules evaluate sequentially from Rank 1 down. The first matching rule dispatches the incident.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {rules.filter((r) => r.enabled).length} of {rules.length} Active
            </span>
          </div>

          <div className="space-y-3">
            {rules.map((rule, index) => {
              const isFirst = index === 0;
              const isLast = index === rules.length - 1;

              return (
                <div
                  key={rule.id}
                  className={`rounded-xl border transition-colors p-4 space-y-3 ${
                    rule.enabled
                      ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      : 'border-slate-900 bg-slate-950/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Priority Rank Badge */}
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-xs font-mono font-bold text-indigo-400 border border-slate-700">
                        #{rule.priorityRank}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{rule.name}</h3>
                          {!rule.enabled && (
                            <span className="text-[10px] text-slate-500 font-mono">DISABLED</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{rule.description}</p>
                      </div>
                    </div>

                    {/* Rank controls & enable toggle */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onMoveRuleRank(rule.id, 'up')}
                        disabled={isFirst}
                        title="Move Priority Up"
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => onMoveRuleRank(rule.id, 'down')}
                        disabled={isLast}
                        title="Move Priority Down"
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => onToggleRule(rule.id)}
                        className={`ml-1 px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                          rule.enabled
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </button>

                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        title="Delete Rule"
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors ml-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Conditions & Actions Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    {/* Conditions */}
                    <div className="rounded-lg bg-slate-950/50 border border-slate-800/60 p-2.5 space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                        Matching Criteria
                      </span>
                      <div className="flex flex-wrap gap-1 text-[11px]">
                        {rule.conditions.priorities && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-900/40">
                            {rule.conditions.priorities.join(', ')}
                          </span>
                        )}
                        {rule.conditions.categories && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {rule.conditions.categories.join(', ')}
                          </span>
                        )}
                        {rule.conditions.departments && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-900/40">
                            Dept: {rule.conditions.departments.join(', ')}
                          </span>
                        )}
                        {rule.conditions.keywords && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-900/40 truncate max-w-[200px]">
                            Keywords: {rule.conditions.keywords.slice(0, 3).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="rounded-lg bg-slate-950/50 border border-slate-800/60 p-2.5 space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                        Routing Action
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
                        <span className="font-mono text-indigo-400 font-semibold">
                          {rule.actions.targetStrategy.replace('_', ' ')}
                        </span>
                        {rule.actions.requiredSkill && (
                          <span className="text-slate-400">
                            (Skill: <span className="text-slate-200">{rule.actions.requiredSkill}</span>)
                          </span>
                        )}
                        {rule.actions.setPriority && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            Set {rule.actions.setPriority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Trigger stats footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60 pt-2 font-mono">
                    <span>
                      Trigger count: <span className="text-slate-300 tabular-nums">{rule.triggerCount}</span> times
                    </span>
                    {rule.lastTriggeredAt && (
                      <span>Last triggered: {rule.lastTriggeredAt.slice(11, 16)} UTC</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Add New Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Workflow className="h-5 w-5 text-indigo-400" />
                <span>Create Automated Routing Rule</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateRuleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Finance & ERP Escalation"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Explain when this rule should trigger"
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category Condition</label>
                  <select
                    value={newRuleCategory}
                    onChange={(e) => setNewRuleCategory(e.target.value as TicketCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="">Any Category</option>
                    <option value="Network & VPN">Network & VPN</option>
                    <option value="Access & Identity">Access & Identity</option>
                    <option value="Hardware & Workstation">Hardware & Workstation</option>
                    <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
                    <option value="Software & SaaS">Software & SaaS</option>
                    <option value="Security & Compliance">Security & Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority Condition</label>
                  <select
                    value={newRulePriority}
                    onChange={(e) => setNewRulePriority(e.target.value as Priority)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="">Any Priority</option>
                    <option value="P1">P1 · Critical</option>
                    <option value="P2">P2 · High</option>
                    <option value="P3">P3 · Normal</option>
                    <option value="P4">P4 · Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Keywords (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. netosuite, billing, invoice, payroll, wire"
                  value={newRuleKeywords}
                  onChange={(e) => setNewRuleKeywords(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Department Match</label>
                  <input
                    type="text"
                    placeholder="e.g. Finance, Accounting"
                    value={newRuleDept}
                    onChange={(e) => setNewRuleDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Routing Strategy</label>
                  <select
                    value={newRuleStrategy}
                    onChange={(e) => setNewRuleStrategy(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="skills_match">Skills-Based Match</option>
                    <option value="workload_balanced">Workload-Balanced Round Robin</option>
                    <option value="emergency_escalation">Emergency Escalation Tier</option>
                    <option value="vip_fast_track">VIP Executive Fast-Track</option>
                    <option value="specific_agent">Specific Specialist Assignee</option>
                  </select>
                </div>
              </div>

              {newRuleStrategy === 'skills_match' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Required Skill Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Okta SSO, AWS, Hardware RMA, Cisco Meraki"
                    value={newRuleRequiredSkill}
                    onChange={(e) => setNewRuleRequiredSkill(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              )}

              {newRuleStrategy === 'specific_agent' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Specialist</label>
                  <select
                    value={newRuleTargetAgent}
                    onChange={(e) => setNewRuleTargetAgent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="">Select Specialist</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.tier})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Save & Enable Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
