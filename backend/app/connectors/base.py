import abc
import asyncio
import time
import logging
from typing import List, Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class BaseConnector(abc.ABC):
    """
    Abstract Base Connector for Multi-Source Voucher Discovery.
    Handles rate limiting, exponential backoff, safe timeouts,
    and performance tracking.
    """

    def __init__(
        self,
        connector_id: str,
        name: str,
        description: str,
        endpoint_url: str,
        connector_type: str = "PUBLIC_FEED"
    ):
        self.connector_id = connector_id
        self.name = name
        self.description = description
        self.endpoint_url = endpoint_url
        self.connector_type = connector_type

    @abc.abstractmethod
    async def fetch_vouchers(self) -> List[Dict[str, Any]]:
        """
        Fetch raw voucher data from the source.
        Returns a list of raw voucher dictionaries.
        """
        pass

    async def execute_safe_fetch(self) -> Dict[str, Any]:
        """
        Executes fetch_vouchers with retries, timeout, and timing.
        """
        start_time = time.time()
        last_error = None
        records: List[Dict[str, Any]] = []

        for attempt in range(1, settings.CONNECTOR_MAX_RETRIES + 1):
            try:
                # Polite rate limiting delay
                if settings.RATE_LIMIT_DELAY_SECONDS > 0:
                    await asyncio.sleep(settings.RATE_LIMIT_DELAY_SECONDS)

                records = await asyncio.wait_for(
                    self.fetch_vouchers(),
                    timeout=settings.REQUEST_TIMEOUT_SECONDS
                )
                duration_ms = int((time.time() - start_time) * 1000)
                return {
                    "success": True,
                    "records": records,
                    "error": None,
                    "duration_ms": duration_ms,
                    "status": "ACTIVE"
                }
            except asyncio.TimeoutError:
                last_error = f"Timeout sau {settings.REQUEST_TIMEOUT_SECONDS}s (Lần thử {attempt})"
                logger.warning(f"Connector {self.connector_id} timeout on attempt {attempt}")
            except Exception as e:
                last_error = f"Lỗi ({type(e).__name__}): {str(e)} (Lần thử {attempt})"
                logger.warning(f"Connector {self.connector_id} attempt {attempt} failed: {e}")

            # Exponential backoff before next attempt
            if attempt < settings.CONNECTOR_MAX_RETRIES:
                await asyncio.sleep(1.5 ** attempt)

        duration_ms = int((time.time() - start_time) * 1000)
        return {
            "success": False,
            "records": [],
            "error": last_error,
            "duration_ms": duration_ms,
            "status": "ERROR"
        }

    async def test_connection(self) -> Dict[str, Any]:
        """
        Quick connectivity test to verify endpoint health.
        """
        start = time.time()
        try:
            res = await self.execute_safe_fetch()
            duration_ms = int((time.time() - start) * 1000)
            return {
                "success": res["success"],
                "status": "ACTIVE" if res["success"] else "ERROR",
                "message": "Kết nối thành công" if res["success"] else res["error"],
                "records_found": len(res.get("records", [])),
                "duration_ms": duration_ms
            }
        except Exception as e:
            return {
                "success": False,
                "status": "ERROR",
                "message": str(e),
                "records_found": 0,
                "duration_ms": int((time.time() - start) * 1000)
            }
