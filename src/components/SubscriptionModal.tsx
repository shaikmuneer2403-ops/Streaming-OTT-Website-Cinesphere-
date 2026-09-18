import React, { useState } from 'react';
import { X, Check, Crown, Shield, Zap, Sparkles } from 'lucide-react';
import { User, SubscriptionPlan } from '../types';
import { apiClient } from '../services/api';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSubscriptionUpdated: (updatedUser: User) => void;
  onRequireAuth: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubscriptionUpdated,
  onRequireAuth
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'BASIC' | 'PREMIUM'>('PREMIUM');
  const [processing, setProcessing] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPlan = currentUser?.subscription?.plan || 'FREE';

  const plans: SubscriptionPlan[] = [
    {
      id: 'FREE',
      name: 'Starter Pass',
      price: 0,
      interval: 'month',
      resolution: '720p HD',
      devices: 1,
      ads: true,
      downloads: false,
      badge: 'Free Tier',
      features: [
        'Standard definition streaming (720p)',
        '1 active screen at a time',
        'Access to selected free movie catalog',
        'Community discussion & reviews',
        'Ad-supported experience'
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
        'Crystal clear 1080p Full HD streaming',
        '2 concurrent devices at the same time',
        'Zero advertisements or interruptions',
        'Download up to 10 movies for offline viewing',
        'Full unlimited movie & series catalog access'
      ]
    },
    {
      id: 'PREMIUM',
      name: 'Ultra VIP Dolby',
      price: 15.99,
      interval: 'month',
      resolution: '4K Ultra HD + HDR',
      devices: 4,
      ads: false,
      downloads: true,
      badge: 'Best Experience',
      features: [
        'Stunning 4K Ultra HD, HDR10 & Dolby Vision',
        'Immersive Dolby Atmos spatial audio',
        '4 simultaneous family screens',
        'Unlimited offline downloads on any device',
        'Priority access to newly released festival premieres',
        'No ads, no buffering priority CDN bandwidth'
      ]
    }
  ];

  const handleUpgrade = async (planId: 'FREE' | 'BASIC' | 'PREMIUM') => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    try {
      setProcessing(true);
      const res = await apiClient.upgradePlan(planId);
      setSuccessNotice(`Upgraded to ${planId} Tier!`);
      if (res.user) {
        onSubscriptionUpdated(res.user);
      }
      setTimeout(() => {
        setSuccessNotice(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Upgrade failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div
        className="relative w-full max-w-5xl bg-[#0d111a] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Crown className="w-3.5 h-3.5" />
            <span>CINESPHERE MEMBERSHIP TIERS</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Choose Your Cinematic Journey
          </h2>
          <p className="text-sm text-gray-400">
            Switch or cancel anytime. All plans come with seamless cloud resume across mobile, tablet, and TV.
          </p>

          {successNotice && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl animate-fade-in">
              ✓ {successNotice}
            </div>
          )}
        </div>

        {/* Tier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isSelected = selectedPlan === plan.id;
            const isPremium = plan.id === 'PREMIUM';

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 cursor-pointer border ${
                  isSelected
                    ? isPremium
                      ? 'bg-gradient-to-b from-[#182032] to-[#121622] border-amber-500/70 shadow-2xl shadow-amber-500/10 scale-[1.02]'
                      : 'bg-[#182032] border-red-500/70 shadow-xl scale-[1.01]'
                    : 'bg-[#111622]/80 border-white/10 hover:border-white/20'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      isPremium
                        ? 'bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-md'
                        : 'bg-red-600 text-white'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      <span className="text-xs text-gray-400 font-medium">{plan.resolution}</span>
                    </div>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-black text-white">
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-xs text-gray-400 font-normal"> / {plan.interval}</span>
                    )}
                  </div>

                  <div className="space-y-3 text-xs text-gray-300 border-t border-white/10 pt-4">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpgrade(plan.id);
                    }}
                    disabled={isCurrent || processing}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
                      isCurrent
                        ? 'bg-white/10 text-gray-400 cursor-not-allowed'
                        : isPremium
                        ? 'bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white shadow-amber-500/20'
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                    }`}
                  >
                    {isCurrent
                      ? 'Current Active Plan'
                      : processing && isSelected
                      ? 'Activating...'
                      : `Activate ${plan.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          🔒 Secure simulated checkout. Production ready with modular Stripe and Razorpay webhook bindings.
        </div>
      </div>
    </div>
  );
};
