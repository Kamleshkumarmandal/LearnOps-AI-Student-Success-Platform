import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyGitHubSignature(secret: string, rawBody: string, signature: string | null): boolean {
  if (!signature || !/^sha256=[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export const SUPPORTED_GITHUB_EVENTS = new Set([
  "push", "pull_request", "pull_request_review", "workflow_run", "check_suite"
]);

export function normalizeGitHubEvent(deliveryId: string, eventType: string, payload: Record<string, unknown>) {
  const repository = payload.repository as { full_name?: unknown } | undefined;
  const sender = payload.sender as { login?: unknown } | undefined;
  return {
    deliveryId,
    eventType,
    repositoryFullName: typeof repository?.full_name === "string" ? repository.full_name : "unknown",
    senderLogin: typeof sender?.login === "string" ? sender.login : null,
    action: typeof payload.action === "string" ? payload.action : null,
    payload
  };
}
