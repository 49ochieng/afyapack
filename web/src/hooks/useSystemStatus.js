'use client';
import { useState, useEffect, useCallback } from 'react';
import { getHealth } from '@/lib/api';

const POLL_INTERVAL = 30000; // 30 seconds

export function useSystemStatus() {
  const [status, setStatus] = useState({
    apiReady: false,
    modelReady: false,
    mockMode: false,
    modelName: null,
    protocolCount: null,
    stockAlerts: 0,
    loading: true,
    error: null,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getHealth();
      setStatus({
        apiReady: data.status === 'ok',
        modelReady: data.foundry?.ready || false,
        mockMode: data.foundry?.mock || false,
        modelName: data.foundry?.model || null,
        protocolCount: data.db?.protocol_chunks ? Math.ceil(data.db.protocol_chunks / 5) : null,
        stockAlerts: 0, // Could be fetched separately
        loading: false,
        error: null,
      });
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        apiReady: false,
        loading: false,
        error: err.message,
      }));
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return status;
}
