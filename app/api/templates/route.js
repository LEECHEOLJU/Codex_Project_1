import { db, uid } from '@/lib/store';

export async function GET() {
  return Response.json(db().templates || []);
}

export async function POST(request) {
  const body = await request.json();
  const tpl = {
    id: uid('tpl'),
    name: body.name,
    triggerStatus: body.triggerStatus || 'Resolved',
    subjectTemplate: body.subjectTemplate,
    bodyTemplate: body.bodyTemplate,
    active: body.active !== false
  };
  db().templates.push(tpl);
  return Response.json(tpl, { status: 201 });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  db().templates = db().templates.filter((t) => t.id !== id);
  return Response.json({ ok: true });
}
