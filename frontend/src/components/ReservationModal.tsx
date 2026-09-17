'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  CheckCircle,
  Smartphone,
  CreditCard,
  ShieldCheck,
  User,
  Phone,
  Sparkles,
  Loader2,
  ArrowRight,
  Tag,
  Check,
  Percent,
} from 'lucide-react';
import { TicketType, ReservationResponse, ValidatePromoResponse } from '@/lib/types';
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

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<ValidatePromoResponse | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const unitPrice = selectedTier.price;
  const rawSubtotal = unitPrice * quantity;
  const discountAmount = promoResult && promoResult.valid ? promoResult.discountAmount : 0;
  const finalPayable = Math.max(0, rawSubtotal - discountAmount);

  // Apply Promo Code
  const handleApplyPromo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promoInput.trim()) return;

    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await api.validatePromoCode({
        code: promoInput.trim(),
        subtotal: rawSubtotal,
        ticketCount: quantity,
      });

      if (res.valid) {
        setPromoResult(res);
        setPromoError(null);
      } else {
        setPromoResult(null);
        setPromoError(res.message || 'Invalid promo code');
      }
    } catch (err: any) {
      setPromoResult(null);
      setPromoError(err.message || 'Could not validate promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoResult(null);
    setPromoInput('');
    setPromoError(null);
  };

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
      const storedRef = typeof window !== 'undefined' ? sessionStorage.getItem('ethioevents_ref') : null;
      const res = await api.reserveGuestOrder({
        ticketTypeId: selectedTier.id,
        quantity,
        customerPhone: customerPhone.trim(),
        customerName: customerName.trim(),
        promoCode: promoResult && promoResult.valid ? promoResult.code : undefined,
        affiliateCode: storedRef || undefined,
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
                        onClick={() => {
                          setQuantity(q);
                          if (promoResult) {
                            // Revalidate with new quantity
                            api.validatePromoCode({
                              code: promoResult.code,
                              subtotal: unitPrice * q,
                              ticketCount: q,
                            }).then((r) => r.valid && setPromoResult(r)).catch(() => {});
                          }
                        }}
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

              {/* Promo Code Input Box */}
              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-amber-400" />
                    Promo Code or Voucher
                  </span>
                  {promoResult && (
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-[11px] font-semibold text-rose-400 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {!promoResult ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. ROPHNAN20 or ADDIS100"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs font-mono uppercase focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoInput.trim()}
                      className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold px-4 py-2 rounded-xl text-xs transition active:scale-95 shadow"
                    >
                      {promoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-black" /> : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>
                        Promo <strong>{promoResult.code}</strong> Applied! (
                        {promoResult.discountType === 'PERCENTAGE'
                          ? `${promoResult.discountValue}% OFF`
                          : `-${promoResult.discountValue} ETB`}
                        )
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">
                      - {discountAmount.toLocaleString()} ETB
                    </span>
                  </div>
                )}

                {promoError && (
                  <p className="text-[11px] text-rose-400 font-medium">{promoError}</p>
                )}
              </div>

              {/* Total & Submit */}
              <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Total Payable</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-400">
                      {finalPayable.toLocaleString()} <span className="text-xs text-slate-300 font-normal">ETB</span>
                    </span>
                    {discountAmount > 0 && (
                      <span className="text-xs line-through text-slate-500 font-mono">
                        {rawSubtotal.toLocaleString()} ETB
                      </span>
                    )}
                  </div>
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

              {/* Order Reservation Summary */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Order Reference</span>
                  <span className="font-mono font-bold text-white">{reservation.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Tickets</span>
                  <span className="font-semibold text-white">
                    {reservation.quantity}x {reservation.ticketTypeName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-white/5">
                  <span className="font-bold text-slate-300">Total Due</span>
                  <span className="text-lg font-black text-amber-400">
                    {reservation.totalAmount.toLocaleString()} {reservation.currency}
                  </span>
                </div>
              </div>

              {/* Payment Method Action Buttons */}
              <div className="space-y-3">
                <p className="text-xs uppercase font-bold tracking-wider text-slate-300 text-center">
                  Select Ethiopian Payment Gateway
                </p>

                {/* Telebirr 1-Tap Payment */}
                <button
                  onClick={handleTelebirrPayment}
                  disabled={paymentLoading}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg transition active:scale-[0.99] disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl text-sky-600">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-extrabold text-white">Telebirr (ቴሌብር)</p>
                      <p className="text-[11px] text-sky-100 font-normal">
                        Instant USSD / In-App Confirmation
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white" />
                </button>

                {/* Chapa Payment */}
                <button
                  onClick={handleChapaPayment}
                  disabled={paymentLoading}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg transition active:scale-[0.99] disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl text-emerald-600">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-extrabold text-white">Chapa (CBE / Bank / Telebirr)</p>
                      <p className="text-[11px] text-emerald-100 font-normal">
                        Commercial Bank of Ethiopia, Awash, Dashen
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white" />
                </button>

                {/* Demo Payment Simulator */}
                <div className="pt-2">
                  <button
                    onClick={handleSimulatePayment}
                    disabled={paymentLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-amber-400 font-semibold text-xs transition active:scale-95 disabled:opacity-50"
                  >
                    {paymentLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-amber-400" />
                    )}
                    <span>Simulate Instant Mobile Money Payment</span>
                  </button>
                </div>
              </div>

              {/* Security Banner */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-white/5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>256-Bit Encrypted Ethiopian Telecommunications Gateway</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
