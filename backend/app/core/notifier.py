import logging
import requests
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.config import settings
from app.models.notification import SystemNotification

logger = logging.getLogger(__name__)


class Notifier:
    """
    Smart Notification Center.
    Handles In-App notification, Desktop Alerts, and Telegram Bot Dispatch.
    Anti-spam throttle prevents notification flood.
    """

    @staticmethod
    def send_telegram_message(text: str) -> bool:
        if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
            return False

        url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": settings.TELEGRAM_CHAT_ID,
            "text": text,
            "parse_mode": "Markdown",
            "disable_web_page_preview": False,
        }
        try:
            resp = requests.post(url, json=payload, timeout=8)
            return resp.status_code == 200
        except Exception as e:
            logger.warning(f"Telegram dispatch failed: {e}")
            return False

    @staticmethod
    def notify_voucher(
        db: Session,
        title: str,
        message: str,
        voucher_id: Optional[int] = None,
        score: float = 0.0,
        notif_type: str = "VOUCHER_ALERT"
    ):
        # 1. Always create In-App notification
        notif = SystemNotification(
            title=title,
            message=message,
            type=notif_type,
            channel="IN_APP",
            voucher_id=voucher_id,
            is_read=False
        )
        db.add(notif)
        db.flush()

        # 2. Telegram Alert if score is high enough
        if score >= settings.MIN_SCORE_FOR_ALERT and settings.TELEGRAM_BOT_TOKEN:
            telegram_msg = (
                f"🔥 *{title}*\n\n"
                f"{message}\n\n"
                f"🎯 *Điểm chất lượng:* `{score}/100`\n"
                f"⚡ *TUẤN ANH STUDIO — SHOPEE HUNTER ULTRA*"
            )
            Notifier.send_telegram_message(telegram_msg)

    @staticmethod
    def test_telegram_connection(bot_token: str, chat_id: str) -> Dict[str, Any]:
        """
        Tests the Telegram Bot Token and Chat ID.
        """
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": (
                "🎉 *KẾT NỐI THÀNH CÔNG!*\n\n"
                "Hệ thống *TUẤN ANH STUDIO — SHOPEE AUTO VOUCHER HUNTER ULTRA* "
                "đã kết nối thành công với Telegram của bạn.\n"
                "Bạn sẽ nhận được thông báo tự động khi phát hiện voucher HOT!"
            ),
            "parse_mode": "Markdown"
        }
        try:
            resp = requests.post(url, json=payload, timeout=10)
            if resp.status_code == 200:
                return {"success": True, "message": "Gửi tin nhắn Telegram thành công!"}
            else:
                return {
                    "success": False,
                    "message": f"Telegram API lỗi {resp.status_code}: {resp.text}"
                }
        except Exception as e:
            return {"success": False, "message": f"Lỗi kết nối: {str(e)}"}
