from datetime import date as Date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


PAYMENT_NOTE = "Hozircha to'lov test rejimida. Real payment keyingi bosqichda ulanadi."


class BarberBalanceRead(BaseModel):
    balance: int
    debt: int
    commission_percent: int
    today_completed_bookings: int = 0
    today_gross_revenue: int
    today_commission: int
    today_net_earning: int
    is_financially_blocked: bool
    message: str = PAYMENT_NOTE


class DemoBarberFinanceRead(BaseModel):
    demo_balance: int
    demo_debt: int
    balance: int = 0
    debt: int = 0
    commission_percent: int
    today_completed_bookings: int
    today_gross_revenue: int
    today_commission: int
    today_net_earning: int
    is_financially_blocked: bool
    message: str = PAYMENT_NOTE


class BarberTransactionRead(BaseModel):
    id: int
    barber_id: int
    top_up_order_id: int | None = None
    booking_id: int | None = None
    provider: str = "mock"
    type: str
    status: str = "paid"
    amount: int
    balance_before: int
    balance_after: int
    debt_before: int = 0
    debt_after: int = 0
    external_transaction_id: str | None = None
    description: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DemoBarberTransactionRead(BarberTransactionRead):
    pass


class BarberTopUpRequest(BaseModel):
    amount: int = Field(gt=0)


class TopUpInitRequest(BaseModel):
    amount: int = Field(gt=0)
    provider: str = "mock"

    @field_validator("provider")
    @classmethod
    def normalize_provider(cls, value: str) -> str:
        return value.strip().lower()


class TopUpOrderRead(BaseModel):
    id: int
    order_id: int
    barber_id: int
    amount: int
    provider: str
    status: str
    external_transaction_id: str | None = None
    provider_payload: dict | None = None
    created_at: datetime
    paid_at: datetime | None = None
    cancelled_at: datetime | None = None
    expires_at: datetime | None = None
    description: str | None = None
    message: str = PAYMENT_NOTE

    model_config = ConfigDict(from_attributes=True)


class TopUpConfirmResponse(BaseModel):
    order: TopUpOrderRead
    balance: int
    debt: int
    message: str = PAYMENT_NOTE


class AdminBalanceAdjustmentRequest(BaseModel):
    amount: int
    description: str = Field(min_length=1, max_length=1000)

    @field_validator("amount")
    @classmethod
    def amount_cannot_be_zero(cls, value: int) -> int:
        if value == 0:
            raise ValueError("amount must not be zero")
        return value


class DailySettlementRunRequest(BaseModel):
    date: Date | None = None


class DailySettlementRead(BaseModel):
    id: int
    barber_id: int
    date: Date
    total_completed_bookings: int
    total_bookings: int = 0
    gross_revenue: int
    commission_total: int
    barber_earning_total: int
    balance_before: int
    balance_after: int
    debt_created: int
    status: str
    created_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class DemoDailySettlementRead(BaseModel):
    id: int
    barber_id: int
    date: Date
    total_completed_bookings: int
    gross_revenue: int
    commission_total: int
    barber_earning_total: int
    balance_before: int
    balance_after: int
    debt_created: int
    status: str
    created_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class DailySettlementRunResponse(BaseModel):
    date: Date
    settlements_created: int
    bookings_charged: int
    commission_total: int
    debt_created: int
    settlements: list[DailySettlementRead]


class DemoDailySettlementRunResponse(BaseModel):
    date: Date
    settlements_created: int
    bookings_charged: int
    commission_total: int
    debt_created: int
    settlements: list[DemoDailySettlementRead]


class FinanceTopBarber(BaseModel):
    barber_id: int
    full_name: str
    gross_revenue: int
    completed_bookings: int
    commission_total: int


class BarberDebtItem(BaseModel):
    barber_id: int
    full_name: str
    balance: int
    debt: int
    is_financially_blocked: bool


class DemoBarberDebtItem(BaseModel):
    barber_id: int
    full_name: str
    demo_balance: int
    demo_debt: int
    is_financially_blocked: bool


class AdminFinanceOverview(BaseModel):
    total_balance: int = 0
    total_debt: int = 0
    today_commission: int = 0
    month_commission: int = 0
    pending_top_up_orders: int = 0
    paid_top_up_orders: int = 0
    failed_top_up_orders: int = 0
    unsettled_commission: int = 0
    total_platform_commission_today: int
    total_platform_commission_month: int
    total_barber_debt: int
    total_topups: int
    unsettled_commissions: int
    top_earning_barbers: list[FinanceTopBarber]
    barbers_with_debt: list[BarberDebtItem]


class AdminDemoFinanceOverview(BaseModel):
    total_platform_commission_today: int
    total_platform_commission_month: int
    total_barber_debt: int
    total_demo_topups: int
    unsettled_commissions: int
    top_earning_barbers: list[FinanceTopBarber]
    barbers_with_debt: list[DemoBarberDebtItem]
    message: str = PAYMENT_NOTE


class AdminBarberFinanceRead(BaseModel):
    barber_id: int
    full_name: str
    balance: int
    debt: int
    commission_percent: int
    is_financially_blocked: bool
    total_revenue: int
    commission_paid: int
    unsettled_commission: int
    transactions: list[BarberTransactionRead]
    settlements: list[DailySettlementRead]


class AdminDemoBarberFinanceRead(BaseModel):
    barber_id: int
    full_name: str
    demo_balance: int
    demo_debt: int
    commission_percent: int
    is_financially_blocked: bool
    total_revenue: int
    commission_paid: int
    unsettled_commission: int
    transactions: list[DemoBarberTransactionRead]
    settlements: list[DemoDailySettlementRead]
    message: str = PAYMENT_NOTE
