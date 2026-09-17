'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Compass,
  Sparkles,
  Search,
  SlidersHorizontal,
  Car,
  Navigation,
  Flame,
  ArrowRight,
  ShieldCheck,
  Zap,
  Ticket,
} from 'lucide-react';
import { EventSummary } from '@/lib/types';
import { api } from '@/lib/api';
import AddisEventsMap from '@/components/AddisEventsMap';
import EventCard from '@/components/EventCard';
import { useI18n } from '@/lib/i18n';

export default function AddisMapPage() {
  const { language } = useI18n();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getEvents().catch(() => []);
        setEvents(data);
      } catch (err) {
        console.warn('Failed to load events for map:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredEvents = events.filter((e) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        e.title.toLowerCase().includes(q) ||
        e.venueName.toLowerCase().includes(q) ||
        e.venueAddress.toLowerCase().includes(q) ||
        (e.neighborhood && e.neighborhood.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (selectedCategory !== 'ALL' && e.category && e.category.toUpperCase() !== selectedCategory.toUpperCase()) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-300">
            <Compass className="h-3.5 w-3.5 text-amber-400" />
            <span>
              {language === 'am'
                ? 'የአዲስ አበባ በይነተገናኝ የመድረኮች ካርታ'
                : 'Addis Ababa Interactive Geo-Explorer'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            {language === 'am' ? 'የመድረኮች መገኛ ካርታ' : 'Explore Events on the Addis Map'} 🗺️
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed font-ethiopic">
            {language === 'am'
              ? 'በቦሌ፣ ካዛንቺስ፣ ፒያሳ፣ መስቀል አደባባይ እና ሳርቤት ያሉ መድረኮችን በካርታ ይመልከቱ፤ የራይድና ፈረስ ታክሲ ታሪፍ አስልተው በቀጥታ ይዘዙ።'
              : 'Discover concerts, tech summits, and cultural festivals across Addis Ababa sub-cities with live venue pins and real-time taxi fare estimates (RIDE 8294, Feres 6090, Telebirr).'}
          </p>
        </div>

        {/* Quick Highlights / Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-center min-w-[110px]">
            <span className="text-xl font-black text-amber-400 block font-mono">{events.length}</span>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">
              {language === 'am' ? 'መድረኮች' : 'Live Venues'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-center min-w-[110px]">
            <span className="text-xl font-black text-sky-400 block font-mono">8+</span>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">
              {language === 'am' ? 'አካባቢዎች' : 'Sub-Cities'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-center min-w-[110px]">
            <span className="text-xl font-black text-emerald-400 block font-mono">4</span>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">
              {language === 'am' ? 'የራይድ አጋሮች' : 'Ride Options'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Component */}
      {loading ? (
        <div className="h-[520px] rounded-3xl bg-slate-900/60 border border-white/5 animate-pulse flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent mx-auto" />
            <p className="text-xs text-slate-400">Loading Addis Ababa venue beacons...</p>
          </div>
        </div>
      ) : (
        <AddisEventsMap events={filteredEvents} />
      )}

      {/* Partner Ride Hailing Showcase Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/20 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl flex-shrink-0">
            🚕
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              Addis Ababa Transportation Partners
              <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Integrated
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Instant taxi fare estimates & 1-tap dialer for RIDE (8294), Feres (6090), and Telebirr Ride.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="tel:8294"
            className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs transition"
          >
            🚕 RIDE 8294
          </a>
          <a
            href="tel:6090"
            className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition"
          >
            🚗 Feres 6090
          </a>
        </div>
      </div>

      {/* Events Grid Section */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 font-ethiopic">
              {language === 'am' ? 'የተገኙ መድረኮች ዝርዝር' : 'All Events Mapped in Addis Ababa'}
            </h2>
            <p className="text-xs text-slate-400">
              Click on any event card to view full ticket tiers and interactive venue seating.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-400 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-xl">
            {filteredEvents.length} Events
          </span>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-3xl bg-slate-900/40 border border-white/5 space-y-3">
            <MapPin className="mx-auto h-10 w-10 text-slate-600" />
            <p className="text-sm font-bold text-white">No events match the current search</p>
          </div>
        )}
      </div>
    </div>
  );
}
