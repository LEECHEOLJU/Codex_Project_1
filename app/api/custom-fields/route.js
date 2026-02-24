import { db, uid } from '@/lib/store';

export async function GET() {
  return Response.json(db().customFields || []);
}

export async function POST(request) {
  const body = await request.json();
  const field = {
    id: uid('cf'),
    name: body.name,
    label: body.label,
    type: body.type || 'text',
    requiredOnResolve: !!body.requiredOnResolve,
    active: true
  };
  db().customFields.push(field);
  return Response.json(field, { status: 201 });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  db().customFields = db().customFields.filter((f) => f.id !== id);
  return Response.json({ ok: true });
}
