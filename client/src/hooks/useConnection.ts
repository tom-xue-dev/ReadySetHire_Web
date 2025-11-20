/**
 * Connection Status Hook
 * 
 * This hook manages the connection status to the backend/database
 * and provides retry functionality with loading states.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { healthCheck } from '@api/api';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'retrying';

export interface ConnectionState {
  status: ConnectionStatus;
  error: string | null;
  lastChecked: Date | null;
  retryCount: number;
  isOnline: boolean;
}

export interface UseConnectionOptions {
  autoCheck?: boolean;
  retryInterval?: number;
  maxRetries?: number;
  checkOnMount?: boolean;
  checkOnFocus?: boolean;
}

const DEFAULT_OPTIONS: Required<UseConnectionOptions> = {
  autoCheck: true,
  retryInterval: 5000, // 5 seconds
  maxRetries: 3,
  checkOnMount: true,
  checkOnFocus: true,
};

export function useConnection(options: UseConnectionOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [state, setState] = useState<ConnectionState>({
    status: 'idle',
    error: null,
    lastChecked: null,
    retryCount: 0,
    isOnline: navigator.onLine,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Health check function
  const checkConnection = useCallback(async (isRetry = false): Promise<boolean> => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState(prev => ({
      ...prev,
      status: isRetry ? 'retrying' : 'connecting',
      error: null,
    }));

    console.log(`🔍 ${isRetry ? 'Retrying' : 'Checking'} server connection...`);

    try {
      // Use our custom health check function
      await healthCheck();
      
      console.log('✅ Server connection successful');
      setState(prev => ({
        ...prev,
        status: 'connected',
        error: null,
        lastChecked: new Date(),
        retryCount: 0,
      }));
      return true;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return false; // Request was cancelled
      }

      const errorMessage = error.message || 'Failed to connect to server';
      console.log(`❌ Server connection failed: ${errorMessage}`);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
        lastChecked: new Date(),
        retryCount: isRetry ? prev.retryCount + 1 : 1,
      }));
      return false;
    }
  }, []);

  // Retry logic
  const scheduleRetry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setState(prev => {
      if (prev.retryCount >= opts.maxRetries) {
        return { ...prev, status: 'error' };
      }

      retryTimeoutRef.current = setTimeout(() => {
        checkConnection(true);
      }, opts.retryInterval);

      return prev;
    });
  }, [checkConnection, opts.maxRetries, opts.retryInterval]);

  // Manual retry function
  const retry = useCallback(() => {
    setState(prev => ({ ...prev, retryCount: 0 }));
    checkConnection(true);
  }, [checkConnection]);

  // Reset connection state
  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      status: 'idle',
      error: null,
      lastChecked: null,
      retryCount: 0,
      isOnline: navigator.onLine,
    });
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      if (opts.autoCheck && state.status === 'error') {
        checkConnection();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ 
        ...prev, 
        isOnline: false, 
        status: 'error',
        error: 'No internet connection'
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [opts.autoCheck, state.status, checkConnection]);

  // Focus detection for re-checking connection
  useEffect(() => {
    if (!opts.checkOnFocus) return;

    const handleFocus = () => {
      if (state.status === 'error' || 
          (state.lastChecked && Date.now() - state.lastChecked.getTime() > 30000)) {
        checkConnection();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [opts.checkOnFocus, state.status, state.lastChecked, checkConnection]);

  // Initial connection check
  useEffect(() => {
    if (opts.checkOnMount) {
      checkConnection();
    }
  }, [opts.checkOnMount, checkConnection]);

  // Auto-retry logic
  useEffect(() => {
    if (state.status === 'error' && opts.autoCheck && state.retryCount < opts.maxRetries) {
      scheduleRetry();
    }
  }, [state.status, state.retryCount, opts.autoCheck, opts.maxRetries, scheduleRetry]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    checkConnection: () => checkConnection(false),
    retry,
    reset,
    isConnecting: state.status === 'connecting' || state.status === 'retrying',
    isConnected: state.status === 'connected',
    hasError: state.status === 'error',
    canRetry: state.status === 'error' && state.retryCount < opts.maxRetries,
  };
}
