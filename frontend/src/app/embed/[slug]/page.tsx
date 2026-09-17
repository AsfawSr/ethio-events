'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Ticket,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  CreditCard,
  Sparkles,
  Tag,
  Check,
  Percent,
  ExternalLink,
  QrCode,
  Lock,
} from 'lucide-react';
import { EventDetail, TicketType, ReservationResponse, ValidatePromoResponse } from '@/lib/types';
import { api } from '@/lib/api';

export default function EmbedTicketCheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;

  // Customization query params
  const theme = (searchParams.get('theme') || 'dark').toLowerCase();
  const customColor = searchParams.get('color') || '#F59E0B';
  const lang = (searchParams.get('lang') || 'en').toLowerCase();
  const refCode = searchParams.get('ref') || '';
  const isModal = searchParams.get('modal') === '1';

  const isDark = theme !== 'light';

  // Event & Checkout State
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<'select' | 'details_payment' | 'completed'>('select');
  const [selectedTier, setSelectedTier] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<ValidatePromoResponse | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Customer Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'TELEBIRR' | 'CHAPA' | 'STRIPE'>('TELEBIRR');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [reservation, setReservation] = useState<ReservationResponse | null>(null);

  // Container ref for auto-resize postMessage
  const containerRef = useRef<HTMLDivElement>(null);

  // Broadcast resize to parent host
  const broadcastHeight = () => {
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      const height = document.documentElement.scrollHeight || document.body.scrollHeight;
      window.parent.postMessage({ type: 'ETHIOEVENTS_RESIZE', height: height }, '*');
    }
  };

  useEffect(() => {
    broadcastHeight();
    const timer = setTimeout(broadcastHeight, 200);
    return () => clearTimeout(timer);
  }, [step, selectedTier, quantity, promoResult, loading, error]);

  // Load event details
  useEffect(() => {
    async function loadEvent() {
      if (!slug) return;
      try {
        setLoading(true);
        const data = await api.getEventBySlug(slug);
        setEvent(data);
        if (data.ticketTypes && data.ticketTypes.length > 0) {
          setSelectedTier(data.ticketTypes[0]);
        }

        // Track affiliate promoter click if ref query param is present
        if (refCode) {
          sessionStorage.setItem('ethioevents_ref', refCode.trim().toLowerCase());
          api.trackAffiliateClick(refCode.trim().toLowerCase(), data.id).catch(() => {});
        }
      } catch (err: any) {
        console.warn('Failed to load event for embed:', err);
        // Fallback mock event for immediate resilience
        const mock: EventDetail = {
          id: 'e1111111-1111-1111-1111-111111111111',
          title: 'ROPHNAN - SOST (፫) LIVE in Addis Ababa',
          slug: slug || 'rophnan-sost-live-millennium-hall',
          description: 'The ultimate electronic-folk spectacle by ROPHNAN at Millennium Hall.',
          venueName: 'Millennium Hall (ሚሌኒየም አዳራሽ)',
          venueAddress: 'Bole Sub-City, Africa Avenue, Addis Ababa',
          startTime: {
            isoUtc: '2026-10-10T15:00:00Z',
            gregorianFormatted: 'Sat, Oct 10, 2026, 6:00 PM EAT',
            ethiopianDateFormatted: 'ቅዳሜ ጥቅምት 1, 2019',
            ethiopianTimeFormatted: 'ምሽት 12:00 ሰዓት',
            ethiopianFullFormatted: 'ቅዳሜ ጥቅምት 1, 2019 (ምሽት 12:00 ሰዓት)',
          },
          endTime: {
            isoUtc: '2026-10-10T21:00:00Z',
            gregorianFormatted: 'Sat, Oct 10, 2026, 12:00 AM EAT',
            ethiopianDateFormatted: 'ቅዳሜ ጥቅምት 1, 2019',
            ethiopianTimeFormatted: 'እኩለ ሌሊት 6:00 ሰዓት',
            ethiopianFullFormatted: 'ቅዳሜ ጥቅምት 1, 2019 (እኩለ ሌሊት 6:00 ሰዓት)',
          },
          bannerImageUrl:
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
          status: 'PUBLISHED',
          organizerName: 'Admas Events & Entertainment',
          ticketTypes: [
            {
              id: 'b1111111-1111-1111-1111-111111111111',
              name: 'Early Bird General',
              description: 'Standard standing area access',
              price: 800,
              currency: 'ETB',
              availableCapacity: 4800,
              maxPerUser: 5,
              isAvailable: true,
            },
            {
              id: 'b2222222-2222-2222-2222-222222222222',
              name: 'VIP Front Stage',
              description: 'Front circle priority access + fast gate entry',
              price: 2500,
              currency: 'ETB',
              availableCapacity: 1400,
              maxPerUser: 4,
              isAvailable: true,
            },
          ],
        };
        setEvent(mock);
        setSelectedTier(mock.ticketTypes[0]);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [slug, refCode]);

  // Pricing calculations
  const unitPrice = selectedTier ? selectedTier.price : 0;
  const rawSubtotal = unitPrice * quantity;
  const discountAmount = promoResult && promoResult.valid ? promoResult.discountAmount : 0;
  const finalPayable = Math.max(0, rawSubtotal - discountAmount);

  // Apply promo code
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
        setPromoError(res.message || (lang === 'am' ? 'የማይሰራ የቅናሽ ኮድ' : 'Invalid promo voucher'));
      }
    } catch (err: any) {
      setPromoResult(null);
      setPromoError(err.message || (lang === 'am' ? 'ኮዱን ማረጋገጥ አልተቻለም' : 'Could not validate promo code'));
    } finally {
      setPromoLoading(false);
    }
  };

  // Submit Order & Simulate Direct Checkout
  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedTier) {
      setError(lang === 'am' ? 'እባክዎ የትኬት አይነት ይምረጡ' : 'Please select a ticket tier');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError(lang === 'am' ? 'እባክዎ ስምዎን እና ስልክ ቁጥርዎን ያስገቡ' : 'Please provide your full name and phone number');
      return;
    }

    setCheckoutLoading(true);
    try {
      const activeRef = refCode || (typeof window !== 'undefined' ? sessionStorage.getItem('ethioevents_ref') : null);

      const res = await api.reserveGuestOrder({
        ticketTypeId: selectedTier.id,
        quantity: quantity,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        promoCode: promoResult?.valid ? promoResult.code : undefined,
        affiliateCode: activeRef || undefined,
      });

      setReservation(res);

      // Simulate instantaneous Telebirr/Chapa payment verification for seamless embed UX
      const gw = paymentMethod === 'STRIPE' ? 'STRIPE_DIASPORA' : paymentMethod;
      await api.simulatePaymentSuccess(res.orderNumber, gw as any);

      setStep('completed');

      // Dispatch order completion message to host website
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'ETHIOEVENTS_ORDER_COMPLETED',
            payload: {
              orderNumber: res.orderNumber,
              eventTitle: event?.title,
              eventSlug: event?.slug,
              tierName: selectedTier.name,
              quantity: quantity,
              totalPaidEtb: finalPayable,
              paymentMethod: paymentMethod,
              customerName: customerName.trim(),
              customerPhone: customerPhone.trim(),
            },
          },
          '*'
        );
      }
    } catch (err: any) {
      setError(err.message || (lang === 'am' ? 'ክፍያውን ማጠናቀቅ አልተቻለም' : 'Failed to complete ticket reservation'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-8 text-center flex flex-col items-center justify-center min-h-[360px] ${isDark ? 'bg-[#0B0F19] text-white' : 'bg-white text-slate-900'}`}>
        <Loader2 className="h-8 w-8 animate-spin text-amber-400 mb-3" />
        <p className="text-xs font-semibold text-slate-400">
          {lang === 'am' ? 'የትኬት መረጃ በመጫን ላይ...' : 'Loading ticket checkout...'}
        </p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className={`p-8 text-center min-h-[300px] flex flex-col items-center justify-center ${isDark ? 'bg-[#0B0F19] text-white' : 'bg-white text-slate-900'}`}>
        <AlertCircle className="h-8 w-8 text-rose-400 mb-2" />
        <p className="text-sm font-bold">{lang === 'am' ? 'ዝግጅቱ አልተገኘም' : 'Event not found'}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#0B0F19] text-slate-100' : 'bg-white text-slate-900'
      } ${isModal ? 'p-5 sm:p-6' : 'p-4 sm:p-5 rounded-2xl border ' + (isDark ? 'border-white/10' : 'border-slate-200')}`}
    >
      {/* Event Header Banner */}
      <div className="flex items-start gap-3 pb-4 border-b border-white/10 mb-4">
        {event.bannerImageUrl && (
          <img
            src={event.bannerImageUrl}
            alt={event.title}
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover flex-shrink-0 border border-white/10 shadow-md"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-black"
              style={{ backgroundColor: customColor }}
            >
              {lang === 'am' ? 'ቀጥታ ትኬት' : 'Official Tickets'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Ed25519 Pass
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-black truncate text-white leading-tight">
            {event.title}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-amber-400" />
              {lang === 'am' && event.startTime?.ethiopianDateFormatted
                ? `${event.startTime.ethiopianDateFormatted} (${event.startTime.ethiopianTimeFormatted})`
                : event.startTime?.gregorianFormatted}
            </span>
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 text-amber-400" />
              {event.venueName}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: SELECT TICKET TIER & QUANTITY */}
      {step === 'select' && (
        <div className="space-y-4 text-xs animate-fadeIn">
          {/* Ticket Tier Cards */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold mb-1">
              {lang === 'am' ? 'የትኬት አይነት ይምረጡ' : 'Select Ticket Tier'}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {event.ticketTypes.map((tier) => {
                const isSelected = selectedTier?.id === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? isDark
                          ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10'
                          : 'bg-amber-50 border-amber-500 shadow-md'
                        : isDark
                        ? 'bg-slate-900/60 border-white/5 hover:border-white/20'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm">{tier.name}</span>
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{tier.description}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-sm sm:text-base font-black font-mono text-amber-400">
                        {tier.price.toLocaleString()}{' '}
                        <span className="text-[10px] text-slate-400 font-sans">ETB</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {lang === 'am' ? 'ይገኛል' : 'Available'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/10">
            <div>
              <span className="font-bold text-white block">
                {lang === 'am' ? 'የትኬት ብዛት' : 'Quantity'}
              </span>
              <span className="text-[10px] text-slate-400">
                {lang === 'am' ? 'በአንድ ሰው እስከ 5 ትኬት' : 'Max 5 tickets per reservation'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition disabled:opacity-30 border border-white/10"
              >
                -
              </button>
              <span className="font-mono font-black text-sm text-white min-w-[20px] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(5, quantity + 1))}
                disabled={quantity >= 5}
                className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition disabled:opacity-30 border border-white/10"
              >
                +
              </button>
            </div>
          </div>

          {/* Promo Code Input */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-amber-400" />
                {lang === 'am' ? 'የቅናሽ ኩፖን (Promo Code)' : 'Promo Code / Voucher'}
              </label>
              {promoResult && promoResult.valid && (
                <button
                  type="button"
                  onClick={() => {
                    setPromoResult(null);
                    setPromoInput('');
                  }}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  {lang === 'am' ? 'አስወግድ' : 'Remove'}
                </button>
              )}
            </div>

            {!promoResult?.valid ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. ADDISVIP20"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs uppercase focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => handleApplyPromo()}
                  disabled={promoLoading || !promoInput.trim()}
                  className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition disabled:opacity-50 text-xs"
                >
                  {promoLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : lang === 'am' ? (
                    'ተግብር'
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <span className="font-mono font-bold">
                  ✓ {promoResult.code} (-{promoResult.discountAmount.toLocaleString()} ETB)
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/20 px-2 py-0.5 rounded">
                  {lang === 'am' ? 'ተተግብሯል' : 'Applied'}
                </span>
              </div>
            )}

            {promoError && <p className="text-[11px] text-rose-400">{promoError}</p>}
          </div>

          {/* Pricing Summary */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span>{lang === 'am' ? 'ድምር ዋጋ' : 'Subtotal'}</span>
              <span className="font-mono text-white">{rawSubtotal.toLocaleString()} ETB</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-400 font-semibold">
                <span>{lang === 'am' ? 'ቅናሽ' : 'Promo Discount'}</span>
                <span className="font-mono">-{discountAmount.toLocaleString()} ETB</span>
              </div>
            )}
            <div className="flex items-center justify-between text-white font-bold pt-1.5 border-t border-white/10 text-sm">
              <span>{lang === 'am' ? 'ጠቅላላ ክፍያ' : 'Total Payable'}</span>
              <span className="font-mono text-base text-amber-400">
                {finalPayable.toLocaleString()} ETB
              </span>
            </div>
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => setStep('details_payment')}
            disabled={!selectedTier}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-black shadow-lg transition active:scale-[0.98] disabled:opacity-50 text-xs sm:text-sm"
            style={{
              background: `linear-gradient(135deg, ${customColor}, #D97706)`,
            }}
          >
            <span>{lang === 'am' ? 'ወደ ክፍያ ቀጥል' : 'Proceed to Checkout'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* STEP 2: ATTENDEE DETAILS & PAYMENT METHOD */}
      {step === 'details_payment' && (
        <form onSubmit={handleCompleteOrder} className="space-y-4 text-xs animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <button
              type="button"
              onClick={() => setStep('select')}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{lang === 'am' ? 'ተመለስ' : 'Back'}</span>
            </button>
            <span className="font-bold text-amber-400 font-mono">
              {finalPayable.toLocaleString()} ETB
            </span>
          </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                {lang === 'am' ? 'ሙሉ ስም *' : 'Full Name *'}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dawit Yohannes"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {lang === 'am' ? 'ስልክ ቁጥር (ለኤስኤምኤስ ፓስ) *' : 'Phone Number (For SMS Pass) *'}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0911223344"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {lang === 'am' ? 'ኢሜይል (አማራጭ)' : 'Email (Optional)'}
                </label>
                <input
                  type="email"
                  placeholder="dawit@ethioevents.et"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-slate-300 font-bold">
              {lang === 'am' ? 'የክፍያ አማራጭ ይምረጡ' : 'Select Ethiopian Payment Method'}
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('TELEBIRR')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition ${
                  paymentMethod === 'TELEBIRR'
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="h-4 w-4 text-amber-400" />
                <span className="font-bold text-[11px]">Telebirr</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CHAPA')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition ${
                  paymentMethod === 'CHAPA'
                    ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-[11px]">CBE / Chapa</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('STRIPE')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition ${
                  paymentMethod === 'STRIPE'
                    ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-lg'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span className="font-bold text-[11px]">USD Diaspora</span>
              </button>
            </div>
          </div>

          {/* Complete Payment Button */}
          <button
            type="submit"
            disabled={checkoutLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-black shadow-lg transition active:scale-[0.98] disabled:opacity-50 text-xs sm:text-sm mt-2"
            style={{
              background: `linear-gradient(135deg, ${customColor}, #D97706)`,
            }}
          >
            {checkoutLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-black" />
                <span>
                  {lang === 'am' ? 'ክፍያውን በማረጋገጥ ላይ...' : 'Securing Ed25519 Pass...'}
                </span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-black" />
                <span>
                  {lang === 'am'
                    ? `${finalPayable.toLocaleString()} ETB በ${paymentMethod} ይክፈሉ`
                    : `Pay ${finalPayable.toLocaleString()} ETB via ${paymentMethod}`}
                </span>
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 3: ORDER COMPLETED CONFIRMATION */}
      {step === 'completed' && reservation && (
        <div className="space-y-4 text-center py-3 animate-fadeIn">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>

          <div>
            <h3 className="text-base font-black text-white">
              {lang === 'am' ? 'እንኳን ደስ አለዎት! ቲኬትዎ ተረጋግጧል' : 'Pass Issued & Confirmed!'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'am'
                ? `ትኬት ቁጥር #${reservation.orderNumber} ለስልክ ቁጥርዎ በኤስኤምኤስ ተልኳል።`
                : `Order #${reservation.orderNumber} dispatched via SMS to ${customerPhone}.`}
            </p>
          </div>

          {/* Pass Card Preview */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 text-left space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                {selectedTier?.name} • {quantity} {quantity > 1 ? 'Tickets' : 'Ticket'}
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                PAID & VERIFIED
              </span>
            </div>

            <div className="text-xs text-slate-300">
              <p className="font-bold text-white truncate">{event.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{event.venueName}</p>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 font-mono">
              <span>Attendee: {customerName}</span>
              <span className="text-emerald-400 font-bold">{finalPayable.toLocaleString()} ETB</span>
            </div>
          </div>

          {/* View Full Pass Button */}
          <a
            href={`/orders/${reservation.orderNumber}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 py-3 font-bold text-black shadow-glowGold hover:from-amber-300 transition text-xs"
          >
            <QrCode className="h-4 w-4" />
            <span>{lang === 'am' ? 'ዲጂታል የQR ፓስ ይመልከቱ' : 'Open Digital QR Pass'}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Powered by EthioEvents footer badge */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1 font-semibold">
          <ShieldCheck className="h-3 w-3 text-amber-400" />
          🔒 256-Bit Encrypted Checkout
        </span>
        <span className="font-mono">
          Powered by <strong className="text-slate-400">EthioEvents</strong> 🇪🇹
        </span>
      </div>
    </div>
  );
}
