'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ email: '', name: '', role: 'Analyst', tenantId: 'all' });

  const load = async () => setRows(await fetch('/api/users').then((r) => r.json()));
  useEffect(() => { load(); }, []);

  const createUser = async (e) => {
    e.preventDefault();
    await fetch('/api/users', { method: 'POST', body: JSON.stringify(form) });
    setForm({ email: '', name: '', role: 'Analyst', tenantId: 'all' });
    await load();
  };

  const remove = async (id) => {
    await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <main className="grid">
      <Nav />
      <div className="page-head">
        <h1>사용자 계정 관리</h1>
        <p className="helper">분석가/관리자 계정을 생성하고 역할을 부여합니다.</p>
      </div>

      <form className="card" onSubmit={createUser}>
        <div className="grid grid-2">
          <div><label>이름</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label>이메일</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label>역할</label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>Global Admin</option><option>Tenant Admin</option><option>Analyst</option><option>Auditor</option></select></div>
          <div><label>Tenant Scope</label><input value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} /></div>
        </div>
        <button type="submit" style={{ marginTop: 10 }}>사용자 생성</button>
      </form>

      <section className="card">
        <h3>사용자 목록</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Tenant</th><th>Status</th><th></th></tr></thead>
          <tbody>{rows.map((u) => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.tenantId}</td><td>{u.status}</td><td><button className="secondary" onClick={() => remove(u.id)}>삭제</button></td></tr>)}</tbody>
        </table>
      </section>
    </main>
  );
}
