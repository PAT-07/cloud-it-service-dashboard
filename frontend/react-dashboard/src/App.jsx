// src/App.jsx
// --------------------------------------------------
// Root component. Declares all client-side routes and
// guards protected routes based on auth + role.
// --------------------------------------------------
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/common/Navbar';

// Pages
import LoginPage             from './pages/LoginPage';
import RegisterPage          from './pages/RegisterPage';
import EmployeeTicketsPage   from './pages/EmployeeTicketsPage';
import SubmitTicketPage      from './pages/SubmitTicketPage';
import TicketDetailPage      from './pages/TicketDetailPage';
import AdminDashboardPage    from './pages/AdminDashboardPage';
import AdminTicketsPage      from './pages/AdminTicketsPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';

// ── Route guards ─────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user)    return <Navigate to="/login"              replace />;
  if (!isAdmin) return <Navigate to="/employee/tickets"  replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

// ── Routes ────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user, isAdmin } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Root redirect — send to appropriate home based on role */}
      <Route path="/" element={
        user
          ? <Navigate to={isAdmin ? '/admin/dashboard' : '/employee/tickets'} replace />
          : <Navigate to="/login" replace />
      } />

      {/* Employee routes */}
      <Route path="/employee/tickets" element={
        <RequireAuth>
          <AppLayout><EmployeeTicketsPage /></AppLayout>
        </RequireAuth>
      } />
      <Route path="/employee/submit" element={
        <RequireAuth>
          <AppLayout><SubmitTicketPage /></AppLayout>
        </RequireAuth>
      } />

      {/* Shared ticket detail (employee sees own; admin sees any) */}
      <Route path="/tickets/:id" element={
        <RequireAuth>
          <AppLayout><TicketDetailPage /></AppLayout>
        </RequireAuth>
      } />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <RequireAdmin>
          <AppLayout><AdminDashboardPage /></AppLayout>
        </RequireAdmin>
      } />
      <Route path="/admin/tickets" element={
        <RequireAdmin>
          <AppLayout><AdminTicketsPage /></AppLayout>
        </RequireAdmin>
      } />
      <Route path="/admin/analytics" element={
        <RequireAdmin>
          <AppLayout><AnalyticsDashboardPage /></AppLayout>
        </RequireAdmin>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontSize: '0.875rem', borderRadius: '8px' },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
