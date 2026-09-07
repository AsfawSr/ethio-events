'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, CheckCircle, Smartphone, CreditCard, ShieldCheck, User, Phone, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { TicketType, ReservationResponse } from '@/lib/types';
import { api } from '@/lib/api';
import CountdownTimer from './CountdownTimer';

interface ReservationModalProps {
  eventTitle: string;
  selectedTier: TicketType;
  onClose: () => void;
}

export default function ReservationModal({
  eventTitle,
  selectedTier,
  onClose,
}: ReservationModalProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<ReservationResponse | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const unitPrice = selectedTier.price;
  const totalPrice = unitPrice * quantity;

  // Step 1: Zero-Login Atomic Reservation
  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim()) {
      setError('Please enter your Ethiopian phone number (09... or 07...)');
      return;
    }
    if (!customerName.trim()) {
      setError('Please enter your full name for the ticket');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.reserveGuestOrder({
        ticketTypeId: selectedTier.id,
        quantity,
        customerPhone: customerPhone.trim(),
        customerName: customerName.trim(),
      });
      setReservation(res);
    } catch (err: any) {
      setError(err.message || 'Failed to reserve ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Payment Trigger (Telebirr / Chapa / Demo Simulator)
  const handleTelebirrPayment = async () => {
    if (!reservation) return;
    setPaymentLoading(true);
    try {
      const res = await api.initiateTelebirr(reservation.orderNumber);
      window.location.href = res.toPayUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to launch Telebirr payment.');
      setPaymentLoading(false);
    }
  };

  const handleChapaPayment = async () => {
    if (!reservation) return;
    setPaymentLoading(true);
    try {
      const res = await api.initiateChapa(reservation.orderNumber);
      window.location.href = res.checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to launch Chapa payment.');
      setPaymentLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!reservation) return;
    setPaymentLoading(true);
    try {
      await api.simulatePaymentSuccess(reservation.orderNumber, 'TELEBIRR');
      router.push(`/orders/${reservation.orderNumber}`);
    } catch (err: any) {
      setError(err.message || 'Simulation failed.');
      setPaymentLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                1-Tap Guest Checkout
              </span>
              <span className="text-xs text-slate-400">No Password Required</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1 truncate max-w-xs sm:max-w-md">
              {eventTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-sm flex items-center gap-2">
              <span className="text-rose-400 font-bold">Error:</span> {error}
            </div>
          )}

          {!reservation ? (
            /* STEP 1: Enter Phone, Name & Quantity */
            <form onSubmit={handleReserve} className="space-y-5">
              {/* Selected Tier Badge */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/60 border border-white/5">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Selected Tier</p>
                  <p className="text-base font-bold text-white">{selectedTier.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium">Price per Ticket</p>
                  <p className="text-lg font-extrabold text-amber-400">
                    {unitPrice.toLocaleString()} <span className="text-xs text-slate-400">ETB</span>
                  </p>
                </div>
              </div>

              {/* Quantity Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Number of Tickets (Max {Math.min(selectedTier.maxPerUser, selectedTier.availableCapacity)})
                </label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5]
                    .filter((q) => q <= Math.min(selectedTier.maxPerUser, selectedTier.availableCapacity))
                    .map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuantity(q)}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition border ${
                          quantity === q
                            ? 'bg-amber-400 text-black border-amber-400 shadow-glowGold'
                            : 'bg-slate-800/80 text-slate-300 border-white/10 hover:border-amber-400/40'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                </div>
              </div>

              {/* Guest Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Full Name (የተጠቃሚ ስም)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abebe Bikila"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Phone Number Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Ethiopian Mobile Phone (ስልክ ቁጥር)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="0911 22 33 44 or 0711..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder:text-slate-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Your ticket pass link will be sent to this number via SMS.
                </p>
              </div>

              {/* Total & Submit */}
              <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Total Payable</p>
                  <p className="text-2xl font-black text-amber-400">
                    {totalPrice.toLocaleString()} <span className="text-xs text-slate-300">ETB</span>
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold px-6 py-3.5 rounded-2xl shadow-glowGold active:scale-95 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Locking Tickets...</span>
                    </>
                  ) : (
                    <>
                      <span>Lock &amp; Pay</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: 10-Minute Hold Active & Payment Gateways */
            <div className="space-y-6 animate-fadeIn">
              {/* Live 10-Minute Countdown */}
              <CountdownTimer
                expiresAtIso={reservation.reservedUntilIsoUtc}
                onExpire={() => {
                  setError('Your 10-minute ticket reservation has expired. Please select tickets again.');
                  setReservation(null);
                }}
              />

              {/* Summary Pill */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Order Number:</span>
                  <span className="font-mono font-bold text-white">{reservation.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tickets:</span>
                  <span className="font-medium text-white">
                    {reservation.quantity}x {reservation.ticketTypeName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-medium text-white">{customerName} ({customerPhone})</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between text-base font-bold">
                  <span className="text-white">Amount Due:</span>
                  <span className="text-amber-400 font-extrabold">
                    {reservation.totalAmount.toLocaleString()} ETB
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Select Local Payment Method:
                </p>

                {/* Telebirr 1-Tap Button */}
                <button
                  onClick={handleTelebirrPayment}
                  disabled={paymentLoading}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white font-bold transition shadow-glowTelebirr active:scale-[0.98] border border-sky-400/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-sky-600 font-black text-xs shadow">
                      telebirr
                    </div>
                    <div className="text-left">
                      <p className="text-base font-extrabold leading-tight">Pay with Telebirr</p>
                      <p className="text-xs text-sky-200">USSD / App Direct Checkout</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5" />
                </button>

                {/* Chapa Button */}
                <button
                  onClick={handleChapaPayment}
                  disabled={paymentLoading}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold transition shadow-glowEmerald active:scale-[0.98] border border-emerald-400/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 font-black text-xs shadow">
                      chapa
                    </div>
                    <div className="text-left">
                      <p className="text-base font-extrabold leading-tight">Pay with Chapa</p>
                      <p className="text-xs text-emerald-200">CBE Birr, Bank Cards, Awash</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5" />
                </button>

                {/* Instant Dev Demo Payment Simulator */}
                <div className="pt-2 border-t border-white/5">
                  <button
                    onClick={handleSimulatePayment}
                    disabled={paymentLoading}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Instant Demo: Simulate Telebirr Approval</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
