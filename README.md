# LearnOps — AI Student Success Platform

LearnOps is an engineering-growth and student-success workspace built around a practical question: what is blocking a learner's progress, and what useful action can a mentor take next?

This independent portfolio project is aligned with the Kalvium Software Engineer Intern role brief: solution ownership, AI-assisted development, GitHub automation, data structures and algorithms, APIs, databases, concurrency, debugging and communication of technical trade-offs. It is not affiliated with or endorsed by Kalvium.

## Current milestone

- Cohort dashboard with student progress and assessment indicators
- Search and filter by cohort, student and support level
- Explainable student support-signal scoring
- Binary max-heap to prioritize mentor follow-ups
- Student details drawer with evidence signals and suggested next actions
- Demo mentor queue and add-student interaction
- Learning-path prerequisite ordering utility with cycle detection
- GitHub webhook signature verification helper
- GitHub webhook API route with delivery-ID idempotency on persistence
- Supabase PostgreSQL schema with Row Level Security
- Unit tests for scoring, heap ordering, prerequisite graph and webhook signatures
- GitHub Actions CI workflow for lint, tests and production build

## Demo data vs. live integrations

The dashboard currently uses illustrative sample cohort data. Adding students and queueing mentor follow-ups changes temporary browser state only and does not persist after refresh.

The GitHub webhook endpoint is implemented, but requires GITHUB_WEBHOOK_SECRET, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, plus the SQL schema. Supported verified events are stored in the webhook inbox. Mapping repository events to student profiles and deriving the student activity metrics is a follow-up integration milestone.

The current support guidance is a deterministic, explainable heuristic. It is not an AI model, does not diagnose students, and must not be used as an automated high-stakes decision. The AI assistant/API integration is planned but not connected.

## Tech stack

- Next.js 15.5.29 (patched Next.js 15 line)
- React 19 and TypeScript
- Tailwind CSS 3
- Supabase PostgreSQL
- Vitest unit tests
- GitHub webhooks with HMAC SHA-256 verification

## Run locally

Use Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Run checks:

```bash
npm run lint
npm test
npm run build
```

## Configure GitHub webhooks

1. Create a Supabase project.
2. Run supabase/schema.sql in the Supabase SQL Editor.
3. Copy .env.example to .env.local.
4. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as server-only secrets.
5. Generate a long random webhook secret and set GITHUB_WEBHOOK_SECRET.
6. In GitHub repository settings, add a webhook URL ending in /api/github/webhook.
7. Select JSON payloads and configure the same secret in GitHub.
8. Subscribe to push, pull request, pull request review, workflow run and check suite events.

The endpoint verifies X-Hub-Signature-256 against the raw request body, rejects invalid signatures, handles only supported event families, and stores each delivery using GitHub's unique X-GitHub-Delivery ID. Duplicate deliveries are ignored by a database uniqueness constraint.

Never put the Supabase service-role key or webhook secret in client-side variables.

## Architecture

```text
GitHub repository
    |
    | signed webhook (push / PR / review / workflow / check suite)
    v
Next.js route: /api/github/webhook
    |
    | HMAC verification + event validation
    v
Supabase webhook inbox (unique delivery ID)
    |
    | future worker: map repository -> student
    v
Learning activities -> student signals -> mentor queue
```

See docs/architecture.md for design notes and trade-offs.

## Project structure

```text
app/
  api/github/webhook/route.ts
  globals.css
  layout.tsx
  page.tsx
lib/
  analytics.ts
  github-webhook.ts
supabase/
  schema.sql
tests/
  analytics.test.ts
docs/
  architecture.md
.github/workflows/
  ci.yml
```

## Roadmap

- [ ] Supabase authentication and cohort membership
- [ ] Mentor/admin access policies
- [ ] GitHub App installation and repository-to-student mapping
- [ ] Background worker for webhook processing and activity aggregation
- [ ] Persisted mentor interventions and audit trail
- [ ] Assessment and project submission workflows
- [ ] AI-assisted mentor summaries with source evidence and human review
- [ ] Integration and end-to-end tests
- [ ] Deployment, monitoring and operational runbooks

## License

MIT. See LICENSE.
