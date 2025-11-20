import { Router } from 'express';
import Stripe from 'stripe';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Initialize Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || '';
const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173/subscription/success?session_id={CHECKOUT_SESSION_ID}';
const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL || 'http://localhost:5173/subscription/cancel';

if (!STRIPE_SECRET_KEY) {
  console.warn('Stripe is not configured. Set STRIPE_SECRET_KEY to enable billing.');
}

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : (null as unknown as Stripe);

// Create a Checkout Session for subscription
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Billing not configured' });
    }
    if (!STRIPE_PRICE_ID) {
      return res.status(500).json({ error: 'Missing STRIPE_PRICE_ID' });
    }

    const { email } = req.user || {} as any;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [
        { price: STRIPE_PRICE_ID, quantity: 1 }
      ],
      success_url: STRIPE_SUCCESS_URL,
      cancel_url: STRIPE_CANCEL_URL,
      allow_promotion_codes: true,
      metadata: {
        userId: String(req.user?.id || ''),
        username: String(req.user?.username || '')
      }
    });

    return res.json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout session error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create checkout session' });
  }
});

export default router;


