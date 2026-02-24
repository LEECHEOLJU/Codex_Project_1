import { db, updateTicket } from '@/lib/store';
import { notifyCustomer } from '@/lib/notify';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').toLowerCase();
  const status = searchParams.get('status') || '';
  const assignee = searchParams.get('assignee') || '';

  let rows = db().tickets;
  if (status) rows = rows.filter((t) => t.status === status);
  if (assignee) rows = rows.filter((t) => (t.assignee || '') === assignee);
  if (q) {
    rows = rows.filter((t) =>
      [t.key, t.title, t.summary, t.tenantId, t.assignee, ...(t.labels || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }
  return Response.json(rows);
}

export async function PATCH(request) {
  const body = await request.json();
  const prev = db().tickets.find((x) => x.id === body.id)?.status;
  const result = updateTicket(body);
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.statusCode || 400 });
  }

  const changedTo = result.ticket.status;
  if (changedTo !== prev && (changedTo === 'Resolved' || changedTo === 'Closed')) {
    const mail = notifyCustomer({ ticket: result.ticket, actor: body.actor || 'analyst' });
    return Response.json({ ...result.ticket, notification: mail });
  }

  return Response.json(result.ticket);
}
