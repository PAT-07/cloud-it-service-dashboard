# models/user.py — SQLAlchemy ORM model for users
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name       = Column(String(100), nullable=False)
    email      = Column(String(150), nullable=False, unique=True, index=True)
    role       = Column(String(20), nullable=False, default="employee")
    password   = Column(String(255), nullable=False)   # bcrypt hash
    department = Column(String(100))
    avatar_url = Column(String(500))
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    submitted_tickets = relationship("Ticket", foreign_keys="Ticket.user_id",     back_populates="submitter")
    assigned_tickets  = relationship("Ticket", foreign_keys="Ticket.assignee_id", back_populates="assignee")
    comments          = relationship("TicketComment", back_populates="author")
