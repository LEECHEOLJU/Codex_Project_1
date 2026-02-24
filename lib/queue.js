import { db, uid, createTicketFromEvent } from '@/lib/store';
import { applyMapping } from '@/lib/mapping';

const MAX_RETRY = 3;

function nowIso() {
  return new Date().toISOString();
}

export function enqueueEvent({ connector, payload }) {
  const item = {
    id: uid('job'),
    connectorId: connector.id,
    tenantId: connector.tenantId,
    status: 'pending',
    retryCount: 0,
    enqueuedAt: nowIso(),
    externalEventKey: payload.external_event_key || payload.sid || uid('ext'),
    payload
  };

  db().queue.pending.push(item);
  return item;
}

function buildBaseEvent(job, connector) {
  const payload = job.payload || {};
  return {
    id: uid('evt'),
    tenantId: connector.tenantId,
    connectorId: connector.id,
    externalEventKey: job.externalEventKey,
    title: payload.title || payload.search_name || `${connector.type} alert`,
    severity: payload.severity || 'medium',
    description: payload.description || payload.message || 'No description',
    raw: payload,
    createdAt: nowIso()
  };
}

function moveToDlq(job, error) {
  job.status = 'dead_letter';
  job.failedAt = nowIso();
  job.error = error;
  db().queue.dlq.unshift(job);
}

function markDone(job, ticket) {
  job.status = 'done';
  job.completedAt = nowIso();
  job.ticketId = ticket.id;
  db().queue.done.unshift(job);
}

function markFailed(job, error) {
  job.retryCount += 1;
  job.lastError = error;
  job.lastTriedAt = nowIso();

  if (job.retryCount >= MAX_RETRY) {
    moveToDlq(job, error);
    return;
  }

  job.status = 'pending';
  db().queue.pending.push(job);
  db().queue.failed.unshift({
    id: uid('fail'),
    jobId: job.id,
    at: nowIso(),
    error,
    retryCount: job.retryCount
  });
}

export async function processQueue(batchSize = 20) {
  const s = db();
  if (s.workers.queueRunning) {
    return { skipped: true, reason: 'worker_already_running' };
  }

  s.workers.queueRunning = true;
  s.workers.lastRunAt = nowIso();

  let processed = 0;
  let createdTickets = 0;
  let retried = 0;
  let dlq = 0;

  try {
    while (s.queue.pending.length > 0 && processed < batchSize) {
      const job = s.queue.pending.shift();
      job.status = 'processing';
      s.queue.processing.push(job);

      const connector = s.connectors.find((c) => c.id === job.connectorId);
      if (!connector) {
        s.queue.processing = s.queue.processing.filter((x) => x.id !== job.id);
        moveToDlq(job, 'connector_not_found');
        dlq += 1;
        processed += 1;
        continue;
      }

      try {
        if (connector.type === 'splunk' && job.payload?.sid && !job.payload?.results) {
          job.payload.results = [{ mocked: true, sid: job.payload.sid }];
        }

        const base = buildBaseEvent(job, connector);
        const mappedEvent = applyMapping({ connectorId: connector.id, payload: job.payload, base });

        s.events.unshift(mappedEvent);
        const beforeCount = s.tickets.length;
        const ticket = createTicketFromEvent(mappedEvent, connector);
        if (mappedEvent.customFields) ticket.customFields = mappedEvent.customFields;
        const afterCount = s.tickets.length;

        markDone(job, ticket);
        createdTickets += afterCount > beforeCount ? 1 : 0;
      } catch (err) {
        markFailed(job, err?.message || 'processing_failed');
        if (job.retryCount >= MAX_RETRY) dlq += 1;
        else retried += 1;
      } finally {
        s.queue.processing = s.queue.processing.filter((x) => x.id !== job.id);
        processed += 1;
      }
    }

    return { processed, createdTickets, retried, dlq, pending: s.queue.pending.length };
  } finally {
    s.workers.queueRunning = false;
  }
}

export function queueStats() {
  const q = db().queue;
  return {
    pending: q.pending.length,
    processing: q.processing.length,
    done: q.done.length,
    failed: q.failed.length,
    dlq: q.dlq.length,
    lastDone: q.done[0] || null,
    lastDlq: q.dlq[0] || null
  };
}
