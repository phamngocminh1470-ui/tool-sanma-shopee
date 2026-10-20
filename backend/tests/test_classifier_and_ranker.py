import pytest
from datetime import datetime, timedelta
from app.core.classifier import VoucherClassifier
from app.core.ranker import VoucherRanker


def test_classifier_tags():
    data = {
        "program_name": "Siêu sale freeship toàn sàn",
        "description": "Giảm 30% cho mọi đơn hàng",
        "code": "FREESHIP30P",
        "discount_unit": "%",
        "discount_value": 30.0,
        "min_spend": 0.0,
        "usage_scope": "ALL_PLATFORM",
        "verification_status": "VERIFIED",
        "expires_at": datetime.utcnow() + timedelta(hours=10),
    }

    tags = VoucherClassifier.classify(data)
    assert "Voucher miễn phí vận chuyển" in tags
    assert "Giảm cao" in tags
    assert "Đã xác minh" in tags
    assert "Sắp hết hạn" in tags
    assert "Toàn sàn Shopee" in tags
    assert "Giá trị nổi bật: Đơn từ 0Đ" in tags


def test_voucher_ranker():
    data = {
        "code": "HOTDEAL100K",
        "discount_value": 100000.0,
        "discount_unit": "VND",
        "min_spend": 0.0,
        "max_discount": 100000.0,
        "connector_name": "shopee_public_deals",
        "usage_scope": "ALL_PLATFORM",
        "verification_status": "VERIFIED",
        "expires_at": datetime.utcnow() + timedelta(hours=5),
    }

    scores, reason = VoucherRanker.evaluate(data)
    assert scores["overall_score"] >= 80.0
    assert scores["value_score"] >= 80.0
    assert scores["reliability_score"] >= 90.0
    assert scores["confidence_score"] >= 90.0
    assert len(reason) > 0
