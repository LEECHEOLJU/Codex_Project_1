#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <github_repo_url> [source_branch]"
  echo "Example: $0 https://github.com/<owner>/Codex_Project_1.git work"
  exit 1
fi

REPO_URL="$1"
SOURCE_BRANCH="${2:-work}"

if ! git rev-parse --verify "$SOURCE_BRANCH" >/dev/null 2>&1; then
  echo "Source branch '$SOURCE_BRANCH' does not exist."
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

git fetch origin || true

git checkout -B main "$SOURCE_BRANCH"

if git ls-remote --heads origin main | grep -q "refs/heads/main"; then
  git fetch origin main
  git merge --ff-only origin/main || true
fi

git push -u origin main

echo "Done: main is pushed to $REPO_URL"
