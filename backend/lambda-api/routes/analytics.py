# routes/analytics.py — KPI and chart data for the analytics dashboard
from datetime import datetime, timedelta
from sqlalchemy import func, extract
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends

from database import get_db
from middleware.auth import require_admin
from models.ticket import Ticket
from models.user import User
from schemas import AnalyticsSummary

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/", response_model=AnalyticsSummary)
def get_analytics(
    db: Session = Depends(get_db),
    _:  User    = Depends(require_admin),
):
    """Aggregate KPIs and time-series data for the analytics dashboard."""

    # ── Status counts ──────────────────────────────────────────────────
    status_counts = dict(
        db.query(Ticket.status, func.count(Ticket.id))
          .group_by(Ticket.status)
          .all()
    )
    total  = sum(status_counts.values())
    open_c = status_counts.get("open", 0)
    inp_c  = status_counts.get("in_progress", 0)
    res_c  = status_counts.get("resolved", 0)
    clo_c  = status_counts.get("closed", 0)

    # ── Average resolution time (hours) ───────────────────────────────
    avg_row = (
        db.query(
            func.avg(
                extract("epoch", Ticket.resolved_at - Ticket.created_at) / 3600
            )
        )
        .filter(Ticket.resolved_at.isnot(None))
        .scalar()
    )
    avg_resolution = round(float(avg_row), 2) if avg_row else None

    # ── SLA compliance ────────────────────────────────────────────────
    resolved_in_sla = (
        db.query(func.count(Ticket.id))
          .filter(
              Ticket.resolved_at.isnot(None),
              Ticket.resolved_at <= Ticket.sla_deadline,
          )
          .scalar() or 0
    )
    total_resolved = res_c + clo_c
    sla_pct = round((resolved_in_sla / total_resolved * 100), 1) if total_resolved else 0.0

    # ── Tickets by category ───────────────────────────────────────────
    by_category = dict(
        db.query(Ticket.category, func.count(Ticket.id))
          .group_by(Ticket.category)
          .all()
    )

    # ── Tickets by priority ───────────────────────────────────────────
    by_priority = dict(
        db.query(Ticket.priority, func.count(Ticket.id))
          .group_by(Ticket.priority)
          .all()
    )

    # ── Monthly volume (last 12 months) ───────────────────────────────
    monthly_rows = (
        db.query(
            extract("year",  Ticket.created_at).label("year"),
            extract("month", Ticket.created_at).label("month"),
            func.count(Ticket.id).label("count"),
        )
        .filter(Ticket.created_at >= datetime.utcnow() - timedelta(days=365))
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )
    monthly_volume = [
        {"year": int(r.year), "month": int(r.month), "count": r.count}
        for r in monthly_rows
    ]

    return AnalyticsSummary(
        total_tickets=total,
        open_tickets=open_c,
        in_progress_tickets=inp_c,
        resolved_tickets=res_c,
        closed_tickets=clo_c,
        avg_resolution_hours=avg_resolution,
        sla_compliance_percent=sla_pct,
        tickets_by_category=by_category,
        tickets_by_priority=by_priority,
        monthly_volume=monthly_volume,
    )
