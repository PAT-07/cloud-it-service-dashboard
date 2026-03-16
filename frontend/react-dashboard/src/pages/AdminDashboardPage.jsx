// src/pages/AdminDashboardPage.jsx
// Summary KPI cards + recent tickets list for admin landing page.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import { useAnalytics } from '../hooks/useTickets';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import { formatDate, ticketLabel, isSLABreached } from '../utils/helpers';
import styles from './AdminDashboardPage.module.css';

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div className={styles.kpiCard} style={{ borderTopColor: color }}>
      <div className={styles.kpiIcon}>{icon}</div>
      <div className={styles.kpiValue} style={{ color }}>{value}</div>
      <div className={styles.kpiLabel}>{label}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate  = useNavigate();
  const { tickets, loading: tLoading } = useTickets({ limit: 10 });
  const { analytics, loading: aLoading } = useAnalytics();

  if (tLoading || aLoading) return <Spinner message="Loading dashboard…" />;

  const breachedCount = tickets.filter(isSLABreached).length;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1>IT Operations Dashboard</h1>
          <p>Real-time overview of all active service requests</p>
        </div>
        <button className={styles.newBtn} onClick={() => navigate('/admin/tickets')}>
          View All Tickets →
        </button>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KpiCard
          label="Total Tickets"
          value={analytics?.total_tickets ?? '—'}
          icon="🎫"
          color="#2563eb"
        />
        <KpiCard
          label="Open"
          value={analytics?.open_tickets ?? '—'}
          sub="Awaiting action"
          icon="📬"
          color="#ea580c"
        />
        <KpiCard
          label="In Progress"
          value={analytics?.in_progress_tickets ?? '—'}
          sub="Being worked on"
          icon="⚙️"
          color="#9333ea"
        />
        <KpiCard
          label="Resolved"
          value={analytics?.resolved_tickets ?? '—'}
          sub="This period"
          icon="✅"
          color="#16a34a"
        />
        <KpiCard
          label="SLA Compliance"
          value={analytics ? `${analytics.sla_compliance_percent}%` : '—'}
          sub="Resolved within SLA"
          icon="⏱"
          color={analytics?.sla_compliance_percent >= 90 ? '#16a34a' : '#dc2626'}
        />
        <KpiCard
          label="Avg Resolution"
          value={analytics?.avg_resolution_hours
            ? `${analytics.avg_resolution_hours.toFixed(1)}h`
            : '—'}
          sub="Mean time to resolve"
          icon="📊"
          color="#0891b2"
        />
      </div>

      {/* SLA breach alert */}
      {breachedCount > 0 && (
        <div className={styles.slaAlert}>
          <span>⚠️</span>
          <span>
            <strong>{breachedCount} ticket{breachedCount > 1 ? 's' : ''}</strong> have breached their SLA deadline and require immediate attention.
          </span>
          <button onClick={() => navigate('/admin/tickets')}>View →</button>
        </div>
      )}

      {/* Quick stats by category */}
      {analytics?.tickets_by_category && (
        <div className={styles.statsRow}>
          <div className={styles.card}>
            <h3>Tickets by Category</h3>
            <div className={styles.statBars}>
              {Object.entries(analytics.tickets_by_category).map(([cat, count]) => {
                const pct = Math.round((count / analytics.total_tickets) * 100);
                return (
                  <div key={cat} className={styles.statBar}>
                    <div className={styles.statBarLabel}>
                      <span>{cat.replace('_', ' ')}</span>
                      <span>{count}</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.card}>
            <h3>Tickets by Priority</h3>
            <div className={styles.statBars}>
              {[['critical','#dc2626'],['high','#ea580c'],['medium','#ca8a04'],['low','#16a34a']].map(([p, color]) => {
                const count = analytics.tickets_by_priority[p] ?? 0;
                const pct   = analytics.total_tickets > 0
                  ? Math.round((count / analytics.total_tickets) * 100) : 0;
                return (
                  <div key={p} className={styles.statBar}>
                    <div className={styles.statBarLabel}>
                      <span style={{ textTransform: 'capitalize' }}>{p}</span>
                      <span>{count}</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recent tickets */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>Recent Tickets</h3>
          <button className={styles.viewAllBtn} onClick={() => navigate('/admin/tickets')}>
            View all
          </button>
        </div>
        <div className={styles.recentTable}>
          <div className={styles.recentHead}>
            <span>Ticket #</span><span>Title</span><span>Priority</span>
            <span>Status</span><span>Created</span>
          </div>
          {tickets.slice(0, 8).map(t => (
            <div
              key={t.id}
              className={`${styles.recentRow} ${isSLABreached(t) ? styles.breached : ''}`}
              onClick={() => navigate(`/tickets/${t.id}`)}
            >
              <span className={styles.tNum}>{ticketLabel(t.ticket_number)}</span>
              <span className={styles.tTitle}>{t.title}</span>
              <PriorityBadge priority={t.priority} />
              <StatusBadge   status={t.status}     />
              <span className={styles.tDate}>{formatDate(t.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
