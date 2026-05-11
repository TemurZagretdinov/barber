from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.finance import TopUpOrder


class PaymentProviderBase:
    provider_name = "base"

    def create_top_up_order(self, db: Session, order: TopUpOrder) -> TopUpOrder:
        raise NotImplementedError("Payment provider is not connected yet")

    def verify_webhook(self, payload: dict[str, Any], headers: dict[str, str] | None = None) -> bool:
        raise NotImplementedError("Payment provider is not connected yet")

    def handle_webhook(self, db: Session, payload: dict[str, Any], headers: dict[str, str] | None = None) -> TopUpOrder | None:
        raise NotImplementedError("Payment provider is not connected yet")

    def cancel_payment(self, db: Session, order: TopUpOrder) -> TopUpOrder:
        raise NotImplementedError("Payment provider is not connected yet")

    def get_payment_status(self, db: Session, order: TopUpOrder) -> str:
        raise NotImplementedError("Payment provider is not connected yet")
