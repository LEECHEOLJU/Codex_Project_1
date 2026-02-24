import Nav from '@/components/Nav';
import { db } from '@/lib/store';

export default function HomePage() {
  const s = db();

  return (
    <main className="grid" style={{ gap: 20 }}>
      <Nav />
      <div className="page-head">
        <h1>SOC TicketOps Platform</h1>
        <p className="helper">Jira 대체형 멀티 SIEM 티켓 운영 플랫폼 (No-Code 관리자 콘솔 포함)</p>
      </div>

      <section className="grid grid-3">
        <div className="card kpi"><span className="label">고객사</span><span className="value">{s.tenants.length}</span></div>
        <div className="card kpi"><span className="label">연동된 SIEM</span><span className="value">{s.connectors.length}</span></div>
        <div className="card kpi"><span className="label">티켓</span><span className="value">{s.tickets.length}</span></div>
      </section>

      <section className="grid grid-3">
        <div className="card kpi"><span className="label">사용자 계정</span><span className="value">{s.users?.length || 0}</span></div>
        <div className="card kpi"><span className="label">커스텀 필드</span><span className="value">{s.customFields?.length || 0}</span></div>
        <div className="card kpi"><span className="label">이메일 템플릿</span><span className="value">{s.templates?.length || 0}</span></div>
      </section>

      <section className="grid grid-3">
        <div className="card kpi"><span className="label">Queue Pending</span><span className="value">{s.queue.pending.length}</span></div>
        <div className="card kpi"><span className="label">Queue Done</span><span className="value">{s.queue.done.length}</span></div>
        <div className="card kpi"><span className="label">Queue DLQ</span><span className="value">{s.queue.dlq.length}</span></div>
      </section>

      <section className="card">
        <h2>운영 절차</h2>
        <ol>
          <li>SIEM 연동 관리에서 고객사/커넥터를 생성하고 웹훅 키를 발급합니다.</li>
          <li>필드 매핑 및 커스텀 필드를 구성해 티켓 입력 스키마를 정의합니다.</li>
          <li>워크플로우/사용자 계정/메일 템플릿을 운영 정책에 맞게 설정합니다.</li>
          <li>Webhook 호출 시 이벤트는 Queue에 적재되고 Worker가 티켓을 생성합니다.</li>
          <li>분석가가 티켓 처리 후 상태를 Resolved/Closed로 변경하면 고객 메일 로그가 생성됩니다.</li>
        </ol>
      </section>
    </main>
  );
}
