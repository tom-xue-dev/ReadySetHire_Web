import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SubscriptionSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get('session_id');

  useEffect(() => {
    // In a real app, verify the sessionId with backend and update user status
    // For now, just show success and redirect later
    const timer = setTimeout(() => navigate('/dashboard'), 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', background: 'white' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Payment successful</h1>
      <p style={{ color: '#6b7280' }}>Thank you for subscribing! Session: {sessionId}</p>
      <p>Redirecting to dashboard…</p>
    </div>
  );
}


