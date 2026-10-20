from fastapi import APIRouter
from app.api.vouchers import router as vouchers_router
from app.api.hunter import router as hunter_router
from app.api.connectors import router as connectors_router
from app.api.rules import router as rules_router
from app.api.notifications import router as notifications_router
from app.api.reports import router as reports_router
from app.api.settings import router as settings_router
from app.api.system import router as system_router
from app.api.backup import router as backup_router
from app.api.tunnel import router as tunnel_router

api_router = APIRouter()
api_router.include_router(vouchers_router)
api_router.include_router(hunter_router)
api_router.include_router(connectors_router)
api_router.include_router(rules_router)
api_router.include_router(notifications_router)
api_router.include_router(reports_router)
api_router.include_router(settings_router)
api_router.include_router(system_router)
api_router.include_router(backup_router)
api_router.include_router(tunnel_router)

__all__ = ["api_router"]
