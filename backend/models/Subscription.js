import { embeddedStore } from '../config/database.js';

export const SUBSCRIPTION_PLANS = [
  {
    id: 'FREE',
    name: 'Free Starter',
    price: 0,
    interval: 'forever',
    resolution: '720p HD',
    devices: 1,
    ads: true,
    downloads: false,
    badge: 'Basic Access',
    features: [
      'Access to standard catalog',
      '720p HD streaming',
      'Watch on 1 mobile or desktop device',
      'Limited commercials'
    ]
  },
  {
    id: 'BASIC',
    name: 'Standard Cinema',
    price: 9.99,
    interval: 'month',
    resolution: '1080p Full HD',
    devices: 2,
    ads: false,
    downloads: true,
    badge: 'Popular',
    features: [
      'Unlimited ad-free movies & series',
      '1080p Full HD crystal clarity',
      'Stream on 2 screens concurrently',
      'Offline downloads on supported devices',
      'Spatial stereo audio'
    ]
  },
  {
    id: 'PREMIUM',
    name: 'Ultra Platinum VIP',
    price: 15.99,
    interval: 'month',
    resolution: '4K Ultra HD + HDR',
    devices: 4,
    ads: false,
    downloads: true,
    badge: 'Ultimate Experience',
    features: [
      '4K Ultra HD + Dolby Vision HDR',
      'Dolby Atmos cinematic surround sound',
      'Stream on 4 screens simultaneously',
      'VIP early access to new releases',
      'Priority customer support'
    ]
  }
];

export const SubscriptionModel = {
  getPlans() {
    return SUBSCRIPTION_PLANS;
  },

  async upgradeUser(userId, planId) {
    const userIndex = embeddedStore.users.findIndex(u => u._id === userId);
    if (userIndex === -1) throw new Error('User not found');

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0];

    const updatedSub = {
      plan: plan.id,
      status: 'active',
      price: plan.price,
      devices: plan.devices,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    embeddedStore.users[userIndex].subscription = updatedSub;
    return updatedSub;
  }
};

export default SubscriptionModel;
