import { Router } from 'express';
import Stripe from 'stripe';
import { authenticateToken } from '../middleware/auth';
import prisma from '../services/database';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

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

// Map plan ID to subscription plan enum
const planIdToEnum: Record<string, SubscriptionPlan> = {
  // HR/Recruiter plans
  basic: SubscriptionPlan.BASIC,
  professional: SubscriptionPlan.PROFESSIONAL,
  enterprise: SubscriptionPlan.ENTERPRISE,
  // Employee plans
  trial: SubscriptionPlan.TRIAL,
  premium: SubscriptionPlan.PREMIUM,
};

// Demo mode subscription - directly activate subscription without payment
router.post('/demo-subscribe', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { planId } = req.body;
    if (!planId || !planIdToEnum[planId]) {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    const subscriptionPlan = planIdToEnum[planId];
    const now = new Date();
    
    // Set expiration to 30 days from now for demo
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update user subscription in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionStartedAt: now,
        subscriptionExpiresAt: expiresAt,
      },
      select: {
        id: true,
        username: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartedAt: true,
        subscriptionExpiresAt: true,
      },
    });

    console.log(`[DEMO] User ${userId} subscribed to ${planId} plan`);

    return res.json({
      success: true,
      message: 'Subscription activated (demo mode)',
      subscription: {
        plan: updatedUser.subscriptionPlan,
        status: updatedUser.subscriptionStatus,
        startedAt: updatedUser.subscriptionStartedAt,
        expiresAt: updatedUser.subscriptionExpiresAt,
      },
    });
  } catch (err: any) {
    console.error('Demo subscription error:', err);
    return res.status(500).json({ error: err.message || 'Failed to activate subscription' });
  }
});

// Get current user's subscription status
router.get('/subscription-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartedAt: true,
        subscriptionExpiresAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if subscription has expired
    let status = user.subscriptionStatus;
    if (user.subscriptionExpiresAt && new Date() > user.subscriptionExpiresAt) {
      status = SubscriptionStatus.EXPIRED;
      // Update status in database
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: SubscriptionStatus.EXPIRED },
      });
    }

    return res.json({
      plan: user.subscriptionPlan,
      status,
      startedAt: user.subscriptionStartedAt,
      expiresAt: user.subscriptionExpiresAt,
    });
  } catch (err: any) {
    console.error('Get subscription status error:', err);
    return res.status(500).json({ error: err.message || 'Failed to get subscription status' });
  }
});

// Create a Checkout Session for subscription (Stripe - for production)
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


