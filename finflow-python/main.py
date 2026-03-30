from contextlib import asynccontextmanager
from fastapi    import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config     import get_settings
from app.core.logging    import setup_logging, logger
from app.core.exceptions import AppException, app_exception_handler, generic_exception_handler
from app.db.mongo        import connect_mongo, disconnect_mongo
from app.shared.cloudinary import init_cloudinary
from app.features.analyze.router  import router as analyze_router 
from app.features.chat.router      import router as chat_router
from app.features.pdf_parse.router import router as parse_router
from app.features.report.router    import router as report_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    settings = get_settings()

    logger.info("Starting FinFlow Python service...")
    await connect_mongo()
    init_cloudinary()
    logger.info(f"🚀 FinFlow AI service running on port {settings.PORT}")

    yield

    await disconnect_mongo()
    logger.info("FinFlow Python service stopped")


app = FastAPI(
    title="FinFlow AI Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppException,  app_exception_handler)
app.add_exception_handler(Exception,     generic_exception_handler)

app.include_router(chat_router)
app.include_router(parse_router)
app.include_router(report_router)
app.include_router(analyze_router)
@app.get("/health")
async def health():
    return {"status": "ok", "service": "finflow-python"}