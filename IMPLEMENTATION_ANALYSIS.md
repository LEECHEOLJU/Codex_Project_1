# 구현 심층 분석 및 기술요건 반영 현황

## 1) 초기 기술요건 대비 반영 체크

| 요구사항 | 구현 상태 | 근거 |
|---|---|---|
| SIEM 웹훅 수신 | 완료 | `/api/webhooks/[key]` |
| Queue 적재/처리/DLQ | 완료 | `lib/queue.js`, `/api/queue/*` |
| 멱등성 중복방지 | 완료 | `tenantId:externalEventKey` |
| 동적 필드 매핑 | 완료(엔진 적용) | `lib/mapping.js`, `/admin/mappings` |
| 티켓 워크플로우 전이 검증 | 완료 | `ensureTransition`, `updateTicket` |
| 분석가 처리 UI | 완료 | `/tickets` list/board + action pane |
| 상태변경 기반 고객 메일 통지 | 완료 | `lib/notify.js`, `/api/notifications` |
| 고객사/SIEM 설정 UI | 완료 | `/admin/connectors` |
| 사용자 계정 생성/삭제/역할 설정 | 완료 | `/admin/users`, `/api/users` |
| 커스텀 필드 생성/삭제 | 완료 | `/admin/custom-fields`, `/api/custom-fields` |
| 이메일 템플릿 관리 | 완료 | `/admin/templates`, `/api/templates` |

## 2) E2E 처리 플로우 (실구현)
1. SIEM이 `POST /api/webhooks/{key}` 호출
2. 서버가 payload를 `queue.pending`에 적재 후 202 반환
3. worker(`processQueue`)가 pending 메시지 처리
4. 커넥터별 기본 정규화 + 매핑프로필 룰 적용(`applyMapping`)
5. 멱등키 기준 티켓 생성/중복무시
6. 티켓이 리스트/보드 UI에 노출
7. 분석가가 상태/우선순위/담당자/코멘트/커스텀필드/해결메모 업데이트
8. 상태가 Resolved/Closed로 변경되면 템플릿 기반 고객 메일 로그 생성
9. 메일 발송 이력은 `/admin/notifications`에서 확인

## 3) 운영자가 UI에서 관리 가능한 영역
- 고객사/연동 설정
- 필드 매핑 룰
- 커스텀 필드 스키마
- 사용자/권한 역할
- 워크플로우 상태 정의
- 고객 메일 템플릿
- 큐 처리 운영 모니터링

## 4) 남은 고도화 권장
- 인메모리 저장소를 Postgres + Redis + RabbitMQ로 교체
- SMTP/SES 실발송 연동(현재는 sent log)
- RBAC 정책 엔진 세분화, SSO/OIDC 연동
- 감사로그 분리 저장 및 SIEM 재연동(자체 로그)
