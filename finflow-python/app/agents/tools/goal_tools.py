from datetime import datetime


def check_goal_progress(goal: dict) -> dict:
    """Calculates goal progress percentage and on-track status."""
    target  = float(goal.get("targetAmount", 1))
    saved   = float(goal.get("savedAmount",  0))
    pct     = (saved / target) * 100 if target > 0 else 0

    try:
        deadline  = datetime.fromisoformat(str(goal.get("deadline", "")).replace("Z", ""))
        days_left = (deadline - datetime.utcnow()).days
    except Exception:
        days_left = 0

    milestones = goal.get("milestones", [])
    total_ms   = len(milestones)
    achieved   = sum(1 for m in milestones if m.get("achieved"))
    expected   = (achieved / total_ms * 100) if total_ms > 0 else 0
    on_track   = pct >= expected

    return {
        "title":       goal.get("title"),
        "progress_pct": round(pct, 1),
        "days_left":   days_left,
        "on_track":    on_track,
        "remaining":   target - saved,
    }


def summarize_goals(goals: list) -> list:
    return [check_goal_progress(g) for g in goals]