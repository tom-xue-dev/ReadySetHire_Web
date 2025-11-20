import { useNavigate } from 'react-router-dom';

export default function SubscriptionCancel() {
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', background: 'white' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Checkout canceled</h1>
      <p style={{ color: '#6b7280' }}>No worries, you can subscribe anytime.</p>
      <button
        onClick={() => navigate('/subscription')}
        style={{
          marginTop: 12,
          padding: '10px 16px',
          backgroundColor: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer'
        }}
      >
        Back to Subscription
      </button>
    </div>
  );
}


