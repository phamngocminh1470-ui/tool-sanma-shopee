@echo off
chcp 65001 >nul
title TUẤN ANH STUDIO — DỪNG HỆ THỐNG

echo ==============================================================================
echo       TUẤN ANH STUDIO — SHOPEE AUTO VOUCHER HUNTER ULTRA
echo       Tiến trình dừng hệ thống an toàn
echo ==============================================================================
echo.

echo Đang tìm và dừng tiến trình Backend (Port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Đã dừng tiến trình PID: %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo Đang tìm và dừng tiến trình Frontend nếu có (Port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo Đã dừng tiến trình PID: %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo Đang tìm và dừng tiến trình Đường truyền công khai (Cloudflare Tunnel)...
taskkill /f /im cloudflared.exe >nul 2>&1

echo.
echo [OK] Toàn bộ hệ thống TUẤN ANH STUDIO đã được dừng an toàn.
echo.
pause
