import React from 'react';
import { 
  LayoutDashboard, 
  TicketCheck, 
  Workflow, 
  Users, 
  BookOpen, 
  Plus, 
  Radio, 
  RotateCcw
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'tickets' | 'routing' | 'team' | 'runbooks';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openCreateModal: () => void;
  simulateIncident: () => void;
  resetData: () => void;
  openTicketCount: number;
  urgentTicketCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openCreateModal,
  simulateIncident,
  resetData,
  openTicketCount,
  urgentTicketCount,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      {/* Strict 3-Zone Top Bar Contract */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: Single text element Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-base shadow-sm">
            OD
          </div>
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className="text-lg font-bold tracking-tight text-white hover:text-slate-200 transition-colors whitespace-nowrap text-left"
          >
            OpsDesk IT
          </button>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'tickets'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <TicketCheck className="h-4 w-4" />
            <span>Tickets Queue</span>
            {openTicketCount > 0 && (
              <span className="font-mono text-xs tabular-nums text-indigo-400 font-semibold">
                {openTicketCount}
              </span>
            )}
            {urgentTicketCount > 0 && (
              <span className="font-mono text-xs tabular-nums text-rose-400 font-bold ml-0.5">
                ({urgentTicketCount} P1/P2)
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('routing')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'routing'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Workflow className="h-4 w-4" />
            <span>Automated Routing</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'team'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Support Team</span>
          </button>

          <button
            onClick={() => setActiveTab('runbooks')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'runbooks'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>IT Runbooks</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Live Simulator */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={simulateIncident}
            title="Dispatch a realistic inbound incident to test automated routing live"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
          >
            <Radio className="h-3.5 w-3.5 text-emerald-400" />
            <span>Simulate Incident</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>New Ticket</span>
          </button>

          <button
            onClick={resetData}
            title="Reset system to fresh demo data"
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-900 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden items-center justify-between border-t border-slate-900 px-4 py-2 bg-slate-950 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'dashboard' ? 'text-white bg-slate-800' : 'text-slate-400'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'tickets' ? 'text-white bg-slate-800' : 'text-slate-400'}`}
        >
          Tickets ({openTicketCount})
        </button>
        <button
          onClick={() => setActiveTab('routing')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'routing' ? 'text-white bg-slate-800' : 'text-slate-400'}`}
        >
          Auto-Routing
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'team' ? 'text-white bg-slate-800' : 'text-slate-400'}`}
        >
          Team
        </button>
        <button
          onClick={() => setActiveTab('runbooks')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'runbooks' ? 'text-white bg-slate-800' : 'text-slate-400'}`}
        >
          Runbooks
        </button>
        <button
          onClick={simulateIncident}
          className="px-2 py-1 text-emerald-400 whitespace-nowrap"
        >
          + Simulate
        </button>
      </div>
    </header>
  );
};
