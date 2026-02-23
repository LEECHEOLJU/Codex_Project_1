# Codex_Project_1

## GitHub main 푸시 빠른 실행

아래 스크립트로 요청한 3단계(원격 설정, `main` 준비, `main` 푸시)를 한 번에 실행할 수 있습니다.

### 어디서 입력하나요?

**명령어는 이 프로젝트 폴더(레포 루트)에서 터미널에 입력**하면 됩니다.

1. 터미널 열기 (PowerShell, CMD, macOS Terminal 등)
2. 프로젝트 폴더로 이동

```bash
cd /workspace/Codex_Project_1
```

3. 스크립트 실행

```bash
./scripts/push_main.sh <github_repo_url> [source_branch]
```

예시:

```bash
./scripts/push_main.sh https://github.com/<owner>/Codex_Project_1.git work
```

### 실행 전 준비

- GitHub 저장소 URL (`https://github.com/<owner>/<repo>.git`)
- 해당 저장소에 push 가능한 인증(SSH 키 또는 PAT)

> 참고: 현재 환경에는 GitHub URL/인증 정보가 없어 실제 원격 푸시는 사용자 저장소 URL과 권한이 필요합니다.
