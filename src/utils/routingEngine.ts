import { Agent, Priority, RoutingAudit, RoutingRule, RoutingStrategy, SLAInfo, Ticket, TicketCategory } from '../types';

export interface RoutingResult {
  ruleMatched: RoutingRule | null;
  assignedAgent: Agent | null;
  priority: Priority;
  sla: SLAInfo;
  audit: RoutingAudit;
  tags: string[];
}

export function calculateSLA(priority: Priority, baseDate: Date = new Date()): SLAInfo {
  let responseHours = 4.0;
  let resolutionHours = 24.0;

  switch (priority) {
    case 'P1':
      responseHours = 0.25; // 15 mins
      resolutionHours = 2.0; // 2 hours
      break;
    case 'P2':
      responseHours = 1.0; // 1 hour
      resolutionHours = 8.0; // 8 hours
      break;
    case 'P3':
      responseHours = 4.0; // 4 hours
      resolutionHours = 24.0; // 1 day
      break;
    case 'P4':
      responseHours = 12.0; // 12 hours
      resolutionHours = 48.0; // 2 days
      break;
  }

  const responseDeadline = new Date(baseDate.getTime() + responseHours * 3600 * 1000);
  const resolutionDeadline = new Date(baseDate.getTime() + resolutionHours * 3600 * 1000);

  return {
    responseTimeHours: responseHours,
    resolutionTimeHours: resolutionHours,
    responseDeadline: responseDeadline.toISOString(),
    resolutionDeadline: resolutionDeadline.toISOString(),
    isBreached: false,
  };
}

