'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Smartphone, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

function TelebirrCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get('order') || 'ORD-2026-DEMO';
  const amount = searchParams.get('amount') || '1500.00';

  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await api.simulatePaymentSuccess(orderNumber, 'TELEBIRR');
      router.push(`/orders/${orderNumber}`);
    } catch (e) {
      router.push(`/orders/${orderNumber}`);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-[32px] bg-slate-900 border border-sky-500/40 shadow-glowTelebirr overflow-hidden p-6 space-y-6">
      {/* Telebirr Brand Header */}
      <div className="text-center space-y-2">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-white shadow-lg flex items-center justify-center text-sky-600 font-black text-xl">
          telebirr
        </div>
        <h1 className="text-xl font-black text-white">Telebirr Web Checkout</h1>
        <p className="text-xs text-sky-300">Ethio Telecom Payment Gateway</p>
      </div>

      {/* Amount Box */}
      <div className="p-4 rounded-2xl bg-sky-950/50 border border-sky-500/30 text-center space-y-1">
        <p className="text-xs text-slate-400">Total Amount to Pay:</p>
        <p className="text-3xl font-black text-sky-400">
          {amount} <span className="text-xs text-slate-300">ETB</span>
        </p>
        <p className="text-[11px] font-mono text-slate-400">Order: {orderNumber}</p>
      </div>

      {/* USSD / PIN simulation */}
      <div className="space-y-2 text-center">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Enter 4-Digit Telebirr PIN
        </label>
        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-12 w-12 rounded-xl bg-slate-800 border border-sky-400/40 flex items-center justify-center text-white font-black text-xl"
            >
              ●
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleApprove}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-extrabold py-4 rounded-2xl shadow-glowTelebirr active:scale-95 transition disabled:opacity-50 text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verifying RSA Signature...</span>
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4" />
            <span>Confirm &amp; Pay {amount} ETB</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
        <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
        <span>256-bit Asymmetric RSA Cryptographic Session</span>
      </div>
    </div>
  );
}

export default function TelebirrMockPaymentPage() {
  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center justify-center bg-gradient-to-b from-sky-950/40 via-[#080C14] to-[#080C14]">
      <Suspense fallback={<div className="text-white text-center">Loading Telebirr Checkout...</div>}>
        <TelebirrCheckoutContent />
      </Suspense>
    </div>
  );
}
