import { NextResponse } from "next/server";
import { normalizeGitHubEvent, SUPPORTED_GITHUB_EVENTS, verifyGitHubSignature } from "@/lib/github-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook endpoint is not configured." }, { status: 503 });

  const rawBody = await request.text();
  if (!verifyGitHubSignature(secret, rawBody, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const deliveryId = request.headers.get("x-github-delivery");
  const eventType = request.headers.get("x-github-event");
  if (!deliveryId || !eventType) {
    return NextResponse.json({ error: "Missing GitHub delivery or event headers." }, { status: 400 });
  }
  if (!SUPPORTED_GITHUB_EVENTS.has(eventType)) {
    return NextResponse.json({ accepted: true, ignored: true });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Webhook body must be valid JSON." }, { status: 400 });
  }

  const normalized = normalizeGitHubEvent(deliveryId, eventType, payload);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Verified delivery received, but event storage is not configured." }, { status: 503 });
  }

  const response = await fetch(url.replace(/\/$/, "") + "/rest/v1/github_webhook_events?on_conflict=delivery_id", {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal"
    },
    body: JSON.stringify({
      delivery_id: normalized.deliveryId,
      event_type: normalized.eventType,
      repository_full_name: normalized.repositoryFullName,
      sender_login: normalized.senderLogin,
      action: normalized.action,
      payload: normalized.payload
    }),
    cache: "no-store"
  });

  if (!response.ok) return NextResponse.json({ error: "Could not persist webhook delivery." }, { status: 502 });
  return NextResponse.json({ accepted: true, deliveryId, eventType });
}
