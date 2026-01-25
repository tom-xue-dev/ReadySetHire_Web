import { useState } from 'react';
import { createCheckoutSession } from '@/api/api';
import { useI18n } from '@/contexts/I18nContext';

interface PricingPlan {
  id: 'basic' | 'professional' | 'enterprise';
  price: number;
  popular?: boolean;
  buttonStyle: 'primary' | 'secondary';
}

export default function Subscription() {
  const { t } = useI18n();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plans: PricingPlan[] = [
    {
      id: 'basic',
      price: 5,
      buttonStyle: 'secondary'
    },
    {
      id: 'professional',
      price: 10,
      popular: true,
      buttonStyle: 'primary'
    },
    {
      id: 'enterprise',
      price: 20,
      buttonStyle: 'primary'
    }
  ];

  const getPlanFeatures = (planId: string): string[] => {
    const baseKey = `subscription.plans.${planId}.features`;
    switch (planId) {
      case 'basic':
        return [
          t(`${baseKey}.unlimitedScoring`),
          t(`${baseKey}.basicAnalysis`),
          t(`${baseKey}.emailNotifications`),
          t(`${baseKey}.basicAnalytics`)
        ];
      case 'professional':
        return [
          t(`${baseKey}.allBasic`),
          t(`${baseKey}.batchScoring`),
          t(`${baseKey}.teamCollaboration`),
          t(`${baseKey}.advancedAnalytics`),
          t(`${baseKey}.prioritySupport`)
        ];
      case 'enterprise':
        return [
          t(`${baseKey}.allProfessional`),
          t(`${baseKey}.unlimitedBatch`),
          t(`${baseKey}.customModels`),
          t(`${baseKey}.dedicatedManager`),
          t(`${baseKey}.enterpriseSLA`),
          t(`${baseKey}.apiAccess`)
        ];
      default:
        return [];
    }
  };

  const handleSubscribe = async (planId: string) => {
    setLoadingPlan(planId);
    setError(null);
    try {
      const session = await createCheckoutSession();
      if (typeof session === 'string') {
        window.location.href = session;
      } else if (session && typeof session.url === 'string') {
        window.location.href = session.url;
      } else if (session && typeof session.id === 'string') {
        window.location.href = `https://checkout.stripe.com/pay/${session.id}`;
      } else {
        setError(t('subscription.errorCheckout'));
      }
    } catch (e: any) {
      setError(e?.message || t('subscription.errorCheckout'));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div style={container}>
      <div style={header}>
        <h1 style={title}>{t('subscription.title')}</h1>
        <p style={subtitle}>
          {t('subscription.subtitle')}
        </p>
        <div style={billingToggle}>
          <span style={billingLabel}>{t('subscription.billingLabel')}</span>
          <span style={billingNote}>{t('subscription.billingNote')}</span>
        </div>
      </div>

      <div style={plansContainer}>
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            style={{
              ...planCard,
              ...(plan.popular ? popularPlanCard : {})
            }}
          >
            {plan.popular && (
              <div style={popularBadge}>
                {t('subscription.popularBadge')}
              </div>
            )}
            
            <div style={planHeader}>
              <h2 style={planName}>{t(`subscription.plans.${plan.id}.name`)}</h2>
              <p style={planSubtitle}>{t(`subscription.plans.${plan.id}.subtitle`)}</p>
            </div>

            <div style={priceSection}>
              <div style={priceRow}>
                <span style={currency}>AUD</span>
                <span style={priceAmount}>${plan.price}</span>
                <span style={pricePeriod}>/mo</span>
              </div>
              <p style={billingInfo}>{t('subscription.billingNote')}</p>
            </div>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loadingPlan === plan.id}
              style={{
                ...subscribeButton,
                ...(plan.buttonStyle === 'primary' ? primaryButton : secondaryButton),
                ...(loadingPlan === plan.id ? { opacity: 0.6, cursor: 'not-allowed' } : {})
              }}
            >
              {loadingPlan === plan.id ? t('subscription.processing') : t(`subscription.plans.${plan.id}.button`)}
            </button>

            <div style={featuresSection}>
              <ul style={featureList}>
                {getPlanFeatures(plan.id).map((feature, index) => (
                  <li key={index} style={featureItem}>
                    <span style={checkIcon}>✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={includedSection}>
              <div style={includedLabel}>{t('subscription.included')}</div>
              <div style={includedGrid}>
                <div>
                  <div style={includedTitle}>{t('subscription.seats')}</div>
                  <div style={includedValue}>
                    {t(`subscription.plans.${plan.id}.seats`)}
                  </div>
                </div>
                <div>
                  <div style={includedTitle}>{t('subscription.support')}</div>
                  <div style={includedValue}>
                    {t(`subscription.plans.${plan.id}.support`)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <div style={errorBox}>{error}</div>}

      <div style={featuresHighlight}>
        <div style={featureHighlightItem}>
          <div style={highlightIcon}>🔒</div>
          <h3 style={highlightTitle}>{t('subscription.highlights.security.title')}</h3>
          <p style={highlightDesc}>{t('subscription.highlights.security.description')}</p>
        </div>
        <div style={featureHighlightItem}>
          <div style={highlightIcon}>⚡</div>
          <h3 style={highlightTitle}>{t('subscription.highlights.speed.title')}</h3>
          <p style={highlightDesc}>{t('subscription.highlights.speed.description')}</p>
        </div>
        <div style={featureHighlightItem}>
          <div style={highlightIcon}>👥</div>
          <h3 style={highlightTitle}>{t('subscription.highlights.teams.title')}</h3>
          <p style={highlightDesc}>{t('subscription.highlights.teams.description')}</p>
        </div>
      </div>
    </div>
  );
}

// Styles
const container: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: '40px 24px',
  background: '#fafafa'
};

const header: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '48px'
};

const title: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 700,
  color: '#111827',
  marginBottom: '16px'
};

