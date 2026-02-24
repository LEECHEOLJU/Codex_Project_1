import crypto from 'crypto';

const defaultWorkflow = {
  id: 'wf-default',
  name: 'Default SOC Workflow',
  states: ['New', 'Triage', 'Analyzing', 'Pending Customer', 'Resolved', 'Closed']
};

const allowedTransitions = {
  New: ['Triage'],
  Triage: ['Analyzing', 'Closed'],
  Analyzing: ['Pending Customer', 'Resolved'],
  'Pending Customer': ['Analyzing', 'Resolved'],
  Resolved: ['Closed', 'Analyzing'],
  Closed: []
};

const state = globalThis.__SOC_STATE__ || {
  tenants: [{ id: 'tenant-default', name: 'Default Tenant', contactEmail: 'soc-default@example.com', status: 'active' }],
  users: [
    { id: 'usr-admin', email: 'admin@soc.local', name: 'Platform Admin', role: 'Global Admin', tenantId: 'all', status: 'active' }
  ],
  customFields: [
    { id: 'cf-root-cause', name: 'root_cause', label: 'Root Cause', type: 'text', requiredOnResolve: true, active: true },
    { id: 'cf-asset', name: 'asset_name', label: 'Asset Name', type: 'text', requiredOnResolve: false, active: true }
  ],
  templates: [
    {
      id: 'tpl-default-resolved',
      name: 'Resolved Mail Default',
      triggerStatus: 'Resolved',
      subjectTemplate: '[{{ticket.key}}] {{ticket.status}} - {{ticket.title}}',
      bodyTemplate: 'Ticket: {{ticket.key}}\nStatus: {{ticket.status}}\nPriority: {{ticket.priority}}\nSummary: {{ticket.summary}}\nResolution: {{ticket.resolutionNote}}\nUpdatedBy: {{actor}}\nUpdatedAt: {{now}}',
      active: true
    },
    {
      id: 'tpl-default-closed',
      name: 'Closed Mail Default',
      triggerStatus: 'Closed',
      subjectTemplate: '[{{ticket.key}}] {{ticket.status}} - {{ticket.title}}',
      bodyTemplate: 'Ticket: {{ticket.key}}\nStatus: {{ticket.status}}\nPriority: {{ticket.priority}}\nSummary: {{ticket.summary}}\nFinal Resolution: {{ticket.resolutionNote}}\nUpdatedBy: {{actor}}\nUpdatedAt: {{now}}',
      active: true
    }
  ],
  connectors: [],
  mappings: [],
  workflows: [defaultWorkflow],
  tickets: [],
  events: [],
  ticketSeq: 1,
  queue: {
    pending: [],
    processing: [],
    done: [],
    failed: [],
    dlq: []
  },
  workers: {
    queueRunning: false,
    lastRunAt: null
  },
  notifications: []
};

globalThis.__SOC_STATE__ = state;

export function db() {
  return state;
}

