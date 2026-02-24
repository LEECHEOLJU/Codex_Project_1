'use client';

import { useEffect, useState } from 'react';
import Nav from '@/components/Nav';

export default function NotificationsPage() {
  const [rows, setRows] = useState([]);

  const load = async () => {
    const data = await fetch('/api/notifications').then((r) => r.json());
    setRows(data);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="grid">
      <Nav />
      <div className="page-head">
        <h1>고객 통지 이력</h1>
        <p className="helper">티켓 상태가 Resolved/Closed로 전환될 때 발송된 고객 메일 로그입니다.</p>
      </div>

      <section className="card">
        <table className="table">
          <thead><tr><th>At</th><th>To</th><th>Subject</th><th>Ticket</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.createdAt}</td>
                <td>{r.to}</td>
                <td>{r.subject}</td>
                <td>{r.ticketId}</td>
                <td>{r.deliveryStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="helper">아직 발송된 메일이 없습니다.</p>}
      </section>
    </main>
  );
}
