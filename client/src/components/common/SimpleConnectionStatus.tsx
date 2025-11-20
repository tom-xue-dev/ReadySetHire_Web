/**
 * Simple Connection Status Components
 * 
 * Clean, minimal UI components for connection status without external dependencies
 */

import React from 'react';
import { useConnection } from '@/hooks/useConnection';

// Simple Loading Spinner
export const SimpleSpinner: React.FC<{ size?: number }> = ({ size = 20 }) => {
  const spinnerStyle: React.CSSProperties = {
    width: size,
    height: size,
    border: '2px solid #f3f3f3',
    borderTop: '2px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    display: 'inline-block',
  };

  // Add keyframes animation if not already added
  React.useEffect(() => {
    if (!document.querySelector('#spinner-keyframes')) {
      const style = document.createElement('style');
      style.id = 'spinner-keyframes';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return <div style={spinnerStyle} />;
};

// Simple Connection Error
interface SimpleConnectionErrorProps {
  error: string;
  onRetry?: () => void;
  canRetry?: boolean;
}

export const SimpleConnectionError: React.FC<SimpleConnectionErrorProps> = ({
  error,
  onRetry,
  canRetry = true
}) => {
  const containerStyle: React.CSSProperties = {
    background: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px 0',
    textAlign: 'center',
  };

  const titleStyle: React.CSSProperties = {
    color: '#c53030',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '10px',
  };

  const messageStyle: React.CSSProperties = {
    color: '#744210',
    marginBottom: '15px',
    lineHeight: '1.5',
  };

  const buttonStyle: React.CSSProperties = {
    background: '#e53e3e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '10px',
    transition: 'background-color 0.2s',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: '#718096',
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>⚠️ Connection Failed</div>
      <div style={messageStyle}>
        Unable to connect to the server. Please check your network connection.
        <br />
        <small style={{ color: '#666', fontSize: '12px' }}>Error: {error}</small>
      </div>
      {canRetry && onRetry && (
        <div>
          <button
            style={buttonStyle}
            onClick={onRetry}
            onMouseOver={(e) => (e.currentTarget.style.background = '#c53030')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#e53e3e')}
          >
            Retry Connection
          </button>
          <button
            style={secondaryButtonStyle}
            onClick={() => window.location.reload()}
            onMouseOver={(e) => (e.currentTarget.style.background = '#4a5568')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#718096')}
          >
            Reload Page
          </button>
        </div>
      )}
    </div>
  );
};

// Simple Loading State
interface SimpleLoadingStateProps {
  message?: string;
}

export const SimpleLoadingState: React.FC<SimpleLoadingStateProps> = ({
  message = "Connecting to server..."
}) => {
  const containerStyle: React.CSSProperties = {
    background: '#f7fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '40px 20px',
    textAlign: 'center',
    margin: '20px 0',
  };

  const titleStyle: React.CSSProperties = {
    color: '#2d3748',
    fontSize: '18px',
    fontWeight: '500',
    marginTop: '15px',
    marginBottom: '8px',
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#718096',
    fontSize: '14px',
  };

  return (
    <div style={containerStyle}>
      <SimpleSpinner size={32} />
      <div style={titleStyle}>{message}</div>
      <div style={subtitleStyle}>Please wait, establishing connection...</div>
    </div>
  );
};

// Simple Connection Indicator Badge
interface SimpleConnectionIndicatorProps {
  showText?: boolean;
  style?: React.CSSProperties;
}

export const SimpleConnectionIndicator: React.FC<SimpleConnectionIndicatorProps> = ({
  showText = true,
  style = {}
}) => {
  const {  isConnected, hasError, isConnecting } = useConnection();

  const getStatusColor = () => {
    if (isConnected) return '#48bb78';
    if (hasError) return '#f56565';
    if (isConnecting) return '#ed8936';
    return '#a0aec0';
  };

  const getStatusText = () => {
    if (isConnected) return 'Connected';
    if (hasError) return 'Failed';
    if (isConnecting) return 'Connecting';
    return 'Unknown';
  };

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#4a5568',
    ...style,
  };

  const dotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: getStatusColor(),
    flexShrink: 0,
  };

  return (
    <div style={containerStyle}>
      <div style={dotStyle} />
      {showText && <span>{getStatusText()}</span>}
    </div>
  );
};

// Connection Guard HOC replacement
interface SimpleConnectionGuardProps {
  children: React.ReactNode;
  showIndicator?: boolean;
}

export const SimpleConnectionGuard: React.FC<SimpleConnectionGuardProps> = ({
  children,
  showIndicator = true
}) => {
  const connection = useConnection({
    autoCheck: true,
    checkOnMount: true,
    checkOnFocus: true,
    maxRetries: 3,
    retryInterval: 5000,
  });

  if (connection.isConnecting) {
    return <SimpleLoadingState message="Checking server connection..." />;
  }

  if (connection.hasError) {
    return (
      <SimpleConnectionError
        error={connection.error || 'Unknown error'}
        onRetry={connection.retry}
        canRetry={connection.canRetry}
      />
    );
  }

  return (
    <div>
      {showIndicator && !connection.isConnected && (
        <div style={{ 
          background: '#fffbeb', 
          border: '1px solid #f6e05e', 
          borderRadius: '6px', 
          padding: '8px 12px', 
          marginBottom: '16px',
          fontSize: '14px',
          color: '#744210'
        }}>
          ⚠️ Server connection status unknown. Some features may not work properly.
        </div>
      )}
      {children}
    </div>
  );
};
