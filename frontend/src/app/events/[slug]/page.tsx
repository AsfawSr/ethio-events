'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Ticket,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Share2,
  Sparkles,
  CheckCircle2,
  Clock,
  Building,
} from 'lucide-react';
import { EventDetail, TicketType } from '@/lib/types';
import { api } from '@/lib/api';
import ReservationModal from '@/components/ReservationModal';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<TicketType | null>(null);
  const [showReserveModal, setShowReserveModal] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      if (!slug) return;
      try {
        const data = await api.getEventBySlug(slug);
        setEvent(data);
        if (data.ticketTypes.length > 0) {
          setSelectedTier(data.ticketTypes[0]);
        }
      } catch (err) {
        console.warn('Backend detail fallback');
        // Mock fallback for immediate seamless preview
        const mock: EventDetail = {
          id: 'e1111111-1111-1111-1111-111111111111',
          title: 'ROPHNAN - SOST (፫) LIVE in Addis Ababa',
          slug: 'rophnan-sost-live-millennium-hall',
          description:
            'The ultimate electronic-folk spectacle by ROPHNAN. Featuring an immersive 360 audio-visual stage at Millennium Hall with special guest traditional instrumentalists from across Ethiopia. Experience hits from My Generation, SOST, and exclusive live unreleased anthems.',
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
              description: 'Standing area access with standard stage view',
              price: 800,
              currency: 'ETB',
              availableCapacity: 4820,
              maxPerUser: 5,
              isAvailable: true,
            },
            {
              id: 'b2222222-2222-2222-2222-222222222222',
              name: 'VIP Front Stage',
              description: 'Front circle priority access + fast-track gate entry',
              price: 2500,
              currency: 'ETB',
              availableCapacity: 1420,
              maxPerUser: 4,
              isAvailable: true,
            },
            {
              id: 'b3333333-3333-3333-3333-333333333333',
              name: 'VVIP Lounge & Drinks',
              description: 'Elevated lounge with free welcome drinks & artist backstage meetup',
              price: 6000,
              currency: 'ETB',
              availableCapacity: 185,
              maxPerUser: 2,
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
  }, [slug]);

  if (loading || !event) {
    return (
      <div className="mx-auto max-w-5xl py-20 px-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent mx-auto" />
        <p className="mt-4 text-sm text-slate-400">Loading event details...</p>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Top Banner Hero */}
      <div className="relative h-[340px] sm:h-[420px] w-full bg-slate-950 overflow-hidden">
        <img
          src={event.bannerImageUrl}
          alt={event.title}
          className="h-full w-full object-cover object-center filter brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080C14] via-[#080C14]/60 to-black/30" />

        <div className="absolute top-6 left-4 sm:left-8 z-10">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-2xl border border-white/10 text-xs font-semibold transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All Events</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-24 sm:-mt-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Event Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Title & Badge Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full">
                  Addis Ababa Concert
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full">
                  <Building className="h-3.5 w-3.5 text-amber-400" />
                  <span>{event.organizerName}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                {event.title}
              </h1>

              {/* Dual Localized Dates Box */}
              <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/30 space-y-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-300/80 uppercase font-bold tracking-wider">
                      Ethiopian Ge'ez Calendar &amp; Local Time:
                    </p>
                    <p className="text-base sm:text-lg font-black text-amber-300">
                      {event.startTime.ethiopianFullFormatted}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Standard Gregorian: {event.startTime.gregorianFormatted}
                    </p>
                  </div>
                </div>
              </div>

              {/* Venue Info */}
              <div className="flex items-start gap-3 pt-2">
                <MapPin className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">{event.venueName}</p>
                  <p className="text-xs text-slate-400">{event.venueAddress}</p>
                </div>
              </div>
            </div>

            {/* About Event Description */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-white/10 space-y-4">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">About This Event</h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>

              <div className="border-t border-white/10 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Instant 1-Tap Telebirr Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Digital QR Pass Sent to SMS</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Offline Validated at Venue Gate</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>100% Guaranteed Anti-Counterfeit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Ticket Tiers & Checkout Selection */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-24 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-black text-white">Select Ticket Tier</h3>
                  <p className="text-xs text-slate-400">ፈጣን የቲኬት ምርጫ</p>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                  Zero Login
                </span>
              </div>

              {/* Tiers List */}
              <div className="space-y-3">
                {event.ticketTypes.map((tier) => {
                  const isSelected = selectedTier?.id === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => tier.isAvailable && setSelectedTier(tier)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-400 shadow-glowGold/20'
                          : 'bg-slate-800/60 border-white/10 hover:border-white/20'
                      } ${!tier.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white">{tier.name}</h4>
                            {isSelected && (
                              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{tier.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-amber-400">
                            {tier.price.toLocaleString()}{' '}
                            <span className="text-xs text-slate-400 font-normal">ETB</span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {tier.availableCapacity} seats left
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              <button
                onClick={() => setShowReserveModal(true)}
                disabled={!selectedTier}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold text-base py-4 rounded-2xl shadow-glowGold active:scale-[0.98] transition disabled:opacity-50"
              >
                <Zap className="h-5 w-5" />
                <span>Reserve with Phone Number</span>
              </button>

              <p className="text-[11px] text-center text-slate-400">
                ⚡ 10-minute temporary inventory lock starts immediately upon clicking Reserve.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Checkout Modal */}
      {showReserveModal && selectedTier && (
        <ReservationModal
          eventTitle={event.title}
          selectedTier={selectedTier}
          onClose={() => setShowReserveModal(false)}
        />
      )}
    </div>
  );
}
