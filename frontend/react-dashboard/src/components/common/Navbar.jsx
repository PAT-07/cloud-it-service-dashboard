// src/components/common/Navbar.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  function handleLogout() {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  }

  const employeeLinks = [
    { to: '/employee/tickets',       label: 'My Tickets' },
    { to: '/employee/submit',        label: 'Submit Ticket' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard',        label: 'Dashboard' },
    { to: '/admin/tickets',          label: 'All Tickets' },
    { to: '/admin/analytics',        label: 'Analytics' },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span>ITDesk</span>
        </Link>

        <div className={styles.links}>
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`${styles.link} ${location.pathname === to ? styles.active : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className={styles.userArea}>
          <div className={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userRole}>{user?.role?.replace('_', ' ')}</span>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
