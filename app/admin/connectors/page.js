'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

export default function ConnectorsPage() {
  const [tenants, setTenants] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [form, setForm] = useState({ tenantId: '', name: '', type: 'splunk', authType: 'token' });

  const load = async () => {
    const [t, c] = await Promise.all([fetch('/api/tenants').then((r) => r.json()), fetch('/api/connectors').then((r) => r.json())]);
    setTenants(t);
    setConnectors(c);
    if (!form.tenantId && t[0]) setForm((f) => ({ ...f, tenantId: t[0].id }));
  };

  useEffect(() => { load(); }, []);

  const createTenant = async () => {
    const name = prompt('신규 고객사 이름을 입력하세요');
    if (!name) return;
    const contactEmail = prompt('고객 담당자 이메일(알림 수신용)을 입력하세요', `${name.replace(/\s+/g, '-').toLowerCase()}@example.com`) || '';
    await fetch('/api/tenants', { method: 'POST', body: JSON.stringify({ name, contactEmail }) });
    await load();
  };

  const createConnector = async (e) => {
    e.preventDefault();
    await fetch('/api/connectors', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    await load();
  };

  return (
    <main className="grid">
      <Nav />
      <div className="page-head">
      <h1>SIEM 연동 관리</h1>
      <p className="helper">코드 수정 없이 고객사/연동을 추가하고 웹훅 키를 발급합니다.</p>
      </div>

      <section className="grid grid-2">
        <div className="card">
          <h3>1) 고객사 관리</h3>
          <button className="secondary" onClick={createTenant}>고객사 추가</button>
          <table className="table" style={{ marginTop: 12 }}>
            <thead><tr><th>Tenant</th><th>Contact Email</th><th>Status</th></tr></thead>
            <tbody>{tenants.map((t) => <tr key={t.id}><td>{t.name}</td><td>{t.contactEmail}</td><td>{t.status}</td></tr>)}</tbody>
          </table>
        </div>

        <form className="card" onSubmit={createConnector}>
          <h3>2) SIEM Connector Wizard</h3>
          <label>고객사</label>
          <select value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <label>연동 이름</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: Splunk-Prod" />
          <label>SIEM 타입</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="splunk">Splunk</option>
            <option value="sentinel">Microsoft Sentinel</option>
            <option value="logpresso">로그프레소</option>
          </select>
          <label>인증 방식</label>
          <select value={form.authType} onChange={(e) => setForm({ ...form, authType: e.target.value })}>
            <option value="token">Token</option>
            <option value="oauth">OAuth</option>
            <option value="hmac">HMAC</option>
          </select>
          <button type="submit" style={{ marginTop: 10 }}>연동 생성</button>
        </form>
      </section>

      <section className="card">
        <h3>3) 발급된 연동 목록 + UI 가이드</h3>
        <table className="table">
          <thead><tr><th>Name</th><th>SIEM</th><th>Webhook URL</th><th>설정 가이드</th></tr></thead>
          <tbody>
            {connectors.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.type}</td>
                <td><code>{`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/${c.webhookKey}`}</code></td>
                <td>
                  {c.type === 'splunk' && 'Alert Action에서 Webhook POST, sid/results_link 포함'}
                  {c.type === 'sentinel' && 'Logic App/Automation Rule에서 HTTP POST 설정'}
                  {c.type === 'logpresso' && 'Event forwarding rule에서 JSON webhook 전송'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
