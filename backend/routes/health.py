from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check() -> dict:
    return {"status": "ok", "service": "NegotiationSim API", "version": "1.0.0"}
