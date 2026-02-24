import { processQueue } from '@/lib/queue';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const batchSize = Number(body.batchSize || 20);
  const result = await processQueue(batchSize);
  return Response.json(result);
}
