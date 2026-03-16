// src/pages/SubmitTicketPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI } from '../services/api';
import toast from 'react-hot-toast';
import styles from './SubmitTicketPage.module.css';

const CATEGORIES = [
  { value: 'network',        label: '🌐 Network',         desc: 'VPN, WiFi, connectivity issues' },
  { value: 'hardware',       label: '🖥️ Hardware',        desc: 'Laptop, monitor, peripherals' },
  { value: 'software',       label: '💾 Software',         desc: 'App crashes, installations' },
  { value: 'access_request', label: '🔑 Access Request',   desc: 'Permissions, accounts, passwords' },
  { value: 'other',          label: '📋 Other',            desc: 'Anything else' },
];

const PRIORITIES = [
  { value: 'low',      label: 'Low',      desc: 'Not urgent, can wait', color: '#16a34a' },
  { value: 'medium',   label: 'Medium',   desc: 'Normal priority',      color: '#ca8a04' },
  { value: 'high',     label: 'High',     desc: 'Impacting work',       color: '#ea580c' },
  { value: 'critical', label: 'Critical', desc: 'System down / urgent', color: '#dc2626' },
];

export default function SubmitTicketPage() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ title: '', description: '', category: '', priority: 'medium' });
  const [loading, setLoading] = useState(false);

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.category) { toast.error('Please select a category'); return; }
    setLoading(true);
    try {
      const { data } = await ticketsAPI.create(form);
      toast.success(`Ticket TKT-${String(data.ticket_number).padStart(4,'0')} submitted!`);
      navigate('/employee/tickets');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Submit IT Support Request</h1>
        <p>Describe your issue and our IT team will respond promptly.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Title */}
        <div className={styles.section}>
          <label className={styles.label}>Issue Title *</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Brief summary of your issue…"
            value={form.title}
            onChange={e => setField('title', e.target.value)}
            required
          />
        </div>

        {/* Category */}
        <div className={styles.section}>
          <label className={styles.label}>Category *</label>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                className={`${styles.categoryCard} ${form.category === cat.value ? styles.selectedCategory : ''}`}
                onClick={() => setField('category', cat.value)}
              >
                <span className={styles.catLabel}>{cat.label}</span>
                <span className={styles.catDesc}>{cat.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div className={styles.section}>
          <label className={styles.label}>Priority *</label>
          <div className={styles.priorityRow}>
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                type="button"
                className={`${styles.priorityBtn} ${form.priority === p.value ? styles.selectedPriority : ''}`}
                style={form.priority === p.value ? { borderColor: p.color, color: p.color } : {}}
                onClick={() => setField('priority', p.value)}
              >
                <span className={styles.pLabel}>{p.label}</span>
                <span className={styles.pDesc}>{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className={styles.section}>
          <label className={styles.label}>Description *</label>
          <textarea
            className={styles.textarea}
            placeholder="Please describe the issue in detail. Include any error messages, steps to reproduce, and how it's impacting your work…"
            value={form.description}
            onChange={e => setField('description', e.target.value)}
            rows={6}
            required
          />
        </div>

        {/* SLA reminder */}
        {form.priority && (
          <div className={styles.slaHint}>
            <span>⏱</span>
            <span>
              SLA response time for <strong>{form.priority}</strong> priority:{' '}
              {{ low: '72 hours', medium: '24 hours', high: '8 hours', critical: '4 hours' }[form.priority]}
            </span>
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={() => navigate('/employee/tickets')}>
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Ticket →'}
          </button>
        </div>
      </form>
    </div>
  );
}
