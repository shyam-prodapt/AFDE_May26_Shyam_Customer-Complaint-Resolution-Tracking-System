from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role_id: int


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    role_id: Optional[int] = None


class RoleOut(BaseModel):
    role_id: int
    role_name: str

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    user_id: int
    name: str
    email: str
    role_id: int
    role: RoleOut
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserOutSimple(BaseModel):
    user_id: int
    name: str
    email: str
    role_id: int

    model_config = {"from_attributes": True}
