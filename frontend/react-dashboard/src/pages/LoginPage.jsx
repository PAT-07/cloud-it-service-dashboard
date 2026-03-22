// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      // Route based on role
      if (user.role === 'admin' || user.role === 'it_staff') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/tickets');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      {/* Left panel – branding */}
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⚡</span>
            <span className={styles.logoText}>ITDesk</span>
          </div>
          <h1 className={styles.tagline}>
            IT Support,<br />Streamlined.
          </h1>
          <p className={styles.subTagline}>
            Submit, track, and resolve IT support requests — all in one place.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}><strong>99.9%</strong><span>Uptime</span></div>
            <div className={styles.stat}><strong>4h</strong><span>Avg Response</span></div>
            <div className={styles.stat}><strong>95%</strong><span>SLA Compliance</span></div>
          </div>
        </div>
        <div className={styles.brandBg} aria-hidden />
      </div>

      {/* Right panel – form */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Sign in</h2>
          <p className={styles.formSubtitle}>Access your IT service portal</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
                autoFocus
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'Sign in →'}
            </button>
          </form>

          <p className={styles.registerLink}>
            Don't have an account?{' '}
            <Link to="/register">Create one</Link>
          </p>

          <div className={styles.demoCredentials}>
            <p className={styles.demoTitle}>Demo credentials</p>
            <div className={styles.demoGrid}>
              <button className={styles.demoBtn} onClick={() => { setEmail('admin@company.com'); setPassword('Password123!'); }}>
                👑 Admin
              </button>
              <button className={styles.demoBtn} onClick={() => { setEmail('employee@company.com'); setPassword('Password123!'); }}>
                👤 Employee
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
