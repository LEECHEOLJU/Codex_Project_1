# A-Z 프로그램 개발 백과사전 PRD
## 멀티 SIEM 연동형 Jira 대체 AI SOC TicketOps Platform

---

## 0. 문서 메타
- 문서 버전: v2.0 (상세화)
- 대상 독자: CISO, SOC 매니저, 제품기획, 백엔드/프론트엔드/데브옵스/보안엔지니어
- 문서 목적: **"코드 수정 없이 UI 중심 운영"**을 전제로, 실제 구축 가능한 수준의 아키텍처/기술스택/운영체계/검증전략을 A-Z 관점으로 정의

---

## 1. 프로젝트 정의 (한 줄)
**다양한 SIEM(Splunk/Sentinel/로그프레소 등) 이벤트를 무손실 수집하고, 고객사별 정책·필드·워크플로우를 UI에서 설정해, 보안분석가의 티켓 처리와 고객 통지까지 자동화하는 멀티테넌트 SOC 운영 플랫폼**.

---

## 2. 왜 지금 이 플랫폼이 필요한가
### 2.1 현재 Jira 기반 운영의 한계
- SIEM별 payload 차이와 고객사별 필드 요구가 커질수록 운영 복잡도 폭증
- 신규 고객사/신규 SIEM 추가 시 개발자 의존성이 높음
- 보안관제 특화 UI 부재(3-Pane 분석 워크벤치 필요)
- 유실/중복/감사추적/규제준수 요건 충족에 커스텀 개발 필요

### 2.2 이 플랫폼의 차별점
- **No-Code Ops**: 커넥터, 매핑, 워크플로우, 권한, 알림을 UI에서 설정
- **SOC-native UX**: 분석가가 한 화면에서 triage→분석→조치→보고 완료
- **Reliability-first**: 큐+멱등성+DLQ+재처리로 무손실 지향
- **AI-ready**: 초기 요약/추천부터 단계적 자동화까지 확장

---

## 3. 제품 원칙 (Product Principles)
1. **안정성 우선**: 기능보다 유실 방지, 중복 통제, 추적성을 우선
2. **설정 중심**: 고객사 요구 변화는 코드가 아니라 설정으로 반영
3. **테넌트 격리 기본값**: 보안/권한/데이터 경계는 설계 1순위
4. **분석가 생산성 중심**: 클릭 수 최소화, 컨텍스트 스위칭 제거
5. **검증 가능한 자동화**: 자동화는 반드시 근거/감사 로그를 남김

---

## 4. 범위
### 4.1 MVP 포함
- 멀티 SIEM 수집(Webhook 중심 + 필요시 Pull)
- 매핑 엔진(UI 기반)
- 티켓/워크플로우 엔진
- 분석가 워크벤치(3-Pane)
- 관리자 콘솔(고객사, 연동, 권한, 템플릿)
- 메일 통지 및 감사로그

### 4.2 차기 릴리즈
- 고객 포털
- AI 분석 고도화(RAG/TI 연동)
- SOAR 플레이북 실행
- 고급 리포트/청구(SLA 가시화)

---

## 5. A-Z 구현 백과사전

### A. Architecture
- 권장 아키텍처: **이벤트 기반 모듈형 모놀리스 → 점진적 마이크로서비스 분리**
- 흐름: `Webhook/API Gateway → Queue → Normalizer → Mapping Engine → Ticket Service → Notification`
- 핵심 보장:
  - Ingestion ACK는 큐 영속화 성공 이후 반환
  - Processing은 at-least-once 전제, DB 레벨 멱등성 보장

### B. Broker / Buffering
- 후보: RabbitMQ(우선), Kafka(대규모 확장 시)
- 큐 설계:
  - `ingestion.raw`, `processing.normalize`, `processing.ticket`, `notification.email`, `dlq.*`
  - 메시지 TTL + DLQ 라우팅 + retry backoff
- 운영지표: 큐 길이, 소비지연, 재시도율, DLQ 증가율

