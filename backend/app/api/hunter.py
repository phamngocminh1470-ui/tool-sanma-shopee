from fastapi import APIRouter, BackgroundTasks
from app.scheduler.runner import scheduler_manager

router = APIRouter(prefix="/api/hunter", tags=["Auto Hunter"])


@router.get("/status")
def get_hunter_status():
    return scheduler_manager.get_status()


@router.post("/scan-now")
async def trigger_scan_now():
    """
    Triggers an immediate autonomous multi-source voucher scan.
    """
    res = await scheduler_manager.trigger_scan_now(trigger_type="MANUAL")
    return res


@router.post("/pause")
def pause_hunter():
    scheduler_manager.pause()
    return {"success": True, "message": "Đã tạm dừng bộ quét tự động"}


@router.post("/resume")
def resume_hunter():
    scheduler_manager.resume()
    return {"success": True, "message": "Đã tiếp tục bộ quét tự động"}
