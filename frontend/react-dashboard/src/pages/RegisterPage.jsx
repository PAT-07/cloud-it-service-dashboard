// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import styles from './LoginPage.module.css'; // reuse login styles

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name: '', email: '', department: '', password: '' });
  const [loading, setLoading] = useState(false);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.register(form);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⚡</span>
            <span className={styles.logoText}>ITDesk</span>
          </div>
          <h1 className={styles.tagline}>Your IT support<br />starts here.</h1>
          <p className={styles.subTagline}>
            Create an account to submit and track IT support requests.
          </p>
        </div>
        <div className={styles.brandBg} aria-hidden />
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Create account</h2>
          <p className={styles.formSubtitle}>Join your company's IT service portal</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Full name</label>
              <input type="text" placeholder="Jane Smith" value={form.name}
                onChange={e => setField('name', e.target.value)} required autoFocus />
            </div>
            <div className={styles.field}>
              <label>Work email</label>
              <input type="email" placeholder="jane@company.com" value={form.email}
                onChange={e => setField('email', e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label>Department</label>
              <input type="text" placeholder="e.g. Finance, HR, Engineering" value={form.department}
                onChange={e => setField('department', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setField('password', e.target.value)} required minLength={8} />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'Create account →'}
            </button>
          </form>

          <p className={styles.registerLink}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
