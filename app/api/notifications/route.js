import { db } from '@/lib/store';

export async function GET() {
  return Response.json(db().notifications || []);
}
