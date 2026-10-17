import { Priority, TicketStatus } from '../types';

export function formatTimeRemaining(deadlineIso: string): {
  text: string;
  isBreached: boolean;
  isUrgent: boolean; // less than 45 mins left
} {
  const target = new Date(deadlineIso).getTime();
  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) {
    const overdueMins = Math.abs(Math.floor(diffMs / 60000));
    const hours = Math.floor(overdueMins / 60);
    const mins = overdueMins % 60;
    return {
      text: hours > 0 ? `+${hours}h ${mins}m breached` : `+${mins}m breached`,
      isBreached: true,
      isUrgent: true,
    };
  }

  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return {
      text: `${days}d ${hours % 24}h left`,
      isBreached: false,
      isUrgent: false,
    };
  }

  if (hours > 0) {
    return {
      text: `${hours}h ${mins}m left`,
      isBreached: false,
      isUrgent: hours === 1 && mins < 45,
    };
  }

  return {
    text: `${mins}m left`,
    isBreached: false,
    isUrgent: true,
  };
}

export function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const date = new Date(isoString).getTime();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

export function getPriorityMeta(priority: Priority): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (priority) {
    case 'P1':
      return {
        label: 'P1 · Critical Outage',
        badgeClass: 'text-rose-400 bg-rose-950/40 border border-rose-800/60 font-semibold',
        dotClass: 'bg-rose-500',
      };
    case 'P2':
      return {
        label: 'P2 · High Impact',
        badgeClass: 'text-amber-400 bg-amber-950/40 border border-amber-800/60 font-medium',
        dotClass: 'bg-amber-500',
      };
    case 'P3':
      return {
        label: 'P3 · Normal',
        badgeClass: 'text-sky-300 bg-sky-950/30 border border-sky-800/50',
        dotClass: 'bg-sky-400',
      };
    case 'P4':
      return {
        label: 'P4 · Low',
        badgeClass: 'text-slate-400 bg-slate-900 border border-slate-700/60',
        dotClass: 'bg-slate-400',
      };
  }
}

export function getStatusMeta(status: TicketStatus): {
  label: string;
  classNames: string;
} {
  switch (status) {
    case 'new':
      return { label: 'New', classNames: 'text-indigo-400 bg-indigo-950/50 border border-indigo-700/50' };
    case 'assigned':
      return { label: 'Assigned', classNames: 'text-sky-400 bg-sky-950/40 border border-sky-700/40' };
    case 'in_progress':
      return { label: 'In Progress', classNames: 'text-amber-400 bg-amber-950/40 border border-amber-700/40' };
    case 'pending_user':
      return { label: 'Pending User', classNames: 'text-purple-400 bg-purple-950/40 border border-purple-700/40' };
    case 'resolved':
      return { label: 'Resolved', classNames: 'text-emerald-400 bg-emerald-950/40 border border-emerald-700/40' };
    case 'closed':
      return { label: 'Closed', classNames: 'text-slate-400 bg-slate-900 border border-slate-700' };
  }
}
