import React from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Ticket, ArrowUpRight } from 'lucide-react';
import { EventSummary } from '@/lib/types';

interface EventCardProps {
  event: EventSummary;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col rounded-3xl bg-slate-900/70 border border-white/10 hover:border-amber-400/50 shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glowGold/20"
    >
      {/* Banner Image with Overlay */}
      <div className="relative h-56 w-full overflow-hidden bg-slate-800">
        <img
          src={event.bannerImageUrl}
          alt={event.title}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Dual Ethiopian Date Badge */}
        <div className="absolute top-3 left-3 flex flex-col items-start bg-black/75 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-2xl">
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
            Sold Out
          </div>
        ) : (
          <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-md text-white font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Selling Fast
          </div>
        )}
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
        </div>

        {/* Footer info: Price & CTA */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block -mb-0.5">Tickets from</span>
            <span className="text-base font-extrabold text-amber-400">
              {event.minPrice > 0 ? (
                <>
                  {event.minPrice.toLocaleString()} <span className="text-xs text-slate-400 font-normal">ETB</span>
                </>
              ) : (
                <span className="text-emerald-400">Free Admission</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-400 group-hover:from-amber-300 group-hover:to-yellow-300 px-3.5 py-2 rounded-xl transition shadow-glowGold/30">
            <span>Get Tickets</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
