// src/components/common/Spinner.jsx
import React from 'react';

export default function Spinner({ message = 'Loading…' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '5rem',
      gap: '1rem',
      color: '#64748b',
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid #e2e8f0',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: '0.9rem' }}>{message}</span>
    </div>
  );
}

export function PageLayout({ children }) {
  return (
    <div style={{
      maxWidth: 1280,
      margin: '0 auto',
      padding: '2rem 1.5rem',
    }}>
      {children}
    </div>
  );
}
