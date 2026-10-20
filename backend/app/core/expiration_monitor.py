from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.voucher import Voucher, VoucherHistory
from app.models.notification import SystemNotification


class ExpirationMonitor:
    """
    Automated Expiration & Lifecycle State Transition Monitor.
    Runs periodically to:
    - Transition expired vouchers to EXPIRED & ARCHIVE
    - Detect vouchers expiring within 24 hours
    - Generate proactive alerts for expiring vouchers
    """

    @staticmethod
    def run_check(db: Session) -> Dict[str, int]:
        now = datetime.utcnow()
        soon_threshold = now + timedelta(hours=24)
        
        expired_count = 0
        expiring_soon_count = 0

        # 1. Check for expired vouchers
        expired_vouchers = (
            db.query(Voucher)
            .filter(
                Voucher.expires_at != None,
                Voucher.expires_at < now,
                Voucher.verification_status != "EXPIRED"
            )
            .all()
        )

        for v in expired_vouchers:
            v.verification_status = "EXPIRED"
            v.is_archived = True
            v.updated_at = now
            
            hist = VoucherHistory(
                voucher_id=v.id,
                changed_at=now,
                change_type="STATUS_CHANGE",
                field_name="verification_status",
                old_value="ACTIVE",
                new_value="EXPIRED",
                connector_name="SYSTEM_EXPIRATION_MONITOR"
            )
            db.add(hist)
            expired_count += 1

        # 2. Check for vouchers expiring within 24 hours
        expiring_vouchers = (
            db.query(Voucher)
            .filter(
                Voucher.expires_at != None,
                Voucher.expires_at >= now,
                Voucher.expires_at <= soon_threshold,
                Voucher.verification_status.notin_(["EXPIRED", "EXPIRING_SOON"])
            )
            .all()
        )

        for v in expiring_vouchers:
            v.verification_status = "EXPIRING_SOON"
            v.updated_at = now
            expiring_soon_count += 1
            
            # Send notification for high value vouchers expiring soon
            if v.overall_score >= 70:
                notif = SystemNotification(
                    title=f"Voucher sắp hết hạn: {v.code}",
                    message=(
                        f"Mã '{v.code}' ({v.program_name}) sắp hết hạn trong 24 giờ tới. "
                        f"Điểm xếp hạng: {v.overall_score}."
                    ),
                    type="WARNING",
                    channel="IN_APP",
                    voucher_id=v.id,
                    is_read=False,
                    created_at=now
                )
                db.add(notif)

        if expired_count > 0 or expiring_soon_count > 0:
            db.commit()

        return {
            "expired_count": expired_count,
            "expiring_soon_count": expiring_soon_count
        }
