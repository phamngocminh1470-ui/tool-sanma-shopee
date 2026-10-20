import io
import csv
import json
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_

from app.database import get_db
from app.models.voucher import Voucher, VoucherHistory
from app.schemas.voucher import (
    VoucherResponse,
    VoucherListResponse,
    VoucherHistoryResponse,
)

router = APIRouter(prefix="/api/vouchers", tags=["Vouchers"])


@router.get("", response_model=VoucherListResponse)
def list_vouchers(
    search: Optional[str] = None,
    category: Optional[str] = None,
    discount_type: Optional[str] = None,
    status: Optional[str] = None,
    scope: Optional[str] = None,
    connector: Optional[str] = None,
    is_archived: bool = False,
    min_score: Optional[float] = None,
    sort_by: str = Query("overall_score", enum=["overall_score", "value_score", "discount_value", "min_spend", "expires_at", "detected_at"]),
    order: str = Query("desc", enum=["asc", "desc"]),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Voucher).filter(Voucher.is_archived == is_archived)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Voucher.code.ilike(s),
                Voucher.program_name.ilike(s),
                Voucher.description.ilike(s),
                Voucher.category.ilike(s),
                Voucher.shop_name.ilike(s),
            )
        )

    if category and category != "all":
        query = query.filter(Voucher.category == category)

    if discount_type and discount_type != "all":
        query = query.filter(Voucher.discount_type == discount_type)

    if status and status != "all":
        query = query.filter(Voucher.verification_status == status)

    if scope and scope != "all":
        query = query.filter(Voucher.usage_scope == scope)

    if connector and connector != "all":
        query = query.filter(Voucher.connector_name == connector)

    if min_score is not None:
        query = query.filter(Voucher.overall_score >= min_score)

    # Sorting
    sort_column = getattr(Voucher, sort_by, Voucher.overall_score)
    query = query.order_by(desc(sort_column) if order == "desc" else asc(sort_column))

    total = query.count()
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/collections/{collection_name}", response_model=VoucherListResponse)
def get_voucher_collection(
    collection_name: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    query = db.query(Voucher)

    if collection_name == "best":
        query = query.filter(Voucher.is_archived == False, Voucher.overall_score >= 75.0).order_by(desc(Voucher.overall_score))
    elif collection_name == "new-24h":
        yesterday = now - timedelta(hours=24)
        query = query.filter(Voucher.is_archived == False, Voucher.detected_at >= yesterday).order_by(desc(Voucher.detected_at))
    elif collection_name == "deep-discount":
        query = query.filter(
            Voucher.is_archived == False,
            or_(
                Voucher.discount_value >= 100000,
                (Voucher.discount_unit == "%") & (Voucher.discount_value >= 20.0)
            )
        ).order_by(desc(Voucher.overall_score))
    elif collection_name == "low-min-spend":
        query = query.filter(Voucher.is_archived == False, Voucher.min_spend <= 50000).order_by(asc(Voucher.min_spend), desc(Voucher.overall_score))
    elif collection_name == "expiring-soon":
        soon = now + timedelta(hours=24)
        query = query.filter(
            Voucher.is_archived == False,
            Voucher.expires_at != None,
            Voucher.expires_at >= now,
            Voucher.expires_at <= soon
        ).order_by(asc(Voucher.expires_at))
    elif collection_name == "verified":
        query = query.filter(Voucher.is_archived == False, Voucher.verification_status == "VERIFIED").order_by(desc(Voucher.overall_score))
    elif collection_name == "unverified":
        query = query.filter(Voucher.is_archived == False, Voucher.verification_status == "UNVERIFIED").order_by(desc(Voucher.overall_score))
    elif collection_name == "needs-review":
        query = query.filter(Voucher.is_archived == False, Voucher.verification_status == "NEEDS_REVIEW").order_by(desc(Voucher.updated_at))
    elif collection_name == "archived":
        query = query.filter(Voucher.is_archived == True).order_by(desc(Voucher.updated_at))
    else:
        raise HTTPException(status_code=404, detail="Bộ sưu tập không tồn tại")

    total = query.count()
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/{voucher_id}")
def get_voucher_detail(voucher_id: int, db: Session = Depends(get_db)):
    voucher = db.query(Voucher).filter(Voucher.id == voucher_id).first()
    if not voucher:
        raise HTTPException(status_code=404, detail="Không tìm thấy voucher")

    history = (
        db.query(VoucherHistory)
        .filter(VoucherHistory.voucher_id == voucher_id)
        .order_by(desc(VoucherHistory.changed_at))
        .all()
    )

    tags = json.loads(voucher.tags) if voucher.tags else []
    raw = json.loads(voucher.raw_data) if voucher.raw_data else {}

    return {
        "voucher": VoucherResponse.from_orm(voucher),
        "history": [VoucherHistoryResponse.from_orm(h) for h in history],
        "tags": tags,
        "raw_data": raw,
    }


@router.post("/{voucher_id}/toggle-account-save")
def toggle_account_save(voucher_id: int, db: Session = Depends(get_db)):
    voucher = db.query(Voucher).filter(Voucher.id == voucher_id).first()
    if not voucher:
        raise HTTPException(status_code=404, detail="Không tìm thấy voucher")

    voucher.is_saved_to_account = not voucher.is_saved_to_account
    voucher.updated_at = datetime.utcnow()
    db.commit()

    return {
        "success": True,
        "voucher_id": voucher_id,
        "is_saved_to_account": voucher.is_saved_to_account,
        "message": "Đã lưu vào ví cá nhân" if voucher.is_saved_to_account else "Đã gỡ khỏi ví cá nhân"
    }


@router.get("/export/csv")
def export_vouchers_csv(db: Session = Depends(get_db)):
    vouchers = db.query(Voucher).filter(Voucher.is_archived == False).order_by(desc(Voucher.overall_score)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Mã Voucher", "Tên Chương Trình", "Giá Trị Giảm", "Đơn Tối Thiểu", "Giảm Tối Đa",
        "Ngành Hàng", "Phạm Vi", "Điểm Xếp Hạng", "Hạn Sử Dụng", "Trạng Thái", "Nguồn", "Link Nhận"
    ])

    for v in vouchers:
        writer.writerow([
            v.code,
            v.program_name,
            f"{v.discount_value} {v.discount_unit}",
            f"{v.min_spend:,.0f} VND",
            f"{v.max_discount:,.0f} VND" if v.max_discount else "Không giới hạn",
            v.category,
            v.usage_scope,
            v.overall_score,
            str(v.expires_at) if v.expires_at else "Không xác định",
            v.verification_status,
            v.connector_name,
            v.claim_url or ""
        ])

    response = Response(content=output.getvalue().encode("utf-8-sig"), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=shopee_vouchers_tuananh_studio.csv"
    return response


@router.get("/export/json")
def export_vouchers_json(db: Session = Depends(get_db)):
    vouchers = db.query(Voucher).filter(Voucher.is_archived == False).order_by(desc(Voucher.overall_score)).all()
    data = [VoucherResponse.from_orm(v).dict() for v in vouchers]

    response = Response(
        content=json.dumps(data, ensure_ascii=False, indent=2, default=str),
        media_type="application/json"
    )
    response.headers["Content-Disposition"] = "attachment; filename=shopee_vouchers_tuananh_studio.json"
    return response
