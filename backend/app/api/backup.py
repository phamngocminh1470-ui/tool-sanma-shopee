import shutil
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.config import DATA_DIR, BACKUP_DIR
from app.database import get_db
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/api/backup", tags=["Database Backup & Restore"])


@router.post("/create")
def create_backup(db: Session = Depends(get_db)):
    source_db = DATA_DIR / "voucher_hunter.db"
    if not source_db.exists():
        raise HTTPException(status_code=400, detail="Database chưa được khởi tạo")

    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"voucher_hunter_backup_{timestamp_str}.bak"
    target_backup = BACKUP_DIR / backup_filename

    try:
        shutil.copy2(source_db, target_backup)
        
        # Log audit
        audit = AuditLog(
            timestamp=datetime.utcnow(),
            action="BACKUP_CREATED",
            actor="USER",
            details=f"Tạo bản sao lưu thành công: {backup_filename}"
        )
        db.add(audit)
        db.commit()

        return {
            "success": True,
            "filename": backup_filename,
            "size_mb": round(target_backup.stat().st_size / (1024 * 1024), 2),
            "created_at": datetime.utcnow().isoformat(),
            "message": "Sao lưu cơ sở dữ liệu thành công"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi sao lưu: {str(e)}")


@router.get("/list")
def list_backups():
    files = []
    if BACKUP_DIR.exists():
        for p in sorted(BACKUP_DIR.glob("*.bak"), key=lambda x: x.stat().st_mtime, reverse=True):
            stat = p.stat()
            files.append({
                "filename": p.name,
                "size_mb": round(stat.st_size / (1024 * 1024), 2),
                "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })
    return files


@router.post("/restore/{filename}")
def restore_backup(filename: str, db: Session = Depends(get_db)):
    # Protect against path traversal
    safe_name = filename.strip().replace("..", "").replace("/", "").replace("\\", "")
    target_backup = BACKUP_DIR / safe_name
    if not target_backup.exists():
        raise HTTPException(status_code=404, detail="Không tìm thấy tệp sao lưu")

    source_db = DATA_DIR / "voucher_hunter.db"
    try:
        # Create safety pre-restore backup first
        safety_name = f"pre_restore_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.bak"
        if source_db.exists():
            shutil.copy2(source_db, BACKUP_DIR / safety_name)

        # Restore
        shutil.copy2(target_backup, source_db)

        # Log audit
        audit = AuditLog(
            timestamp=datetime.utcnow(),
            action="RESTORE_COMPLETED",
            actor="USER",
            details=f"Đã phục hồi dữ liệu từ bản sao lưu: {safe_name}"
        )
        db.add(audit)
        db.commit()

        return {
            "success": True,
            "restored_from": safe_name,
            "message": "Phục hồi cơ sở dữ liệu thành công"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi phục hồi: {str(e)}")
