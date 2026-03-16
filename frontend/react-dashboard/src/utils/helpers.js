// src/utils/helpers.js
// --------------------------------------------------
// Shared formatting and badge-colour utilities.
// --------------------------------------------------

export const PRIORITY_COLORS = {
  critical: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
  high:     { bg: '#fff7ed', text: '#ea580c', border: '#fdba74' },
  medium:   { bg: '#fefce8', text: '#ca8a04', border: '#fde047' },
  low:      { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
};

export const STATUS_COLORS = {
  open:        { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
  in_progress: { bg: '#fdf4ff', text: '#9333ea', border: '#d8b4fe' },
  resolved:    { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
  closed:      { bg: '#f9fafb', text: '#6b7280', border: '#d1d5db' },
};

export const CATEGORY_ICONS = {
  network:        '🌐',
  hardware:       '🖥️',
  software:       '💾',
  access_request: '🔑',
  other:          '📋',
};

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatHours(hours) {
  if (hours == null) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export function ticketLabel(number) {
  return `TKT-${String(number).padStart(4, '0')}`;
}

export function isSLABreached(ticket) {
  if (!ticket.sla_deadline) return false;
  if (ticket.status === 'resolved' || ticket.status === 'closed') return false;
  return new Date() > new Date(ticket.sla_deadline);
}
