from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.notification import SystemNotification
from app.core.notifier import Notifier

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    channel: str
    is_read: bool
    action_url: Optional[str] = None
    voucher_id: Optional[int] = None
    created_at: str

    class Config:
        from_attributes = True


class TelegramTestPayload(BaseModel):
    bot_token: str
    chat_id: str


@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    notifs = (
        db.query(SystemNotification)
        .order_by(desc(SystemNotification.created_at))
        .limit(limit)
        .all()
    )
    return [
        NotificationResponse(
            id=n.id,
            title=n.title,
            message=n.message,
            type=n.type,
            channel=n.channel,
            is_read=n.is_read,
            action_url=n.action_url,
            voucher_id=n.voucher_id,
            created_at=str(n.created_at)
        )
        for n in notifs
    ]


@router.put("/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db)):
    notif = db.query(SystemNotification).filter(SystemNotification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo")
    notif.is_read = True
    db.commit()
    return {"success": True}


@router.post("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db)):
    db.query(SystemNotification).filter(SystemNotification.is_read == False).update({"is_read": True})
    db.commit()
    return {"success": True, "message": "Đã đánh dấu tất cả là đã đọc"}


@router.delete("/{notif_id}")
def delete_notification(notif_id: int, db: Session = Depends(get_db)):
    notif = db.query(SystemNotification).filter(SystemNotification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo")
    db.delete(notif)
    db.commit()
    return {"success": True}


@router.post("/test-telegram")
def test_telegram(payload: TelegramTestPayload):
    res = Notifier.test_telegram_connection(payload.bot_token, payload.chat_id)
    return res
