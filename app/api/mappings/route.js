import { db, uid } from '@/lib/store';

export async function GET() {
  return Response.json(db().mappings);
}

export async function POST(request) {
  const body = await request.json();
  const mapping = {
    id: uid('map'),
    tenantId: body.tenantId,
    connectorId: body.connectorId,
    name: body.name,
    rules: body.rules || [],
    version: 1,
    status: 'published',
    createdAt: new Date().toISOString()
  };
  db().mappings.push(mapping);
  return Response.json(mapping, { status: 201 });
}
