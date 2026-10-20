import pytest
import httpx
from app.main import app
from app.database import Base, engine


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.mark.anyio
async def test_api_info():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/info")
        assert response.status_code == 200
        data = response.json()
        assert "TUẤN ANH STUDIO" in data["app"]
        assert data["status"] == "OPERATIONAL"


@pytest.mark.anyio
async def test_system_health():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/system/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "HEALTHY"
        assert "cpu_percent" in data
        assert "disk_free_gb" in data


@pytest.mark.anyio
async def test_connectors_list():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/connectors")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 5
        ids = [c["id"] for c in data]
        assert "shopee_public_deals" in ids
        assert "shopee_freeship" in ids


@pytest.mark.anyio
async def test_hunter_status():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/hunter/status")
        assert response.status_code == 200
        data = response.json()
        assert "scheduler_running" in data
        assert "is_scanning_now" in data


@pytest.mark.anyio
async def test_vouchers_list():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/vouchers")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data


@pytest.mark.anyio
async def test_dashboard_report():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/reports/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "total_vouchers" in data
        assert "categories" in data
        assert "tiers" in data
