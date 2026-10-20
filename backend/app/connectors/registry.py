import asyncio
import uuid
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from app.config import settings
from app.models.connector import ConnectorConfig
from app.models.scan_log import ScanRunLog
from app.models.audit_log import AuditLog
from app.connectors.base import BaseConnector
from app.connectors.shopee_public_deals import ShopeePublicDealsConnector
from app.connectors.shopee_freeship import ShopeeFreeshipConnector
from app.connectors.shopee_category_deals import ShopeeCategoryDealsConnector
from app.connectors.coupon_aggregator_feed import CouponAggregatorFeedConnector
from app.connectors.partner_bank_deals import PartnerBankDealsConnector
from app.connectors.mgg_vn import MggVnConnector

from app.core.normalizer import VoucherNormalizer
from app.core.deduplicator import VoucherDeduplicator
from app.core.classifier import VoucherClassifier
from app.core.ranker import VoucherRanker
from app.core.rule_engine import RuleEngine
from app.core.expiration_monitor import ExpirationMonitor
from app.core.notifier import Notifier

logger = logging.getLogger(__name__)


class ConnectorRegistry:
    """
    Central Coordinator for Multi-Source Voucher Discovery Connectors.
    Manages lifecycle, synchronization with database, bounded concurrency,
    and ingestion into the normalizer/ranking/deduplication pipeline.
    """

    def __init__(self):
        self._connectors: Dict[str, BaseConnector] = {}
        self._register_default_connectors()

    def _register_default_connectors(self):
        default_list = [
            ShopeePublicDealsConnector(),
            ShopeeFreeshipConnector(),
            ShopeeCategoryDealsConnector(),
            CouponAggregatorFeedConnector(),
            MggVnConnector(),
            PartnerBankDealsConnector(),
        ]
        for c in default_list:
            self._connectors[c.connector_id] = c

    def get_connector(self, connector_id: str) -> Optional[BaseConnector]:
        return self._connectors.get(connector_id)

    def get_all(self) -> List[BaseConnector]:
        return list(self._connectors.values())

    def sync_with_db(self, db: Session):
        """
        Ensures all registered connectors exist in database connector_configs.
        """
        for c in self._connectors.values():
            cfg = db.query(ConnectorConfig).filter(ConnectorConfig.id == c.connector_id).first()
            if not cfg:
                cfg = ConnectorConfig(
                    id=c.connector_id,
                    name=c.name,
                    description=c.description,
                    endpoint_url=c.endpoint_url,
                    connector_type=c.connector_type,
                    is_enabled=True,
                    status="ACTIVE",
                    total_found=0,
                    new_records=0,
                    updated_records=0,
                    duplicates_count=0,
                    error_count=0,
                    avg_duration_ms=0,
                    config_data="{}"
                )
                db.add(cfg)
        db.commit()

    async def run_connector(self, connector_id: str, db: Session) -> Dict[str, Any]:
        connector = self.get_connector(connector_id)
        if not connector:
            return {"success": False, "error": f"Connector {connector_id} không tồn tại"}

        # Fetch config from DB
        cfg = db.query(ConnectorConfig).filter(ConnectorConfig.id == connector_id).first()
        if cfg and not cfg.is_enabled:
            return {"success": False, "error": "Connector đang bị tắt", "status": "DISABLED"}

        fetch_result = await connector.execute_safe_fetch()
        now = datetime.utcnow()

        if cfg:
            cfg.last_run_at = now
            cfg.avg_duration_ms = fetch_result["duration_ms"]
            if fetch_result["success"]:
                cfg.last_success_at = now
                cfg.status = "ACTIVE"
                cfg.last_error_message = None
            else:
                cfg.status = "ERROR"
                cfg.error_count += 1
                cfg.last_error_message = fetch_result["error"]
            db.commit()

        if not fetch_result["success"]:
            return fetch_result

        raw_records = fetch_result["records"]
        new_count = 0
        updated_count = 0
        dup_count = 0

        for raw_item in raw_records:
            try:
                # 1. Normalization
                norm = VoucherNormalizer.normalize_record(raw_item, connector.name)
                
                # 2. Ranking Evaluation
                scores, ranking_reason = VoucherRanker.evaluate(norm)
                
                # 3. Classification
                tags = VoucherClassifier.classify(norm)
                
                # 4. Deduplication & Persistence
                voucher_rec, is_new, is_upd, is_dup = VoucherDeduplicator.process_and_deduplicate(
                    db, norm, scores, tags, ranking_reason
                )

                # 5. Rule-Based Automation Trigger
                final_tags = RuleEngine.evaluate_rules(db, norm, voucher_rec, tags)
                voucher_rec.tags = json.dumps(final_tags, ensure_ascii=False)
                
                # 6. Notifications for high-value discoveries
                if is_new:
                    new_count += 1
                    if scores["overall_score"] >= settings.MIN_SCORE_FOR_ALERT:
                        Notifier.notify_voucher(
                            db,
                            title=f"Phát hiện Voucher Mới: {voucher_rec.code}",
                            message=f"{voucher_rec.program_name} - Giảm {voucher_rec.discount_value}{voucher_rec.discount_unit}",
                            voucher_id=voucher_rec.id,
                            score=scores["overall_score"]
                        )
                elif is_upd:
                    updated_count += 1
                else:
                    dup_count += 1
                    
            except Exception as e:
                logger.error(f"Error processing record in connector {connector_id}: {e}")
                continue

        # Commit all voucher transactions
        db.commit()

        # Update connector stats in DB
        if cfg:
            cfg.total_found += len(raw_records)
            cfg.new_records += new_count
            cfg.updated_records += updated_count
            cfg.duplicates_count += dup_count
            db.commit()

        return {
            "success": True,
            "connector_id": connector_id,
            "total_found": len(raw_records),
            "new_records": new_count,
            "updated_records": updated_count,
            "duplicates": dup_count,
            "duration_ms": fetch_result["duration_ms"]
        }

    async def run_all_connectors(
        self,
        db: Session,
        trigger_type: str = "SCHEDULED"
    ) -> ScanRunLog:
        """
        Executes all active connectors concurrently with bounded worker pool.
        """
        scan_id = str(uuid.uuid4())
        started_at = datetime.utcnow()

        scan_log = ScanRunLog(
            scan_id=scan_id,
            started_at=started_at,
            status="RUNNING",
            trigger_type=trigger_type,
            details_json="[]"
        )
        db.add(scan_log)
        db.commit()

        # Audit log
        audit = AuditLog(
            timestamp=started_at,
            action="SCAN_STARTED",
            actor=trigger_type,
            details=f"Bắt đầu phiên quét mã tự động {scan_id}"
        )
        db.add(audit)
        db.commit()

        semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_WORKERS)
        details = []

        async def worker(conn: BaseConnector):
            async with semaphore:
                # Open isolated DB session for concurrent safety
                from app.database import SessionLocal
                local_db = SessionLocal()
                try:
                    res = await self.run_connector(conn.connector_id, local_db)
                    return res
                finally:
                    local_db.close()

        tasks = [worker(c) for c in self._connectors.values()]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        total_found = 0
        total_new = 0
        total_updated = 0
        total_dup = 0
        total_errors = 0

        for r in results:
            if isinstance(r, Exception):
                total_errors += 1
                details.append({"error": str(r), "success": False})
            elif isinstance(r, dict):
                details.append(r)
                if r.get("success"):
                    total_found += r.get("total_found", 0)
                    total_new += r.get("new_records", 0)
                    total_updated += r.get("updated_records", 0)
                    total_dup += r.get("duplicates", 0)
                else:
                    total_errors += 1

        # Run Expiration Monitor
        exp_res = ExpirationMonitor.run_check(db)

        finished_at = datetime.utcnow()
        duration_ms = int((finished_at - started_at).total_seconds() * 1000)

        scan_log.finished_at = finished_at
        scan_log.status = "COMPLETED" if total_errors == 0 else "PARTIAL"
        scan_log.total_found = total_found
        scan_log.new_records = total_new
        scan_log.updated_records = total_updated
        scan_log.duplicates_count = total_dup
        scan_log.errors_count = total_errors
        scan_log.duration_ms = duration_ms
        scan_log.summary = (
            f"Tìm thấy: {total_found} | Mới: {total_new} | Cập nhật: {total_updated} | "
            f"Trùng: {total_dup} | Lỗi: {total_errors} | Hết hạn: {exp_res['expired_count']}"
        )
        scan_log.details_json = json.dumps(details, ensure_ascii=False)
        db.commit()

        # Log completion in audit
        audit_finish = AuditLog(
            timestamp=finished_at,
            action="SCAN_COMPLETED",
            actor=trigger_type,
            details=scan_log.summary
        )
        db.add(audit_finish)
        db.commit()

        return scan_log


registry = ConnectorRegistry()
