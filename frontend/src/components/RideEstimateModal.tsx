'use client';

import React, { useState } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Car,
  Phone,
  Clock,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { EventSummary, EventDetail } from '@/lib/types';

interface RideEstimateModalProps {
  event: EventSummary | EventDetail;
  onClose: () => void;
  userCoords?: { lat: number; lng: number } | null;
}

// Popular starting points across Addis Ababa with realistic coordinates
const ADDIS_NEIGHBORHOOD_ORIGINS = [
  { name: 'Bole Medhane Alem (ቦሌ መድኃኔዓለም)', amharicName: 'ቦሌ መድኃኔዓለም', lat: 8.9958, lng: 38.7885 },
  { name: 'Kazanchis / UNECA (ካዛንቺስ)', amharicName: 'ካዛንቺስ', lat: 9.0165, lng: 38.7675 },
  { name: 'Megenagna / Diaspora Square (መገናኛ)', amharicName: 'መገናኛ', lat: 9.0195, lng: 38.8025 },
  { name: 'Piassa / Arada (ፒያሳ)', amharicName: 'ፒያሳ', lat: 9.0335, lng: 38.7515 },
  { name: 'Meskel Square / Stadium (መስቀል አደባባይ)', amharicName: 'መስቀል አደባባይ', lat: 9.0105, lng: 38.7612 },
  { name: 'Sarbet / Bisrate Gabriel (ሳርቤት)', amharicName: 'ሳርቤት', lat: 8.9925, lng: 38.7365 },
  { name: 'Mexico Square / Kera (ሜክሲኮ)', amharicName: 'ሜክሲኮ', lat: 9.0115, lng: 38.7465 },
  { name: 'CMC / Century Mall (ሲኤምሲ)', amharicName: 'ሲኤምሲ', lat: 9.0265, lng: 38.8415 },
  { name: 'Ayat / Tafo (አያት)', amharicName: 'አያት', lat: 9.0350, lng: 38.8750 },
  { name: 'Gerji / Imperial (ገርጂ)', amharicName: 'ገርጂ', lat: 9.0040, lng: 38.8120 },
  { name: '22 Mazoria / Haya Hulet (22 ማዞሪያ)', amharicName: '22 ማዞሪያ', lat: 9.0170, lng: 38.7880 },
  { name: 'Tor Hailoch / Old Airport (ጦር ኃይሎች)', amharicName: 'ጦር ኃይሎች', lat: 9.0065, lng: 38.7230 },
];

