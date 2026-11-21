# 02 — Stack and Standards

## Stack

- Monorepo using npm workspaces
- API: NestJS + TypeScript
- Web: React + Vite + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- UI: Tailwind CSS
- API docs: Swagger/OpenAPI
- Backend tests: Jest (NestJS default) or Vitest if justified
- Frontend tests: Vitest + React Testing Library
- Optional browser tests: Playwright for critical user journeys
- Local services: Docker Compose

Do not add microservices, Redis, GraphQL, queues or complex state management. Keep the architecture appropriate to the assignment.

## Suggested layout

```text
.
├── apps/
│   ├── api/
│   │   ├── prisma/schema.prisma
│   │   ├── prisma/seed.ts
│   │   └── src/
│   │       ├── common/
│   │       ├── movies/
│   │       │   ├── dto/
│   │       │   └── algorithms/
│   │       └── cinemas/
│   │           ├── dto/
│   │           └── algorithms/
│   └── web/src/
│       ├── api/
│       ├── components/
│       ├── features/movies/
│       ├── features/rewatch/
│       ├── features/booking/
│       └── pages/
├── context/
├── prompts/
├── docs/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Agent may adjust structure if it explains why and keeps boundaries clear.

## Standards

- Enable TypeScript strict mode.
- Avoid `any`; use typed DTOs, API responses and domain types.
- Keep controllers thin; put business logic in services or pure functions.
- Keep algorithm functions pure where possible and independently unit-testable.
- Validate every incoming body, path parameter and query parameter.
- Use transactions for multi-step database writes where partial persistence is possible.
- Handle expected errors explicitly; do not swallow exceptions.
- No fake API responses or hardcoded frontend data after integration.
- No secrets in source control. Commit `.env.example`, never `.env`.
- Use accessible labels, keyboard-operable controls and responsive layouts.
- Use comments for non-obvious reasoning, not line-by-line narration.
- Do not leave debug logging or unexplained TODOs in final code.

## Error response

Use one consistent shape, for example:

```json
{
  "statusCode": 409,
  "code": "CIRCULAR_DEPENDENCY",
  "message": "The prerequisite change would create a cycle."
}
```

Do not expose stack traces, database internals or secrets.

## Environment variables

Document and validate at startup:

```env
NODE_ENV=development
API_PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/doomsday_ready?schema=public
FRONTEND_ORIGIN=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3000/api
```

Use provider-supplied environment variables for production.

## Root scripts

Provide working scripts, as appropriate:
- `dev`
- `build`
- `lint`
- `typecheck`
- `test`
- `test:e2e`
- `db:migrate`
- `db:seed`

Only document scripts that actually exist and have been tested.
