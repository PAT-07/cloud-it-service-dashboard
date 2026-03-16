// src/pages/EmployeeTicketsPage.jsx
// Displays the logged-in employee's tickets with filter and status tracking.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import { formatDate, ticketLabel, isSLABreached, CATEGORY_ICONS } from '../utils/helpers';
import styles from './TicketListPage.module.css';

const STATUS_OPTS   = ['', 'open', 'in_progress', 'resolved', 'closed'];
const PRIORITY_OPTS = ['', 'critical', 'high', 'medium', 'low'];

export default function EmployeeTicketsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});

  const { tickets, loading, error } = useTickets(filters);

  function applyFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val || undefined }));
  }

  if (loading) return <Spinner message="Loading your tickets…" />;
  if (error)   return <div className={styles.error}>⚠️ {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>My Tickets</h1>
          <p>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found</p>
        </div>
        <button className={styles.newBtn} onClick={() => navigate('/employee/submit')}>
          + New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <select onChange={e => applyFilter('status', e.target.value)} className={styles.select}>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s ? s.replace('_',' ') : 'All statuses'}</option>)}
        </select>
        <select onChange={e => applyFilter('priority', e.target.value)} className={styles.select}>
          {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p || 'All priorities'}</option>)}
        </select>
      </div>

      {tickets.length === 0 ? (
        <div className={styles.empty}>
          <span>📭</span>
          <p>No tickets yet. <button onClick={() => navigate('/employee/submit')}>Submit your first request</button></p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.thead}>
            <span>Ticket #</span>
            <span>Title</span>
            <span>Category</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Created</span>
          </div>
          {tickets.map(t => (
            <div
              key={t.id}
              className={`${styles.row} ${isSLABreached(t) ? styles.slaBreached : ''}`}
              onClick={() => navigate(`/tickets/${t.id}`)}
            >
              <span className={styles.ticketNum}>{ticketLabel(t.ticket_number)}</span>
              <span className={styles.title}>{t.title}</span>
              <span className={styles.category}>
                {CATEGORY_ICONS[t.category]} {t.category.replace('_', ' ')}
              </span>
              <span><PriorityBadge priority={t.priority} /></span>
              <span><StatusBadge status={t.status} /></span>
              <span className={styles.date}>{formatDate(t.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
