import { db, uid } from '@/lib/store';

function renderTemplate(text, ctx) {
  return text.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => {
    const path = key.trim().split('.');
    let cur = ctx;
    for (const p of path) cur = cur?.[p];
    return cur == null ? '' : String(cur);
  });
}

function resolveTemplate(status) {
  const tpls = db().templates || [];
  return tpls.find((t) => t.active && t.triggerStatus === status) || null;
}

export function notifyCustomer({ ticket, actor = 'system' }) {
  const tenant = db().tenants.find((t) => t.id === ticket.tenantId);
  const to = tenant?.contactEmail || `${tenant?.name || 'customer'}@example.com`;
  const tpl = resolveTemplate(ticket.status);

  const ctx = { ticket, actor, now: new Date().toISOString(), tenant };
  const subject = tpl ? renderTemplate(tpl.subjectTemplate, ctx) : `[${ticket.key}] ${ticket.status} - ${ticket.title}`;
  const body = tpl
    ? renderTemplate(tpl.bodyTemplate, ctx)
    : [
      `Ticket: ${ticket.key}`,
      `Status: ${ticket.status}`,
      `Priority: ${ticket.priority}`,
      `Summary: ${ticket.summary}`,
      `Resolution: ${ticket.resolutionNote || '-'}`,
      `UpdatedBy: ${actor}`,
      `UpdatedAt: ${ctx.now}`
    ].join('\n');

  const mail = {
    id: uid('mail'),
    to,
    subject,
    body,
    createdAt: ctx.now,
    ticketId: ticket.id,
    tenantId: ticket.tenantId,
    templateId: tpl?.id || null,
    deliveryStatus: 'sent'
  };

  if (!db().notifications) db().notifications = [];
  db().notifications.unshift(mail);

  ticket.timeline.unshift({
    at: ctx.now,
    actor: 'notification-service',
    action: 'customer_email_sent',
    detail: `Sent status update email to ${to}`
  });

  return mail;
}
