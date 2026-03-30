from fastapi                              import APIRouter, Depends
from app.features.analyze.schemas         import AnomalyRequest, AnomalyResponse
from app.features.analyze.service         import run_anomaly_detection
from app.core.security                    import verify_internal_key

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post(
    "/anomalies",
    response_model=AnomalyResponse,
    dependencies=[Depends(verify_internal_key)],
)
async def detect_anomalies_endpoint(request: AnomalyRequest) -> AnomalyResponse:
    """
    Receives parsed transactions from Node.js upload pipeline.
    Returns detected anomalies — Node.js handles deduplication and DB write.
    """
    return await run_anomaly_detection(request)