import { db, uid } from '@/lib/store';

export async function GET() {
  return Response.json(db().workflows);
}

export async function POST(request) {
  const body = await request.json();
  const wf = {
    id: uid('wf'),
    name: body.name,
    states: body.states,
    createdAt: new Date().toISOString()
  };
  db().workflows.push(wf);
  return Response.json(wf, { status: 201 });
}
