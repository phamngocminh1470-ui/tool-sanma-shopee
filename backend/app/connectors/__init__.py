from app.connectors.base import BaseConnector
from app.connectors.registry import ConnectorRegistry, registry
from app.connectors.shopee_public_deals import ShopeePublicDealsConnector
from app.connectors.shopee_freeship import ShopeeFreeshipConnector
from app.connectors.shopee_category_deals import ShopeeCategoryDealsConnector
from app.connectors.coupon_aggregator_feed import CouponAggregatorFeedConnector
from app.connectors.partner_bank_deals import PartnerBankDealsConnector

__all__ = [
    "BaseConnector",
    "ConnectorRegistry",
    "registry",
    "ShopeePublicDealsConnector",
    "ShopeeFreeshipConnector",
    "ShopeeCategoryDealsConnector",
    "CouponAggregatorFeedConnector",
    "PartnerBankDealsConnector",
]
