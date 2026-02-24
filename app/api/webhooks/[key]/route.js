import { db } from '@/lib/store';
import { enqueueEvent, processQueue } from '@/lib/queue';

export async function POST(request, { params }) {
  const payload = await request.json();
  const connector = db().connectors.find((c) => c.webhookKey === params.key);
  if (!connector) return Response.json({ error: 'Invalid webhook key' }, { status: 404 });

  const job = enqueueEvent({ connector, payload });

  // Fire-and-process pattern: acknowledge quickly, process asynchronously.
  queueMicrotask(() => {
    processQueue(50).catch(() => null);
  });

  return Response.json({ accepted: true, queueJobId: job.id, status: 'queued' }, { status: 202 });
}
