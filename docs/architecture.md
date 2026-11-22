# LearnOps architecture notes

## Product goal

Help students and mentors understand progress signals and agree on a useful next action. The system supports professional judgment; it does not replace it.

## GitHub activity flow

1. GitHub posts an event to POST /api/github/webhook.
2. The route reads the exact raw request body.
3. It validates X-Hub-Signature-256 with HMAC SHA-256 and constant-time comparison.
4. Unsupported event types are acknowledged without persistence.
5. Supported events are written to a webhook inbox with X-GitHub-Delivery as a unique idempotency key.
6. A future worker maps repository names to learner profiles and converts webhook payloads into learning activities.

The route does not assume that a GitHub sender is a student. Repository-to-student mapping must be explicit.

## Algorithms

- Risk scoring is a bounded, explainable weighted sum. Reasons accompany each score.
- Mentor ordering uses a binary max-heap: O(log n) insertion and removal.
- Learning prerequisites use Kahn's topological sort: O(V + E), including explicit cycle detection.

## Security and privacy

- Signature verification uses the unmodified raw request body.
- Supabase service-role credentials are server-only.
- Webhook inbox RLS is enabled with no browser-facing policy.
- Starter student-level policies are intentionally narrow. Mentor/admin access requires verified cohort membership and institution scoping before launch.
- Demo scores are not validated predictive measures and must not be used to rank ability or make consequential decisions.

## Current trade-offs

The dashboard uses local sample data, so it can be explored without secrets. Webhook persistence is available after Supabase and GitHub secrets are configured. Event-to-student normalization and async processing remain later milestones.
