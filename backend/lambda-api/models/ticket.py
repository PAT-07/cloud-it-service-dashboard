# models/ticket.py — Ticket, TicketComment, TicketHistory ORM models
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_number = Column(Integer, unique=True, autoincrement=True)
    user_id       = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assignee_id   = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    title         = Column(String(200), nullable=False)
    description   = Column(Text, nullable=False)
    category      = Column(String(50), nullable=False)   # network|hardware|software|access_request|other
    priority      = Column(String(20), nullable=False, default="medium")
    status        = Column(String(20), nullable=False, default="open")
    sla_deadline  = Column(DateTime(timezone=True))
    resolved_at   = Column(DateTime(timezone=True))
    created_at    = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at    = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    submitter = relationship("User", foreign_keys=[user_id],     back_populates="submitted_tickets")
    assignee  = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_tickets")
    comments  = relationship("TicketComment", back_populates="ticket", cascade="all, delete-orphan")
    history   = relationship("TicketHistory", back_populates="ticket", cascade="all, delete-orphan")


class TicketComment(Base):
    __tablename__ = "ticket_comments"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id   = Column(UUID(as_uuid=True), ForeignKey("tickets.id"), nullable=False)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    comment     = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)
    created_at  = Column(DateTime(timezone=True), default=datetime.utcnow)

    ticket = relationship("Ticket",        back_populates="comments")
    author = relationship("User",          back_populates="comments")


class TicketHistory(Base):
    __tablename__ = "ticket_history"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id  = Column(UUID(as_uuid=True), ForeignKey("tickets.id"), nullable=False)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"),   nullable=False)
    field_name = Column(String(50),  nullable=False)
    old_value  = Column(String(200))
    new_value  = Column(String(200))
    changed_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="history")
