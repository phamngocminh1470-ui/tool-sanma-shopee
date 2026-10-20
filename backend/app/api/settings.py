from fastapi import APIRouter, HTTPException
from app.config import settings
from app.schemas.settings import SystemSettingsResponse, SystemSettingsUpdate
from app.scheduler.runner import scheduler_manager

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("", response_model=SystemSettingsResponse)
def get_system_settings():
    return SystemSettingsResponse(
        project_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        copyright=settings.COPYRIGHT,
        slogan=settings.SLOGAN,
        auto_scan_enabled=settings.AUTO_SCAN_ENABLED,
        scan_interval_minutes=settings.DEFAULT_SCAN_INTERVAL_MINUTES,
        max_concurrent_workers=settings.MAX_CONCURRENT_WORKERS,
        request_timeout_seconds=settings.REQUEST_TIMEOUT_SECONDS,
        telegram_configured=bool(settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_CHAT_ID),
        telegram_chat_id=settings.TELEGRAM_CHAT_ID,
        min_score_for_alert=settings.MIN_SCORE_FOR_ALERT,
        weight_value=settings.WEIGHT_VALUE,
        weight_reliability=settings.WEIGHT_RELIABILITY,
        weight_applicability=settings.WEIGHT_APPLICABILITY,
        weight_urgency=settings.WEIGHT_URGENCY,
        weight_confidence=settings.WEIGHT_CONFIDENCE,
    )


@router.put("", response_model=SystemSettingsResponse)
def update_system_settings(payload: SystemSettingsUpdate):
    if payload.auto_scan_enabled is not None:
        settings.AUTO_SCAN_ENABLED = payload.auto_scan_enabled
        if not payload.auto_scan_enabled:
            scheduler_manager.pause()
        else:
            scheduler_manager.resume()

    if payload.scan_interval_minutes is not None:
        if payload.scan_interval_minutes < 1 or payload.scan_interval_minutes > 1440:
            raise HTTPException(status_code=400, detail="Chu kỳ quét phải từ 1 đến 1440 phút")
        settings.DEFAULT_SCAN_INTERVAL_MINUTES = payload.scan_interval_minutes
        scheduler_manager.schedule_job(payload.scan_interval_minutes)

    if payload.max_concurrent_workers is not None:
        settings.MAX_CONCURRENT_WORKERS = max(1, min(10, payload.max_concurrent_workers))

    if payload.request_timeout_seconds is not None:
        settings.REQUEST_TIMEOUT_SECONDS = max(5, min(120, payload.request_timeout_seconds))

    if payload.telegram_bot_token is not None:
        settings.TELEGRAM_BOT_TOKEN = payload.telegram_bot_token.strip() or None

    if payload.telegram_chat_id is not None:
        settings.TELEGRAM_CHAT_ID = payload.telegram_chat_id.strip() or None

    if payload.min_score_for_alert is not None:
        settings.MIN_SCORE_FOR_ALERT = max(0, min(100, payload.min_score_for_alert))

    # Ranking weights update
    if (
        payload.weight_value is not None
        or payload.weight_reliability is not None
        or payload.weight_applicability is not None
        or payload.weight_urgency is not None
        or payload.weight_confidence is not None
    ):
        wv = payload.weight_value if payload.weight_value is not None else settings.WEIGHT_VALUE
        wr = payload.weight_reliability if payload.weight_reliability is not None else settings.WEIGHT_RELIABILITY
        wa = payload.weight_applicability if payload.weight_applicability is not None else settings.WEIGHT_APPLICABILITY
        wu = payload.weight_urgency if payload.weight_urgency is not None else settings.WEIGHT_URGENCY
        wc = payload.weight_confidence if payload.weight_confidence is not None else settings.WEIGHT_CONFIDENCE

        total_weight = wv + wr + wa + wu + wc
        if total_weight <= 0:
            raise HTTPException(status_code=400, detail="Tổng trọng số phải lớn hơn 0")

        settings.WEIGHT_VALUE = round(wv / total_weight, 4)
        settings.WEIGHT_RELIABILITY = round(wr / total_weight, 4)
        settings.WEIGHT_APPLICABILITY = round(wa / total_weight, 4)
        settings.WEIGHT_URGENCY = round(wu / total_weight, 4)
        settings.WEIGHT_CONFIDENCE = round(wc / total_weight, 4)

    return get_system_settings()