export function evaluateTicketRouting(
  ticketData: {
    title: string;
    description: string;
    category: TicketCategory;
    department?: string;
    priority?: Priority;
  },
  rules: RoutingRule[],
  agents: Agent[]
): RoutingResult {
  const startTime = performance.now();
  const titleLower = ticketData.title.toLowerCase();
  const descLower = ticketData.description.toLowerCase();
  const combinedText = `${titleLower} ${descLower}`;
  const department = ticketData.department || '';
  let priority: Priority = ticketData.priority || 'P3';

  // Sort rules by priorityRank ascending (rank 1 comes first)
  const activeRules = rules
    .filter((r) => r.enabled)
    .sort((a, b) => a.priorityRank - b.priorityRank);

  let matchedRule: RoutingRule | null = null;
  const matchedConditions: string[] = [];

  for (const rule of activeRules) {
    const conditions = rule.conditions;
    let match = true;
    const currentMatches: string[] = [];

    // Check priorities condition if set
    if (conditions.priorities && conditions.priorities.length > 0) {
      if (conditions.priorities.includes(priority)) {
        currentMatches.push(`Priority: ${priority}`);
      } else {
        match = false;
      }
    }

    // Check categories condition if set
    if (match && conditions.categories && conditions.categories.length > 0) {
      if (conditions.categories.includes(ticketData.category)) {
        currentMatches.push(`Category: ${ticketData.category}`);
      } else {
        match = false;
      }
    }

    // Check departments condition if set
    if (match && conditions.departments && conditions.departments.length > 0) {
      const deptMatch = conditions.departments.some(
        (d) => department.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(department.toLowerCase())
      );
      if (deptMatch) {
        currentMatches.push(`Department: ${department}`);
      } else {
        match = false;
      }
    }

    // Check keywords condition if set
    if (match && conditions.keywords && conditions.keywords.length > 0) {
      const matchedKw = conditions.keywords.filter((kw) => combinedText.includes(kw.toLowerCase()));
      if (matchedKw.length > 0) {
        currentMatches.push(`Keywords: [${matchedKw.slice(0, 3).map((k) => `"${k}"`).join(', ')}]`);
      } else if (!conditions.priorities && !conditions.categories && !conditions.departments) {
        // If keywords were the sole condition, failure to match keywords fails the rule
        match = false;
      }
    }

    if (match && currentMatches.length > 0) {
      matchedRule = rule;
      matchedConditions.push(...currentMatches);
      break; // First matching rule wins in rank order
    }
  }

  // Determine actions from matched rule
  const finalTags: string[] = [];
  let assignedAgent: Agent | null = null;
  let routingStrategy: RoutingStrategy = 'workload_balanced';

  if (matchedRule) {
    if (matchedRule.actions.setPriority) {
      priority = matchedRule.actions.setPriority;
    }
    if (matchedRule.actions.addTags) {
      finalTags.push(...matchedRule.actions.addTags);
    }

    routingStrategy = matchedRule.actions.targetStrategy;

    // Pick target agent
    if (matchedRule.actions.targetAgentId) {
      const explicit = agents.find((a) => a.id === matchedRule?.actions.targetAgentId);
      if (explicit) {
        assignedAgent = explicit;
      }
    }

    // If no explicit agent or need skills matching
    if (!assignedAgent && matchedRule.actions.targetStrategy === 'skills_match' && matchedRule.actions.requiredSkill) {
      const skillName = matchedRule.actions.requiredSkill.toLowerCase();
      const qualified = agents.filter(
        (a) => a.status !== 'away' && a.skills.some((s) => s.toLowerCase().includes(skillName))
      );
      if (qualified.length > 0) {
        // Pick least loaded qualified agent (activeTicketCount / maxCapacity ratio)
        qualified.sort((a, b) => a.activeTicketCount / a.maxCapacity - b.activeTicketCount / b.maxCapacity);
        assignedAgent = qualified[0];
      }
    }

    // Emergency tier routing fallback
    if (!assignedAgent && matchedRule.actions.targetStrategy === 'emergency_escalation') {
      const onCall = agents.find((a) => a.tier === 'SecOps Lead' || a.tier === 'Tier 3 Infrastructure');
      assignedAgent = onCall || agents[0];
    }
  }

  // Fallback to workload-balanced routing among all available agents if not yet assigned
  if (!assignedAgent) {
    const available = agents.filter((a) => a.status === 'available');
    const pool = available.length > 0 ? available : agents;
    // Sort by available capacity
    const sorted = [...pool].sort((a, b) => a.activeTicketCount / a.maxCapacity - b.activeTicketCount / b.maxCapacity);
    assignedAgent = sorted[0] || null;
    routingStrategy = 'workload_balanced';
    if (!matchedRule) {
      matchedConditions.push('Default Fallback: Lowest Workload Allocation');
    }
  }

  const sla = calculateSLA(priority);
  const executionMs = Math.max(12, Math.round(performance.now() - startTime));

  const audit: RoutingAudit = {
    ruleId: matchedRule ? matchedRule.id : 'default-fallback',
    ruleName: matchedRule ? matchedRule.name : 'Workload-Balanced Auto-Dispatch',
    matchedConditions: matchedConditions.length > 0 ? matchedConditions : ['Standard Dispatch'],
    routingStrategy,
    timestamp: new Date().toISOString(),
    executionMs,
  };

  return {
    ruleMatched: matchedRule,
    assignedAgent,
    priority,
    sla,
    audit,
    tags: finalTags,
  };
}

export function detectCategoryFromText(text: string): TicketCategory {
  const t = text.toLowerCase();
  if (t.includes('vpn') || t.includes('wifi') || t.includes('network') || t.includes('firewall') || t.includes('dns') || t.includes('meraki')) {
    return 'Network & VPN';
  }
  if (t.includes('okta') || t.includes('saml') || t.includes('sso') || t.includes('mfa') || t.includes('password') || t.includes('yubikey') || t.includes('login') || t.includes('permission')) {
    return 'Access & Identity';
  }
  if (t.includes('aws') || t.includes('cloud') || t.includes('kubernetes') || t.includes('docker') || t.includes('server') || t.includes('database') || t.includes('outage') || t.includes('terraform')) {
    return 'Cloud & Infrastructure';
  }
  if (t.includes('macbook') || t.includes('laptop') || t.includes('battery') || t.includes('screen') || t.includes('monitor') || t.includes('dock') || t.includes('keyboard') || t.includes('mouse') || t.includes('charger')) {
    return 'Hardware & Workstation';
  }
  if (t.includes('crowdstrike') || t.includes('antivirus') || t.includes('malware') || t.includes('phishing') || t.includes('compliance') || t.includes('soc2') || t.includes('security')) {
    return 'Security & Compliance';
  }
  return 'Software & SaaS';
}
