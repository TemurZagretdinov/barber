from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.finance import TopUpOrder
from app.services.payments.base import PaymentProviderBase


class MockProvider(PaymentProviderBase):
    provider_name = "mock"

    def create_top_up_order(self, db: Session, order: TopUpOrder) -> TopUpOrder:
        order.provider = self.provider_name
        order.status = "pending"
        order.provider_payload = {"mode": "mock"}
        return order

    def verify_webhook(self, payload: dict[str, Any], headers: dict[str, str] | None = None) -> bool:
        return True

    def handle_webhook(self, db: Session, payload: dict[str, Any], headers: dict[str, str] | None = None) -> TopUpOrder | None:
        return None

    def cancel_payment(self, db: Session, order: TopUpOrder) -> TopUpOrder:
        order.status = "cancelled"
        return order

    def get_payment_status(self, db: Session, order: TopUpOrder) -> str:
        return order.status
