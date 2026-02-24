import { db } from '@/lib/store';

export async function PATCH(request, { params }) {
  const body = await request.json();
  const connector = db().connectors.find((c) => c.id === params.id);
  if (!connector) return Response.json({ error: 'not found' }, { status: 404 });

  Object.assign(connector, body, { updatedAt: new Date().toISOString() });
  return Response.json(connector);
}
