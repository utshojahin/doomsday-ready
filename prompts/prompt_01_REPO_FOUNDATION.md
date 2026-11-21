# Prompt 01 — Repository Foundation

Read all six context files and `prompt_00_INDEX.md` first.

## Goal
Create the smallest maintainable monorepo foundation for the assessment. Do not implement movie or cinema business features yet.

## Tasks
1. Inspect the current repository and preserve existing user work.
2. Set up npm workspaces with `apps/api` (NestJS TypeScript) and `apps/web` (React + Vite + TypeScript).
3. Enable strict TypeScript settings.
4. Add root scripts for development, build, lint, typecheck and tests; scripts must work.
5. Add `.gitignore` and `.env.example`.
6. Add Docker Compose for local PostgreSQL with a named volume and health check.
7. Configure API configuration loading and a minimal `GET /api/health` endpoint.
8. Configure CORS from `FRONTEND_ORIGIN`.
9. Add a minimal frontend shell that displays the app name and confirms the frontend can call the health endpoint.
10. Add concise setup instructions in README (will be expanded later).

## Tests in this chunk
- API health endpoint test returns HTTP 200 and a stable JSON status.
- Configuration test or validation confirms missing required production config fails clearly.
- Frontend health/API status component test covers loading, success and failure states.
- Verify workspace install and all root scripts.

## Acceptance gate
- Both apps start locally.
- PostgreSQL starts via Docker Compose.
- API health endpoint works.
- Frontend can reach API with configured CORS.
- Build, lint, typecheck and tests pass.

Report results and STOP. Do not create database entities or business features yet.
