import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.voucher import Voucher, VoucherHistory
from app.models.rule import AutomationRule
from app.core.deduplicator import VoucherDeduplicator
from app.core.rule_engine import RuleEngine

# Test in-memory SQLite database
test_engine = create_engine("sqlite:///:memory:", echo=False)
TestSession = sessionmaker(bind=test_engine)


@pytest.fixture
def db():
    Base.metadata.create_all(bind=test_engine)
    session = TestSession()
    yield session
    session.close()
    Base.metadata.drop_all(bind=test_engine)


def test_deduplicator(db):
    norm = {
        "code": "TESTVOUCHER50K",
        "program_name": "Test Voucher 50k",
        "description": "Test description",
        "discount_type": "FIXED_AMOUNT",
        "discount_value": 50000.0,
        "discount_unit": "VND",
        "min_spend": 200000.0,
        "max_discount": 50000.0,
        "category": "Toàn sàn",
        "connector_name": "test_connector",
        "usage_scope": "ALL_PLATFORM",
        "verification_status": "VERIFIED",
        "is_saved_to_account": False,
    }
    scores = {
        "overall_score": 75.0,
        "value_score": 75.0,
        "reliability_score": 80.0,
        "applicability_score": 80.0,
        "urgency_score": 50.0,
        "confidence_score": 90.0
    }
    tags = ["Toàn sàn Shopee", "Giảm cao"]

    # Ingest 1st time
    rec1, is_new1, is_upd1, is_dup1 = VoucherDeduplicator.process_and_deduplicate(
        db, norm, scores, tags, "Lý do test"
    )
    assert is_new1 is True
    assert is_dup1 is False
    assert rec1.code == "TESTVOUCHER50K"

    # Ingest 2nd time (identical)
    rec2, is_new2, is_upd2, is_dup2 = VoucherDeduplicator.process_and_deduplicate(
        db, norm, scores, tags, "Lý do test"
    )
    assert is_new2 is False
    assert is_dup2 is True
    assert rec2.id == rec1.id


def test_rules_engine(db):
    rule = AutomationRule(
        name="Hot Rule Test",
        condition_type="MIN_SCORE",
        condition_value="70.0",
        action_type="ADD_TAG",
        action_payload="TEST_HOT",
        is_active=True
    )
    db.add(rule)
    db.commit()

    voucher = Voucher(
        code="HOT1",
        fingerprint="fp1",
        program_name="Hot 1",
        category="Toàn sàn",
        connector_name="test",
        overall_score=85.0
    )
    db.add(voucher)
    db.commit()

    tags = ["Mới phát hiện"]
    new_tags = RuleEngine.evaluate_rules(db, {}, voucher, tags)
    assert "TEST_HOT" in new_tags
    assert rule.execution_count == 1