### C. Connector Framework
- 커넥터 타입:
  - Push(Webhook) / Pull(API polling)
- 공통 인터페이스:
  - `validate(payload)`
  - `extract_identity()` (sid/event_id)
  - `fetch_full_results()` (Splunk sid 역조회)
  - `normalize()`
- 지원 우선순위: Splunk → Sentinel → 로그프레소

### D. Data Model
- 주요 테이블:
  - `tenants`, `users`, `roles`, `permissions`, `user_role_bindings`
  - `siem_connectors`, `connector_secrets_ref`, `ingestion_events`
  - `mapping_profiles`, `mapping_profile_versions`
  - `workflow_defs`, `workflow_states`, `workflow_transitions`
  - `tickets`, `ticket_fields`, `ticket_events`, `ticket_assignments`
  - `notification_rules`, `notification_templates`, `audit_logs`
- 핵심 유니크키:
  - `UNIQUE(tenant_id, external_event_key)`

### E. Event Contract
- 사내 표준 스키마(Canonical Event):
  - `event_time`, `source`, `tenant`, `severity`, `title`, `description`, `entities[]`, `raw_ref`
- 원본은 object storage에 저장, DB에는 참조 포인터 저장
- 버전드 스키마(`schema_version`)로 하위호환 유지

### F. Field Mapping Engine
- 표현식: JSONPath/JMESPath + 함수 파이프라인
- 함수 예시:
  - `coalesce()`, `regex_extract()`, `to_int()`, `to_datetime()`, `map_enum()`, `concat()`, `hash()`
- 검증:
  - 샘플 페이로드 dry-run
  - 필수 필드 누락 경고
  - 배포 전 테스트 통과 필수

### G. Governance
- 변경관리:
  - 설정 변경은 Draft→Review→Publish
  - 민감 설정(권한/워크플로우)은 2인 승인
- 감사정책:
  - 모든 설정 변경과 티켓 상태 변경은 immutable audit log 기록

### H. High Availability
- 구성:
  - Receiver/Worker 다중 인스턴스
  - DB multi-AZ, 자동 백업
  - Queue mirrored/HA 정책
- 목표:
  - SLA 99.9% (MVP), 99.95% (고도화)

### I. Idempotency
- 키 전략:
  - Splunk: `sid + result_offset`
  - Sentinel: `alert_id`
  - 로그프레소: `event_uuid`
- 처리:
  - upsert + 중복 카운트 로깅
  - 동일 이벤트 재수신 시 ticket 중복 생성 금지

### J. Job Orchestration
- 비동기 작업: Celery/Arq/RQ 중 선택 (초기 Celery 권장)
- 큐별 worker 분리:
  - `normalizer-worker`, `mapping-worker`, `notification-worker`
- 재시도:
  - exponential backoff + 최대 재시도 횟수 + DLQ

### K. Key Management
- Secrets 저장:
  - Vault or Cloud Secret Manager
- 원칙:
  - 평문 키 저장 금지
  - 키 회전 정책(예: 90일)
  - 관리자 UI에서도 마스킹

### L. Logging / Observability
- 구조화 로그(JSON), request_id / event_id / ticket_id 필수
- OpenTelemetry 기반 trace 연계
- 대시보드:
  - ingestion success rate
  - ticket creation latency
  - workflow lead time
  - SLA breach rate

### M. Multi-Tenancy
- 격리 모델: Shared DB + Strict Tenant Key + RLS
- 쿼리 규칙:
  - 모든 비즈니스 테이블에 `tenant_id` 필수
  - 서비스 계층에서 tenant context 누락 시 즉시 거부

### N. Notification Engine
- 트리거:
  - 상태 전이, SLA 임박/위반, 분석 완료
- 채널:
  - MVP: Email
  - 확장: Slack/Teams/Webhook/SMS
- 템플릿:
  - Jinja2/Mustache + 다국어/고객사별 템플릿

