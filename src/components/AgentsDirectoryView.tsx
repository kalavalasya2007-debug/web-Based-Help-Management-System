import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  Sparkles,
  Award
} from 'lucide-react';
import { Agent } from '../types';

interface AgentsDirectoryViewProps {
  agents: Agent[];
  onToggleAgentStatus: (agentId: string, status: Agent['status']) => void;
  onUpdateAgentCapacity: (agentId: string, delta: number) => void;
}

export const AgentsDirectoryView: React.FC<AgentsDirectoryViewProps> = ({
  agents,
  onToggleAgentStatus,
  onUpdateAgentCapacity,
}) => {
  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
                <Users className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">Support Specialist Directory & Shift Operations</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Skills-based routing engine distributes incoming queue workloads according to engineer tier, technical certifications, and live status.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/50">
              {agents.filter((a) => a.status === 'available').length} Active On Shift
            </span>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((agent) => {
          const loadPercent = Math.round((agent.activeTicketCount / agent.maxCapacity) * 100);
          const isHighLoad = loadPercent >= 80;

          return (
            <div
              key={agent.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-colors shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                
                {/* Agent Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={agent.avatarUrl}
                      alt={agent.name}
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-700 shrink-0"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                      <p className="text-xs text-indigo-300 font-medium">{agent.role}</p>
                      <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                        {agent.tier}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shift & Status */}
                <div className="flex items-center justify-between text-xs border-y border-slate-800/80 py-2.5">
                  <div className="text-slate-400">
                    Shift: <span className="text-slate-200 font-mono text-[11px]">{agent.shift}</span>
                  </div>

                  {/* Status switcher */}
                  <select
                    value={agent.status}
                    onChange={(e) => onToggleAgentStatus(agent.id, e.target.value as any)}
                    className={`text-xs font-mono px-2 py-0.5 rounded border focus:outline-none ${
                      agent.status === 'available'
                        ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50'
                        : agent.status === 'busy'
                        ? 'text-amber-400 bg-amber-950/40 border-amber-800/50'
                        : 'text-slate-400 bg-slate-900 border-slate-700'
                    }`}
                  >
                    <option value="available">Available</option>
                    <option value="busy">In Huddle / Busy</option>
                    <option value="away">Shift Away</option>
                  </select>
                </div>

                {/* Capacity Bar & Controls */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Queue Capacity</span>
                    <span className="font-mono tabular-nums text-slate-200 font-medium">
                      {agent.activeTicketCount} / {agent.maxCapacity} ({loadPercent}%)
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isHighLoad ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(loadPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Certified Skills Tags */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">
                    Certified Skills (Routing Tags):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {agent.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 text-[11px] font-mono border border-slate-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Footer: Resolved count & capacity tweak */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="tabular-nums font-semibold">{agent.resolvedToday}</span> resolved today
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Max:</span>
                  <button
                    onClick={() => onUpdateAgentCapacity(agent.id, -1)}
                    disabled={agent.maxCapacity <= 3}
                    className="h-5 w-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                  >
                    -
                  </button>
                  <span className="font-mono tabular-nums text-slate-200 w-4 text-center">
                    {agent.maxCapacity}
                  </span>
                  <button
                    onClick={() => onUpdateAgentCapacity(agent.id, 1)}
                    disabled={agent.maxCapacity >= 15}
                    className="h-5 w-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                  >
                    +
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
