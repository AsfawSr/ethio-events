'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCard, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

function ChapaCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get('order') || 'ORD-2026-DEMO';
  const amount = searchParams.get('amount') || '1500.00';
  const txRef = searchParams.get('txRef') || 'CHP-ORD-DEMO';

  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await api.simulatePaymentSuccess(orderNumber, 'CHAPA');
      router.push(`/orders/${orderNumber}`);
    } catch (e) {
      router.push(`/orders/${orderNumber}`);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-[32px] bg-slate-900 border border-emerald-500/40 shadow-glowEmerald overflow-hidden p-6 space-y-6">
      {/* Chapa Header */}
      <div className="text-center space-y-2">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-white shadow-lg flex items-center justify-center text-emerald-600 font-black text-xl">
          chapa
        </div>
        <h1 className="text-xl font-black text-white">Chapa Hosted Checkout</h1>
        <p className="text-xs text-emerald-300">CBE Birr • Awash • Dashen • Cards</p>
      </div>

      {/* Amount */}
      <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-center space-y-1">
        <p className="text-xs text-slate-400">Total Amount:</p>
        <p className="text-3xl font-black text-emerald-400">
          {amount} <span className="text-xs text-slate-300">ETB</span>
        </p>
        <p className="text-[11px] font-mono text-slate-400">tx_ref: {txRef}</p>
      </div>

      {/* Action Button */}
      <button
        onClick={handleApprove}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-extrabold py-4 rounded-2xl shadow-glowEmerald active:scale-95 transition disabled:opacity-50 text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4" />
            <span>Authorize Payment ({amount} ETB)</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        <span>Secured by Chapa Financial Technologies</span>
      </div>
    </div>
  );
}

export default function ChapaMockPaymentPage() {
  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center justify-center bg-gradient-to-b from-emerald-950/40 via-[#080C14] to-[#080C14]">
      <Suspense fallback={<div className="text-white text-center">Loading Chapa Checkout...</div>}>
        <ChapaCheckoutContent />
      </Suspense>
    </div>
  );
}