### O. Operations Model
- 운영조직 권장:
  - L1 운영(관제), L2 플랫폼운영, L3 개발
- Runbook 필수 항목:
  - DLQ 급증 대응
  - 커넥터 인증만료 대응
  - 매핑 오류 롤백 절차

### P. Performance & Capacity
- 기준 용량:
  - 기본 500 events/day, burst 5,000/day
- 목표 성능:
  - event→ticket P95 30초 이하
  - UI 검색 응답 P95 2초 이하
- 스케일링:
  - worker HPA(큐 길이 기반)
  - DB 인덱스 + 파티셔닝(월별 ingestion_events)

### Q. Quality Engineering
- 테스트 전략:
  - Unit(변환함수/상태전이), Integration(커넥터), E2E(수집→티켓→통지)
- 계약 테스트:
  - SIEM 샘플 payload를 고정 fixture로 관리
- 릴리즈 게이트:
  - 성능 회귀, 보안 스캔, 마이그레이션 검증 통과 시 배포

### R. RBAC
- 역할:
  - Global Admin / Tenant Admin / Analyst / Auditor / Customer Viewer
- 정책구조:
  - `subject-role-policy-resource-action-scope(tenant)`
- 특수권한:
  - 상태강제변경, 승인우회는 Break-glass 권한으로 분리

### S. Security
- 인증: OIDC/SAML SSO + MFA
- 인가: API 게이트웨이 + 서비스 레이어 이중검사
- 데이터보호:
  - at-rest encryption, TLS1.2+
  - PII masking/retention 정책
- 보안 점검:
  - 정적분석(SAST), 의존성 스캔(SCA), 침투테스트

### T. Ticket Workflow Engine
- 상태 예시:
  - New → Triage → Analyzing → Pending Customer → Resolved → Closed
- 전이 조건:
  - 필수 필드 완료
  - 승인자 지정
  - 자동에스컬레이션 조건
- 이벤트 소싱:
  - 상태 변경 이력은 `ticket_events`로 누적 저장

### U. UI/UX Blueprint
- 분석가 3-Pane:
  - 좌: 우선순위 큐/필터
  - 중: 원본+정규화+AI 요약
  - 우: 액션(상태변경/코멘트/플레이북)
- 관리자 UX:
  - Connector Wizard(연결→샘플→매핑→테스트→배포)
  - Mapping Builder(드래그&드롭 + 결과 미리보기)
  - Workflow Designer(State graph)

### V. Versioning
- 버전 대상:
  - 매핑 프로필
  - 워크플로우 정의
  - 알림 템플릿
- 정책:
  - 현재 운영버전(Active) + 과거버전 조회 + 롤백 1클릭

### W. Webhook Hardening
- 검증:
  - HMAC signature 검증
  - IP allowlist
  - timestamp replay 방지
- 안정화:
  - timeout 짧게 설정 후 즉시 202 응답
  - 동기 처리 최소화

### X. eXternal Integrations
- 필수 연동:
  - SIEM 3종
  - 메일 발송(SMTP/SES)
- 선택 연동:
  - Threat Intel(VirusTotal/MISP)
  - 협업툴(Slack/Teams)
  - ITSM/Jira 양방향(전환기)

### Y. Yardsticks (KPI)
- 운영 KPI:
  - 수집 성공률, 중복률, 유실률
  - MTTA, MTTR, SLA breach
  - 분석가 1인당 처리량
- 제품 KPI:
  - 신규 고객사 온보딩 시간
  - 설정 변경 리드타임
  - 자동화율(자동필드 채움)

### Z. Zero-Loss Strategy
- 4중 방어:
  1) 수신 즉시 영속 큐 적재
  2) 멱등키 upsert
  3) DLQ + 재처리
  4) 원본 payload 보관 + 재생(replay)
- 복구 시나리오:
  - 특정 기간 이벤트 재처리 작업 지원(백필)

---

## 6. 상세 기술 스택 제안

