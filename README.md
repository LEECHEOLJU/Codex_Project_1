# SOC TicketOps Platform

멀티 SIEM 연동 기반 Jira 대체형 보안관제 티켓 플랫폼입니다.

## 포함 기능
- 고객사(Tenant) 관리 UI
- SIEM Connector Wizard (Splunk/Sentinel/로그프레소)
- 웹훅 키 자동 발급 및 연동 가이드 UI
- 필드 매핑 빌더(UI 기반 규칙 관리)
- 커스텀 필드 생성/삭제 및 필수 정책 설정
- 사용자 계정 생성/삭제 및 역할 관리
- 이메일 템플릿 생성/삭제 및 상태별 템플릿 적용
- 워크플로우 디자이너(UI 상태 정의)
- 분석가 Jira 스타일 티켓 워크벤치(List/Board)
- SIEM 이벤트 큐 시스템(Pending/Processing/Done/DLQ)
- 웹훅 이벤트 수신 API + 큐 워커 기반 티켓 생성(멱등성 키 처리)
- 상태전이 + 해결메모 + 커스텀필드 검증 로직
- 고객 통지 메일 로그 UI/API

## 로컬 실행
```bash
npm install
npm run dev
```

## Vercel 배포
1. GitHub에 push
2. Vercel에서 Import Project
3. Build command: `npm run build`
4. Start command: `npm run start` (Vercel 기본값 사용 가능)

## SIEM 연동 방법(UI)
1. **SIEM 연동 관리**에서 고객사 생성(연락 이메일 포함)
2. 연동 유형 선택 후 connector 생성
3. 발급된 Webhook URL 복사
4. SIEM에서 POST webhook 설정
5. **필드 매핑/커스텀 필드** 설정
6. **큐 운영** 페이지에서 처리 현황(Pending/DLQ) 모니터링

## API 요약
- `GET/POST /api/tenants`
- `GET/POST /api/connectors`
- `GET/POST /api/mappings`
- `GET/POST/DELETE /api/custom-fields`
- `GET/POST/DELETE /api/users`
- `GET/POST/DELETE /api/templates`
- `GET/PATCH /api/tickets`
- `POST /api/webhooks/{key}`
- `GET /api/queue/stats`
- `POST /api/queue/process`
- `GET /api/notifications`

## 상태변경→고객 메일 플로우
- 티켓 상태가 `Resolved` 또는 `Closed`로 변경되면 템플릿 기반 메일 로그가 생성됩니다.
- UI에서 `/admin/notifications` 페이지에서 발송 이력을 확인할 수 있습니다.

## 예시 이벤트 전송
```bash
curl -X POST http://localhost:3000/api/webhooks/<WEBHOOK_KEY> \
  -H "Content-Type: application/json" \
  -d '{
    "external_event_key": "evt-001",
    "title": "Suspicious Login",
    "severity": "high",
    "description": "Multiple failed logins",
    "src_ip": "1.2.3.4"
  }'
```

## 심층 구현 분석
- `IMPLEMENTATION_ANALYSIS.md` 문서에서 기술요건 반영률/플로우/남은 고도화를 확인할 수 있습니다.

> 참고: 현재 저장소 버전은 데모/검토용 인메모리 저장소를 사용합니다. 프로덕션에서는 Postgres/Redis/RabbitMQ/Celery + SMTP/SES 조합으로 교체해 영속성/고가용성을 확보하세요.
