import { useState } from 'react';
import { createCheckoutSession } from '@/api/api';

export default function Subscription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await createCheckoutSession();
      if (typeof session === 'string') {
        window.location.href = session;
      } else if (session && typeof session.url === 'string') {
        window.location.href = session.url;
      } else if (session && typeof session.id === 'string') {
        // Fallback if only id is returned (shouldn't happen, but safe)
        window.location.href = `https://checkout.stripe.com/pay/${session.id}`;
      } else {
        setError('Unable to start checkout.');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <h1 style={title}>Subscription</h1>
      <p style={desc}>Unlock pro features for your team. billed monthly.</p>

      <div style={planCard}>
        <h2 style={planTitle}>Pro</h2>
        <p style={planPrice}>$19<span style={per}>/mo</span></p>
        <ul style={featureList}>
          <li>Unlimited interviews</li>
          <li>AI question generation</li>
          <li>Resume assessment</li>
          <li>Priority support</li>
        </ul>
        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            padding: '10px 16px',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Redirecting…' : 'Subscribe'}
        </button>
        {error && <div style={errorBox}>{error}</div>}
      </div>
    </div>
  );
}

const container: React.CSSProperties = {
  maxWidth: '720px',
  margin: '0 auto',
  background: 'white'
};
const title: React.CSSProperties = { fontSize: '28px', fontWeight: 800 };
const desc: React.CSSProperties = { color: '#6b7280', marginBottom: 20 };
const planCard: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 24
};
const planTitle: React.CSSProperties = { fontSize: '20px', fontWeight: 700 };
const planPrice: React.CSSProperties = { fontSize: '36px', fontWeight: 800 };
const per: React.CSSProperties = { fontSize: '14px', color: '#6b7280' };
const featureList: React.CSSProperties = { paddingLeft: 18, margin: '16px 0' };
const errorBox: React.CSSProperties = {
  marginTop: 12,
  color: '#b91c1c',
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 8,
  padding: 12
};


