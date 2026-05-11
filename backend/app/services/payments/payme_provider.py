from app.services.payments.base import PaymentProviderBase


class PaymeProvider(PaymentProviderBase):
    provider_name = "payme"
