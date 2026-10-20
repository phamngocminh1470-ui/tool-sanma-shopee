import os
import sys
import re
import time
import shutil
import logging
import threading
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

from app.config import settings, DATA_DIR

logger = logging.getLogger(__name__)


class TunnelManager:
    """
    Manages Cloudflare Tunnel (trycloudflare.com) to provide a free, secure,
    instant public HTTPS link for accessing the Shopee Hunter Dashboard anywhere.
    """

    def __init__(self):
        self._process: Optional[subprocess.Popen] = None
        self._url: Optional[str] = None
        self._error: Optional[str] = None
        self._started_at: Optional[datetime] = None
        self._lock = threading.Lock()
        self._thread: Optional[threading.Thread] = None
        self._status_file = DATA_DIR / "public_link.txt"

    @property
    def is_running(self) -> bool:
        if self._process is None:
            return False
        return self._process.poll() is None

    @property
    def url(self) -> Optional[str]:
        return self._url

    def _find_cloudflared(self) -> Optional[str]:
        # 1. Check workspace tools/cloudflared.exe
        root_dir = settings.DATA_PATH.parent.parent
        ws_tool = root_dir / "tools" / "cloudflared.exe"
        if ws_tool.exists():
            return str(ws_tool)

        # 2. Check PATH
        which_cf = shutil.which("cloudflared")
        if which_cf:
            return which_cf

        return None

    def start(self, port: int = 8000) -> Dict[str, Any]:
        with self._lock:
            if self.is_running and self._url:
                return {
                    "success": True,
                    "url": self._url,
                    "message": "Đường truyền công khai đang hoạt động.",
                    "status": "RUNNING"
                }

            cf_path = self._find_cloudflared()
            if not cf_path:
                self._error = "Không tìm thấy file tools/cloudflared.exe"
                logger.error(self._error)
                return {
                    "success": False,
                    "url": None,
                    "message": self._error,
                    "status": "ERROR"
                }

            try:
                # Stop any existing process
                self._stop_internal()

                self._error = None
                self._url = None
                self._started_at = datetime.utcnow()

                logger.info(f"Starting Cloudflare tunnel pointing to port {port} using {cf_path}...")
                
                # Start process with captured output
                self._process = subprocess.Popen(
                    [cf_path, "tunnel", "--url", f"http://127.0.0.1:{port}"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1,
                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
                )

                # Read output in background thread to grab the URL
                self._thread = threading.Thread(target=self._monitor_output, daemon=True)
                self._thread.start()

                # Wait up to 12 seconds for the tunnel URL to appear
                for _ in range(24):
                    time.sleep(0.5)
                    if self._url:
                        break
                    if not self.is_running:
                        break

                if self._url:
                    logger.info(f"Public link created successfully: {self._url}")
                    # Write to file
                    try:
                        self._status_file.write_text(self._url, encoding="utf-8")
                    except Exception:
                        pass
                    return {
                        "success": True,
                        "url": self._url,
                        "message": "Đã khởi tạo link online công khai thành công!",
                        "status": "RUNNING"
                    }
                else:
                    msg = self._error or "Đang kết nối Cloudflare... Vui lòng kiểm tra lại sau vài giây."
                    return {
                        "success": self.is_running,
                        "url": self._url,
                        "message": msg,
                        "status": "INITIALIZING" if self.is_running else "FAILED"
                    }

            except Exception as e:
                self._error = str(e)
                logger.error(f"Failed to start Cloudflare tunnel: {e}")
                return {
                    "success": False,
                    "url": None,
                    "message": f"Lỗi khởi động: {str(e)}",
                    "status": "ERROR"
                }

    def _monitor_output(self):
        try:
            while self._process and self._process.poll() is None:
                line = self._process.stdout.readline()
                if not line:
                    break
                # Look for trycloudflare URL
                m = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
                if m:
                    self._url = m.group(0)
                    try:
                        self._status_file.write_text(self._url, encoding="utf-8")
                    except Exception:
                        pass
                    logger.info(f"Cloudflare Tunnel URL detected: {self._url}")
        except Exception as e:
            logger.warning(f"Error reading cloudflared output: {e}")

    def stop(self) -> Dict[str, Any]:
        with self._lock:
            self._stop_internal()
            return {
                "success": True,
                "message": "Đã đóng kết nối link công khai.",
                "status": "STOPPED"
            }

    def _stop_internal(self):
        if self._process:
            try:
                self._process.terminate()
                self._process.wait(timeout=3)
            except Exception:
                try:
                    self._process.kill()
                except Exception:
                    pass
            self._process = None

        self._url = None
        self._started_at = None
        if self._status_file.exists():
            try:
                self._status_file.unlink()
            except Exception:
                pass

    def get_status(self) -> Dict[str, Any]:
        running = self.is_running
        # If running but URL not cached in memory, check status file
        if running and not self._url and self._status_file.exists():
            try:
                self._url = self._status_file.read_text(encoding="utf-8").strip()
            except Exception:
                pass

        return {
            "is_running": running,
            "url": self._url if running else None,
            "error": self._error if not running else None,
            "started_at": self._started_at.isoformat() if (running and self._started_at) else None
        }


tunnel_manager = TunnelManager()
