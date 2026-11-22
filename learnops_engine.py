"""Pure-Python business logic for the LearnOps Streamlit demo."""

from __future__ import annotations

import heapq
from typing import Any


SEED_STUDENTS: list[dict[str, Any]] = [
    {
        "id": "ST-2041", "name": "Aarav Sharma", "cohort": "2027",
        "github": "aarav-builds", "days_since_activity": 1, "commits_7d": 12,
        "open_prs": 2, "failed_checks": 0, "overdue_tasks": 0,
        "assessment": 91, "progress": 86,
    },
    {
        "id": "ST-2038", "name": "Meera Iyer", "cohort": "2027",
        "github": "meera-codes", "days_since_activity": 9, "commits_7d": 2,
        "open_prs": 1, "failed_checks": 1, "overdue_tasks": 1,
        "assessment": 72, "progress": 58,
    },
    {
        "id": "ST-2022", "name": "Rohan Das", "cohort": "2027",
        "github": "rohancode", "days_since_activity": 17, "commits_7d": 0,
        "open_prs": 0, "failed_checks": 2, "overdue_tasks": 3,
        "assessment": 54, "progress": 28,
    },
    {
        "id": "ST-2054", "name": "Ananya Rao", "cohort": "2027",
        "github": "ananya-dev", "days_since_activity": 2, "commits_7d": 8,
        "open_prs": 3, "failed_checks": 0, "overdue_tasks": 0,
        "assessment": 84, "progress": 79,
    },
    {
        "id": "ST-2017", "name": "Kabir Nair", "cohort": "2026",
        "github": "kabir-labs", "days_since_activity": 12, "commits_7d": 1,
        "open_prs": 0, "failed_checks": 1, "overdue_tasks": 2,
        "assessment": 68, "progress": 43,
    },
    {
        "id": "ST-2060", "name": "Ishita Sen", "cohort": "2027",
        "github": "ishita-creates", "days_since_activity": 0, "commits_7d": 15,
        "open_prs": 1, "failed_checks": 0, "overdue_tasks": 0,
        "assessment": 94, "progress": 92,
    },
]

LEARNING_PATH = [
    {"id": "programming", "title": "Programming foundations", "week": "Week 01", "prerequisites": [], "complete": True},
    {"id": "dsa", "title": "Data structures & algorithms", "week": "Week 02", "prerequisites": ["programming"], "complete": True},
    {"id": "oop", "title": "Object-oriented design", "week": "Week 03", "prerequisites": ["programming"], "complete": True},
    {"id": "apis", "title": "APIs & backend systems", "week": "Week 04", "prerequisites": ["dsa", "oop"], "complete": False},
    {"id": "concurrency", "title": "Concurrency & reliability", "week": "Week 05", "prerequisites": ["apis"], "complete": False},
]


def calculate_risk(student: dict[str, Any]) -> dict[str, Any]:
    """Return a bounded and explainable support score for human review.

    This is a demo triage heuristic, not a prediction of student ability.
    """
    score = 0
    reasons: list[str] = []

    days = int(student.get("days_since_activity", 0))
    if days >= 14:
        score += 22
        reasons.append("No GitHub activity for 14+ days")
    elif days >= 7:
        score += 12
        reasons.append("GitHub activity has slowed")

    if int(student.get("commits_7d", 0)) == 0:
        score += 15
        reasons.append("No commits in the last 7 days")

    failed = max(0, int(student.get("failed_checks", 0)))
    if failed:
        score += min(18, failed * 6)
        reasons.append(f"{failed} failed automated check(s)")

    overdue = max(0, int(student.get("overdue_tasks", 0)))
    if overdue:
        score += min(20, overdue * 5)
        reasons.append(f"{overdue} overdue task(s)")

    assessment = float(student.get("assessment", 0))
    if assessment < 60:
        score += 18
        reasons.append("Assessment average below 60%")
    elif assessment < 75:
        score += 9
        reasons.append("Assessment average below 75%")

    if float(student.get("progress", 0)) < 40:
        score += 12
        reasons.append("Project progress below 40%")

    score = min(100, score)
    level = "Needs support" if score >= 55 else "Watch" if score >= 25 else "On track"
    action = {
        "Needs support": "Schedule a 1:1 mentor check-in and agree on one small next step.",
        "Watch": "Send a check-in and review progress at the next stand-up.",
        "On track": "Keep the current learning plan and acknowledge recent progress.",
    }[level]

    return {
        **student,
        "score": score,
        "level": level,
        "reasons": reasons,
        "recommended_action": action,
    }


def prioritize_students(students: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Rank support signals with a heap; highest score is returned first."""
    heap: list[tuple[int, str, dict[str, Any]]] = []
    for student in students:
        result = calculate_risk(student)
        heapq.heappush(heap, (-result["score"], result["id"], result))
    return [heapq.heappop(heap)[2] for _ in range(len(heap))]


def order_learning_path(modules: list[dict[str, Any]]) -> list[str]:
    """Kahn topological sort: O(V + E), with missing-edge/cycle validation."""
    known = {module["id"] for module in modules}
    indegree = {module["id"]: 0 for module in modules}
    dependents = {module["id"]: [] for module in modules}

    for module in modules:
        for prerequisite in module["prerequisites"]:
            if prerequisite not in known:
                raise ValueError(f"Unknown prerequisite: {prerequisite}")
            indegree[module["id"]] += 1
            dependents[prerequisite].append(module["id"])

    ready = [key for key, degree in indegree.items() if degree == 0]
    ordered: list[str] = []
    while ready:
        current = ready.pop(0)
        ordered.append(current)
        for dependent in dependents[current]:
            indegree[dependent] -= 1
            if indegree[dependent] == 0:
                ready.append(dependent)

    if len(ordered) != len(modules):
        raise ValueError("Learning path contains a prerequisite cycle")
    return ordered
