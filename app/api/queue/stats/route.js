import { queueStats } from '@/lib/queue';

export async function GET() {
  return Response.json(queueStats());
}
