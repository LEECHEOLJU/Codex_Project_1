import { db, uid } from '@/lib/store';

export async function GET() {
  return Response.json(db().connectors);
}

export async function POST(request) {
  const body = await request.json();
  const connector = {
    id: uid('con'),
    tenantId: body.tenantId,
    name: body.name,
    type: body.type,
    authType: body.authType,
    webhookKey: uid('hook'),
    status: 'active',
    createdAt: new Date().toISOString()
  };
  db().connectors.push(connector);
  return Response.json(connector, { status: 201 });
}
