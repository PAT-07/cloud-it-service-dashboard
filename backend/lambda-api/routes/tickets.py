# routes/tickets.py — Full CRUD for tickets + comments
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from middleware.auth import get_current_user, require_admin
from models.ticket import Ticket, TicketComment, TicketHistory
from models.user import User
from schemas import TicketCreate, TicketOut, TicketUpdate, CommentCreate, CommentOut

router = APIRouter(prefix="/tickets", tags=["tickets"])

# ── SLA hours per priority ────────────────────────────────────────────────
SLA_HOURS = {"critical": 4, "high": 8, "medium": 24, "low": 72}


def _load_ticket(ticket_id: UUID, db: Session) -> Ticket:
    ticket = (
        db.query(Ticket)
        .options(
            joinedload(Ticket.submitter),
            joinedload(Ticket.assignee),
            joinedload(Ticket.comments).joinedload(TicketComment.author),
        )
        .filter(Ticket.id == ticket_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


# ── Create ticket ─────────────────────────────────────────────────────────
@router.post("/", response_model=TicketOut, status_code=201)
def create_ticket(
    payload: TicketCreate,
    db:      Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    hours = SLA_HOURS.get(payload.priority, 24)
    ticket = Ticket(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        priority=payload.priority,
        status="open",
        sla_deadline=datetime.utcnow() + timedelta(hours=hours),
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return _load_ticket(ticket.id, db)


# ── List tickets ──────────────────────────────────────────────────────────
@router.get("/", response_model=List[TicketOut])
def list_tickets(
    status:   Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db:   Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Ticket).options(
        joinedload(Ticket.submitter),
        joinedload(Ticket.assignee),
    )
    # Employees see only their own tickets
    if current_user.role == "employee":
        q = q.filter(Ticket.user_id == current_user.id)

    if status:
        q = q.filter(Ticket.status == status)
    if priority:
        q = q.filter(Ticket.priority == priority)
    if category:
        q = q.filter(Ticket.category == category)

    return q.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()


# ── Get single ticket ─────────────────────────────────────────────────────
@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = _load_ticket(ticket_id, db)
    # Employees may only view their own tickets
    if current_user.role == "employee" and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return ticket


# ── Update ticket (admin / it_staff) ─────────────────────────────────────
@router.put("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: UUID,
    payload:   TicketUpdate,
    db:        Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    changes = payload.model_dump(exclude_none=True)
    for field, new_val in changes.items():
        old_val = getattr(ticket, field)
        if str(old_val) != str(new_val):
            # Record audit history
            db.add(TicketHistory(
                ticket_id=ticket.id,
                changed_by=current_user.id,
                field_name=field,
                old_value=str(old_val),
                new_value=str(new_val),
            ))
            setattr(ticket, field, new_val)

    # Mark resolved_at when status transitions to resolved
    if payload.status == "resolved" and ticket.resolved_at is None:
        ticket.resolved_at = datetime.utcnow()

    db.commit()
    db.refresh(ticket)
    return _load_ticket(ticket.id, db)


# ── Add comment ───────────────────────────────────────────────────────────
@router.post("/{ticket_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(
    ticket_id: UUID,
    payload:   CommentCreate,
    db:        Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Only admins/it_staff can post internal notes
    if payload.is_internal and current_user.role == "employee":
        raise HTTPException(status_code=403, detail="Cannot post internal notes")

    comment = TicketComment(
        ticket_id=ticket_id,
        user_id=current_user.id,
        comment=payload.comment,
        is_internal=payload.is_internal,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
