# Prompt 13 — README, AI Disclosure and Submission Handoff

Read all six context files and the master index. Inspect the actual repository, test output and deployment state.

## Goal
Prepare a truthful, professional repository for Blinto submission.

## Tasks
1. Write a complete root README with:
   - Project overview and feature list.
   - Tech stack.
   - Architecture explanation.
   - ER/data model diagram (Mermaid is acceptable).
   - Local prerequisites and setup.
   - Environment variables.
   - Docker Compose instructions.
   - Migration and seed commands.
   - Development/build/lint/typecheck/test commands.
   - API endpoint table with example requests and responses.
   - Explanation of graph traversal, cycle detection and ordering.
   - Explanation of minimum-bundle DP, reconstruction and complexity.
   - Test strategy and actual test commands.
   - Deployment providers, exact plan names, URLs and free-tier limitations (only if verified).
   - Known limitations.
   - AI tool disclosure.
2. AI disclosure must truthfully state what AI tools were used for (for example scaffolding, reviewing, generating test ideas or UI assistance) and what the candidate personally implemented, tested and understood. Do not falsely claim all code was written without AI.
3. Ensure screenshots are current and do not contain secrets, if screenshots are included.
4. Confirm repository contains no `.env`, credentials, API keys or database secrets.
5. Confirm `.env.example` has placeholders only.
6. Confirm GitHub repository access is configured. If private, remind candidate to grant Blinto hiring team access.
7. Confirm submission form fields: repository URL required, live URL optional, additional notes optional.
8. Do not submit the Google Form on behalf of the candidate.

## Final verification
- Fresh clone setup tested.
- Build, lint, typecheck and tests pass.
- All required routes documented and tested.
- All three frontend views connected to API.
- Assessment sample cases pass.
- AI usage disclosure present.
- Git status clean or remaining changes explained.
- Repository URL and optional live URL verified.

## Final response
Provide a concise handoff checklist and suggested additional notes for the submission form. STOP.
