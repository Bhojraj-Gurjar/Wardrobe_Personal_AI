import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.routers import (
    avatar_generation,
    body_analysis,
    digital_avatar,
    face,
    face_analysis,
    face_auth,
    face_debug,
    face_diagnostics,
    fashion_dna,
    health,
    products,
    recommendations,
    virtual_tryon,
)
from app.config import get_settings
from app.services.face_engine import initialize_face_engine
from app.services.fashion_dna_vector_service import FashionDnaVectorService
from app.services.qdrant_service import QdrantStore

logger = logging.getLogger(__name__)


logging.basicConfig(

    level=logging.INFO,

    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",

)





def create_app() -> FastAPI:

    app = FastAPI(

        title="Wardrobe AI — AI Service",

        version="1.0.0",

        description="Python FastAPI microservice for face, fashion DNA, and recommendations.",

    )



    @app.on_event("startup")

    async def startup_face_engine() -> None:
        status = initialize_face_engine()
        if status.ready:
            settings = get_settings()
            QdrantStore().ensure_collection(
                settings.qdrant_face_collection,
                settings.face_vector_size,
            )
        FashionDnaVectorService().ensure_collection()

        try:
            from app.tryon.service import log_tryon_startup_config

            log_tryon_startup_config()
        except Exception as error:  # noqa: BLE001
            logger.error("Virtual try-on startup check failed: %s", error)

        try:
            from app.services.face_trait_service import get_face_trait_engine
            from app.services.opencv_pose_provider import detect_pose_landmarks
            import numpy as np

            get_face_trait_engine()
            detect_pose_landmarks(np.zeros((256, 192, 3), dtype=np.uint8))
        except Exception as error:  # noqa: BLE001
            logger.error("Vision analysis engines failed to initialize: %s", error)



    @app.exception_handler(Exception)

    async def unhandled_exception_handler(request: Request, exc: Exception):

        logging.getLogger("app.errors").error(

            "Unhandled error on %s %s: %s",

            request.method,

            request.url.path,

            exc,

            exc_info=True,

        )

        return JSONResponse(

            status_code=500,

            content={"detail": f"Face verification failed: {exc}"},

        )



    app.add_middleware(

        CORSMiddleware,

        allow_origins=["*"],

        allow_credentials=True,

        allow_methods=["*"],

        allow_headers=["*"],

    )



    app.include_router(health.router)

    app.include_router(face_diagnostics.router)

    app.include_router(face_auth.router)

    app.include_router(face_debug.router)

    app.include_router(face.router)

    app.include_router(face_analysis.router)

    app.include_router(body_analysis.router)

    app.include_router(avatar_generation.router)

    app.include_router(digital_avatar.router)

    app.include_router(fashion_dna.router)

    app.include_router(recommendations.router)

    app.include_router(products.router)

    app.include_router(virtual_tryon.router)

    app.include_router(__import__("app.tryon.router", fromlist=["router"]).router)

    tryon_results_dir = Path(__file__).resolve().parent / "generated" / "tryon"
    tryon_results_dir.mkdir(parents=True, exist_ok=True)
    app.mount(
        "/tryon/results",
        StaticFiles(directory=str(tryon_results_dir)),
        name="tryon-results",
    )

    return app





app = create_app()


