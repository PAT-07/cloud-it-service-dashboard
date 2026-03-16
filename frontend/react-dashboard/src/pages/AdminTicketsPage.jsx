// src/pages/AdminTicketsPage.jsx
// Full ticket list for admins with inline quick-update controls.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import { ticketsAPI } from '../services/api';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';
import { formatDate, ticketLabel, isSLABreached, CATEGORY_ICONS } from '../utils/helpers';
import styles from './TicketListPage.module.css';

const STATUS_OPTS   = ['', 'open', 'in_progress', 'resolved', 'closed'];
const PRIORITY_OPTS = ['', 'critical', 'high', 'medium', 'low'];
const CATEGORY_OPTS = ['', 'network', 'hardware', 'software', 'access_request', 'other'];

export default function AdminTicketsPage() {
  const navigate  = useNavigate();
  const [filters, setFilters] = useState({});

  const { tickets, loading, error, refetch } = useTickets(filters);

  function applyFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val || undefined }));
  }

  async function quickUpdateStatus(e, ticketId, status) {
    e.stopPropagation();
    try {
      await ticketsAPI.update(ticketId, { status });
      toast.success(`Status → ${status.replace('_', ' ')}`);
      refetch();
    } catch {
      toast.error('Update failed');
    }
  }

  if (loading) return <Spinner message="Loading tickets…" />;
  if (error)   return <div className={styles.error}>⚠️ {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>All Tickets</h1>
          <p>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <select onChange={e => applyFilter('status',   e.target.value)} className={styles.select}>
          {STATUS_OPTS.map(s   => <option key={s} value={s}>{s ? s.replace('_',' ') : 'All statuses'}</option>)}
        </select>
        <select onChange={e => applyFilter('priority', e.target.value)} className={styles.select}>
          {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p || 'All priorities'}</option>)}
        </select>
        <select onChange={e => applyFilter('category', e.target.value)} className={styles.select}>
          {CATEGORY_OPTS.map(c => <option key={c} value={c}>{c ? c.replace('_',' ') : 'All categories'}</option>)}
        </select>
      </div>

      {tickets.length === 0 ? (
        <div className={styles.empty}>
          <span>📭</span>
          <p>No tickets match the selected filters.</p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={`${styles.thead} ${styles.theadAdmin}`}>
            <span>Ticket #</span>
            <span>Title</span>
            <span>Category</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Submitted By</span>
            <span>Created</span>
          </div>
          {tickets.map(t => (
            <div
              key={t.id}
              className={`${styles.row} ${styles.rowAdmin} ${isSLABreached(t) ? styles.slaBreached : ''}`}
              onClick={() => navigate(`/tickets/${t.id}`)}
            >
              <span className={styles.ticketNum}>{ticketLabel(t.ticket_number)}</span>
              <span className={styles.title}>{t.title}</span>
              <span className={styles.category}>
                {CATEGORY_ICONS[t.category]} {t.category.replace('_', ' ')}
              </span>
              <span><PriorityBadge priority={t.priority} /></span>
              <span onClick={e => e.stopPropagation()}>
                <select
                  className={styles.select}
                  value={t.status}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                  onChange={e => quickUpdateStatus(e, t.id, e.target.value)}
                >
                  {STATUS_OPTS.filter(Boolean).map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </span>
              <span className={styles.assignee}>{t.submitter?.name ?? '—'}</span>
              <span className={styles.date}>{formatDate(t.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
