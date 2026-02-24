import { db, uid } from '@/lib/store';

export async function GET() {
  return Response.json(db().users || []);
}

export async function POST(request) {
  const body = await request.json();
  const user = {
    id: uid('usr'),
    email: body.email,
    name: body.name,
    role: body.role || 'Analyst',
    tenantId: body.tenantId || 'all',
    status: body.status || 'active'
  };
  db().users.push(user);
  return Response.json(user, { status: 201 });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  db().users = db().users.filter((u) => u.id !== id);
  return Response.json({ ok: true });
}
