from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app.models.voucher import Voucher
from app.models.connector import ConnectorConfig
from app.models.scan_log import ScanRunLog
from app.schemas.report import (
    DashboardSummaryResponse,
    CategoryMetric,
    TierMetric,
    ConnectorMetric,
)
from app.scheduler.runner import scheduler_manager

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])


@router.get("/dashboard", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    yesterday = now - timedelta(hours=24)

    total_vouchers = db.query(Voucher).filter(Voucher.is_archived == False).count()
    new_24h = db.query(Voucher).filter(Voucher.is_archived == False, Voucher.detected_at >= yesterday).count()
    verified_count = db.query(Voucher).filter(Voucher.is_archived == False, Voucher.verification_status == "VERIFIED").count()
    unverified_count = db.query(Voucher).filter(Voucher.is_archived == False, Voucher.verification_status == "UNVERIFIED").count()
    expiring_soon_count = db.query(Voucher).filter(Voucher.is_archived == False, Voucher.verification_status == "EXPIRING_SOON").count()
    archived_count = db.query(Voucher).filter(Voucher.is_archived == True).count()

    avg_score_res = db.query(func.avg(Voucher.overall_score)).filter(Voucher.is_archived == False).scalar()
    avg_score = round(float(avg_score_res or 0.0), 1)

    connectors = db.query(ConnectorConfig).all()
    active_conn = sum(1 for c in connectors if c.is_enabled and c.status == "ACTIVE")

    # Categories breakdown
    cat_query = (
        db.query(
            Voucher.category,
            func.count(Voucher.id).label("count"),
            func.avg(Voucher.overall_score).label("avg_score")
        )
        .filter(Voucher.is_archived == False)
        .group_by(Voucher.category)
        .all()
    )
    categories = [
        CategoryMetric(
            category=row[0],
            count=row[1],
            avg_score=round(float(row[2] or 0.0), 1)
        )
        for row in cat_query
    ]

    # Tiers breakdown
    deep_discount_count = db.query(Voucher).filter(
        Voucher.is_archived == False,
        (Voucher.discount_value >= 100000) | ((Voucher.discount_unit == "%") & (Voucher.discount_value >= 25.0))
    ).count()

    mid_discount_count = db.query(Voucher).filter(
        Voucher.is_archived == False,
        (Voucher.discount_value >= 30000) & (Voucher.discount_value < 100000)
    ).count()

    low_discount_count = total_vouchers - deep_discount_count - mid_discount_count
    low_discount_count = max(0, low_discount_count)

    tiers = [
        TierMetric(tier="Giảm rất cao (≥ 100K hoặc ≥ 25%)", count=deep_discount_count),
        TierMetric(tier="Giảm trung bình (30K - 100K)", count=mid_discount_count),
        TierMetric(tier="Giảm cơ bản (< 30K)", count=low_discount_count),
    ]

    # Connector metrics
    conn_metrics = [
        ConnectorMetric(
            id=c.id,
            name=c.name,
            status=c.status,
            total_found=c.total_found,
            new_records=c.new_records,
            error_count=c.error_count
        )
        for c in connectors
    ]

    scheduler_status = scheduler_manager.get_status()

    return DashboardSummaryResponse(
        total_vouchers=total_vouchers,
        new_24h=new_24h,
        verified_count=verified_count,
        unverified_count=unverified_count,
        expiring_soon_count=expiring_soon_count,
        archived_count=archived_count,
        avg_voucher_score=avg_score,
        active_connectors=active_conn,
        total_connectors=len(connectors),
        last_scan_time=scheduler_status.get("last_scan_time"),
        next_scan_time=scheduler_status.get("next_scan_time"),
        scheduler_running=scheduler_status.get("scheduler_running", False),
        categories=categories,
        tiers=tiers,
        connectors=conn_metrics
    )


@router.get("/scan-history")
def get_scan_history(
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    runs = (
        db.query(ScanRunLog)
        .order_by(desc(ScanRunLog.started_at))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "scan_id": r.scan_id,
            "started_at": str(r.started_at),
            "finished_at": str(r.finished_at) if r.finished_at else None,
            "status": r.status,
            "trigger_type": r.trigger_type,
            "total_found": r.total_found,
            "new_records": r.new_records,
            "updated_records": r.updated_records,
            "duplicates": r.duplicates_count,
            "errors": r.errors_count,
            "duration_ms": r.duration_ms,
            "summary": r.summary
        }
        for r in runs
    ]