### 6.1 프론트엔드
- Framework: Next.js (App Router) + TypeScript
- UI: Tailwind CSS + shadcn/ui
- 상태관리: TanStack Query + Zustand
- 시각 편집기:
  - Mapping Builder: React Flow
  - Workflow Designer: React Flow / D3
- 폼/검증: React Hook Form + Zod

### 6.2 백엔드
- API: FastAPI (Python)
- 비동기 워커: Celery + Redis/RabbitMQ
- 규칙/표현식: JMESPath, custom transform functions
- 인증/인가:
  - OIDC SSO
  - 내부 정책 엔진(Casbin 또는 Oso)

### 6.3 데이터/인프라
- DB: PostgreSQL (JSONB + GIN index + RLS)
- 캐시: Redis
- 메시징: RabbitMQ
- 오브젝트 스토리지: S3 compatible
- 배포:
  - 초기: Vercel(프론트) + Managed Backend
  - 확장: Kubernetes(EKS/GKE/AKS)
- 관측성: Prometheus + Grafana + Loki + Tempo (또는 Datadog)

### 6.4 AI 계층(선택)
- LLM Gateway: OpenAI/Anthropic/Azure OpenAI 추상화
- Vector DB: pgvector or Qdrant
- 기능:
  - 사건 요약
  - 유사 티켓 추천
  - 대응 가이드 초안

---

## 7. 레퍼런스 아키텍처 (요청하신 Vercel/Supabase 포함)

### 7.1 빠른 구축안 (실전 가능)
- Front: Vercel
- Backend: FastAPI (Cloud Run/Fly.io/ECS 중 택1)
- DB/Auth: Supabase(Postgres + Auth)
- Queue: Upstash Redis Queue 또는 RabbitMQ Cloud
- 장점: 빠른 개발, 관리부담 낮음
- 단점: 큐/워커/네트워크 정책을 별도 통합해야 함

### 7.2 엔터프라이즈 표준안
- Front: 사내 도메인 + CDN
- Backend/Worker: Kubernetes
- DB: Managed Postgres HA
- MQ: RabbitMQ cluster or Kafka
- Secret/Policy: Vault + OPA
- 장점: 보안/감사/규모 대응 우수
- 단점: 초기 구축 난이도 높음

---

## 8. 핵심 API 초안

### 8.1 Ingestion
- `POST /api/v1/hooks/{connector_key}`
- `GET /api/v1/ingestion-events/{id}`
- `POST /api/v1/ingestion-events/{id}/replay`

### 8.2 Connector Admin
- `POST /api/v1/connectors`
- `POST /api/v1/connectors/{id}/test`
- `POST /api/v1/connectors/{id}/publish`

### 8.3 Mapping
- `POST /api/v1/mappings`
- `POST /api/v1/mappings/{id}/validate`
- `POST /api/v1/mappings/{id}/publish`

### 8.4 Ticket
- `GET /api/v1/tickets`
- `PATCH /api/v1/tickets/{id}/state`
- `POST /api/v1/tickets/{id}/comments`

### 8.5 Admin/RBAC
- `POST /api/v1/tenants`
- `POST /api/v1/users`
- `POST /api/v1/roles`
- `POST /api/v1/role-bindings`

---

## 9. 화면 설계 디테일

### 9.1 분석가 워크벤치
- 좌측: 큐(신규/고위험/SLA임박) + Saved filters
- 중앙: 사건 타임라인, IOC, 원본 JSON, AI 요약
- 우측: 상태전이, 대응 템플릿, 고객 통지 프리뷰

### 9.2 관리자 콘솔
- Tenant Setup: 고객사 기본정보/정책/보존기간
- SIEM Wizard: 인증→샘플수신→필드매핑→테스트→활성화
- Field Catalog: 시스템 필드/커스텀 필드 타입/검증규칙
- Workflow Studio: 상태/전이/조건/자동액션 설정
- Audit Explorer: 누구/언제/무엇 변경했는지 추적

---

