import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Copy, 
  Check, 
  Terminal, 
  ListOrdered, 
  FileText, 
  Tag
} from 'lucide-react';
import { Runbook, TicketCategory } from '../types';

interface RunbooksModalProps {
  runbooks: Runbook[];
  onSelectRunbook?: (runbook: Runbook) => void;
}

export const RunbooksModal: React.FC<RunbooksModalProps> = ({ runbooks, onSelectRunbook }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = runbooks.filter((rb) => {
    if (selectedCategory !== 'all' && rb.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        rb.title.toLowerCase().includes(q) ||
        rb.summary.toLowerCase().includes(q) ||
        rb.steps.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
                <BookOpen className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">IT Standard Operating Procedures (SOPs)</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Curated resolution workflows, diagnostic checklists, and verified canned macro responses for helpdesk teams.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search runbooks by title, symptoms, steps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-900/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Domains</option>
            <option value="Network & VPN">Network & VPN</option>
            <option value="Access & Identity">Access & Identity</option>
            <option value="Hardware & Workstation">Hardware & Workstation</option>
            <option value="Security & Compliance">Security & Compliance</option>
          </select>
        </div>
      </div>

      {/* Runbooks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((rb) => (
          <div
            key={rb.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-colors shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold block mb-1">
                    {rb.category}
                  </span>
                  <h3 className="text-base font-bold text-white">{rb.title}</h3>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{rb.summary}</p>

              {/* Troubleshooting Steps */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <ListOrdered className="h-3.5 w-3.5" /> Investigation Checklist:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
                  {rb.steps.map((step, idx) => (
                    <li key={idx} className="leading-normal">
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Canned Response Macro */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <FileText className="h-3.5 w-3.5" /> Canned Ticket Macro:
                  </span>
                  <button
                    onClick={() => handleCopy(rb.id, rb.cannedReply)}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-[11px]"
                  >
                    {copiedId === rb.id ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Macro</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-3 text-xs text-slate-400 font-mono leading-relaxed">
                  "{rb.cannedReply}"
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
