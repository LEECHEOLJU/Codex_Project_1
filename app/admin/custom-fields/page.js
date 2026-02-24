'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

export default function CustomFieldsPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', label: '', type: 'text', requiredOnResolve: false });

  const load = async () => setRows(await fetch('/api/custom-fields').then((r) => r.json()));
  useEffect(() => { load(); }, []);

  const createField = async (e) => {
    e.preventDefault();
    await fetch('/api/custom-fields', { method: 'POST', body: JSON.stringify(form) });
    setForm({ name: '', label: '', type: 'text', requiredOnResolve: false });
    await load();
  };

  const remove = async (id) => {
    await fetch(`/api/custom-fields?id=${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <main className="grid">
      <Nav />
      <div className="page-head">
        <h1>커스텀 필드 관리</h1>
        <p className="helper">분석 필드를 생성/삭제하고 Resolved/Closed 시 필수 여부를 설정합니다.</p>
      </div>

      <form className="card" onSubmit={createField}>
        <div className="grid grid-3">
          <div><label>필드 키</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: root_cause" /></div>
          <div><label>표시명</label><input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
          <div><label>타입</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>text</option><option>number</option><option>select</option></select></div>
        </div>
        <label><input type="checkbox" checked={form.requiredOnResolve} onChange={(e) => setForm({ ...form, requiredOnResolve: e.target.checked })} style={{ width: 'auto', marginRight: 8 }} />Resolved/Closed 전 필수 입력</label>
        <button type="submit" style={{ marginTop: 10 }}>필드 생성</button>
      </form>

      <section className="card">
        <h3>필드 목록</h3>
        <table className="table">
          <thead><tr><th>Key</th><th>Label</th><th>Type</th><th>Required on Resolve</th><th></th></tr></thead>
          <tbody>{rows.map((f) => <tr key={f.id}><td>{f.name}</td><td>{f.label}</td><td>{f.type}</td><td>{String(f.requiredOnResolve)}</td><td><button className="secondary" onClick={() => remove(f.id)}>삭제</button></td></tr>)}</tbody>
        </table>
      </section>
    </main>
  );
}
