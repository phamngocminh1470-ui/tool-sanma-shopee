# TUẤN ANH STUDIO — SHOPEE AUTO VOUCHER HUNTER ULTRA
### Autonomous Voucher Intelligence Platform — Ultimate Edition

> **Bản quyền TUẤN ANH STUDIO**  
> **Slogan:** *AUTOMATE THE SEARCH. ORGANIZE THE VALUE.*  
> **Phiên bản:** `v1.0.0-ULTRA`

---

## 1. GIỚI THIỆU TỔNG QUAN

**TUẤN ANH STUDIO — SHOPEE AUTO VOUCHER HUNTER ULTRA** là nền tảng tự động hóa thông minh cao cấp, chuyên dụng tìm kiếm, thu thập, chuẩn hóa, phân loại, đánh giá, xếp hạng và theo dõi voucher Shopee Việt Nam theo thời gian thực.

Hệ thống được thiết kế theo tôn chỉ: **Loại bỏ 100% các công việc thủ công lặp đi lặp lại của người dùng**.

Người dùng **KHÔNG** cần:
- Tự nhập từng mã voucher.
- Tự tìm kiếm các trang phân tán.
- Tự sao chép dữ liệu vào bảng tính.
- Tự chia nhóm hay phân loại voucher.
- Tự so sánh mức giảm và đơn tối thiểu.
- Tự theo dõi thời hạn còn lại.
- Tự mở nhiều chương trình phức tạp để vận hành.

---

## 2. KIẾN TRÚC KỸ THUẬT & TÍNH NĂNG ĐỘT PHÁ

### A. Đa Nguồn Thu Thập (Multi-Source Connector Plugin Architecture)
Hệ thống tích hợp sẵn 5 đầu kết nối (Connectors) độc lập:
1. **Shopee Public Mega Deals**: Thu thập mã toàn sàn, chiến dịch Siêu Sale và ưu đãi công khai từ Shopee VN.
2. **Shopee Freeship Xtra & ShopeePay**: Thu thập mã vận chuyển toàn quốc 0Đ, voucher Freeship Xtra 70K, 300K và ưu đãi ví ShopeePay.
3. **Shopee Category Industry Deals**: Khám phá mã chuyên sâu từng ngành: Điện tử & Công nghệ, Thời trang & Làm đẹp, Sức khỏe & Sắc đẹp, Gia dụng & Đời sống, Mẹ & Bé.
4. **Public Deal Aggregator & Community Feed**: Tiếp nhận deal chia sẻ từ cộng đồng tiêu dùng thông minh và blog khuyến mãi.
5. **Shopee Partner Banks & E-Wallets**: Thu thập ưu đãi đối tác thẻ tín dụng VIB, VPBank, Techcombank, Shinhan, JCB, Visa và ví trả sau SPayLater.

Mỗi Connector tự động theo dõi: Tỷ lệ thành công, độ trễ xử lý (ms), số mã mới, số mã trùng, số lỗi và tự động phục hồi khi mạng gián đoạn.

### B. Chuẩn Hóa & Chống Trùng Đa Tầng (Normalization & Deduplication)
- **Chuẩn hóa tự động:** Chuyển mã sang chuẩn ký tự viết hoa, loại bỏ ký tự rác, nhận diện số tiền thông minh (`50k` ➔ `50.000Đ`, `1tr` ➔ `1.000.000Đ`, `20%` ➔ tỷ lệ phần trăm).
- **Fingerprint SHA-256:** Tạo mã băm nhận diện độc bản `sha256(code + discount_type + min_spend + max_discount + scope)`.
- **Nhật ký biến động (Audit Trail):** Khi voucher có thay đổi thời hạn hoặc điều kiện, hệ thống tự động ghi nhật ký lịch sử (`VoucherHistory`) mà không làm trùng lặp bản ghi.

### C. Phân Loại Tự Động Đa Chiều (AI / Heuristic Classification)
Tự động gắn thẻ voucher theo 4 chiều:
1. **Theo cơ chế:** Giảm tiền cố định, Giảm theo %, Freeship, Hoàn xu Shopee, Livestream, Khuyến mãi đối tác.
2. **Theo mức độ hấp dẫn:** Giảm rất cao (≥ 100K hoặc ≥ 25%), Giảm cao, Giảm trung bình, Đơn từ 0Đ, Giá trị nổi bật.
3. **Theo trạng thái:** Mới phát hiện (< 24h), Đã xác minh, Chưa xác minh, Sắp hết hạn (< 24h), Đã hết hạn.
4. **Theo phạm vi:** Toàn sàn Shopee, Ngành hàng, Shop cụ thể, Sản phẩm.

### D. Thuật Toán Xếp Hạng 5 Chiều (Smart Voucher Ranking Engine)
Điểm số chất lượng từ `0 đến 100` được tính dựa trên tổ hợp trọng số hiệu chỉnh:
$$\text{Overall Score} = W_v \cdot \text{Value} + W_r \cdot \text{Reliability} + W_a \cdot \text{Applicability} + W_u \cdot \text{Urgency} + W_c \cdot \text{Confidence}$$
- **Value Score (35%):** Mức tiết kiệm thực tế so với đơn tối thiểu.
- **Reliability Score (20%):** Mức độ tin cậy từ nguồn cung cấp.
- **Applicability Score (20%):** Độ rộng của phạm vi áp dụng (Toàn sàn & đơn từ 0Đ được ưu tiên).
- **Urgency Score (15%):** Độ khẩn cấp (voucher sắp hết hạn trong 12-24h được đẩy ưu tiên sử dụng).
- **Confidence Score (10%):** Mức độ xác minh có bằng chứng.

