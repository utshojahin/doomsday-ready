# 06 — Testing, Free Deployment and Submission

## Feature-by-feature development gate

Every prompt must follow this loop:

1. Inspect current repository and context.
2. State the small scope for this chunk.
3. Implement only that scope.
4. Add/adjust tests in the same chunk.
5. Run focused tests.
6. Run typecheck/lint for affected app.
7. Manually exercise the relevant API/UI flow.
8. Report changed files, commands, results, known gaps and a suggested commit message.
9. STOP and wait for candidate approval.

Do not write the whole product before testing. Do not move a feature's tests to a later phase.

## Test layers

- Pure unit tests for graph and dynamic programming algorithms.
- Service tests for validation, database orchestration and transaction behavior.
- Controller/API integration tests for status codes and response shapes.
- Frontend component tests for forms, loading/error/empty states and interactions.
- End-to-end smoke test for the three primary user journeys if time permits.

For each feature, test success and failure cases. Use a test database separate from development data.

## Suggested feature gates

| Gate | Must pass before proceeding |
|---|---|
| Foundation | apps start, health endpoint responds, database connects |
| Schema | migration succeeds, seed is repeatable, constraints work |
| Movie create/list | valid create/list works; duplicate and invalid inputs fail |
| Movie update | watched/prerequisite edits work; cycles return exact 409; failed update is atomic |
| Rewatch | transitive order, deduplication, target exclusion and runtime summary tests pass |
| Cinema CRUD | unique name and bundle-size validations pass |
| Booking | all assessment examples and edge cases pass; minimum bundle count proven |
| Frontend Movies | real API CRUD and watched toggle work |
| Frontend Rewatch | target selection, order, progress and remaining time work |
| Frontend Booking | quote and impossible states work |
| Integration | all three flows work from clean database; no console errors |
| Deployment | public frontend and API work against deployed database |

## Free-tier deployment guidance

Free offerings, sleep behavior, storage persistence and limits change. Verify the provider's current pricing/terms on deployment day. The following are candidate options, not guarantees of permanent free hosting.

### Simple deployment topology

- Frontend: static hosting such as **Vercel Hobby** or **Netlify Free**.
- API: a free application/container host if currently offered, or a low-cost paid host if no reliable free option is available. Candidate providers to check include Render and other platforms with free web-service tiers; free instances may sleep or have limited monthly hours.
- PostgreSQL: a hosted free database tier such as **Neon** or **Supabase** if current plan limits suit the project. Check storage, compute hours, connection limits, inactivity suspension and retention.
- Alternative: use one provider's integrated frontend/API/database offering if its current free tier supports the architecture.

Do not assume Render, Railway, Fly.io, Supabase, Neon, Vercel or Netlify has a specific free allowance without checking current official pricing. Avoid adding a payment card or starting a trial unless the candidate consciously approves it.

### Deployment steps

1. Ensure local production build succeeds.
2. Provision a hosted PostgreSQL database.
3. Copy its connection string into the API host's secret environment variables.
4. Deploy API from GitHub with correct build/start commands.
5. Run Prisma production migrations (`prisma migrate deploy`) as a controlled release step, not `migrate dev`.
6. Run seed only if intended; do not automatically overwrite production data on every deploy.
7. Set API `FRONTEND_ORIGIN` to the deployed frontend origin.
8. Set frontend `VITE_API_BASE_URL` to the deployed API base URL ending in `/api`.
9. Deploy frontend.
10. Configure CORS and any platform-specific health check.
11. Test public API health, create/list movies, rewatch calculation, cinema quote and browser UI.
12. Record deployment limitations (cold starts, sleeping service, database expiry/quotas) in README.

### Production safety

- Never put database credentials in frontend environment variables.
- Never expose server-only secrets via `VITE_` variables.
- Use HTTPS.
- Use provider secret managers/environment settings.
- Use a restricted database user if supported.
- Do not commit `.env`.
- Set a non-development `NODE_ENV`.
- Confirm logs do not expose secrets or personal data.
- Ensure the API binds to `0.0.0.0` and the port supplied by the platform.
- If the API host sleeps, the first request may be slow; disclose this.

### If free deployment is not practical

A fully working local Docker Compose deployment is better than a broken public demo. Submit a tested repository and state honestly that the live URL is unavailable. The form labels the live URL optional.

## README final checklist

- Product overview and screenshots (optional).
- Tech stack and architecture.
- ER/data model diagram.
- Prerequisite graph direction and cycle strategy.
- Rewatch ordering algorithm and complexity.
- Minimum-bundle DP algorithm and complexity.
- Local setup and environment variables.
- Migration, seed, run, lint, typecheck and test commands.
- API endpoint table and example requests/responses.
- Docker Compose instructions.
- Deployment architecture, links and free-tier limitations.
- AI disclosure: tools used, what they helped with, what was manually implemented/reviewed.
- Known limitations and future improvements.

## Submission checklist

- GitHub repository link works.
- If private, Blinto hiring team has access.
- Source code, README, setup instructions and AI disclosure are committed.
- `.env` and secrets are absent from Git history.
- Fresh clone setup has been tested.
- All required endpoints work.
- All three frontend views work.
- Both algorithms are tested and understood by candidate.
- Live URL tested if supplied.
- Google Form submitted before the deadline.
