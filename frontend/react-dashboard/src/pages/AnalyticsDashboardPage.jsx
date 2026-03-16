// src/pages/AnalyticsDashboardPage.jsx
// Full analytics view with Recharts visualisations.
import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAnalytics } from '../hooks/useTickets';
import Spinner from '../components/common/Spinner';
import styles from './AnalyticsDashboardPage.module.css';

const CAT_COLORS  = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b'];
const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function MetricCard({ label, value, sub, icon, accent }) {
  return (
    <div className={styles.metricCard} style={{ borderLeftColor: accent }}>
      <div className={styles.metricIcon}>{icon}</div>
      <div>
        <div className={styles.metricValue} style={{ color: accent }}>{value}</div>
        <div className={styles.metricLabel}>{label}</div>
        {sub && <div className={styles.metricSub}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const { analytics, loading, error } = useAnalytics();

  if (loading) return <Spinner message="Crunching the numbers…" />;
  if (error)   return <div style={{ padding: '3rem', textAlign: 'center', color: '#dc2626' }}>⚠️ {error}</div>;
  if (!analytics) return null;

  // Prepare chart data
  const categoryData = Object.entries(analytics.tickets_by_category).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }));

  const priorityData = ['critical', 'high', 'medium', 'low'].map(p => ({
    name: p,
    count: analytics.tickets_by_priority[p] ?? 0,
  }));

  const monthlyData = analytics.monthly_volume.map(m => ({
    name: MONTH_NAMES[m.month],
    tickets: m.count,
  }));

  const slaBreached = 100 - analytics.sla_compliance_percent;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1>Analytics Dashboard</h1>
        <p>Service desk performance metrics and trends</p>
      </div>

      {/* KPI Metrics Row */}
      <div className={styles.metricsGrid}>
        <MetricCard
          label="Total Tickets"
          value={analytics.total_tickets}
          icon="🎫"
          accent="#2563eb"
        />
        <MetricCard
          label="SLA Compliance"
          value={`${analytics.sla_compliance_percent}%`}
          sub={`${slaBreached.toFixed(1)}% breached`}
          icon="⏱"
          accent={analytics.sla_compliance_percent >= 90 ? '#16a34a' : '#dc2626'}
        />
        <MetricCard
          label="Avg Resolution Time"
          value={analytics.avg_resolution_hours
            ? `${analytics.avg_resolution_hours.toFixed(1)}h`
            : 'N/A'}
          sub="Mean time to resolve"
          icon="📊"
          accent="#0891b2"
        />
        <MetricCard
          label="Open / In Progress"
          value={`${analytics.open_tickets} / ${analytics.in_progress_tickets}`}
          sub="Tickets needing attention"
          icon="⚙️"
          accent="#ea580c"
        />
      </div>

      {/* Charts Row 1 */}
      <div className={styles.chartsRow}>
        {/* Monthly Volume Line Chart */}
        <div className={styles.chartCard}>
          <h3>Monthly Ticket Volume</h3>
          <p className={styles.chartSub}>Tickets submitted over the past 12 months</p>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Line
                  type="monotone"
                  dataKey="tickets"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.noData}>No monthly data available yet.</div>
          )}
        </div>

        {/* Priority Bar Chart */}
        <div className={styles.chartCard}>
          <h3>Tickets by Priority</h3>
          <p className={styles.chartSub}>Distribution across priority levels</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8', textTransform: 'capitalize' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {priorityData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={['#dc2626','#ea580c','#ca8a04','#16a34a'][i]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className={styles.chartsRow}>
        {/* Category Pie Chart */}
        <div className={styles.chartCard}>
          <h3>Tickets by Category</h3>
          <p className={styles.chartSub}>Breakdown of support request types</p>
          {categoryData.length > 0 ? (
            <div className={styles.pieLayout}>
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%" cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.pieLegend}>
                {categoryData.map((entry, i) => (
                  <div key={entry.name} className={styles.legendItem}>
                    <span
                      className={styles.legendDot}
                      style={{ background: CAT_COLORS[i % CAT_COLORS.length] }}
                    />
                    <span className={styles.legendName}>{entry.name}</span>
                    <span className={styles.legendVal}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.noData}>No category data available.</div>
          )}
        </div>

        {/* SLA Donut */}
        <div className={styles.chartCard}>
          <h3>SLA Compliance Rate</h3>
          <p className={styles.chartSub}>Percentage of tickets resolved within SLA</p>
          <div className={styles.slaDonut}>
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Within SLA',   value: analytics.sla_compliance_percent },
                    { name: 'Breached SLA', value: slaBreached },
                  ]}
                  cx="50%" cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  <Cell fill="#16a34a" />
                  <Cell fill="#fee2e2" />
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={v => `${Number(v).toFixed(1)}%`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.slaStats}>
              <div className={styles.slaNum} style={{ color: '#16a34a' }}>
                {analytics.sla_compliance_percent}%
              </div>
              <div className={styles.slaLabel}>Within SLA</div>
              <div className={styles.slaBreachNum}>{slaBreached.toFixed(1)}% Breached</div>
              <div className={styles.slaTarget}>
                Target: <strong>95%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status breakdown table */}
      <div className={styles.statusTable}>
        <h3>Current Status Breakdown</h3>
        <div className={styles.statusGrid}>
          {[
            { label: 'Open',        val: analytics.open_tickets,        color: '#2563eb' },
            { label: 'In Progress', val: analytics.in_progress_tickets, color: '#9333ea' },
            { label: 'Resolved',    val: analytics.resolved_tickets,    color: '#16a34a' },
            { label: 'Closed',      val: analytics.closed_tickets,      color: '#64748b' },
          ].map(row => (
            <div key={row.label} className={styles.statusRow}>
              <span className={styles.statusDot} style={{ background: row.color }} />
              <span className={styles.statusLabel}>{row.label}</span>
              <div className={styles.statusBarTrack}>
                <div
                  className={styles.statusBarFill}
                  style={{
                    width: analytics.total_tickets
                      ? `${(row.val / analytics.total_tickets * 100).toFixed(1)}%`
                      : '0%',
                    background: row.color,
                  }}
                />
              </div>
              <span className={styles.statusCount}>{row.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
