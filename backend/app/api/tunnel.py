from fastapi import APIRouter
from app.core.tunnel import tunnel_manager

router = APIRouter(prefix="/api/tunnel", tags=["Tunnel Online Link"])


@router.get("/status")
def get_tunnel_status():
    return tunnel_manager.get_status()


@router.post("/start")
def start_tunnel():
    return tunnel_manager.start()


@router.post("/stop")
def stop_tunnel():
    return tunnel_manager.stop()
