from collections import defaultdict
from datetime import datetime


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


def detect_anomalies(transactions: list) -> list:
    """Detects spending anomalies — 3x category average = anomaly."""
    category_amounts: dict[str, list[float]] = defaultdict(list)

    for t in transactions:
        if t.get("type") == "DEBIT":
            category = t.get("category", "other")
            category_amounts[category].append(float(t.get("amount", 0)))

    anomalies = []
    for category, amounts in category_amounts.items():
        if len(amounts) < 3:
            continue
        avg    = sum(amounts[:-1]) / len(amounts[:-1])
        latest = amounts[-1]
        if avg > 0 and latest > avg * 3:
            anomalies.append({
                "description": f"{category} spend of ₹{latest:,.0f} is {latest/avg:.1f}x above average",
                "severity":    "high" if latest > avg * 5 else "medium",
                "category":    category,
            })

    return anomalies