# Prompt 12 — Free-Tier Deployment

Read all six context files and the master index. Inspect package scripts, Docker files and production build.

## Goal
Deploy the app using free-tier services where currently available, without compromising security or pretending a free plan is guaranteed.

## Important
Free plan eligibility, quotas, sleep behavior, database retention and pricing change. Before choosing a provider, verify current official pricing/limits. Prefer providers with a genuinely usable free plan and do not start paid trials or add a payment method without asking the candidate.

## Tasks
1. Ensure production API and frontend builds work locally.
2. Confirm API listens on `0.0.0.0` and uses platform-provided `PORT` where required.
3. Confirm Prisma production migration command uses `prisma migrate deploy`.
4. Select a static frontend host (candidate options: Vercel Hobby or Netlify Free; verify current eligibility).
5. Select an API host with a currently available free tier if possible. Investigate current provider terms; note cold starts/sleep limitations. If no viable free host exists, explain the lowest-friction alternative and do not silently incur cost.
6. Select a hosted PostgreSQL free tier if currently available (candidate options include Neon or Supabase; verify quotas, inactivity suspension, storage, connections and retention).
7. Configure secrets only in host environment settings.
8. Set API `DATABASE_URL`, `FRONTEND_ORIGIN`, `NODE_ENV` and port configuration.
9. Set frontend `VITE_API_BASE_URL` to deployed API URL plus `/api`.
10. Configure CORS, health checks and build/start commands.
11. Deploy migrations; seed only intentionally.
12. Test public frontend and every required API flow.
13. Record exact provider names, plan names, deploy commands/settings, URLs and limitations in README.

## Safety
- Never expose database URL to browser.
- Never put secrets in `VITE_` variables.
- Never commit `.env`.
- Do not claim live deployment until tested from a separate browser/network context.
- If a free tier is not workable, leave the app reproducibly deployable and report that no live URL is provided. The assessment marks live URL optional.

## Tests/verification in this chunk
- Production builds.
- Migration command verified against deployment DB.
- Health endpoint publicly reachable.
- Create/list movie, rewatch plan, create/list cinema and booking quote work against deployed environment.
- Browser console has no fatal errors.
- Confirm no secrets appear in built frontend assets or logs.

## Acceptance gate
Provide live URLs only if verified. Include a short free-tier limitations note. STOP.
