'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

export default function TemplatesPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    name: '',
    triggerStatus: 'Resolved',
    subjectTemplate: '[{{ticket.key}}] {{ticket.status}} - {{ticket.title}}',
    bodyTemplate: 'Ticket: {{ticket.key}}\\nStatus: {{ticket.status}}\\nResolution: {{ticket.resolutionNote}}',
    active: true
  });

  const load = async () => setRows(await fetch('/api/templates').then((r) => r.json()));
  useEffect(() => { load(); }, []);

  const createTemplate = async (e) => {
    e.preventDefault();
    await fetch('/api/templates', { method: 'POST', body: JSON.stringify(form) });
    setForm({ ...form, name: '' });
    await load();
  };

  const remove = async (id) => {
    await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <main className="grid">
      <Nav />
      <div className="page-head">
        <h1>이메일 템플릿 관리</h1>
        <p className="helper">상태 전환 기반 고객 메일 제목/본문 템플릿을 관리합니다. 변수: {'{{ticket.key}}'} 등</p>
      </div>

      <form className="card" onSubmit={createTemplate}>
        <div className="grid grid-2">
          <div><label>템플릿 이름</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label>트리거 상태</label><select value={form.triggerStatus} onChange={(e) => setForm({ ...form, triggerStatus: e.target.value })}><option>Resolved</option><option>Closed</option></select></div>
        </div>
        <label>메일 제목 템플릿</label>
        <input value={form.subjectTemplate} onChange={(e) => setForm({ ...form, subjectTemplate: e.target.value })} />
        <label>메일 본문 템플릿</label>
        <textarea rows={6} value={form.bodyTemplate} onChange={(e) => setForm({ ...form, bodyTemplate: e.target.value })} />
        <button type="submit" style={{ marginTop: 10 }}>템플릿 저장</button>
      </form>

      <section className="card">
        <h3>템플릿 목록</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>Trigger</th><th>Subject</th><th>Active</th><th></th></tr></thead>
          <tbody>{rows.map((t) => <tr key={t.id}><td>{t.name}</td><td>{t.triggerStatus}</td><td>{t.subjectTemplate}</td><td>{String(t.active)}</td><td><button className="secondary" onClick={() => remove(t.id)}>삭제</button></td></tr>)}</tbody>
        </table>
      </section>
    </main>
  );
}
