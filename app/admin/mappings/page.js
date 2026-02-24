'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

const defaultRule = { source: 'payload.severity', target: 'ticket.severity', transform: 'map_enum' };

export default function MappingsPage() {
  const [tenants, setTenants] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [form, setForm] = useState({ tenantId: '', connectorId: '', name: '', rules: [defaultRule] });

  const load = async () => {
    const [t, c, m] = await Promise.all([
      fetch('/api/tenants').then((r) => r.json()),
      fetch('/api/connectors').then((r) => r.json()),
      fetch('/api/mappings').then((r) => r.json())
    ]);
    setTenants(t);
    setConnectors(c);
    setMappings(m);
    if (!form.tenantId && t[0]) setForm((f) => ({ ...f, tenantId: t[0].id }));
    if (!form.connectorId && c[0]) setForm((f) => ({ ...f, connectorId: c[0].id }));
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await fetch('/api/mappings', { method: 'POST', body: JSON.stringify(form) });
    setForm((f) => ({ ...f, name: '', rules: [defaultRule] }));
    await load();
  };

  const addRule = () => setForm((f) => ({ ...f, rules: [...f.rules, { source: '', target: '', transform: '' }] }));

  return (
    <main className="grid">
      <Nav />
      <div className="page-head">
        <h1>필드 매핑 빌더</h1>
        <p className="helper">소스 JSON 필드를 티켓 커스텀 필드로 매핑합니다. 운영자가 UI에서 즉시 변경 가능합니다.</p>
      </div>

      <form className="card" onSubmit={save}>
        <div className="grid grid-3">
          <div><label>고객사</label><select value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}>{tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div><label>연동</label><select value={form.connectorId} onChange={(e) => setForm({ ...form, connectorId: e.target.value })}>{connectors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label>매핑 이름</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: Splunk-Default Mapping" /></div>
        </div>

        <h3 style={{ marginTop: 12 }}>Mapping Rules</h3>
        {form.rules.map((r, idx) => (
          <div className="grid grid-3" key={idx} style={{ marginBottom: 8 }}>
            <input placeholder="source (ex. payload.src_ip)" value={r.source} onChange={(e) => {
              const rules = [...form.rules]; rules[idx].source = e.target.value; setForm({ ...form, rules });
            }} />
            <input placeholder="target (ex. ticket.source_ip)" value={r.target} onChange={(e) => {
              const rules = [...form.rules]; rules[idx].target = e.target.value; setForm({ ...form, rules });
            }} />
            <input placeholder="transform (ex. regex_extract)" value={r.transform} onChange={(e) => {
              const rules = [...form.rules]; rules[idx].transform = e.target.value; setForm({ ...form, rules });
            }} />
          </div>
        ))}

        <div className="grid grid-2">
          <button className="secondary" type="button" onClick={addRule}>규칙 추가</button>
          <button type="submit">매핑 저장/배포</button>
        </div>
      </form>

      <section className="card">
        <h3>배포된 매핑 버전</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>Tenant</th><th>Connector</th><th>Rules</th><th>Version</th></tr></thead>
          <tbody>
            {mappings.map((m) => (
              <tr key={m.id}><td>{m.name}</td><td>{m.tenantId}</td><td>{m.connectorId}</td><td>{m.rules.length}</td><td>v{m.version}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
