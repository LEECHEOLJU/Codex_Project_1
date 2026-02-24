'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

export default function QueuePage() {
  const [stats, setStats] = useState(null);
  const [batchSize, setBatchSize] = useState(20);
  const [lastRun, setLastRun] = useState(null);

  const load = async () => {
    const data = await fetch('/api/queue/stats').then((r) => r.json());
    setStats(data);
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, []);

  const runWorker = async () => {
    const result = await fetch('/api/queue/process', {
      method: 'POST',
      body: JSON.stringify({ batchSize })
    }).then((r) => r.json());
    setLastRun(result);
    await load();
  };

  return (
    <main className="grid">
      <Nav />
      <div className="page-head">
      <h1>SIEM Queue 운영 센터</h1>
      <p className="helper">Webhook 이벤트는 Queue로 수신되며 Worker가 Ticket 생성을 처리합니다.</p>
      </div>

      <section className="grid grid-3">
        <div className="card"><h3>Pending</h3><p>{stats?.pending ?? '-'}</p></div>
        <div className="card"><h3>Processing</h3><p>{stats?.processing ?? '-'}</p></div>
        <div className="card"><h3>DLQ</h3><p>{stats?.dlq ?? '-'}</p></div>
      </section>

      <section className="card">
        <h3>Worker 실행</h3>
        <div className="grid grid-2">
          <div>
            <label>Batch Size</label>
            <input type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} />
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button onClick={runWorker}>Queue 처리 실행</button>
          </div>
        </div>
        {lastRun && <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(lastRun, null, 2)}</pre>}
      </section>

      <section className="card">
        <h3>운영 가이드</h3>
        <ul>
          <li>SIEM에서 유입된 이벤트는 먼저 Pending queue에 적재됩니다.</li>
          <li>Worker는 멱등키 기준 중복 제거 후 티켓을 생성합니다.</li>
          <li>처리 실패는 재시도 후 DLQ로 이동하며, 운영자가 원인 분석 후 재처리합니다.</li>
        </ul>
      </section>
    </main>
  );
}
