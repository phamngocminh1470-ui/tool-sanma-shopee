from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.rule import AutomationRule
from app.schemas.rule import RuleCreate, RuleUpdate, RuleResponse

router = APIRouter(prefix="/api/rules", tags=["Automation Rules"])


@router.get("", response_model=List[RuleResponse])
def list_rules(db: Session = Depends(get_db)):
    rules = db.query(AutomationRule).order_by(AutomationRule.priority.desc()).all()
    return rules


@router.post("", response_model=RuleResponse)
def create_rule(payload: RuleCreate, db: Session = Depends(get_db)):
    rule = AutomationRule(
        name=payload.name,
        description=payload.description,
        is_active=payload.is_active,
        priority=payload.priority,
        trigger_event=payload.trigger_event,
        condition_type=payload.condition_type,
        condition_value=payload.condition_value,
        action_type=payload.action_type,
        action_payload=payload.action_payload,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.put("/{rule_id}", response_model=RuleResponse)
def update_rule(rule_id: int, payload: RuleUpdate, db: Session = Depends(get_db)):
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Không tìm thấy quy tắc")

    if payload.name is not None:
        rule.name = payload.name
    if payload.description is not None:
        rule.description = payload.description
    if payload.is_active is not None:
        rule.is_active = payload.is_active
    if payload.priority is not None:
        rule.priority = payload.priority
    if payload.condition_type is not None:
        rule.condition_type = payload.condition_type
    if payload.condition_value is not None:
        rule.condition_value = payload.condition_value
    if payload.action_type is not None:
        rule.action_type = payload.action_type
    if payload.action_payload is not None:
        rule.action_payload = payload.action_payload

    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Không tìm thấy quy tắc")

    db.delete(rule)
    db.commit()
    return {"success": True, "message": "Đã xóa quy tắc thành công"}
