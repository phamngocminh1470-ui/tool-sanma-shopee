import pytest
from app.core.normalizer import VoucherNormalizer


def test_clean_code():
    assert VoucherNormalizer.clean_code(" shopee 50k ") == "SHOPEE50K"
    assert VoucherNormalizer.clean_code("VOUCHER_123-ABC") == "VOUCHER_123-ABC"
    assert VoucherNormalizer.clean_code(None) == "UNKNOWN"


def test_parse_money():
    assert VoucherNormalizer.parse_money("50k") == 50000.0
    assert VoucherNormalizer.parse_money("1tr") == 1000000.0
    assert VoucherNormalizer.parse_money("150.000đ") == 150000.0
    assert VoucherNormalizer.parse_money(25000) == 25000.0
    assert VoucherNormalizer.parse_money(0) == 0.0


def test_parse_discount():
    val, unit = VoucherNormalizer.parse_discount("20%")
    assert val == 20.0
    assert unit == "%"

    val2, unit2 = VoucherNormalizer.parse_discount("50.000đ")
    assert val2 == 50000.0
    assert unit2 == "VND"


def test_infer_category():
    assert VoucherNormalizer.infer_category("Giảm giá điện thoại iPhone 15 Pro") == "Điện Tử & Công Nghệ"
    assert VoucherNormalizer.infer_category("Voucher freeship toàn quốc") == "Vận Chuyển Freeship"
    assert VoucherNormalizer.infer_category("Đầm váy thời trang nữ") == "Thời Trang & Làm Đẹp"
    assert VoucherNormalizer.infer_category("Sữa bột tã bỉm cho bé") == "Mẹ & Bé"
