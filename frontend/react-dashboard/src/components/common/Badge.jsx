// src/components/common/Badge.jsx
// Reusable coloured badge for status and priority indicators.
import React from 'react';
import { PRIORITY_COLORS, STATUS_COLORS } from '../../utils/helpers';

export function PriorityBadge({ priority }) {
  const c = PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.6rem',
      borderRadius: '999px',
      fontSize: '0.72rem',
      fontWeight: 600,
      letterSpacing: '0.03em',
      textTransform: 'capitalize',
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
    }}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }) {
  const c    = STATUS_COLORS[status] || STATUS_COLORS.open;
  const label = status?.replace('_', ' ');
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.65rem',
      borderRadius: '999px',
      fontSize: '0.72rem',
      fontWeight: 600,
      letterSpacing: '0.03em',
      textTransform: 'capitalize',
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
    }}>
      {label}
    </span>
  );
}
