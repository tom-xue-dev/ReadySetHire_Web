/**
 * Connection Demo Page
 * 
 * Demonstrates the connection management system with various states
 */

import React, { useState } from 'react';
import { 
  SimpleConnectionGuard, 
  SimpleConnectionIndicator, 
  SimpleLoadingState, 
  SimpleConnectionError,
  SimpleSpinner 
} from '../components/SimpleConnectionStatus';
import { useConnection } from '../hooks/useConnection';

export default function ConnectionDemo() {
  const [showDemo, setShowDemo] = useState<'guard' | 'loading' | 'error' | 'indicator' | null>(null);
  const connection = useConnection();

  const buttonStyle: React.CSSProperties = {
    padding: '10px 16px',
    margin: '8px',
    border: '1px solid #3b82f6',
    background: '#3b82f6',
    color: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'white',
    color: '#3b82f6',
  };

  const cardStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    margin: '16px 0',
    background: '#f9fafb',
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Connection Management System Demo</h1>
      
      <div style={cardStyle}>
        <h3>Current Connection Status</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <SimpleConnectionIndicator />
          <span>Status: {connection.status}</span>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <strong>Details:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Connected: {connection.isConnected ? 'Yes' : 'No'}</li>
            <li>Has Error: {connection.hasError ? 'Yes' : 'No'}</li>
            <li>Is Connecting: {connection.isConnecting ? 'Yes' : 'No'}</li>
            <li>Retry Count: {connection.retryCount}</li>
            <li>Last Checked: {connection.lastChecked?.toLocaleTimeString() || 'Never'}</li>
          </ul>
        </div>

        {connection.hasError && (
          <div style={{ color: '#dc2626', marginBottom: '12px' }}>
            <strong>Error:</strong> {connection.error}
          </div>
        )}

        <div>
          <button 
            style={buttonStyle} 
            onClick={() => connection.checkConnection()}
            disabled={connection.isConnecting}
          >
            {connection.isConnecting ? 'Checking...' : 'Check Connection'}
          </button>
          
          {connection.hasError && (
            <button 
              style={buttonStyle} 
              onClick={() => connection.retry()}
              disabled={!connection.canRetry}
            >
              Retry Connection
            </button>
          )}
          
          <button 
            style={secondaryButtonStyle} 
            onClick={() => connection.reset()}
          >
            Reset Status
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <h3>Component Demos</h3>
        <p>Click the buttons below to see different connection states:</p>
        
        <div>
          <button 
            style={buttonStyle} 
            onClick={() => setShowDemo('guard')}
          >
            Connection Guard Demo
          </button>
          
          <button 
            style={buttonStyle} 
            onClick={() => setShowDemo('loading')}
          >
            Loading State Demo
          </button>
          
          <button 
            style={buttonStyle} 
            onClick={() => setShowDemo('error')}
          >
            Error State Demo
          </button>
          
          <button 
            style={buttonStyle} 
            onClick={() => setShowDemo('indicator')}
          >
            Indicator Demo
          </button>
          
          <button 
            style={secondaryButtonStyle} 
            onClick={() => setShowDemo(null)}
          >
            Clear Demo
          </button>
        </div>
      </div>

      {showDemo && (
        <div style={cardStyle}>
          <h3>Demo: {showDemo.charAt(0).toUpperCase() + showDemo.slice(1)}</h3>
          
          {showDemo === 'guard' && (
            <SimpleConnectionGuard>
              <div style={{ padding: '20px', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '6px' }}>
                <h4>✅ Connection Guard Active</h4>
                <p>This content is protected by SimpleConnectionGuard. It only shows when connected.</p>
                <p>The guard automatically checks connection and shows appropriate loading/error states.</p>
              </div>
            </SimpleConnectionGuard>
          )}
          
          {showDemo === 'loading' && (
            <SimpleLoadingState message="Demo loading state - connecting to server..." />
          )}
          
          {showDemo === 'error' && (
            <SimpleConnectionError
              error="Demo connection error - server is unreachable"
              onRetry={() => alert('Demo retry clicked!')}
              canRetry={true}
            />
          )}
          
          {showDemo === 'indicator' && (
            <div>
              <p>Connection indicators with different states:</p>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', margin: '16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  <span>Connected</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                  <span>Connecting</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                  <span>Failed</span>
                </div>
              </div>
              <p>Live indicator: <SimpleConnectionIndicator /></p>
              <p>Spinner demo: <SimpleSpinner size={16} /></p>
            </div>
          )}
        </div>
      )}

      <div style={cardStyle}>
        <h3>Usage Instructions</h3>
        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px' }}>
          <p><strong>1. Wrap pages that need database connection:</strong></p>
          <code>{`<SimpleConnectionGuard>\n  <YourPageContent />\n</SimpleConnectionGuard>`}</code>
          
          <p style={{ marginTop: '16px' }}><strong>2. Add status indicator to headers:</strong></p>
          <code>{`<SimpleConnectionIndicator />`}</code>
          
          <p style={{ marginTop: '16px' }}><strong>3. Use connection hook for custom logic:</strong></p>
          <code>{`const connection = useConnection();\nif (connection.isConnected) { /* your logic */ }`}</code>
        </div>
      </div>
    </div>
  );
}
