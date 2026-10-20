@echo off
chcp 65001 >nul
title TUẤN ANH STUDIO — MỞ LINK CÔNG KHAI (CLOUDFLARE TUNNEL)

echo ==============================================================================
echo       TUẤN ANH STUDIO — SHOPEE AUTO VOUCHER HUNTER ULTRA
echo       Khởi tạo đường truyền công khai bảo mật Cloudflare (HTTPS)
echo ==============================================================================
echo.
echo [1/2] Đang kết nối mạng Cloudflare toàn cầu...
echo [2/2] Chờ đường truyền sẵn sàng...
echo.
echo Khi đường dẫn xuất hiện bên dưới (https://xxxx.trycloudflare.com),
echo bạn có thể gửi link đó cho bất kỳ ai hoặc mở trên điện thoại ngoài đường!
echo.
echo Nhấn Ctrl + C để dừng chia sẻ link công khai.
echo ==============================================================================
echo.

.\tools\cloudflared.exe tunnel --url http://127.0.0.1:8000
pause
