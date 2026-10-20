from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.connector import ConnectorConfig
from app.schemas.connector import (
    ConnectorResponse,
    ConnectorUpdate,
    ConnectorTestResult,
)
from app.connectors.registry import registry

router = APIRouter(prefix="/api/connectors", tags=["Connectors"])


@router.get("", response_model=List[ConnectorResponse])
def list_connectors(db: Session = Depends(get_db)):
    registry.sync_with_db(db)
    items = db.query(ConnectorConfig).all()
    return items


@router.put("/{connector_id}", response_model=ConnectorResponse)
def update_connector(
    connector_id: str,
    payload: ConnectorUpdate,
    db: Session = Depends(get_db)
):
    cfg = db.query(ConnectorConfig).filter(ConnectorConfig.id == connector_id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Không tìm thấy Connector")

    if payload.name is not None:
        cfg.name = payload.name
    if payload.endpoint_url is not None:
        cfg.endpoint_url = payload.endpoint_url
    if payload.is_enabled is not None:
        cfg.is_enabled = payload.is_enabled
        cfg.status = "ACTIVE" if payload.is_enabled else "DISABLED"
    if payload.config_data is not None:
        cfg.config_data = payload.config_data

    db.commit()
    db.refresh(cfg)
    return cfg


@router.post("/{connector_id}/test", response_model=ConnectorTestResult)
async def test_connector(connector_id: str):
    conn = registry.get_connector(connector_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connector không tồn tại trong hệ thống")

    res = await conn.test_connection()
    return {
        "id": connector_id,
        "success": res["success"],
        "status": res["status"],
        "message": res["message"],
        "records_found": res["records_found"],
        "duration_ms": res["duration_ms"]
    }


@router.post("/{connector_id}/run")
async def run_single_connector(connector_id: str, db: Session = Depends(get_db)):
    res = await registry.run_connector(connector_id, db)
    return res
