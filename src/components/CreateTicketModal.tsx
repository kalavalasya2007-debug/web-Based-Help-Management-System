import React, { useState, useEffect } from 'react';
import { 
  X, 
  Workflow, 
  Zap, 
  ShieldAlert, 
  User, 
  Tag, 
  CheckCircle2, 
  Clock,
  Sparkles
} from 'lucide-react';
import { Agent, Priority, RoutingRule, Ticket, TicketCategory } from '../types';
import { detectCategoryFromText, evaluateTicketRouting } from '../utils/routingEngine';

interface CreateTicketModalProps {
  agents: Agent[];
  rules: RoutingRule[];
  onClose: () => void;
  onCreateTicket: (newTicket: Ticket) => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  agents,
  rules,
  onClose,
  onCreateTicket,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory | 'AUTO'>('AUTO');
  const [priority, setPriority] = useState<Priority>('P3');
  const [requesterName, setRequesterName] = useState('Sarah Jenkins');
  const [requesterEmail, setRequesterEmail] = useState('s.jenkins@acme-corp.com');
  const [requesterDepartment, setRequesterDepartment] = useState('Engineering');
  const [requesterLocation, setRequesterLocation] = useState('San Francisco HQ - Floor 4');
  const [assetTag, setAssetTag] = useState('');
  const [useAutoDispatch, setUseAutoDispatch] = useState(true);
  const [manualAgentId, setManualAgentId] = useState('');

  // Live Auto-Routing Prediction
  const effectiveCategory: TicketCategory =
    category === 'AUTO' ? detectCategoryFromText(`${title} ${description}`) : category;

