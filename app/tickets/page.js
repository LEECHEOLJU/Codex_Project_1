'use client';

import { useEffect, useMemo, useState } from 'react';
import Nav from '@/components/Nav';

const states = ['New', 'Triage', 'Analyzing', 'Pending Customer', 'Resolved', 'Closed'];
const priorities = ['Highest', 'High', 'Medium', 'Low'];

function slaTone(date) {
  const remain = new Date(date).getTime() - Date.now();
  if (remain <= 0) return 'sla-overdue';
  if (remain < 1000 * 60 * 60) return 'sla-soon';
  return 'sla-ok';
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('list');
  const [filters, setFilters] = useState({ q: '', status: '' });
  const [fieldDefs, setFieldDefs] = useState([]);
  const [form, setForm] = useState({ assignee: '', comment: '', resolutionNote: '', priority: 'Medium', labels: '', customFields: {} });

  const load = async () => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.status) params.set('status', filters.status);

    const [ticketsData, fieldsData] = await Promise.all([
      fetch(`/api/tickets?${params.toString()}`).then((r) => r.json()),
      fetch('/api/custom-fields').then((r) => r.json())
    ]);
    setTickets(ticketsData);
    setFieldDefs(fieldsData.filter((f) => f.active));
    if (!selected && ticketsData[0]) setSelected(ticketsData[0]);
    if (selected) {
      const updated = ticketsData.find((x) => x.id === selected.id);
      if (updated) setSelected(updated);
    }
  };

  useEffect(() => { load(); }, [filters.q, filters.status]);

  useEffect(() => {
    if (!selected) return;
    setForm({
      assignee: selected.assignee || '',
      comment: '',
      resolutionNote: selected.resolutionNote || '',
      priority: selected.priority || 'Medium',
      labels: (selected.labels || []).join(', '),
      customFields: { ...(selected.customFields || {}) }
    });
  }, [selected?.id]);

  const grouped = useMemo(() => states.reduce((acc, s) => {
    acc[s] = tickets.filter((t) => t.status === s);
    return acc;
  }, {}), [tickets]);

  const applyUpdate = async (status = selected?.status) => {
    if (!selected) return;
    setError('');

    const res = await fetch('/api/tickets', {
      method: 'PATCH',
      body: JSON.stringify({
        id: selected.id,
        status,
        assignee: form.assignee,
        comment: form.comment,
        resolutionNote: form.resolutionNote,
        priority: form.priority,
        labels: form.labels,
        customFields: form.customFields,
        actor: 'analyst'
      })
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || 'update failed');
      return;
    }
    setSelected(body);
    setForm((f) => ({ ...f, comment: '' }));
    await load();
  };

  const renderTicketCard = (t) => (
    <div key={t.id} className={`ticket ticket-row ${selected?.id === t.id ? 'selected' : ''}`} onClick={() => setSelected(t)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <strong>{t.key}</strong>
        <span className={`sla-chip ${slaTone(t.slaDueAt)}`}>SLA</span>
      </div>
      <div style={{ marginTop: 4 }}>{t.title}</div>
      <div className="helper" style={{ marginTop: 6 }}>{t.priority} · {t.severity} · {t.assignee || 'Unassigned'}</div>
      <div style={{ marginTop: 6 }}>
        {(t.labels || []).slice(0, 3).map((lb) => <span key={lb} className="badge">{lb}</span>)}
      </div>
    </div>
  );

  return (
    <main className="grid">
      <Nav />
      <div className="page-head">
        <h1>티켓 워크벤치</h1>
        <p className="helper">Jira 스타일 리스트/보드 뷰, 검색 필터, 우선순위·라벨·SLA 기반 처리 흐름을 제공합니다.</p>
      </div>

      <section className="card toolbar">
        <div className="grid grid-3">
          <input placeholder="키/제목/라벨 검색 (예: SOC-0001 bruteforce)" value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">전체 상태</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={view === 'list' ? '' : 'secondary'} onClick={() => setView('list')} type="button">List</button>
            <button className={view === 'board' ? '' : 'secondary'} onClick={() => setView('board')} type="button">Board</button>
          </div>
        </div>
      </section>

      {view === 'list' ? (
        <div className="columns">
          <section className="card">
            <h3>이슈 목록</h3>
            {tickets.map(renderTicketCard)}
            {tickets.length === 0 && <p className="helper">조회된 티켓이 없습니다.</p>}
          </section>

          <section className="card">
            <h3>이슈 상세</h3>
            {!selected && <p className="helper">티켓을 선택하세요.</p>}
            {selected && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{selected.key} · {selected.title}</strong>
                  <span className="badge">{selected.status}</span>
                </div>
                <p className="helper" style={{ marginTop: 8 }}>Reporter: {selected.reporter} · Tenant: {selected.tenantId}</p>
                <p>{selected.summary}</p>
                <h4>원본 이벤트(JSON)</h4>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(selected.raw, null, 2)}</pre>

                {selected.customFields && Object.keys(selected.customFields).length > 0 && (
                  <>
                    <h4>매핑된 커스텀 필드</h4>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(selected.customFields, null, 2)}</pre>
                  </>
                )}
              </>
            )}
          </section>

          <section className="card">
            <h3>업데이트</h3>
            {!selected ? <p className="helper">선택된 티켓 없음</p> : (
              <>
                <label>상태 전이</label>
                <select defaultValue={selected.status} onChange={(e) => applyUpdate(e.target.value)}>
                  {states.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>

                <label>우선순위</label>
                <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                  {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>

                <label>담당자</label>
                <input value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} placeholder="예: analyst-1" />

                <label>라벨(쉼표구분)</label>
                <input value={form.labels} onChange={(e) => setForm((f) => ({ ...f, labels: e.target.value }))} placeholder="malware, endpoint, customer-a" />

                {fieldDefs.length > 0 && <h4 style={{ marginTop: 12 }}>커스텀 필드</h4>}
                {fieldDefs.map((fd) => (
                  <div key={fd.id}>
                    <label>{fd.label} ({fd.name}) {fd.requiredOnResolve ? '*' : ''}</label>
                    <input value={form.customFields?.[fd.name] || ''} onChange={(e) => setForm((f) => ({ ...f, customFields: { ...(f.customFields || {}), [fd.name]: e.target.value } }))} />
                  </div>
                ))}

                <label>코멘트</label>
                <textarea rows={3} value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} placeholder="분석 메모" />

                <label>해결 메모 (Resolved/Closed 전 필수)</label>
                <textarea rows={3} value={form.resolutionNote} onChange={(e) => setForm((f) => ({ ...f, resolutionNote: e.target.value }))} placeholder="조치 및 근거" />

                <button onClick={() => applyUpdate(selected.status)} type="button" style={{ marginTop: 10 }}>변경사항 저장</button>
                {error && <p className="error">{error}</p>}

                <h4 style={{ marginTop: 12 }}>활동</h4>
                {(selected.timeline || []).map((x, i) => (
                  <div key={i} className="ticket">
                    <strong>{x.action}</strong>
                    <div className="helper">{x.at}</div>
                    <div>{x.detail}</div>
                  </div>
                ))}
              </>
            )}
          </section>
        </div>
      ) : (
        <section className="board-grid">
          {states.map((s) => (
            <div key={s} className="card board-col">
              <h3>{s} <span className="badge">{grouped[s]?.length || 0}</span></h3>
              {(grouped[s] || []).map(renderTicketCard)}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
