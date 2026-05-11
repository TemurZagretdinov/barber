from app.services.payments.base import PaymentProviderBase


class ClickProvider(PaymentProviderBase):
    provider_name = "click"
