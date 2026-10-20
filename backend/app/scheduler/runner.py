import asyncio
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.database import SessionLocal
from app.connectors.registry import registry

logger = logging.getLogger(__name__)


class SchedulerManager:
    """
    Autonomous Collection Engine Scheduler.
    Controls background task execution, periodic jobs, manual triggers,
    pause/resume, and safe concurrency locking.
    """

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.is_scanning_now = False
        self.current_scan_id: Optional[str] = None
        self.last_scan_time: Optional[datetime] = None
        self._scan_lock = asyncio.Lock()
        self.job_id = "autonomous_voucher_hunter_job"

    def start(self):
        if not self.scheduler.running:
            self.scheduler.start()
            self.schedule_job(settings.DEFAULT_SCAN_INTERVAL_MINUTES)
            logger.info("Autonomous Collection Scheduler started successfully")

    def schedule_job(self, interval_minutes: int):
        trigger = IntervalTrigger(minutes=interval_minutes)
        if self.scheduler.get_job(self.job_id):
            self.scheduler.reschedule_job(self.job_id, trigger=trigger)
        else:
            self.scheduler.add_job(
                self._periodic_scan_worker,
                trigger=trigger,
                id=self.job_id,
                name="Autonomous Shopee Voucher Periodic Hunter",
                replace_existing=True
            )
        logger.info(f"Scheduled periodic scan every {interval_minutes} minutes")

    def pause(self):
        if self.scheduler.get_job(self.job_id):
            self.scheduler.pause_job(self.job_id)
            logger.info("Autonomous Collection Scheduler paused")

    def resume(self):
        if self.scheduler.get_job(self.job_id):
            self.scheduler.resume_job(self.job_id)
            logger.info("Autonomous Collection Scheduler resumed")

    def shutdown(self):
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)
            logger.info("Autonomous Collection Scheduler stopped")

    async def _periodic_scan_worker(self):
        logger.info("Executing scheduled periodic scan...")
        await self.trigger_scan_now(trigger_type="SCHEDULED")

    async def trigger_scan_now(self, trigger_type: str = "MANUAL") -> Dict[str, Any]:
        """
        Launches an immediate voucher scan run if not already scanning.
        """
        if self.is_scanning_now:
            return {
                "success": False,
                "message": "Một tác vụ quét đang diễn ra. Vui lòng chờ tiến trình hoàn tất.",
                "scanning": True
            }

        async with self._scan_lock:
            self.is_scanning_now = True
            db = SessionLocal()
            try:
                scan_log = await registry.run_all_connectors(db, trigger_type=trigger_type)
                self.last_scan_time = datetime.utcnow()
                self.current_scan_id = scan_log.scan_id
                return {
                    "success": True,
                    "message": "Quét hoàn tất thành công",
                    "scan_id": scan_log.scan_id,
                    "summary": scan_log.summary,
                    "total_found": scan_log.total_found,
                    "new_records": scan_log.new_records,
                    "updated_records": scan_log.updated_records,
                    "duplicates": scan_log.duplicates_count,
                    "errors": scan_log.errors_count,
                    "duration_ms": scan_log.duration_ms
                }
            except Exception as e:
                logger.error(f"Error during scan: {e}")
                return {
                    "success": False,
                    "message": f"Lỗi trong quá trình quét: {str(e)}",
                    "scanning": False
                }
            finally:
                self.is_scanning_now = False
                db.close()

    def get_status(self) -> Dict[str, Any]:
        job = self.scheduler.get_job(self.job_id) if self.scheduler.running else None
        next_run = str(job.next_run_time) if job and job.next_run_time else None
        is_paused = job.next_run_time is None if job else False

        return {
            "scheduler_running": self.scheduler.running,
            "is_paused": is_paused,
            "is_scanning_now": self.is_scanning_now,
            "current_scan_id": self.current_scan_id,
            "last_scan_time": str(self.last_scan_time) if self.last_scan_time else None,
            "next_scan_time": next_run,
            "interval_minutes": settings.DEFAULT_SCAN_INTERVAL_MINUTES
        }


scheduler_manager = SchedulerManager()
