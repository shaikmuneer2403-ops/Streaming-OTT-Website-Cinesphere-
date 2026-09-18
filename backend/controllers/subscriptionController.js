import SubscriptionModel, { SUBSCRIPTION_PLANS } from '../models/Subscription.js';
import UserModel from '../models/User.js';

export async function getPlans(req, res) {
  return res.json({
    success: true,
    plans: SUBSCRIPTION_PLANS
  });
}

/**
 * Initializes a payment order for Stripe / Razorpay integration.
 * In development sandbox mode, creates the payment session payload.
 */
export async function createCheckoutSession(req, res, next) {
  try {
    const { planId } = req.body;
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan selected.'
      });
    }

    if (plan.price === 0) {
      // Free plan requires no gateway processing
      const updated = await SubscriptionModel.upgradeUser(req.user._id, planId);
      return res.json({
        success: true,
        message: 'Activated Free Starter plan.',
        subscription: updated
      });
    }

    // Architecture prepared for Stripe/Razorpay webhook
    const orderSession = {
      orderId: 'ord_' + Date.now(),
      planId: plan.id,
      amount: plan.price,
      currency: 'USD',
      customerEmail: req.user.email,
      gatewayIntegration: {
        stripePublicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_placeholder_key',
        provider: 'Stripe/Razorpay Modular Gateway',
        note: 'Ready to receive real client secret once payment provider keys are attached.'
      }
    };

    return res.json({
      success: true,
      message: 'Payment order initialized.',
      session: orderSession
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Confirms subscription upgrade.
 */
export async function confirmUpgrade(req, res, next) {
  try {
    const { planId, paymentMethodId } = req.body;
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan.'
      });
    }

    const updated = await SubscriptionModel.upgradeUser(req.user._id, plan.id);
    const user = await UserModel.findById(req.user._id);

    return res.json({
      success: true,
      message: `Successfully upgraded to ${plan.name}!`,
      subscription: updated,
      user
    });
  } catch (err) {
    next(err);
  }
}
