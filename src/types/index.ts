export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type TicketStatus = 'new' | 'assigned' | 'in_progress' | 'pending_user' | 'resolved' | 'closed';
export type TicketCategory =
  | 'Hardware & Workstation'
  | 'Network & VPN'
  | 'Cloud & Infrastructure'
  | 'Access & Identity'
  | 'Software & SaaS'
  | 'Security & Compliance';

export interface Requester {
  name: string;
  email: string;
  department: string;
  location?: string;
  avatarUrl?: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: 'Tier 1 Helpdesk' | 'Tier 2 Systems' | 'Tier 3 Infrastructure' | 'SecOps Lead';
  skills: string[];
  avatarUrl: string;
  status: 'available' | 'busy' | 'away';
  activeTicketCount: number;
  maxCapacity: number;
  shift: string;
  resolvedToday: number;
}

export type RoutingStrategy =
  | 'skills_match'
  | 'workload_balanced'
  | 'emergency_escalation'
  | 'vip_fast_track'
  | 'specific_agent'
  | 'manual';

export interface RoutingAudit {
  ruleId: string;
  ruleName: string;
  matchedConditions: string[];
  routingStrategy: RoutingStrategy;
  timestamp: string;
  executionMs: number;
}

export interface SLAInfo {
  responseTimeHours: number;
  resolutionTimeHours: number;
  responseDeadline: string; // ISO
  resolutionDeadline: string; // ISO
  firstRespondedAt?: string;
  resolvedAt?: string;
  isBreached: boolean;
}

export interface TicketMessage {
  id: string;
  sender: string;
  senderRole: 'requester' | 'agent' | 'system';
  isInternalNote: boolean;
  content: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: Priority;
  status: TicketStatus;
  requester: Requester;
  assignedTo: Agent | null;
  routingAudit: RoutingAudit;
  sla: SLAInfo;
  tags: string[];
  messages: TicketMessage[];
  assetTag?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutingRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priorityRank: number;
  conditions: {
    categories?: TicketCategory[];
    keywords?: string[];
    departments?: string[];
    priorities?: Priority[];
  };
  actions: {
    targetStrategy: RoutingStrategy;
    targetAgentId?: string;
    requiredSkill?: string;
    setPriority?: Priority;
    addTags?: string[];
    autoEscalateSla?: boolean;
  };
  triggerCount: number;
  lastTriggeredAt?: string;
}

export interface Runbook {
  id: string;
  title: string;
  category: TicketCategory;
  summary: string;
  steps: string[];
  cannedReply: string;
}
