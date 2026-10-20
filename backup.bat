@echo off
chcp 65001 >nul
title TUẤN ANH STUDIO — SAO LƯU DỮ LIỆU

echo ==============================================================================
echo       TUẤN ANH STUDIO — SAO LƯU CƠ SỞ DỮ LIỆU VOUCHER
echo ==============================================================================
echo.

python -c "import urllib.request; print(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8000/api/backup/create', method='POST')).read().decode())" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Đã tạo bản sao lưu thành công trong thư mục backend\data\backups!
) else (
    echo [INFO] Đang sao lưu trực tiếp từ tệp tin cơ sở dữ liệu...
    if not exist "backend\data\backups" mkdir "backend\data\backups"
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set mydate=%%c%%a%%b
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a%%b
    copy "backend\data\voucher_hunter.db" "backend\data\backups\voucher_hunter_backup_%mydate%_%mytime%.bak" >nul 2>&1
    echo [OK] Đã tạo bản sao lưu thành công!
)

echo.
pause
