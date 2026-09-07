'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Phone, KeyRound, ArrowRight, Loader2, Ticket } from 'lucide-react';
import { api } from '@/lib/api';

interface MyTicketsModalProps {
  onClose: () => void;
}

export default function MyTicketsModal({ onClose }: MyTicketsModalProps) {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter your Ethiopian phone number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.requestOtp(phoneNumber.trim());
      setStep('OTP');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError('Please enter the 6-digit code received via SMS');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.verifyOtp(phoneNumber.trim(), otpCode.trim());
      onClose();
      router.push(`/my-tickets?phone=${encodeURIComponent(phoneNumber.trim())}`);
    } catch (err: any) {
      setError(err.message || 'Incorrect verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Find My Tickets</h3>
              <p className="text-xs text-slate-400">የእኔ ቲኬቶች መፈለጊያ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {step === 'PHONE' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-xs text-slate-300">
                Enter the phone number you used during ticket purchase. We will send a fast 1-tap OTP to verify ownership.
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Phone Number (ስልክ ቁጥር)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="0911 22 33 44"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder:text-slate-500 font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold py-3.5 rounded-xl shadow-glowGold active:scale-95 transition disabled:opacity-50 text-sm"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Send 6-Digit Code</span>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-xs text-slate-300">
                We sent a 6-digit verification code to <span className="font-mono text-amber-300 font-semibold">{phoneNumber}</span>.
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  6-Digit SMS Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-center text-lg tracking-widest font-mono font-bold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder:text-slate-600"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold py-3.5 rounded-xl shadow-glowGold active:scale-95 transition disabled:opacity-50 text-sm"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Unlock My Tickets</span>}
              </button>
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="w-full text-center text-xs text-slate-400 hover:text-white py-1 transition"
              >
                Change Phone Number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
