import json
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.rule import AutomationRule
from app.models.notification import SystemNotification
from app.models.voucher import Voucher


class RuleEngine:
    """
    Rule-Based Automation Center execution engine.
    Matches vouchers against user-configured dynamic rules
    and executes automated actions (tagging, notifications, verification).
    """

    @staticmethod
    def evaluate_rules(
        db: Session,
        voucher_data: Dict[str, Any],
        voucher_record: Voucher,
        current_tags: List[str]
    ) -> List[str]:
        rules = (
            db.query(AutomationRule)
            .filter(AutomationRule.is_active == True)
            .order_by(AutomationRule.priority.desc())
            .all()
        )
        if not rules:
            return current_tags

        updated_tags = list(current_tags)
        now = datetime.utcnow()

        for rule in rules:
            matched = False
            cond_val = rule.condition_value.strip()

            try:
                if rule.condition_type == "MIN_SCORE":
                    if float(voucher_record.overall_score) >= float(cond_val):
                        matched = True

                elif rule.condition_type == "MIN_DISCOUNT_PERCENT":
                    if (
                        voucher_record.discount_unit == "%"
                        and float(voucher_record.discount_value) >= float(cond_val)
                    ):
                        matched = True

                elif rule.condition_type == "MAX_MIN_SPEND":
                    if float(voucher_record.min_spend) <= float(cond_val):
                        matched = True

                elif rule.condition_type == "CATEGORY_EQUALS":
                    if cond_val.lower() in voucher_record.category.lower():
                        matched = True

                elif rule.condition_type == "CODE_CONTAINS":
                    if cond_val.upper() in voucher_record.code.upper():
                        matched = True
            except Exception:
                continue

            if matched:
                rule.execution_count += 1
                rule.last_triggered_at = now
                
                # Execute Action
                if rule.action_type == "ADD_TAG":
                    tag_name = rule.action_payload or "Đặc biệt"
                    if tag_name not in updated_tags:
                        updated_tags.append(tag_name)

                elif rule.action_type == "SEND_NOTIFICATION":
                    notif = SystemNotification(
                        title=f"Kích hoạt quy tắc: {rule.name}",
                        message=(
                            f"Voucher {voucher_record.code} đạt tiêu chuẩn quy tắc '{rule.name}'. "
                            f"Điểm số: {voucher_record.overall_score} | Giảm: {voucher_record.discount_value}{voucher_record.discount_unit}"
                        ),
                        type="VOUCHER_ALERT",
                        channel="IN_APP",
                        voucher_id=voucher_record.id,
                        is_read=False,
                        created_at=now
                    )
                    db.add(notif)

                elif rule.action_type == "MARK_VERIFIED":
                    voucher_record.verification_status = "VERIFIED"
                    if "Đã xác minh" not in updated_tags:
                        updated_tags.append("Đã xác minh")

        return updated_tags