## 10. Splunk 연동 구현 상세 (중요)
1. Splunk Alert Action에서 webhook 호출
2. payload에서 `sid`, `search_name`, `results_link` 수신
3. 수신 즉시 큐 적재 후 202 응답
4. worker가 Splunk REST `/services/search/jobs/{sid}/results` 역조회
5. results row별 `external_event_key = sid + row_index` 생성
6. mapping 적용 후 ticket upsert
7. 성공/실패/중복 카운트 기록

리스크 대응:
- sid 만료(TTL): 우선순위 큐 처리 + 지연경보
- API rate limit: 토큰버킷 + 지수백오프
- 중복 webhook: 멱등키 유니크 제약으로 차단

---

## 11. 데이터 거버넌스 & 컴플라이언스
- 보존기간:
  - raw payload: 90~365일(고객사 계약별)
  - ticket/audit: 규제 요구에 따라 장기보존
- 개인정보:
  - 저장 최소화, 마스킹, 접근통제
- 컴플라이언스 매핑:
  - ISO 27001, ISMS-P, GDPR(해당 시) 체크리스트 반영

---

## 12. 배포/운영 전략

### 12.1 환경 분리
- `dev` / `staging` / `prod`
- 설정도 환경별 분리(테넌트 샘플 데이터 금지)

### 12.2 CI/CD
- PR 시:
  - lint + test + security scan
- merge 시:
  - migration check
  - canary deploy
  - health metric 확인 후 rollout

### 12.3 장애대응
- SLO 기반 경보(지연/실패율)
- DLQ 운영대시보드 + 1클릭 재처리
- Postmortem 템플릿 표준화

---

## 13. 개발 로드맵 (실행형)

### Phase 1 (0~8주): Foundation MVP
- 멀티테넌트/RBAC
- Webhook Receiver + Queue + Ticket Upsert
- 기본 분석가 3-Pane
- 이메일 통지
- 감사로그

### Phase 2 (9~16주): No-Code Ops 완성
- Connector Wizard 고도화
- Mapping Builder(함수/검증/버전)
- Workflow Designer + SLA 에스컬레이션
- 운영 대시보드

### Phase 3 (17~24주): AI + 자동화
- AI 요약/추천
- TI 연동
- 반자동 대응 플레이북
- 품질평가 루프

### Phase 4 (25주+): Enterprise Hardening
- 다지역 DR
- 고급 규제 대응
- 고객 포털/청구/리포팅 고도화

---

## 14. 리스크 매트릭스
- 기술리스크: 커넥터 다양성 증가 → 커넥터 SDK/표준계약으로 완화
- 운영리스크: No-Code 오설정 → 샌드박스/승인체계/롤백
- 보안리스크: 권한오남용 → 최소권한 + 민감행위 2인승인
- 일정리스크: 과도한 AI 범위 → AI는 3단계 분리 투입

---

## 15. 의사결정 체크리스트 (프로젝트 시작 전 확정)
1. MVP 우선 SIEM 3종 확정 여부
2. 멀티테넌트 격리수준(Shared DB vs Dedicated DB)
3. 큐 기술(RabbitMQ vs Kafka) 선택
4. 인증체계(사내 SSO 연동 방식)
5. 고객 통지 채널 우선순위(Email 우선 여부)
6. AI 기능 가드레일(자동조치 허용 범위)

---

## 16. 최종 결론
이 프로젝트는 단순한 Jira 대체가 아니라, **SOC 업무를 코드가 아니라 정책/설정으로 운영하는 플랫폼 전환**이다. 성공의 핵심은 다음 4가지다.
1. **무손실 수집과 멱등성**
2. **No-Code 관리자 기능 완성도**
3. **분석가 생산성을 극대화한 UX**
4. **단계적 AI 도입과 강한 거버넌스**

이 문서를 기준으로 바로 구현을 시작하면, 고객사 추가/연동 변경/권한정책/필드맵핑을 개발팀 개입 최소화로 운영 가능한 수준까지 도달할 수 있다.
