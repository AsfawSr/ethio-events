'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CreditCard,
  CheckCircle,
  ShieldCheck,
  Loader2,
  Lock,
  Globe,
  Gift,
  Sparkles,
  ArrowRight,
  Heart,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { OrderDetails } from '@/lib/types';

function StripeCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get('order') || searchParams.get('orderNumber') || 'ORD-2026-DIASPORA';
  const paramAmount = searchParams.get('amount');
  const paramCurrency = searchParams.get('currency') || 'USD';
  const paramPi = searchParams.get('pi') || 'pi_simulated_test';

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12 / 28');
  const [cvc, setCvc] = useState('•••');
  const [cardHolder, setCardHolder] = useState('Diaspora Supporter');
  const [postalCode, setPostalCode] = useState('90210');
  const [country, setCountry] = useState('US');

  useEffect(() => {
    if (orderNumber && !orderNumber.includes('DEMO') && !orderNumber.includes('DIASPORA')) {
      setLoading(true);
      api
        .getOrderDetails(orderNumber)
        .then((data) => {
          setOrder(data);
          if (data.customerName) setCardHolder(data.customerName);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [orderNumber]);

  const displayCurrency = order?.currency && order.currency !== 'ETB' ? order.currency : paramCurrency;
  const foreignAmount = order?.foreignAmount || (paramAmount ? parseFloat(paramAmount) : (order ? parseFloat((order.totalAmount / 125).toFixed(2)) : 24.00));
  const etbAmount = order?.totalAmount || 3000;
  const isGift = order?.isGift || searchParams.get('isGift') === 'true';

  const handlePay = async (method: string = 'CARD') => {
    setSubmitting(true);
    setError(null);
    try {
      await api.simulateStripeSuccess(orderNumber);
      router.push(`/orders/${orderNumber}?status=success&gateway=STRIPE_DIASPORA`);
    } catch (err: any) {
      try {
        await api.simulatePaymentSuccess(orderNumber, 'STRIPE_DIASPORA');
        router.push(`/orders/${orderNumber}?status=success&gateway=STRIPE_DIASPORA`);
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || 'Payment simulation failed.');
        setSubmitting(false);
      }
    }
  };

  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'CAD':
        return 'CA$';
      case 'AED':
        return 'AED ';
      default:
        return '$';
    }
  };

  return (
    <div className="w-full max-w-md rounded-[32px] bg-[#0A0F1D] border border-purple-500/40 shadow-2xl shadow-purple-950/50 overflow-hidden p-6 sm:p-8 space-y-6 animate-fadeIn">
      {/* Stripe & EthioEvents Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#635BFF] to-[#0A2540] flex items-center justify-center text-white font-black text-xl shadow-lg">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-white">Stripe</span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-[#635BFF]/20 text-[#7a73ff] border border-[#635BFF]/30 px-1.5 py-0.2 rounded">
                Test Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">EthioEvents Diaspora Gateway</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[11px] text-slate-400 font-medium">Order</p>
          <p className="text-xs font-mono font-bold text-amber-400">{orderNumber}</p>
        </div>
      </div>

      {/* Amount Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/50 to-slate-900 border border-purple-500/30 text-center space-y-1">
        <p className="text-xs text-purple-200">Total International Charge:</p>
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-3xl font-black text-white tracking-tight">
            {getCurrencySymbol(displayCurrency)}
            {foreignAmount.toFixed(2)}
          </span>
          <span className="text-xs font-bold text-purple-300">{displayCurrency}</span>
        </div>
        <p className="text-xs text-slate-400">
          ≈ {etbAmount.toLocaleString()} ETB (Settled to Addis Organizer)
        </p>
      </div>

      {/* Diaspora Gifting Banner */}
      {isGift && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/40 to-pink-950/40 border border-purple-500/40 text-xs space-y-1.5 animate-fadeIn">
          <div className="flex items-center gap-2 text-purple-300 font-bold">
            <Gift className="h-4 w-4 text-purple-400" />
            <span>Diaspora Gift for Addis Ababa Recipient</span>
          </div>
          <div className="text-[11px] text-purple-200/90 pl-6">
            <p>
              Recipient:{' '}
              <strong className="text-white">
                {order?.giftRecipientName || 'Family Member'}
              </strong>{' '}
              ({order?.giftRecipientPhone || '+251 911 22 33 44'})
            </p>
            {order?.giftMessage && (
              <p className="italic text-purple-300/80 mt-1">"{order.giftMessage}"</p>
            )}
            <p className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <Check className="h-3 w-3" /> SMS ticket pass will be instantly dispatched upon charge.
            </p>
          </div>
        </div>
      )}

      {/* 1-Tap Apple Pay / Google Pay Simulator */}
      <div className="space-y-2">
        <button
          onClick={() => handlePay('APPLE_PAY')}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-black hover:bg-neutral-900 text-white font-bold py-3.5 rounded-2xl border border-white/20 shadow-lg active:scale-98 transition disabled:opacity-50 text-sm"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Pay / GPay (1-Tap Checkout)</span>
            </>
          )}
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-3 text-[11px] uppercase font-semibold text-slate-500">
            Or pay with card
          </span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>
      </div>

      {/* Simulated Card Form */}
      <div className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Card Information
          </label>
          <div className="rounded-xl border border-white/10 bg-slate-900/80 overflow-hidden divide-y divide-white/10 focus-within:border-purple-500 transition">
            <div className="flex items-center px-3.5 py-2.5">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4242 4242 4242 4242"
                className="w-full bg-transparent text-white text-xs font-mono focus:outline-none placeholder:text-slate-500"
              />
              <div className="flex items-center gap-1 text-slate-400 shrink-0">
                <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                  VISA
                </span>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                  MC
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-white/10">
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM / YY"
                className="w-full bg-transparent px-3.5 py-2 text-white text-xs font-mono focus:outline-none placeholder:text-slate-500"
              />
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="CVC"
                className="w-full bg-transparent px-3.5 py-2 text-white text-xs font-mono focus:outline-none placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Cardholder Name
            </label>
            <input
              type="text"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              placeholder="Name on card"
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2 text-white text-xs focus:outline-none focus:border-purple-500 transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              ZIP / Postal Code
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Postal code"
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2 text-white text-xs focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Submit Charge Button */}
      <button
        onClick={() => handlePay('CARD')}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#635BFF] via-[#5448EE] to-[#7A73FF] hover:from-[#5448EE] hover:to-[#635BFF] text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-indigo-950/50 active:scale-95 transition disabled:opacity-50 text-sm"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-white" />
            <span>Authorizing with Bank...</span>
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 text-white" />
            <span>
              Pay {getCurrencySymbol(displayCurrency)}
              {foreignAmount.toFixed(2)} {displayCurrency}
            </span>
            <ArrowRight className="h-4 w-4 text-white" />
          </>
        )}
      </button>

      {/* Security Footer */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-white/10">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <span>PCI-DSS Level 1 Compliant • 256-Bit SSL Encryption</span>
      </div>
    </div>
  );
}

export default function StripeMockPaymentPage() {
  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center justify-center bg-gradient-to-b from-purple-950/40 via-[#080C14] to-[#080C14]">
      <Suspense fallback={<div className="text-white text-center">Loading Stripe Diaspora Checkout...</div>}>
        <StripeCheckoutContent />
      </Suspense>
    </div>
  );
}
