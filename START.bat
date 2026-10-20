@echo off
chcp 65001 >nul
title TUẤN ANH STUDIO — SHOPEE AUTO VOUCHER HUNTER ULTRA

echo ==============================================================================
echo       TUẤN ANH STUDIO — SHOPEE AUTO VOUCHER HUNTER ULTRA
echo       Autonomous Voucher Intelligence Platform — Ultimate Edition
echo       Bản quyền TUẤN ANH STUDIO
echo ==============================================================================
echo.

:: 1. Kiểm tra môi trường Python
echo [1/6] Kiểm tra môi trường Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Không tìm thấy Python! Vui lòng cài đặt Python 3.10 trở lên.
    pause
    exit /b 1
)
python --version

:: 2. Kiểm tra thư viện Python
echo.
echo [2/6] Kiểm tra thư viện cần thiết...
python -c "import fastapi, uvicorn, sqlalchemy, apscheduler, httpx, bs4, psutil" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Đang cài đặt các thư viện cần thiết...
    pip install -r backend\requirements.txt
) else (
    echo [OK] Thư viện backend đã đầy đủ.
)

:: 3. Kiểm tra và khởi tạo Database
echo.
echo [3/6] Kiểm tra và khởi tạo cơ sở dữ liệu SQLite WAL...
python -c "from app.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)" >nul 2>&1
echo [OK] Cơ sở dữ liệu sẵn sàng.

:: 4. Dọn dẹp tiến trình cũ nếu có trên cổng 8000
echo.
echo [4/6] Khởi động Backend API & Autonomous Scheduler...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

:: Khởi chạy backend bằng uvicorn
cd backend
start "TUAN ANH STUDIO - Voucher Hunter Backend" /min python run.py
cd ..

:: 5. Chờ backend sẵn sàng
echo [5/6] Đang kết nối dịch vụ...
:wait_backend
timeout /t 2 /nobreak >nul
curl -s http://127.0.0.1:8000/api/info >nul 2>&1
if %errorlevel% neq 0 (
    echo Đang khởi động máy chủ...
    goto wait_backend
)
echo [OK] Máy chủ TUẤN ANH STUDIO đã sẵn sàng hoạt động!

:: Đợi lấy link online Cloudflare
echo.
echo [5.5/6] Đang kết nối đường truyền Cloudflare Online (HTTPS)...
set PUBLIC_URL=
for /l %%i in (1,1,10) do (
    if exist backend\data\public_link.txt (
        set /p PUBLIC_URL=<backend\data\public_link.txt
        if not "!PUBLIC_URL!"=="" goto got_link
    )
    timeout /t 1 /nobreak >nul
)
:got_link

if not "%PUBLIC_URL%"=="" (
    echo %PUBLIC_URL%| clip >nul 2>&1
)

:: 6. Mở trình duyệt Web Dashboard
echo.
echo [6/6] Khởi chạy Dashboard...
echo ==============================================================================
echo    HỆ THỐNG ĐÃ SẴN SÀNG!
echo.
echo    [1] Dashboard máy tính (Nội bộ):
echo        http://127.0.0.1:8000
echo.
if not "%PUBLIC_URL%"=="" (
    echo    [2] LINK ONLINE MỞ TRÊN ĐIỆN THOẠI / 4G (ĐÃ TỰ ĐỘNG SAO CHÉP):
    echo        %PUBLIC_URL%
    echo        (Bạn chỉ cần bấm Ctrl + V gửi qua Zalo/Facebook là mở được!)
) else (
    echo    [2] Link Online: Đang kết nối, xem nút 'Link Online' trên thanh Header web!
)
echo.
echo    Tự động quét định kỳ: 15 phút / lần
echo    Để dừng hệ thống, chạy file STOP.bat
echo ==============================================================================
start http://127.0.0.1:8000

echo.
pause