  const routingPrediction = evaluateTicketRouting(
    {
      title,
      description,
      category: effectiveCategory,
      department: requesterDepartment,
      priority,
    },
    rules,
    agents
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const ticketId = `IT-${Math.floor(1060 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const assignedSpecialist = useAutoDispatch
      ? routingPrediction.assignedAgent
      : agents.find((a) => a.id === manualAgentId) || null;

    const finalPriority = useAutoDispatch ? routingPrediction.priority : priority;

    const newTicket: Ticket = {
      id: ticketId,
      title: title.trim(),
      description: description.trim() || 'No additional details provided.',
      category: effectiveCategory,
      priority: finalPriority,
      status: assignedSpecialist ? 'assigned' : 'new',
      requester: {
        name: requesterName || 'Employee',
        email: requesterEmail || 'employee@acme-corp.com',
        department: requesterDepartment || 'General Operations',
        location: requesterLocation || undefined,
      },
      assignedTo: assignedSpecialist,
      routingAudit: routingPrediction.audit,
      sla: routingPrediction.sla,
      tags: [...routingPrediction.tags, 'Inbound-Intake'],
      assetTag: assetTag.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: `msg-${Date.now()}-1`,
          sender: requesterName || 'Requester',
          senderRole: 'requester',
          isInternalNote: false,
          content: description.trim() || title.trim(),
          timestamp: now,
        },
        {
          id: `msg-${Date.now()}-2`,
          sender: 'Automated Routing Engine',
          senderRole: 'system',
          isInternalNote: true,
          content: `⚡ Ticket auto-analyzed in ${routingPrediction.audit.executionMs}ms via Rule "${routingPrediction.audit.ruleName}". Strategy: ${routingPrediction.audit.routingStrategy.replace('_', ' ')}. Designated Specialist: ${assignedSpecialist ? assignedSpecialist.name : 'Unassigned'}.`,
          timestamp: now,
        },
      ],
    };

    onCreateTicket(newTicket);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create New IT Incident</h2>
              <p className="text-xs text-slate-400">Automated routing engine dispatches to specialists in real-time</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Form (left) + Live Auto-Routing Prediction (right) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Left Column (7 cols): Intake Details */}
          <div className="lg:col-span-7 p-6 space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Incident Subject / Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cisco Meraki switch flapping on 4th floor, users lost Wi-Fi"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="AUTO">✨ Auto-Detect from Text ({effectiveCategory})</option>
                  <option value="Network & VPN">Network & VPN</option>
                  <option value="Access & Identity">Access & Identity</option>
                  <option value="Hardware & Workstation">Hardware & Workstation</option>
                  <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
                  <option value="Software & SaaS">Software & SaaS</option>
                  <option value="Security & Compliance">Security & Compliance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Severity / Urgency</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="P1">P1 · Critical (Cluster down, total outage)</option>
                  <option value="P2">P2 · High (No workaround, VIP user)</option>
                  <option value="P3">P3 · Normal (Standard request)</option>
                  <option value="P4">P4 · Low (General inquiry)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Incident Description</label>
              <textarea
                rows={3}
                placeholder="Describe symptoms, error codes, affected users, or device behavior..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            <div className="border-t border-slate-800/80 pt-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Requester Information
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Executive, Engineering, Sales"
                    value={requesterDepartment}
                    onChange={(e) => setRequesterDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={requesterEmail}
                    onChange={(e) => setRequesterEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Asset Tag (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. MBP-M3-4410"
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Auto Dispatch Toggle */}
            <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAutoDispatch}
                  onChange={(e) => setUseAutoDispatch(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span className="font-semibold text-white">
                  Let Automated Routing Engine Dispatch (Recommended)
                </span>
              </label>

              {!useAutoDispatch && (
                <div className="pt-2">
                  <label className="block text-slate-400 mb-1">Manual Assignee Override</label>
                  <select
                    value={manualAgentId}
                    onChange={(e) => setManualAgentId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option value="">Leave in Triage Queue (Unassigned)</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.tier})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

          </div>

          {/* Right Column (5 cols): Live Auto-Routing Engine Preview */}
          <div className="lg:col-span-5 p-6 bg-slate-950/40 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Workflow className="h-4 w-4" /> Live Auto-Routing Preview
                </span>
                <span className="font-mono text-emerald-400 text-xs tabular-nums">
                  ~{routingPrediction.audit.executionMs}ms
                </span>
              </div>

              <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/20 p-4 space-y-3 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 text-[11px]">Matched Rule:</span>
                  <div className="font-semibold text-white font-mono text-xs">
                    {routingPrediction.ruleMatched?.name || 'Default Workload Router'}
                  </div>
                </div>

                <div className="space-y-1 border-t border-indigo-900/40 pt-2">
                  <span className="text-slate-400 text-[11px]">Target Dispatch Strategy:</span>
                  <div className="font-mono text-indigo-300 uppercase text-[10px]">
                    {routingPrediction.audit.routingStrategy.replace('_', ' ')}
                  </div>
                </div>

                <div className="space-y-1 border-t border-indigo-900/40 pt-2">
                  <span className="text-slate-400 text-[11px]">Designated Specialist:</span>
                  {routingPrediction.assignedAgent ? (
                    <div className="flex items-center gap-2.5 mt-1">
                      <img
                        src={routingPrediction.assignedAgent.avatarUrl}
                        alt={routingPrediction.assignedAgent.name}
                        referrerPolicy="no-referrer"
                        className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <div className="font-bold text-white">
                          {routingPrediction.assignedAgent.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {routingPrediction.assignedAgent.role} · {routingPrediction.assignedAgent.activeTicketCount}/{routingPrediction.assignedAgent.maxCapacity} load
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-amber-400 font-medium">Unassigned (Placed in Triage)</div>
                  )}
                </div>

                <div className="space-y-1 border-t border-indigo-900/40 pt-2">
                  <span className="text-slate-400 text-[11px]">Calculated SLA Timelines:</span>
                  <div className="font-mono text-emerald-400 font-semibold tabular-nums text-xs">
                    {routingPrediction.sla.responseTimeHours * 60}m First Response · {routingPrediction.sla.resolutionTimeHours}h Resolution
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300">How routing works:</span>
                <p>
                  Rules analyze keyword vectors, department priorities, and engineer capacity. Once submitted, the ticket enters the queue with active countdown timers.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm transition-colors"
              >
                <Zap className="h-4 w-4" />
                <span>Submit & Auto-Route</span>
              </button>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
};
