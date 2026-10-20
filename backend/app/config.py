import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
BACKUP_DIR = DATA_DIR / "backups"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    PROJECT_NAME: str = "TUẤN ANH STUDIO — SHOPEE AUTO VOUCHER HUNTER ULTRA"
    VERSION: str = "1.0.0-ULTRA"
    COPYRIGHT: str = "Bản quyền TUẤN ANH STUDIO"
    SLOGAN: str = "AUTOMATE THE SEARCH. ORGANIZE THE VALUE."
    
    # Paths & Database
    DATA_PATH: Path = DATA_DIR
    BACKUP_PATH: Path = BACKUP_DIR
    DATABASE_URL: str = f"sqlite:///{DATA_DIR.as_posix()}/voucher_hunter.db"
    
    # Scheduler & Execution limits
    AUTO_SCAN_ENABLED: bool = True
    AUTO_START_TUNNEL: bool = True
    DEFAULT_SCAN_INTERVAL_MINUTES: int = 15
    MAX_CONCURRENT_WORKERS: int = 4
    REQUEST_TIMEOUT_SECONDS: int = 25
    CONNECTOR_MAX_RETRIES: int = 3
    RATE_LIMIT_DELAY_SECONDS: float = 1.0
    
    # Notification & Alerting
    ENABLE_DESKTOP_NOTIFICATIONS: bool = True
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHAT_ID: Optional[str] = None
    MIN_SCORE_FOR_ALERT: int = 70
    
    # Smart Ranking Weights (Sum = 1.0)
    WEIGHT_VALUE: float = 0.35
    WEIGHT_RELIABILITY: float = 0.20
    WEIGHT_APPLICABILITY: float = 0.20
    WEIGHT_URGENCY: float = 0.15
    WEIGHT_CONFIDENCE: float = 0.10
    
    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
