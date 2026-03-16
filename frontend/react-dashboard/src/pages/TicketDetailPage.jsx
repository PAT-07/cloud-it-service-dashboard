// src/pages/TicketDetailPage.jsx
// View a single ticket with full comment thread.
// Admins get additional controls: status update, assignee picker.
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTicket } from '../hooks/useTickets';
import { useAuth } from '../context/AuthContext';
import { ticketsAPI, usersAPI } from '../services/api';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';
import {
  formatDateTime, ticketLabel, isSLABreached, CATEGORY_ICONS,
} from '../utils/helpers';
import styles from './TicketDetailPage.module.css';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export default function TicketDetailPage() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { isAdmin }   = useAuth();
  const { ticket, loading, error, refetch } = useTicket(id);

  const [comment,    setComment]    = useState('');
  const [internal,   setInternal]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Admin update state
  const [newStatus,   setNewStatus]   = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [updating,    setUpdating]    = useState(false);

  async function submitComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await ticketsAPI.addComment(id, { comment, is_internal: internal });
      toast.success('Comment added');
      setComment('');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate() {
    const payload = {};
    if (newStatus)   payload.status      = newStatus;
    if (newAssignee) payload.assignee_id = newAssignee;
    if (!Object.keys(payload).length) { toast('No changes to apply'); return; }
    setUpdating(true);
    try {
      await ticketsAPI.update(id, payload);
      toast.success('Ticket updated');
      setNewStatus('');
      setNewAssignee('');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <Spinner message="Loading ticket…" />;
  if (error)   return <div style={{ padding: '3rem', textAlign: 'center', color: '#dc2626' }}>⚠️ {error}</div>;
  if (!ticket) return null;

  const breached = isSLABreached(ticket);

  return (
    <div className={styles.container}>
      {/* Back */}
      <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>

      <div className={styles.layout}>
        {/* ── Main ─────────────────────────────────── */}
        <div className={styles.main}>
          {/* Header */}
          <div className={styles.ticketHeader}>
            <div className={styles.ticketMeta}>
              <span className={styles.ticketNum}>{ticketLabel(ticket.ticket_number)}</span>
              {breached && <span className={styles.slaBadge}>⚠ SLA Breached</span>}
            </div>
            <h1 className={styles.title}>{ticket.title}</h1>
            <div className={styles.badges}>
              <StatusBadge   status={ticket.status}     />
              <PriorityBadge priority={ticket.priority} />
              <span className={styles.catTag}>
                {CATEGORY_ICONS[ticket.category]} {ticket.category.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Description</h3>
            <p className={styles.description}>{ticket.description}</p>
          </div>

          {/* Comments */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              Comments <span className={styles.count}>{ticket.comments?.length ?? 0}</span>
            </h3>

            {ticket.comments?.length === 0 && (
              <p className={styles.noComments}>No comments yet.</p>
            )}

            <div className={styles.commentList}>
              {ticket.comments
                ?.filter(c => !c.is_internal || isAdmin)
                .map(c => (
                  <div key={c.id} className={`${styles.comment} ${c.is_internal ? styles.internalComment : ''}`}>
                    <div className={styles.commentHeader}>
                      <div className={styles.commentAvatar}>
                        {c.author?.name?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <span className={styles.commentAuthor}>{c.author?.name ?? 'Unknown'}</span>
                        <span className={styles.commentRole}>{c.author?.role?.replace('_', ' ')}</span>
                      </div>
                      {c.is_internal && <span className={styles.internalTag}>Internal Note</span>}
                      <span className={styles.commentTime}>{formatDateTime(c.created_at)}</span>
                    </div>
                    <p className={styles.commentText}>{c.comment}</p>
                  </div>
                ))}
            </div>

            {/* Add comment form */}
            <form onSubmit={submitComment} className={styles.commentForm}>
              <textarea
                className={styles.commentInput}
                placeholder="Add a comment…"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                required
              />
              <div className={styles.commentActions}>
                {isAdmin && (
                  <label className={styles.internalToggle}>
                    <input
                      type="checkbox"
                      checked={internal}
                      onChange={e => setInternal(e.target.checked)}
                    />
                    Internal note (admin-only)
                  </label>
                )}
                <button type="submit" className={styles.commentBtn} disabled={submitting}>
                  {submitting ? 'Posting…' : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────── */}
        <aside className={styles.sidebar}>
          {/* Details */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Details</h3>
            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <span>Submitted by</span>
                <strong>{ticket.submitter?.name ?? '—'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Assigned to</span>
                <strong>{ticket.assignee?.name ?? 'Unassigned'}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Created</span>
                <strong>{formatDateTime(ticket.created_at)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Last updated</span>
                <strong>{formatDateTime(ticket.updated_at)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>SLA deadline</span>
                <strong style={{ color: breached ? '#dc2626' : 'inherit' }}>
                  {formatDateTime(ticket.sla_deadline)}
                </strong>
              </div>
              {ticket.resolved_at && (
                <div className={styles.detailRow}>
                  <span>Resolved at</span>
                  <strong>{formatDateTime(ticket.resolved_at)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Admin controls */}
          {isAdmin && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Admin Controls</h3>
              <div className={styles.adminForm}>
                <label className={styles.adminLabel}>Update Status</label>
                <select
                  className={styles.adminSelect}
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                >
                  <option value="">— keep current —</option>
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>

                <button
                  className={styles.updateBtn}
                  onClick={handleUpdate}
                  disabled={updating}
                >
                  {updating ? 'Updating…' : 'Apply Changes'}
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
