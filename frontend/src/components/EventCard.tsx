'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Calendar, ArrowUpRight, Sparkles, Tag } from 'lucide-react';
import { EventSummary } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { useCurrency } from '@/lib/currency';

interface EventCardProps {
  event: EventSummary;
}

export default function EventCard({ event }: EventCardProps) {
  const { t, language } = useI18n();
  const { currency, formatPrice } = useCurrency();

  const categoryLabel = language === 'am' && event.categoryAmharic
    ? `${event.categoryEmoji || '🎟️'} ${event.categoryAmharic}`
    : `${event.categoryEmoji || '🎟️'} ${event.category || 'Event'}`;

  const neighborhoodLabel = language === 'am' && event.neighborhoodAmharic
    ? event.neighborhoodAmharic
    : event.neighborhood || 'Addis Ababa';

  return (
    <Link
      href={`/events/${event.slug}`}
      className={`group flex flex-col rounded-3xl bg-slate-900/70 border ${
        event.featured ? 'border-amber-400/40 shadow-glowGold/10' : 'border-white/10'
      } hover:border-amber-400/70 shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glowGold/20 relative`}
    >
      {/* Featured Spotlight Badge */}
      {event.featured && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-glowGold">
          <Sparkles className="h-3 w-3 text-black" />
          <span>{language === 'am' ? 'ተወዳጅ መድረክ' : 'Featured Spotlight'}</span>
        </div>
      )}

      {/* Banner Image with Overlay */}
      <div className="relative h-56 w-full overflow-hidden bg-slate-800">
        <img
          src={event.bannerImageUrl}
          alt={event.title}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Dual Ethiopian Date Badge */}
        <div className={`absolute ${event.featured ? 'top-10' : 'top-3'} left-3 flex flex-col items-start bg-black/75 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-2xl`}>
          <span className="text-xs font-bold text-amber-300">
            {event.startTime.ethiopianDateFormatted}
          </span>
          <span className="text-[11px] font-semibold text-slate-300">
            {event.startTime.ethiopianTimeFormatted}
          </span>
        </div>

        {/* Sold Out / Status Pill */}
        {event.isSoldOut ? (
          <div className="absolute top-3 right-3 bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
            {language === 'am' ? 'ያለቀ' : 'Sold Out'}
          </div>
        ) : (
          <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-md text-white font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {language === 'am' ? 'በሽያጭ ላይ' : 'Selling Fast'}
          </div>
        )}

        {/* Category & Neighborhood Overlay Badges */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 bg-slate-950/80 backdrop-blur-md border border-white/15 text-amber-300 font-bold px-2.5 py-1 rounded-xl">
            {categoryLabel}
          </span>

          <span className="inline-flex items-center gap-1 bg-slate-950/80 backdrop-blur-md border border-white/15 text-slate-200 font-semibold px-2.5 py-1 rounded-xl">
            <MapPin className="h-3 w-3 text-amber-400" />
            <span>{neighborhoodLabel}</span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{event.startTime.gregorianFormatted}</span>
          </div>

          <h3 className="text-lg font-bold text-white leading-snug group-hover:text-amber-300 transition line-clamp-2">
            {event.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.venueName} • {event.venueAddress}</span>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {event.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer info: Price & CTA */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block -mb-0.5">
              {t.fromPrice}
            </span>
            <span className="text-base font-extrabold text-amber-400">
              {event.minPrice > 0 ? (
                formatPrice(event.minPrice)
              ) : (
                <span className="text-emerald-400">Free Admission</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-400 group-hover:from-amber-300 group-hover:to-yellow-300 px-3.5 py-2 rounded-xl transition shadow-glowGold/30">
            <span>{t.getTickets}</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
