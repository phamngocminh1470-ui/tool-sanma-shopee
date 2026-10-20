@echo off
chcp 65001 >nul
title TUẤN ANH STUDIO — PHỤC HỒI DỮ LIỆU

echo ==============================================================================
echo       TUẤN ANH STUDIO — PHỤC HỒI CƠ SỞ DỮ LIỆU VOUCHER
echo ==============================================================================
echo.

echo Danh sách các bản sao lưu hiện có trong backend\data\backups:
echo.
dir /b /o-d backend\data\backups\*.bak 2>nul
echo.

set /p backup_file=Nhập tên tệp sao lưu muốn phục hồi (ví dụ: voucher_hunter_backup_xyz.bak): 

if not exist "backend\data\backups\%backup_file%" (
    echo [ERROR] Không tìm thấy tệp %backup_file%!
    pause
    exit /b 1
)

echo.
echo Đang sao lưu an toàn cơ sở dữ liệu hiện tại trước khi khôi phục...
copy "backend\data\voucher_hunter.db" "backend\data\backups\pre_restore_safety.bak" >nul 2>&1

echo Đang phục hồi từ %backup_file%...
copy /y "backend\data\backups\%backup_file%" "backend\data\voucher_hunter.db" >nul 2>&1

echo.
echo [OK] Phục hồi cơ sở dữ liệu thành công!
echo.
pause
