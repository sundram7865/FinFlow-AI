from collections import defaultdict
from datetime import datetime
import numpy as np

def summarize_transactions(transactions: list) -> dict:
    """Aggregates transactions by category and type."""
    total_income  = 0.0
    total_expense = 0.0
    by_category: dict[str, float] = defaultdict(float)

    for t in transactions:
        amount   = float(t.get("amount", 0))
        tx_type  = t.get("type", "")
        category = t.get("category", "other")

        if tx_type == "CREDIT":
            total_income += amount
        else:
            total_expense += amount
            by_category[category] += amount

    top_categories = sorted(
        by_category.items(), key=lambda x: x[1], reverse=True
    )[:5]

    return {
        "total_income":   total_income,
        "total_expense":  total_expense,
        "balance":        total_income - total_expense,
        "by_category":    dict(by_category),
        "top_categories": top_categories,
    }


def calculate_averages(transactions: list) -> dict:
    """Calculates monthly average income and expense."""
    monthly: dict[str, dict] = defaultdict(lambda: {"income": 0.0, "expense": 0.0})

    for t in transactions:
        try:
            date  = datetime.fromisoformat(str(t.get("date", "")).replace("Z", ""))
            key   = f"{date.year}-{date.month:02d}"
        except Exception:
            continue

        amount = float(t.get("amount", 0))
        if t.get("type") == "CREDIT":
            monthly[key]["income"]  += amount
        else:
            monthly[key]["expense"] += amount

    if not monthly:
        return {"avg_income": 0.0, "avg_expense": 0.0}

    months      = len(monthly)
    avg_income  = sum(v["income"]  for v in monthly.values()) / months
    avg_expense = sum(v["expense"] for v in monthly.values()) / months

    return {"avg_income": avg_income, "avg_expense": avg_expense}


def detect_anomalies(transactions):
    expenses = [
        float(t.get("amount", 0))
        for t in transactions
        if t.get("type") != "CREDIT"
    ]

    if not expenses:
        return []

    mean = np.mean(expenses)
    std  = np.std(expenses) or 1

    anomalies = []

    for t in transactions:
        if t.get("type") == "CREDIT":
            continue

        t_amount = float(t.get("amount", 0))
        category = t.get("category", "Unknown")

        z = (t_amount - mean) / std

        if z > 2:
            if z > 3:
                severity = "high"
            elif z > 2.5:
                severity = "medium"
            else:
                severity = "low"

            percentile = (
                sum(a < t_amount for a in expenses) / len(expenses) * 100
            )

            if percentile >= 95:
                rank = "top 5%"
            elif percentile >= 90:
                rank = "top 10%"
            else:
                rank = "unusual"

            ratio = (t_amount / mean) if mean > 0 else 0

            description = (
                f"You spent ₹{t_amount} on {category}, "
                f"which is {ratio:.1f}× your average spending. "
                f"This falls in the {rank} of your past transactions."
            )

            anomalies.append({
                "amount": t_amount,
                "category": category,
                "avg": mean,
                "zScore": z,
                "rank": rank,
                "description": description,
                "severity": severity
            })

    return anomalies