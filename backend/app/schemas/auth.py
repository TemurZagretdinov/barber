from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    email: str
    password: str


class CustomerCreate(BaseModel):
    email: str
    password: str
    full_name: str | None = None
    phone: str | None = None


class UserRead(BaseModel):
    id: int
    email: str
    full_name: str | None = None
    phone: str | None = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: UserRead
