export type StudentSignal = {
  id: string;
  name: string;
  cohort: string;
  githubUsername: string;
  githubDaysSinceActivity: number;
  commitsLast7Days: number;
  openPullRequests: number;
  failedChecks: number;
  overdueTasks: number;
  assessmentAverage: number;
  projectProgress: number;
};

export type RiskLevel = "On track" | "Watch" | "Needs support";
export type StudentRisk = {
  student: StudentSignal;
  score: number;
  level: RiskLevel;
  reasons: string[];
  recommendedAction: string;
};

/**
 * Explainable demo triage signal only. It is not a prediction of student ability.
 * A higher score means more support signals warrant a human check-in.
 */
export function calculateStudentRisk(student: StudentSignal): StudentRisk {
  let score = 0;
  const reasons: string[] = [];
  if (student.githubDaysSinceActivity >= 14) {
    score += 22;
    reasons.push("No GitHub activity for 14+ days");
  } else if (student.githubDaysSinceActivity >= 7) {
    score += 12;
    reasons.push("GitHub activity has slowed");
  }
  if (student.commitsLast7Days === 0) {
    score += 15;
    reasons.push("No commits in the last 7 days");
  }
  if (student.failedChecks > 0) {
    score += Math.min(18, student.failedChecks * 6);
    reasons.push(student.failedChecks + " failed automated check(s)");
  }
  if (student.overdueTasks > 0) {
    score += Math.min(20, student.overdueTasks * 5);
    reasons.push(student.overdueTasks + " overdue task(s)");
  }
  if (student.assessmentAverage < 60) {
    score += 18;
    reasons.push("Assessment average below 60%");
  } else if (student.assessmentAverage < 75) {
    score += 9;
    reasons.push("Assessment average below 75%");
  }
  if (student.projectProgress < 40) {
    score += 12;
    reasons.push("Project progress below 40%");
  }
  score = Math.min(100, score);
  const level: RiskLevel = score >= 55 ? "Needs support" : score >= 25 ? "Watch" : "On track";
  const recommendedAction = level === "Needs support"
    ? "Schedule a 1:1 mentor check-in and agree on one small next step."
    : level === "Watch"
      ? "Send a check-in and review progress at the next stand-up."
      : "Keep the current learning plan and acknowledge recent progress.";
  return { student, score, level, reasons, recommendedAction };
}

type QueueItem<T> = { value: T; priority: number };

/** Max-priority queue backed by a binary heap: O(log n) insert and remove. */
export class MaxPriorityQueue<T> {
  private heap: QueueItem<T>[] = [];
  get size(): number { return this.heap.length; }

  push(value: T, priority: number): void {
    this.heap.push({ value, priority });
    let index = this.heap.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.heap[parent].priority >= this.heap[index].priority) break;
      [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
      index = parent;
    }
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const first = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last) {
      this.heap[0] = last;
      let index = 0;
      while (true) {
        const left = index * 2 + 1;
        const right = left + 1;
        let largest = index;
        if (left < this.heap.length && this.heap[left].priority > this.heap[largest].priority) largest = left;
        if (right < this.heap.length && this.heap[right].priority > this.heap[largest].priority) largest = right;
        if (largest === index) break;
        [this.heap[index], this.heap[largest]] = [this.heap[largest], this.heap[index]];
        index = largest;
      }
    }
    return first.value;
  }
}

export function prioritizeStudents(students: StudentSignal[]): StudentRisk[] {
  const queue = new MaxPriorityQueue<StudentRisk>();
  for (const student of students) {
    const risk = calculateStudentRisk(student);
    queue.push(risk, risk.score);
  }
  const result: StudentRisk[] = [];
  while (queue.size > 0) {
    const next = queue.pop();
    if (next) result.push(next);
  }
  return result;
}

export type LearningModule = { id: string; title: string; prerequisites: string[] };

/** Kahn topological sort: O(V + E), with explicit invalid-edge and cycle checks. */
export function orderLearningPath(modules: LearningModule[]): string[] {
  const known = new Set(modules.map((module) => module.id));
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const module of modules) {
    indegree.set(module.id, 0);
    dependents.set(module.id, []);
  }
  for (const module of modules) {
    for (const prerequisite of module.prerequisites) {
      if (!known.has(prerequisite)) {
        throw new Error('Unknown prerequisite "' + prerequisite + '" for "' + module.id + '"');
      }
      indegree.set(module.id, (indegree.get(module.id) || 0) + 1);
      dependents.get(prerequisite)?.push(module.id);
    }
  }
  const ready = modules.filter((module) => indegree.get(module.id) === 0).map((module) => module.id);
  const ordered: string[] = [];
  while (ready.length > 0) {
    const current = ready.shift();
    if (!current) continue;
    ordered.push(current);
    for (const dependent of dependents.get(current) || []) {
      const nextDegree = (indegree.get(dependent) || 1) - 1;
      indegree.set(dependent, nextDegree);
      if (nextDegree === 0) ready.push(dependent);
    }
  }
  if (ordered.length !== modules.length) throw new Error("Learning path contains a prerequisite cycle");
  return ordered;
}
