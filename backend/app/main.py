import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.config import settings, DATA_DIR
from app.database import engine, Base, SessionLocal
from app.api import api_router
from app.connectors.registry import registry
from app.scheduler.runner import scheduler_manager
from app.models.rule import AutomationRule
from app.models.voucher import Voucher

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("tuananh_studio_hunter")


def seed_default_rules(db):
    count = db.query(AutomationRule).count()
    if count == 0:
        default_rules = [
            AutomationRule(
                name="Tự động gắn thẻ HOT",
                description="Gắn thẻ 'VOUCHER HOT' cho các voucher có điểm chất lượng từ 80 trở lên",
                is_active=True,
                priority=10,
                trigger_event="ON_DISCOVERY",
                condition_type="MIN_SCORE",
                condition_value="80.0",
                action_type="ADD_TAG",
                action_payload="VOUCHER HOT"
            ),
            AutomationRule(
                name="Ưu đãi giảm sâu",
                description="Gửi thông báo ưu tiên khi phát hiện mã giảm từ 25% trở lên",
                is_active=True,
                priority=9,
                trigger_event="ON_DISCOVERY",
                condition_type="MIN_DISCOUNT_PERCENT",
                condition_value="25.0",
                action_type="SEND_NOTIFICATION",
                action_payload="GIAM_SAU"
            ),
            AutomationRule(
                name="Ưu tiên đơn 0Đ",
                description="Gắn thẻ 'ĐƠN TỪ 0Đ' và đánh dấu xác minh cho voucher không yêu cầu đơn tối thiểu",
                is_active=True,
                priority=8,
                trigger_event="ON_DISCOVERY",
                condition_type="MAX_MIN_SPEND",
                condition_value="0.0",
                action_type="ADD_TAG",
                action_payload="ĐƠN TỪ 0Đ"
            ),
            AutomationRule(
                name="Ưu đãi Điện Tử & Công Nghệ",
                description="Tự động gắn thẻ 'CÔNG NGHỆ CHỌN LỌC' cho ngành hàng điện tử",
                is_active=True,
                priority=5,
                trigger_event="ON_DISCOVERY",
                condition_type="CATEGORY_EQUALS",
                condition_value="Điện Tử & Công Nghệ",
                action_type="ADD_TAG",
                action_payload="CÔNG NGHỆ CHỌN LỌC"
            )
        ]
        db.add_all(default_rules)
        db.commit()
        logger.info("Default automation rules seeded successfully")


from app.core.tunnel import tunnel_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schemas...")
    Base.metadata.create_all(bind=engine)

    # Database synchronization & seeding
    db = SessionLocal()
    try:
        registry.sync_with_db(db)
        seed_default_rules(db)
        
        # If database is fresh, trigger an initial automated discovery run
        v_count = db.query(Voucher).count()
        if v_count == 0:
            logger.info("Database is fresh. Launching initial autonomous voucher discovery...")
            # Run in background without blocking startup
            import asyncio
            asyncio.create_task(scheduler_manager.trigger_scan_now(trigger_type="INITIAL_BOOTSTRAP"))
    finally:
        db.close()

    # Start Autonomous Scheduler
    if settings.AUTO_SCAN_ENABLED:
        scheduler_manager.start()

    # Auto-start Cloudflare Public Tunnel if enabled
    if settings.AUTO_START_TUNNEL:
        import threading
        logger.info("Auto-starting Cloudflare Online Link...")
        threading.Thread(target=tunnel_manager.start, daemon=True).start()

    yield

    # Clean shutdown
    logger.info("Shutting down Autonomous Collection Scheduler & Tunnel...")
    scheduler_manager.shutdown()
    tunnel_manager.stop()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous Shopee Vietnam Voucher Intelligence Platform by TUẤN ANH STUDIO",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(api_router)


@app.get("/api/info")
def get_info():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "copyright": settings.COPYRIGHT,
        "slogan": settings.SLOGAN,
        "status": "OPERATIONAL"
    }


# Serve built frontend static files if present
frontend_dist = settings.DATA_PATH.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
