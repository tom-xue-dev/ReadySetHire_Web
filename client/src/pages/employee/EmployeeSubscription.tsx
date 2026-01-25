import { useState } from 'react';
import { createCheckoutSession } from '@/api/api';
import { useI18n } from '@/contexts/I18nContext';
import LandingHeader from '@/components/layout/LandingHeader';
import LandingFooter from '@/components/layout/LandingFooter';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface PricingPlan {
  id: 'trial' | 'premium';
  price: number;
  recommended?: boolean;
  buttonStyle: 'primary' | 'secondary';
}

export default function EmployeeSubscription() {
  const { t } = useI18n();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plans: PricingPlan[] = [
    {
      id: 'trial',
      price: 1,
      buttonStyle: 'secondary'
    },
    {
      id: 'premium',
      price: 5,
      recommended: true,
      buttonStyle: 'primary'
    }
  ];

  const getPlanFeatures = (planId: string): string[] => {
    const baseKey = `employeeSubscription.plans.${planId}.features`;
    switch (planId) {
      case 'trial':
        return [
          t(`${baseKey}.unlimited`),
          t(`${baseKey}.basicModel`),
          t(`${baseKey}.instantResults`),
          t(`${baseKey}.validity`)
        ];
      case 'premium':
        return [
          t(`${baseKey}.unlimited`),
          t(`${baseKey}.advancedModel`),
          t(`${baseKey}.higherAccuracy`),
          t(`${baseKey}.priorityProcessing`),
          t(`${baseKey}.validity`)
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
        setError(t('employeeSubscription.errorCheckout'));
      }
    } catch (e: any) {
      setError(e?.message || t('employeeSubscription.errorCheckout'));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="bg-white min-h-screen relative flex flex-col">
      <LandingHeader showNavLinks={false} />
      
      {/* Top background decoration - same as RateResume */}
      <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-[80px] sm:-top-80">
        <div
          style={{clipPath:'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}
          className="relative left-1/2 aspect-1155/678 w-400 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 blur-3xl pointer-events-none sm:w-560"
        />
      </div>

      <div className="min-h-screen bg-transparent pt-14">
        {/* Header Section - same style as RateResume */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 relative overflow-hidden shadow-lg">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <SparklesIcon className="w-10 h-10 text-white" />
                <h1 className="text-3xl font-bold text-white">{t('employeeSubscription.title')}</h1>
              </div>
              <p className="text-white/90 text-lg">{t('employeeSubscription.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div style={billingInfo}>
            <span style={billingNote}>{t('employeeSubscription.billingNote')}</span>
          </div>

          <div style={plansContainer}>
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            style={{
              ...planCard,
              ...(plan.recommended ? recommendedPlanCard : {})
            }}
          >
            {plan.recommended && (
              <div style={recommendedBadge}>
                {t('employeeSubscription.recommendedBadge')}
              </div>
            )}
            
            <div style={planHeader}>
              <h2 style={planName}>{t(`employeeSubscription.plans.${plan.id}.name`)}</h2>
              <p style={planSubtitle}>{t(`employeeSubscription.plans.${plan.id}.subtitle`)}</p>
            </div>

            <div style={priceSection}>
              <div style={priceRow}>
                <span style={currency}>AUD</span>
                <span style={priceAmount}>${plan.price}</span>
              </div>
              <p style={priceBillingInfo}>{t('employeeSubscription.billingNote')}</p>
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
              {loadingPlan === plan.id ? t('employeeSubscription.processing') : t(`employeeSubscription.plans.${plan.id}.button`)}
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
              <div style={includedLabel}>{t('employeeSubscription.included')}</div>
              <div style={includedGrid}>
                <div>
                  <div style={includedTitle}>{t('employeeSubscription.validity')}</div>
                  <div style={includedValue}>
                    {t(`employeeSubscription.plans.${plan.id}.validity`)}
                  </div>
                </div>
                <div>
                  <div style={includedTitle}>{t('employeeSubscription.model')}</div>
                  <div style={includedValue}>
                    {t(`employeeSubscription.plans.${plan.id}.model`)}
                  </div>
                </div>
                <div style={fullWidthIncluded}>
                  <div style={includedTitle}>{t('employeeSubscription.accuracy')}</div>
                  <div style={includedValue}>
                    {t(`employeeSubscription.plans.${plan.id}.accuracy`)}
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
              <div style={highlightIcon}>⚡</div>
              <h3 style={highlightTitle}>{t('employeeSubscription.highlights.instant.title')}</h3>
              <p style={highlightDesc}>{t('employeeSubscription.highlights.instant.description')}</p>
            </div>
            <div style={featureHighlightItem}>
              <div style={highlightIcon}>🎯</div>
              <h3 style={highlightTitle}>{t('employeeSubscription.highlights.accurate.title')}</h3>
              <p style={highlightDesc}>{t('employeeSubscription.highlights.accurate.description')}</p>
            </div>
            <div style={featureHighlightItem}>
              <div style={highlightIcon}>♾️</div>
              <h3 style={highlightTitle}>{t('employeeSubscription.highlights.unlimited.title')}</h3>
              <p style={highlightDesc}>{t('employeeSubscription.highlights.unlimited.description')}</p>
            </div>
          </div>
        </div>
      </div>
      
      <LandingFooter />
    </div>
  );
}

// Styles
const billingInfo: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '32px',
  marginTop: '16px'
};

const billingNote: React.CSSProperties = {
  fontSize: '14px',
  color: '#059669',
  fontWeight: 600,
  background: '#d1fae5',
  padding: '6px 16px',
  borderRadius: '20px'
};

const plansContainer: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
  gap: '32px',
  marginBottom: '48px',
  maxWidth: '900px',
  margin: '0 auto'
};

const planCard: React.CSSProperties = {
  position: 'relative',
  background: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  padding: '40px',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
};

const recommendedPlanCard: React.CSSProperties = {
  border: '2px solid #8b5cf6',
  boxShadow: '0 8px 20px rgba(139,92,246,0.2)',
  transform: 'scale(1.02)'
};

const recommendedBadge: React.CSSProperties = {
  position: 'absolute',
  top: '-14px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  color: 'white',
  padding: '8px 20px',
  borderRadius: '24px',
  fontSize: '13px',
  fontWeight: 700,
  whiteSpace: 'nowrap',
  boxShadow: '0 4px 12px rgba(139,92,246,0.4)'
};

const planHeader: React.CSSProperties = {
  marginBottom: '28px'
};

const planName: React.CSSProperties = {
  fontSize: '28px',
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
  marginBottom: '28px'
};

const priceRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '6px',
  marginBottom: '8px'
};

const currency: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#6b7280'
};

const priceAmount: React.CSSProperties = {
  fontSize: '52px',
  fontWeight: 800,
  color: '#111827',
  lineHeight: '1'
};

const priceBillingInfo: React.CSSProperties = {
  fontSize: '13px',
  color: '#9ca3af'
};

const subscribeButton: React.CSSProperties = {
  width: '100%',
  padding: '16px 28px',
  fontSize: '16px',
  fontWeight: 600,
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  marginBottom: '28px'
};

const primaryButton: React.CSSProperties = {
  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  color: 'white',
  boxShadow: '0 4px 14px rgba(139,92,246,0.4)'
};

const secondaryButton: React.CSSProperties = {
  background: 'white',
  color: '#7c3aed',
  border: '2px solid #e5e7eb'
};

const featuresSection: React.CSSProperties = {
  marginBottom: '28px',
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
  marginBottom: '14px',
  fontSize: '15px',
  color: '#374151',
  lineHeight: '22px'
};

const checkIcon: React.CSSProperties = {
  color: '#10b981',
  fontWeight: 700,
  fontSize: '18px',
  flexShrink: 0
};

const includedSection: React.CSSProperties = {
  borderTop: '1px solid #e5e7eb',
  paddingTop: '24px'
};

const includedLabel: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '16px'
};

const includedGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px'
};

const fullWidthIncluded: React.CSSProperties = {
  gridColumn: '1 / -1'
};

const includedTitle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  marginBottom: '4px'
};

const includedValue: React.CSSProperties = {
  fontSize: '15px',
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '32px',
  marginTop: '80px',
  paddingTop: '64px',
  borderTop: '1px solid #e5e7eb',
  maxWidth: '900px',
  margin: '80px auto 0'
};

const featureHighlightItem: React.CSSProperties = {
  textAlign: 'center'
};

const highlightIcon: React.CSSProperties = {
  fontSize: '40px',
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