function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function RideEstimateModal({ event, onClose, userCoords }: RideEstimateModalProps) {
  // Target venue coordinates (default to Millennium Hall Bole if null)
  const targetLat = event.latitude || 9.0012;
  const targetLng = event.longitude || 38.7853;

  const [selectedOriginIndex, setSelectedOriginIndex] = useState<number>(userCoords ? -1 : 0);

  // Determine active starting coordinates
  const originLat = selectedOriginIndex === -1 && userCoords ? userCoords.lat : ADDIS_NEIGHBORHOOD_ORIGINS[Math.max(0, selectedOriginIndex)].lat;
  const originLng = selectedOriginIndex === -1 && userCoords ? userCoords.lng : ADDIS_NEIGHBORHOOD_ORIGINS[Math.max(0, selectedOriginIndex)].lng;
  const originName = selectedOriginIndex === -1 && userCoords ? 'Your Current Location (የአሁኑ መገኛዎ)' : ADDIS_NEIGHBORHOOD_ORIGINS[Math.max(0, selectedOriginIndex)].name;

  // Compute straight-line distance & driving approximation (~1.3x road factor in Addis Ababa)
  const directDistanceKm = calculateHaversineDistanceKm(originLat, originLng, targetLat, targetLng);
  const roadDistanceKm = Math.max(1.5, Math.round(directDistanceKm * 1.35 * 10) / 10);

  // Estimate traffic travel time: ~3 mins per km in Addis Ababa traffic + 5 min base
  const estimatedMins = Math.round(roadDistanceKm * 3.2 + 6);

  // Compute realistic ETB fares for Ethiopian ride providers
  const rideEstimates = [
    {
      id: 'ride',
      name: 'RIDE Ethiopia',
      amharicName: 'ራይድ',
      shortCode: '8294',
      dialUrl: 'tel:8294',
      color: 'from-amber-400 to-yellow-500',
      badge: 'Most Popular in Addis',
      icon: '🚕',
      minFare: Math.round(110 + roadDistanceKm * 32),
      maxFare: Math.round(135 + roadDistanceKm * 38),
      waitTime: '3 - 6 mins',
    },
    {
      id: 'feres',
      name: 'Feres Driver',
      amharicName: 'ፈረስ',
      shortCode: '6090',
      dialUrl: 'tel:6090',
      color: 'from-emerald-400 to-teal-500',
      badge: 'Affordable Economy',
      icon: '🚗',
      minFare: Math.round(95 + roadDistanceKm * 28),
      maxFare: Math.round(115 + roadDistanceKm * 34),
      waitTime: '4 - 8 mins',
    },
    {
      id: 'telebirr_ride',
      name: 'Telebirr Ride',
      amharicName: 'ቴሌብር ራይድ',
      shortCode: '127',
      dialUrl: 'tel:127',
      color: 'from-sky-400 to-blue-500',
      badge: 'Instant Telebirr Pay',
      icon: '⚡',
      minFare: Math.round(100 + roadDistanceKm * 30),
      maxFare: Math.round(120 + roadDistanceKm * 35),
      waitTime: '5 - 9 mins',
    },
    {
      id: 'yango',
      name: 'Yango Addis',
      amharicName: 'ያንጎ',
      shortCode: '',
      dialUrl: '',
      color: 'from-rose-400 to-red-500',
      badge: 'Fixed Upfront Price',
      icon: '📱',
      minFare: Math.round(105 + roadDistanceKm * 29),
      maxFare: Math.round(125 + roadDistanceKm * 33),
      waitTime: '4 - 7 mins',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 shadow-2xl p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xl flex-shrink-0">
              🚕
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Addis Ride Fare Estimator
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Live ETB Rates
                </span>
              </h3>
              <p className="text-xs text-slate-400">Compare taxi fares from your sub-city to {event.venueName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Origin Sub-City Selector */}
        <div className="space-y-1.5 text-xs">
          <label className="block text-slate-300 font-bold flex items-center justify-between">
            <span>Choose Your Starting Location (መነሻ አካባቢ)</span>
            <span className="text-[10px] text-amber-400 font-mono">Addis Ababa City</span>
          </label>

          <select
            value={selectedOriginIndex}
            onChange={(e) => setSelectedOriginIndex(parseInt(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400 text-xs"
          >
            {userCoords && <option value="-1">📍 My Current Live GPS Location</option>}
            {ADDIS_NEIGHBORHOOD_ORIGINS.map((nh, idx) => (
              <option key={idx} value={idx}>
                {nh.name}
              </option>
            ))}
          </select>
        </div>

        {/* Route Details Card */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 flex items-center justify-between text-xs">
          <div className="space-y-1 min-w-0 pr-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="truncate">From: <strong>{originName}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs truncate">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="truncate">To: {event.venueName} ({event.venueAddress})</span>
            </div>
          </div>

          <div className="text-right flex-shrink-0 border-l border-white/10 pl-4">
            <div className="font-mono text-base font-black text-white">{roadDistanceKm} <span className="text-[10px] text-slate-400">km</span></div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 justify-end font-semibold">
              <Clock className="h-3 w-3" />
              ~{estimatedMins} mins
            </div>
          </div>
        </div>

        {/* Ride Options Comparison List */}
        <div className="space-y-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Estimated Fares & 1-Click Call Booking
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {rideEstimates.map((ride) => (
              <div
                key={ride.id}
                className="p-3 rounded-2xl bg-slate-800/60 border border-white/10 hover:border-amber-500/40 transition space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span>{ride.icon}</span>
                      <span>{ride.name}</span>
                    </div>
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/20 px-1.5 py-0.5 rounded">
                      {ride.badge}
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between">
                    <div className="text-base font-black font-mono text-emerald-400">
                      {ride.minFare} - {ride.maxFare}{' '}
                      <span className="text-[10px] text-slate-400 font-sans">ETB</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Pickup: {ride.waitTime}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                  {ride.shortCode ? (
                    <a
                      href={`tel:${ride.shortCode}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-black font-bold text-[11px] hover:from-amber-300 transition shadow-sm"
                    >
                      <Phone className="h-3 w-3" />
                      <span>Call {ride.shortCode}</span>
                    </a>
                  ) : (
                    <span className="flex-1 text-center py-2 text-[11px] text-slate-400 font-semibold bg-slate-700/40 rounded-xl">
                      Book via App
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Turn-by-Turn GPS Navigation Links */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
          <span className="text-[11px] text-slate-400">GPS Navigation:</span>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition text-[11px] border border-slate-700"
            >
              <Navigation className="h-3.5 w-3.5 text-sky-400" />
              <span>Google Maps</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>

            <a
              href={`https://maps.apple.com/?daddr=${targetLat},${targetLng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition text-[11px] border border-slate-700"
            >
              <Navigation className="h-3.5 w-3.5 text-emerald-400" />
              <span>Apple Maps</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
