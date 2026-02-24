'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [form, setForm] = useState({ name: '', states: 'New,Triage,Analyzing,Pending Customer,Resolved,Closed' });

  const load = async () => setWorkflows(await fetch('/api/workflows').then((r) => r.json()));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await fetch('/api/workflows', {
      method: 'POST',
      body: JSON.stringify({ name: form.name, states: form.states.split(',').map((s) => s.trim()).filter(Boolean) })
    });
    setForm({ ...form, name: '' });
    await load();
  };

  return (
    <main className="grid">
      <Nav />
      <div className="page-head">
        <h1>워크플로우 디자이너</h1>
        <p className="helper">분석 단계 상태 전이 규칙을 UI에서 설계/변경합니다.</p>
      </div>

      <form className="card" onSubmit={save}>
        <label>워크플로우 이름</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 금융고객사 워크플로우" />
        <label>상태 목록 (쉼표 구분)</label>
        <textarea rows={4} value={form.states} onChange={(e) => setForm({ ...form, states: e.target.value })} />
        <button type="submit" style={{ marginTop: 10 }}>저장</button>
      </form>

      <section className="card">
        <h3>저장된 워크플로우</h3>
        {workflows.map((wf) => (
          <div key={wf.id} className="ticket">
            <strong>{wf.name}</strong>
            <div className="helper">{wf.states.join(' → ')}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
