# AGENTS.md – Rules for Codex on rok-ai.com_interactive

## 0. TL;DR
- Next.js 14 + TypeScript; Yarn workspaces
- Build → yarn build
- Tests → yarn test

## 1. Setup & validate
Run these commands for every task:
yarn install --frozen-lockfile
yarn lint
yarn test
yarn build

## 2. Coding conventions
- React Server Components in /src/app
- Named exports only in shared libs
- API routes under src/app/api/**/route.ts
- Use zod for request/response validation

## 3. Don’ts
- Never commit .env* files
- Skip flaky Cypress tests tagged @flaky

## 4. Context
- Trading logic lives in /src/lib/alpaca/
- Charts use react-plotly.js; if types break, wrap helpers in /src/types/plot.ts