export function uid(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function ensureTransition(fromStatus, toStatus) {
  const allowed = allowedTransitions[fromStatus] || [];
  return allowed.includes(toStatus);
}

function nextTicketKey() {
  const seq = state.ticketSeq++;
  const padded = String(seq).padStart(4, '0');
  return `SOC-${padded}`;
}

function severityToPriority(severity = 'medium') {
  if (severity === 'critical') return 'Highest';
  if (severity === 'high') return 'High';
  if (severity === 'medium') return 'Medium';
  return 'Low';
}

function defaultSlaDue(hours = 4) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function validateRequiredCustomFields(ticket, patchFields = {}) {
  const active = state.customFields.filter((f) => f.active && f.requiredOnResolve);
  if (active.length === 0) return null;

  const merged = { ...(ticket.customFields || {}), ...patchFields };
  const missing = active.filter((f) => !merged[f.name]).map((f) => f.name);
  return missing.length > 0 ? missing : null;
}

export function createTicketFromEvent(event, connector) {
  const idempotencyKey = `${event.tenantId}:${event.externalEventKey}`;
  const found = state.tickets.find((t) => t.idempotencyKey === idempotencyKey);
  if (found) {
    found.timeline.unshift({
      at: new Date().toISOString(),
      actor: 'system',
      action: 'duplicate_event_ignored',
      detail: `Duplicate event ignored (${event.externalEventKey})`
    });
    return found;
  }

  const priority = severityToPriority(event.severity);
  const ticket = {
    id: uid('tic'),
    key: nextTicketKey(),
    tenantId: event.tenantId,
    connectorId: connector.id,
    title: event.title || `${connector.type} Security Event`,
    severity: event.severity || 'medium',
    priority,
    status: 'New',
    summary: event.description || 'No description',
    raw: event.raw,
    idempotencyKey,
    assignee: null,
    reporter: 'SIEM Connector',
    labels: [connector.type, event.severity || 'medium'],
    resolutionNote: '',
    comments: [],
    customFields: event.customFields || {},
    slaDueAt: defaultSlaDue(priority === 'Highest' ? 1 : priority === 'High' ? 2 : 4),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [
      {
        at: new Date().toISOString(),
        actor: 'system',
        action: 'created',
        detail: 'Ticket created from SIEM event'
      }
    ]
  };

  state.tickets.unshift(ticket);
  return ticket;
}

export function updateTicket({ id, status, actor = 'analyst', comment, assignee, resolutionNote, priority, labels, customFields }) {
  const ticket = state.tickets.find((t) => t.id === id);
  if (!ticket) return { error: 'not found', statusCode: 404 };

  if (customFields && typeof customFields === 'object') {
    ticket.customFields = { ...(ticket.customFields || {}), ...customFields };
    ticket.timeline.unshift({
      at: new Date().toISOString(),
      actor,
      action: 'custom_fields',
      detail: 'Updated custom fields'
    });
  }

  if (status && status !== ticket.status) {
    if (!ensureTransition(ticket.status, status)) {
      return { error: `invalid transition: ${ticket.status} -> ${status}`, statusCode: 400 };
    }

    if (status === 'Resolved' || status === 'Closed') {
      if (!resolutionNote && !ticket.resolutionNote) {
        return { error: 'resolutionNote required before resolving/closing ticket', statusCode: 400 };
      }
      const missing = validateRequiredCustomFields(ticket, customFields || {});
      if (missing) {
        return { error: `required custom fields missing: ${missing.join(', ')}`, statusCode: 400 };
      }
    }

    ticket.status = status;
    ticket.timeline.unshift({
      at: new Date().toISOString(),
      actor,
      action: 'state_change',
      detail: `Changed status to ${ticket.status}`
    });
  }

  if (priority && priority !== ticket.priority) {
    ticket.priority = priority;
    ticket.timeline.unshift({
      at: new Date().toISOString(),
      actor,
      action: 'priority',
      detail: `Priority changed to ${priority}`
    });
  }

  if (labels) {
    ticket.labels = labels.split(',').map((x) => x.trim()).filter(Boolean);
    ticket.timeline.unshift({
      at: new Date().toISOString(),
      actor,
      action: 'labels',
      detail: `Labels updated: ${ticket.labels.join(', ')}`
    });
  }

  if (assignee !== undefined) {
    ticket.assignee = assignee || null;
    ticket.timeline.unshift({
      at: new Date().toISOString(),
      actor,
      action: 'assignment',
      detail: ticket.assignee ? `Assigned to ${ticket.assignee}` : 'Unassigned'
    });
  }

  if (resolutionNote) {
    ticket.resolutionNote = resolutionNote;
    ticket.timeline.unshift({
      at: new Date().toISOString(),
      actor,
      action: 'resolution_note',
      detail: resolutionNote
    });
  }

  if (comment) {
    const entry = {
      id: uid('cmt'),
      at: new Date().toISOString(),
      actor,
      text: comment
    };
    ticket.comments.unshift(entry);
    ticket.timeline.unshift({
      at: entry.at,
      actor,
      action: 'comment',
      detail: comment
    });
  }

  ticket.updatedAt = new Date().toISOString();
  return { ticket };
}
