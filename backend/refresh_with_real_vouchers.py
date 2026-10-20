import sys
import io
import asyncio
from datetime import datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.database import SessionLocal
from app.models.voucher import Voucher, VoucherHistory
from app.models.scan_log import ScanRunLog
from app.models.notification import SystemNotification
from app.connectors.registry import registry

async def main():
    db = SessionLocal()
    print("1. Đang dọn dẹp toàn bộ dữ liệu mock cũ khỏi cơ sở dữ liệu...")
    db.query(VoucherHistory).delete()
    db.query(Voucher).delete()
    db.query(ScanRunLog).delete()
    db.query(SystemNotification).delete()
    db.commit()
    print("   -> Đã dọn sạch cơ sở dữ liệu.")

    print("\n2. Đang kích hoạt thu thập dữ liệu THẬT 100% từ mạng lưới deal Shopee...")
    scan_log = await registry.run_all_connectors(db, trigger_type="LIVE_WEB_CRAWL")
    
    total = db.query(Voucher).count()
    print(f"\n3. KẾT QUẢ THU THẬP THỰC TẾ:")
    print(f"   - Tổng số voucher THẬT thu được: {total}")
    print(f"   - Mới phát hiện: {scan_log.new_records}")
    print(f"   - Trùng lặp: {scan_log.duplicates_count}")
    print(f"   - Lỗi: {scan_log.errors_count}")
    print(f"   - Tóm tắt: {scan_log.summary}")
    
    vouchers = db.query(Voucher).limit(5).all()
    print("\n4. MẪU VOUCHER THẬT VỪA CÀO ĐƯỢC:")
    for v in vouchers:
        print(f"   • [{v.code}] {v.program_name} | Giảm: {v.discount_value}{v.discount_unit} | Đơn từ: {v.min_spend:,.0f}Đ | Hạn: {v.expires_at} | Nguồn: {v.connector_name}")

    db.close()

if __name__ == "__main__":
    asyncio.run(main())
