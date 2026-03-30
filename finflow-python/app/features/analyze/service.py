from app.features.analyze.schemas          import AnomalyRequest, AnomalyResponse
from app.agents.tools.transaction_tools    import detect_anomalies
from app.core.logging                      import logger


async def run_anomaly_detection(request: AnomalyRequest) -> AnomalyResponse:
    """
    Dedicated anomaly detection service.
    Called ONCE per PDF upload from Node.js upload pipeline.
    Never called from the chat pipeline.
    """
    logger.info(
        f"[AnomalyService] START userId={request.userId} "
        f"uploadId={request.uploadId} "
        f"transactions={len(request.transactions)}"
    )

    if not request.transactions:
        logger.warning("[AnomalyService] No transactions provided — returning empty")
        return AnomalyResponse(anomalies=[])

    anomalies = detect_anomalies(request.transactions)

    logger.info(f"[AnomalyService] Detected {len(anomalies)} anomalies")
    for a in anomalies:
        logger.info(f"[AnomalyService] [{a.get('severity')}] {a.get('description')[:80]}")

    return AnomalyResponse(anomalies=anomalies)