### E. Giám Sát Thời Hạn & Vòng Đời (Lifecycle & Expiration Monitor)
- Tự động chuyển trạng thái `EXPIRING_SOON` khi voucher còn dưới 24 giờ.
- Tự động lưu trữ `EXPIRED` & `ARCHIVED` khi quá hạn sử dụng, phục vụ tra cứu đối soát.

### F. Trung Tâm Quy Tắc Tự Động (Rule-Based Automation Center)
Cho phép người dùng tạo quy tắc trực quan theo cơ chế `Trigger ➔ Condition ➔ Action`:
- *Ví dụ:* Nếu Điểm ≥ 80 ➔ Tự động gắn thẻ `HOT` và phát thông báo.
- *Ví dụ:* Nếu Ngành hàng chứa `Điện tử` ➔ Gắn thẻ `CÔNG NGHỆ CHỌN LỌC`.

### G. Trung Tâm Thông Báo & Tích Hợp Telegram Bot
- Thông báo In-App thời gian thực kèm huy hiệu số lượng chưa đọc.
- Gửi tin nhắn tức thời qua **Telegram Bot** khi phát hiện voucher HOT điểm cao.
- Nút kiểm tra kết nối Telegram trực tiếp trên giao diện.

### H. 18 Trang Chức Năng Hoàn Chỉnh
1. **Dashboard:** Tổng quan các chỉ số KPI, phân bố ngành hàng, tình trạng connector và top voucher.
2. **Auto Hunter:** Cockpit điều khiển quét, bật/tắt lịch, terminal nhật ký hoạt động.
3. **Tất cả voucher:** Kho toàn bộ voucher kèm bộ lọc đa chiều (tìm kiếm, ngành hàng, mức giảm, sắp xếp).
4. **Voucher mới:** Lọc tự động các voucher phát hiện trong 24 giờ qua.
5. **Voucher giảm sâu:** Các voucher có giá trị giảm ≥ 100.000Đ hoặc ≥ 20%.
6. **Voucher sắp hết hạn:** Cảnh báo khẩn cấp các voucher còn hiệu lực dưới 24 giờ.
7. **Voucher đã xác minh:** Voucher có bằng chứng áp dụng chính thức từ Shopee.
8. **Voucher chưa xác minh:** Voucher từ nguồn chia sẻ cộng đồng cần đối chiếu.
9. **Voucher theo ngành hàng:** Phân loại theo tab ngành hàng (Điện tử, Thời trang, Sắc đẹp, Mẹ & Bé,...).
10. **Kho lưu trữ:** Hồ sơ voucher đã hết hạn phục vụ thống kê đối soát.
11. **Quản lý nguồn (Sources):** Bật/tắt, chạy thử nghiệm kết nối từng connector.
12. **Lịch sử quét:** Nhật ký từng phiên quét chi tiết.
13. **Trung tâm thông báo:** Quản lý thông báo và cấu hình Telegram Bot.
14. **Báo cáo & Xuất file:** Phân tích dữ liệu, xuất file Excel/CSV và JSON.
15. **Quy tắc tự động:** Trình tạo và quản lý quy tắc tự động hóa.
16. **Cài đặt hệ thống:** Hiệu chỉnh trọng số thuật toán và chu kỳ quét.
17. **Sức khỏe hệ thống:** Giám sát CPU, RAM, dung lượng SQLite WAL và sao lưu/phục hồi (.bak).
18. **Bản quyền & Giới thiệu:** Thông tin tác quyền **TUẤN ANH STUDIO**.

---

## 3. HƯỚNG DẪN KHỞI CHẠY WINDOWS 1-CLICK

Hệ thống được đóng gói tối ưu để khởi chạy với 1 thao tác duy nhất trên Windows 10/11:

### Bước 1: Khởi động phần mềm
Nhấp đúp chuột vào tệp:
```bash
START.bat
```
Hệ thống sẽ tự động:
1. Kiểm tra môi trường Python.
2. Kiểm tra và cập nhật các thư viện backend cần thiết.
3. Khởi tạo cơ sở dữ liệu SQLite WAL và tạo bảng tự động.
4. Kích hoạt Autonomous Collection Engine & Scheduler.
5. Khởi động máy chủ backend tại cổng `8000`.
6. Tự động mở trình duyệt web giao diện Dashboard tại: `http://127.0.0.1:8000`.

### Bước 2: Dừng phần mềm an toàn
Khi không sử dụng, nhấp đúp chuột vào:
```bash
STOP.bat
```
Tiến trình sẽ giải phóng cổng `8000` và dừng an toàn mọi tác vụ nền.

### Bước 3: Sao lưu và phục hồi dữ liệu
- **Sao lưu:** Nhấp đúp `backup.bat` để tạo tệp `.bak` trong thư mục `backend\data\backups\`.
- **Phục hồi:** Nhấp đúp `restore.bat` và chọn tệp sao lưu muốn khôi phục.

---

## 4. CHẠY KIỂM THỬ HỆ THỐNG (TEST SUITE)

Để chạy bộ kiểm thử tự động toàn diện:
```powershell
python -m pytest backend/tests -v
```
Toàn bộ 14 bài kiểm thử về Model, Normalizer, Deduplicator, Ranker, Classifier, Rules Engine và API Endpoints đều đạt **100% PASS**.

---

## 5. BẢN QUYỀN & TUÂN THỦ

- **Tên sản phẩm:** TUẤN ANH STUDIO — SHOPEE AUTO VOUCHER HUNTER ULTRA
- **Bản quyền:** Bản quyền TUẤN ANH STUDIO. Mọi quyền được bảo lưu.
- **Cam kết đạo đức:** Không vượt CAPTCHA trái phép, không thu thập mật khẩu hoặc mã OTP người dùng, không tự động đặt hàng hoặc thanh toán trái phép.
