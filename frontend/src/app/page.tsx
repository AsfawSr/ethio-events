'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, MapPin, Search, Ticket, ShieldCheck, Zap, Smartphone } from 'lucide-react';
import { EventSummary } from '@/lib/types';
import { api } from '@/lib/api';
import EventCard from '@/components/EventCard';

export default function HomePage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await api.getEvents();
        setEvents(data);
      } catch (e) {
        console.warn('Backend API connection fallback, using local seed mock');
        // Seed mock fallback for immediate visual preview if backend is spinning up
        setEvents([
          {
            id: 'e1111111-1111-1111-1111-111111111111',
            title: 'ROPHNAN - SOST (፫) LIVE in Addis Ababa',
            slug: 'rophnan-sost-live-millennium-hall',
            description: 'The ultimate electronic-folk spectacle by ROPHNAN at Millennium Hall with 360 audio-visual stage.',
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
            bannerImageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
            status: 'PUBLISHED',
            minPrice: 800,
            maxPrice: 6000,
            currency: 'ETB',
            isSoldOut: false,
          },
          {
            id: 'e2222222-2222-2222-2222-222222222222',
            title: 'Addis Tech Summit & AI Expo 2026',
            slug: 'addis-tech-summit-2026',
            description: 'Ethiopia premier tech and AI summit bringing together 2,000+ engineers, founders, and investors.',
            venueName: 'Ethiopian Skylight Hotel',
            venueAddress: 'Bole Airport Road, Addis Ababa',
            startTime: {
              isoUtc: '2026-11-05T06:00:00Z',
              gregorianFormatted: 'Thu, Nov 5, 2026, 9:00 AM EAT',
              ethiopianDateFormatted: 'ሐሙስ ጥቅምት 26, 2019',
              ethiopianTimeFormatted: 'ጠዋት 3:00 ሰዓት',
              ethiopianFullFormatted: 'ሐሙስ ጥቅምት 26, 2019 (ጠዋት 3:00 ሰዓት)',
            },
            endTime: {
              isoUtc: '2026-11-06T14:00:00Z',
              gregorianFormatted: 'Fri, Nov 6, 2026, 5:00 PM EAT',
              ethiopianDateFormatted: 'አርብ ጥቅምት 27, 2019',
              ethiopianTimeFormatted: 'ከሰዓት 11:00 ሰዓት',
              ethiopianFullFormatted: 'አርብ ጥቅምት 27, 2019 (ከሰዓት 11:00 ሰዓት)',
            },
            bannerImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop',
            status: 'PUBLISHED',
            minPrice: 1500,
            maxPrice: 5000,
            currency: 'ETB',
            isSoldOut: false,
          },
          {
            id: 'e3333333-3333-3333-3333-333333333333',
            title: 'Habesha Stand-Up Comedy Night & Jazz',
            slug: 'habesha-comedy-night-ghion',
            description: 'An evening of premier Ethiopian stand-up comedy and live Ethio-Jazz under the historic trees of Ghion Hotel.',
            venueName: 'Ghion Hotel Gardens',
            venueAddress: 'Ras Desta Damtew St, Addis Ababa',
            startTime: {
              isoUtc: '2026-09-25T15:30:00Z',
              gregorianFormatted: 'Fri, Sep 25, 2026, 6:30 PM EAT',
              ethiopianDateFormatted: 'አርብ መስከረም 15, 2019',
              ethiopianTimeFormatted: 'ምሽት 12:30 ሰዓት',
              ethiopianFullFormatted: 'አርብ መስከረም 15, 2019 (ምሽት 12:30 ሰዓት)',
            },
            endTime: {
              isoUtc: '2026-09-25T20:00:00Z',
              gregorianFormatted: 'Fri, Sep 25, 2026, 11:00 PM EAT',
              ethiopianDateFormatted: 'አርብ መስከረም 15, 2019',
              ethiopianTimeFormatted: 'ምሽት 5:00 ሰዓት',
              ethiopianFullFormatted: 'አርብ መስከረም 15, 2019 (ምሽት 5:00 ሰዓት)',
            },
            bannerImageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
            status: 'PUBLISHED',
            minPrice: 500,
            maxPrice: 500,
            currency: 'ETB',
            isSoldOut: false,
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-16 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        {/* Background Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-amber-500/15 via-emerald-500/10 to-sky-500/15 blur-3xl pointer-events-none rounded-full" />

        <div className="relative mx-auto max-w-5xl text-center space-y-6">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 border border-amber-500/30 px-4 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-md shadow-glowGold/20 animate-fadeIn">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Addis Ababa’s High-Speed Event Engine • ፈጣን የቲኬት መግዣ</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Experience Events in <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
              Addis Ababa.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Frictionless zero-login booking for concerts, conferences, and festivals. Instant checkout with{' '}
            <strong className="text-sky-400 font-bold">Telebirr</strong> and{' '}
            <strong className="text-emerald-400 font-bold">Chapa</strong>, delivered as an offline-verified digital QR pass directly to your phone.
          </p>

          {/* Search & Quick Filter Bar */}
          <div className="mx-auto max-w-xl pt-4">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Millennium Hall, concerts, summits, comedy..."
                className="w-full rounded-2xl bg-slate-900/90 border border-white/15 pl-12 pr-4 py-4 text-white text-sm sm:text-base focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 shadow-2xl transition placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Trust Value Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>10-Minute Atomic Hold</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-sky-400" />
              <span>1-Tap Telebirr Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Offline Cryptographic Gates</span>
            </div>
          </div>
        </div>
      </section>

      {/* Events Listing Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              Upcoming Events in Addis <span className="text-amber-400">📅</span>
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Dates displayed in both Ethiopian Ge'ez (12-hour cycle) &amp; Gregorian Time
            </p>
          </div>

          <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10 self-start sm:self-auto font-medium">
            Showing <strong className="text-white font-bold">{filteredEvents.length}</strong> live events
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-3xl bg-slate-900 border border-white/5" />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-3xl bg-slate-900/40 border border-white/5 space-y-3">
            <Ticket className="mx-auto h-12 w-12 text-slate-600" />
            <p className="text-base font-semibold text-white">No events found</p>
            <p className="text-xs text-slate-400">Try adjusting your search terms</p>
          </div>
        )}
      </section>
    </div>
  );
}
