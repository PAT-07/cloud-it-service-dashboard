// src/hooks/useTickets.js
// --------------------------------------------------
// Reusable data-fetching hooks for tickets and analytics.
// --------------------------------------------------
import { useState, useEffect, useCallback } from 'react';
import { ticketsAPI, analyticsAPI } from '../services/api';

export function useTickets(filters = {}) {
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await ticketsAPI.list(filters);
      setTickets(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return { tickets, loading, error, refetch: fetchTickets };
}

export function useTicket(id) {
  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchTicket = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await ticketsAPI.get(id);
      setTicket(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  return { ticket, loading, error, refetch: fetchTicket };
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    analyticsAPI.getSummary()
      .then(({ data }) => setAnalytics(data))
      .catch((err)     => setError(err.response?.data?.detail || 'Failed to load analytics'))
      .finally(()      => setLoading(false));
  }, []);

  return { analytics, loading, error };
}
