import os
import platform
import psutil
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.config import settings, DATA_DIR
from app.database import get_db
from app.models.audit_log import AuditLog
from app.scheduler.runner import scheduler_manager

router = APIRouter(prefix="/api/system", tags=["System Health & Logs"])


@router.get("/health")
def get_system_health():
    # Process memory
    proc = psutil.Process(os.getpid())
    proc_mem_mb = round(proc.memory_info().rss / (1024 * 1024), 1)

    # System memory
    sys_mem = psutil.virtual_memory()
    total_mem_gb = round(sys_mem.total / (1024 * 1024 * 1024), 1)
    available_mem_gb = round(sys_mem.available / (1024 * 1024 * 1024), 1)

    # CPU
    cpu_percent = psutil.cpu_percent(interval=None)

    # Disk
    disk = psutil.disk_usage(str(DATA_DIR))
    disk_free_gb = round(disk.free / (1024 * 1024 * 1024), 1)

    # Database file size
    db_file = DATA_DIR / "voucher_hunter.db"
    db_size_mb = round(db_file.stat().st_size / (1024 * 1024), 2) if db_file.exists() else 0.0

    return {
        "status": "HEALTHY",
        "platform": f"{platform.system()} {platform.release()}",
        "python_version": platform.python_version(),
        "cpu_percent": cpu_percent,
        "process_memory_mb": proc_mem_mb,
        "system_memory_used_percent": sys_mem.percent,
        "system_memory_total_gb": total_mem_gb,
        "system_memory_available_gb": available_mem_gb,
        "disk_free_gb": disk_free_gb,
        "db_size_mb": db_size_mb,
        "active_workers": settings.MAX_CONCURRENT_WORKERS,
        "is_scanning": scheduler_manager.is_scanning_now,
        "version": settings.VERSION,
        "brand": settings.PROJECT_NAME,
        "copyright": settings.COPYRIGHT
    }


@router.get("/audit-logs")
def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    logs = (
        db.query(AuditLog)
        .order_by(desc(AuditLog.timestamp))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": l.id,
            "timestamp": str(l.timestamp),
            "action": l.action,
            "actor": l.actor,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details
        }
        for l in logs
    ]
