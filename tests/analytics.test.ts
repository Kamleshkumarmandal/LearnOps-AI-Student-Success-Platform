import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { calculateStudentRisk, MaxPriorityQueue, orderLearningPath, prioritizeStudents, type StudentSignal } from "../lib/analytics";
import { normalizeGitHubEvent, verifyGitHubSignature } from "../lib/github-webhook";

const healthy: StudentSignal = {
  id: "s1", name: "Aarav", cohort: "2027", githubUsername: "aarav",
  githubDaysSinceActivity: 1, commitsLast7Days: 5, openPullRequests: 1,
  failedChecks: 0, overdueTasks: 0, assessmentAverage: 86, projectProgress: 72
};

describe("risk scoring", () => {
  it("keeps healthy activity at zero risk", () => {
    expect(calculateStudentRisk(healthy).score).toBe(0);
    expect(calculateStudentRisk(healthy).level).toBe("On track");
  });
  it("explains multiple elevated signals", () => {
    const result = calculateStudentRisk({ ...healthy, githubDaysSinceActivity: 18, commitsLast7Days: 0, failedChecks: 2, overdueTasks: 2, assessmentAverage: 52, projectProgress: 20 });
    expect(result.score).toBe(100);
    expect(result.level).toBe("Needs support");
    expect(result.reasons.length).toBeGreaterThan(3);
  });
  it("orders mentor follow-ups by score", () => {
    const high = { ...healthy, id: "s2", overdueTasks: 4, failedChecks: 2 };
    expect(prioritizeStudents([healthy, high])[0].student.id).toBe("s2");
  });
});

describe("max priority queue", () => {
  it("pops highest priority first", () => {
    const queue = new MaxPriorityQueue<string>();
    queue.push("low", 1);
    queue.push("high", 10);
    queue.push("medium", 5);
    expect([queue.pop(), queue.pop(), queue.pop()]).toEqual(["high", "medium", "low"]);
    expect(queue.pop()).toBeUndefined();
  });
});

describe("learning path prerequisite sort", () => {
  it("places prerequisites before dependent modules", () => {
    const result = orderLearningPath([
      { id: "api", title: "APIs", prerequisites: ["js"] },
      { id: "js", title: "JavaScript", prerequisites: [] },
      { id: "backend", title: "Backend", prerequisites: ["api"] }
    ]);
    expect(result.indexOf("js")).toBeLessThan(result.indexOf("api"));
    expect(result.indexOf("api")).toBeLessThan(result.indexOf("backend"));
  });
  it("rejects prerequisite cycles and unknown modules", () => {
    expect(() => orderLearningPath([
      { id: "a", title: "A", prerequisites: ["b"] },
      { id: "b", title: "B", prerequisites: ["a"] }
    ])).toThrow(/cycle/i);
    expect(() => orderLearningPath([
      { id: "a", title: "A", prerequisites: ["missing"] }
    ])).toThrow(/Unknown prerequisite/);
  });
});

describe("GitHub webhook helpers", () => {
  it("verifies SHA-256 signatures and rejects invalid signatures", () => {
    const secret = "local-test-secret";
    const body = JSON.stringify({ hello: "learnops" });
    const signature = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyGitHubSignature(secret, body, signature)).toBe(true);
    expect(verifyGitHubSignature(secret, body, "sha256=" + "0".repeat(64))).toBe(false);
    expect(verifyGitHubSignature(secret, body, null)).toBe(false);
  });
  it("normalizes repository and sender data", () => {
    const result = normalizeGitHubEvent("delivery-1", "push", {
      repository: { full_name: "owner/repo" },
      sender: { login: "contributor" }
    });
    expect(result.repositoryFullName).toBe("owner/repo");
    expect(result.senderLogin).toBe("contributor");
  });
});