const subtitle: React.CSSProperties = {
  fontSize: '16px',
  color: '#6b7280',
  lineHeight: '24px',
  maxWidth: '800px',
  margin: '0 auto 24px'
};

const billingToggle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  marginTop: '24px'
};

const billingLabel: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#111827'
};

const billingNote: React.CSSProperties = {
  fontSize: '14px',
  color: '#6b7280'
};

const plansContainer: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '24px',
  marginBottom: '48px'
};

const planCard: React.CSSProperties = {
  position: 'relative',
  background: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '32px',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const popularPlanCard: React.CSSProperties = {
  border: '2px solid #4f46e5',
  boxShadow: '0 4px 12px rgba(79,70,229,0.15)'
};

const popularBadge: React.CSSProperties = {
  position: 'absolute',
  top: '-12px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#1e1b4b',
  color: 'white',
  padding: '6px 16px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 600,
  whiteSpace: 'nowrap'
};

const planHeader: React.CSSProperties = {
  marginBottom: '24px'
};

const planName: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#111827',
  marginBottom: '8px'
};

const planSubtitle: React.CSSProperties = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: '20px'
};

const priceSection: React.CSSProperties = {
  marginBottom: '24px'
};

const priceRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '4px',
  marginBottom: '8px'
};

const currency: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#6b7280'
};

const priceAmount: React.CSSProperties = {
  fontSize: '48px',
  fontWeight: 800,
  color: '#111827',
  lineHeight: '1'
};

const pricePeriod: React.CSSProperties = {
  fontSize: '16px',
  color: '#6b7280'
};

const billingInfo: React.CSSProperties = {
  fontSize: '13px',
  color: '#9ca3af'
};

const subscribeButton: React.CSSProperties = {
  width: '100%',
  padding: '14px 24px',
  fontSize: '15px',
  fontWeight: 600,
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  marginBottom: '24px'
};

const primaryButton: React.CSSProperties = {
  background: '#1e1b4b',
  color: 'white'
};

const secondaryButton: React.CSSProperties = {
  background: 'white',
  color: '#1e1b4b',
  border: '1px solid #e5e7eb'
};

const featuresSection: React.CSSProperties = {
  marginBottom: '24px',
  flex: 1
};

const featureList: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0
};

const featureItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  marginBottom: '12px',
  fontSize: '14px',
  color: '#374151',
  lineHeight: '20px'
};

const checkIcon: React.CSSProperties = {
  color: '#10b981',
  fontWeight: 700,
  fontSize: '16px',
  flexShrink: 0
};

const includedSection: React.CSSProperties = {
  borderTop: '1px solid #e5e7eb',
  paddingTop: '20px'
};

const includedLabel: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '12px'
};

const includedGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px'
};

const includedTitle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  marginBottom: '4px'
};

const includedValue: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#111827'
};

const errorBox: React.CSSProperties = {
  maxWidth: '600px',
  margin: '24px auto',
  padding: '16px',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  color: '#b91c1c',
  fontSize: '14px',
  textAlign: 'center'
};

const featuresHighlight: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '32px',
  marginTop: '64px',
  paddingTop: '64px',
  borderTop: '1px solid #e5e7eb'
};

const featureHighlightItem: React.CSSProperties = {
  textAlign: 'center'
};

const highlightIcon: React.CSSProperties = {
  fontSize: '36px',
  marginBottom: '16px'
};

const highlightTitle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#111827',
  marginBottom: '8px'
};

const highlightDesc: React.CSSProperties = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: '20px'
};
