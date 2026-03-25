def safe_calculate(expression: str) -> float:
    """
    Safely evaluates simple math expressions for budget calculations.
    Only allows numbers and basic operators.
    """
    allowed = set("0123456789+-*/(). ")
    if not all(c in allowed for c in expression):
        raise ValueError(f"Invalid characters in expression: {expression}")
    try:
        return float(eval(expression))
    except Exception as e:
        raise ValueError(f"Calculation error: {e}")


def monthly_savings_needed(target: float, months: int) -> float:
    if months <= 0:
        raise ValueError("Months must be positive")
    return round(target / months, 2)


def weeks_to_goal(target: float, saved: float, weekly_save: float) -> float:
    remaining = target - saved
    if weekly_save <= 0:
        return float("inf")
    return round(remaining / weekly_save, 1)