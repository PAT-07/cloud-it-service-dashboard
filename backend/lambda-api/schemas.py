# schemas.py — Pydantic request/response models
from __future__ import annotations
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator

# ── Auth ───────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

# ── User ───────────────────────────────────────────────────────────────────
class UserBase(BaseModel):
    name:       str
    email:      EmailStr
    role:       str = "employee"
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id:         UUID
    is_active:  bool
    created_at: datetime
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserOut

# ── Ticket ─────────────────────────────────────────────────────────────────
class TicketCreate(BaseModel):
    title:       str
    description: str
    category:    str
    priority:    str = "medium"

    @field_validator("category")
    @classmethod
    def validate_category(cls, v):
        valid = {"network","hardware","software","access_request","other"}
        if v not in valid:
            raise ValueError(f"category must be one of {valid}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v):
        valid = {"low","medium","high","critical"}
        if v not in valid:
            raise ValueError(f"priority must be one of {valid}")
        return v

class TicketUpdate(BaseModel):
    status:      Optional[str]  = None
    priority:    Optional[str]  = None
    assignee_id: Optional[UUID] = None
    title:       Optional[str]  = None
    description: Optional[str]  = None

class CommentCreate(BaseModel):
    comment:     str
    is_internal: bool = False

class CommentOut(BaseModel):
    id:          UUID
    ticket_id:   UUID
    user_id:     UUID
    comment:     str
    is_internal: bool
    created_at:  datetime
    author:      Optional[UserOut] = None
    class Config:
        from_attributes = True

class TicketOut(BaseModel):
    id:            UUID
    ticket_number: Optional[int]
    title:         str
    description:   str
    category:      str
    priority:      str
    status:        str
    sla_deadline:  Optional[datetime]
    resolved_at:   Optional[datetime]
    created_at:    datetime
    updated_at:    datetime
    submitter:     Optional[UserOut]  = None
    assignee:      Optional[UserOut]  = None
    comments:      List[CommentOut]   = []
    class Config:
        from_attributes = True

# ── Analytics ──────────────────────────────────────────────────────────────
class AnalyticsSummary(BaseModel):
    total_tickets:          int
    open_tickets:           int
    in_progress_tickets:    int
    resolved_tickets:       int
    closed_tickets:         int
    avg_resolution_hours:   Optional[float]
    sla_compliance_percent: float
    tickets_by_category:    dict
    tickets_by_priority:    dict
    monthly_volume:         List[dict]
