import { db, uid } from '@/lib/store';

export async function GET() {
  return Response.json(db().tenants);
}

export async function POST(request) {
  const body = await request.json();
  const tenant = {
    id: uid('tenant'),
    name: body.name,
    contactEmail: body.contactEmail || `${(body.name || 'customer').replace(/\s+/g, '-').toLowerCase()}@example.com`,
    status: 'active'
  };
  db().tenants.push(tenant);
  return Response.json(tenant, { status: 201 });
}
