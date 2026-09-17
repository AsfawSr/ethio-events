'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Navigation,
  Car,
  Compass,
  Sparkles,
  Calendar,
  Ticket,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  X,
  Crosshair,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { EventSummary } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import RideEstimateModal from './RideEstimateModal';

interface AddisEventsMapProps {
  events: EventSummary[];
  initialSelectedSlug?: string;
  className?: string;
}

// Addis Ababa Geographic Projection Boundaries
const MAP_BOUNDS = {
  minLat: 8.9400, // South (Bole Bulbula / Kality / Old Airport)
  maxLat: 9.0900, // North (Entoto Hills / Shiromeda)
  minLng: 38.6900, // West (Tor Hailoch / Old Airport / Kolfe)
  maxLng: 38.8800, // East (Ayat / CMC / Gurd Shola)
};

// Key Addis Neighborhood Landmark Anchors for cartographic backdrop
const ADDIS_DISTRICTS = [
  { id: 'bole', name: 'Bole', amharic: 'ቦሌ', lat: 8.9950, lng: 38.7880, radius: 42, color: 'rgba(245, 158, 11, 0.12)' },
  { id: 'kazanchis', name: 'Kazanchis', amharic: 'ካዛንቺስ', lat: 9.0165, lng: 38.7675, radius: 30, color: 'rgba(14, 165, 233, 0.12)' },
  { id: 'meskel', name: 'Meskel Sq.', amharic: 'መስቀል አደባባይ', lat: 9.0105, lng: 38.7612, radius: 32, color: 'rgba(168, 85, 247, 0.12)' },
  { id: 'piassa', name: 'Piassa', amharic: 'ፒያሳ', lat: 9.0335, lng: 38.7515, radius: 34, color: 'rgba(236, 72, 153, 0.12)' },
  { id: 'sarbet', name: 'Sarbet', amharic: 'ሳርቤት', lat: 8.9925, lng: 38.7365, radius: 32, color: 'rgba(34, 197, 94, 0.12)' },
  { id: 'cmc', name: 'CMC / Ayat', amharic: 'ሲኤምሲ', lat: 9.0265, lng: 38.8415, radius: 38, color: 'rgba(234, 179, 8, 0.12)' },
  { id: 'entoto', name: 'Entoto Park', amharic: 'እንጦጦ', lat: 9.0750, lng: 38.7620, radius: 36, color: 'rgba(16, 185, 129, 0.15)' },
  { id: 'mexico', name: 'Mexico Sq.', amharic: 'ሜክሲኮ', lat: 9.0115, lng: 38.7465, radius: 28, color: 'rgba(99, 102, 241, 0.12)' },
];

// Major Addis Arteries & Corridors (Projected coordinates)
const ADDIS_ROADS = [
  // Africa Avenue (Bole Road from Meskel Square to Bole Airport)
  [
    { lat: 9.0105, lng: 38.7612 },
    { lat: 9.0012, lng: 38.7853 },
    { lat: 8.9770, lng: 38.7990 },
  ],
  // Churchill Avenue (Meskel Square -> National Theatre -> Piassa)
  [
    { lat: 9.0105, lng: 38.7612 },
    { lat: 9.0182, lng: 38.7523 },
    { lat: 9.0335, lng: 38.7515 },
    { lat: 9.0750, lng: 38.7620 },
  ],
  // Megenagna -> CMC -> Ayat Corridor
  [
    { lat: 9.0195, lng: 38.8025 },
    { lat: 9.0265, lng: 38.8415 },
    { lat: 9.0350, lng: 38.8750 },
  ],
  // Ring Road South (Sarbet -> Gotera -> Bole Bulbula)
  [
    { lat: 8.9925, lng: 38.7365 },
    { lat: 8.9880, lng: 38.7600 },
    { lat: 8.9850, lng: 38.7900 },
  ],
];

// Helper: Convert Lat/Lng to SVG ViewBox (1000 x 700)
function projectCoordinates(lat: number, lng: number): { x: number; y: number } {
  const normX = (lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng);
  // Latitude increases upwards, SVG Y increases downwards
  const normY = (MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);

  const x = Math.max(20, Math.min(980, normX * 1000));
  const y = Math.max(20, Math.min(680, normY * 700));
  return { x, y };
}

function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

export default function AddisEventsMap({ events, initialSelectedSlug, className = '' }: AddisEventsMapProps) {
  const { language } = useI18n();

  // Selected event state for preview card
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  // Ride Estimate Modal state
  const [rideModalEvent, setRideModalEvent] = useState<EventSummary | null>(null);

  // Neighborhood filter pill
  const [activeDistrict, setActiveDistrict] = useState<string>('all');

  // Zoom and Pan controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // User Live Geolocation
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);

  // Initialize selected event if initialSelectedSlug is provided
  useEffect(() => {
    if (initialSelectedSlug && events.length > 0) {
      const match = events.find((e) => e.slug === initialSelectedSlug);
      if (match) {
        setSelectedEventId(match.id);
      }
    } else if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [initialSelectedSlug, events]);

  // Request user HTML5 geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocatingError('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    setLocatingError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocatingUser(false);
      },
      (err) => {
        console.warn('Geolocation access error:', err);
        // Fallback to Meskel Square if user denies GPS permission
        setUserCoords({ lat: 9.0105, lng: 38.7612 });
        setLocatingError('Using Meskel Square center default.');
        setLocatingUser(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Filter events by selected district
  const filteredEvents = useMemo(() => {
    if (activeDistrict === 'all') return events;
    return events.filter((e) => {
      const text = `${e.neighborhood || ''} ${e.venueAddress || ''} ${e.venueName || ''}`.toLowerCase();
      return text.includes(activeDistrict.toLowerCase());
    });
  }, [events, activeDistrict]);

  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);

  // Focus neighborhood on pill click
  const handleSelectDistrict = (districtId: string) => {
    setActiveDistrict(districtId);
    if (districtId === 'all') {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    } else {
      const district = ADDIS_DISTRICTS.find((d) => d.id === districtId);
      if (district) {
        const { x, y } = projectCoordinates(district.lat, district.lng);
        // Center view on this district
        setZoomLevel(1.4);
        setPanOffset({
          x: (500 - x) * 0.4,
          y: (350 - y) * 0.4,
        });
      }
    }
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setActiveDistrict('all');
  };

  // User projected coordinates
  const projectedUser = userCoords ? projectCoordinates(userCoords.lat, userCoords.lng) : null;

  return (
    <div className={`relative rounded-3xl border border-white/10 bg-slate-950/90 shadow-2xl overflow-hidden ${className}`}>
      {/* Top Map Control & Filter Pill Bar */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-900/90 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 z-20 relative">
        {/* Title and stats */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-black font-black text-lg shadow-glowGold">
            🗺️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">
                {language === 'am' ? 'የአዲስ አበባ የመድረኮች ካርታ' : 'Addis Ababa Interactive Map'}
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                {filteredEvents.length} {language === 'am' ? 'ቦታዎች' : 'Venues'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-ethiopic">
              {language === 'am'
                ? 'የቦሌ፣ ካዛንቺስ፣ ፒያሳ፣ መስቀል አደባባይ እና እንጦጦ መድረኮች ከራይድ ታሪፍ ጋር'
                : 'Live venue beacons & taxi fare estimator across sub-cities'}
            </p>
          </div>
        </div>

        {/* Action Buttons (Locate Me & Zoom Controls) */}
        <div className="flex items-center gap-2">
          {/* Locate Me Button */}
          <button
            onClick={handleLocateMe}
            disabled={locatingUser}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition border active:scale-95 shadow-sm ${
              userCoords
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-glow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Locate Events Near Me (በአቅራቢያዬ ያሉ መድረኮች)"
          >
            <Crosshair className={`h-3.5 w-3.5 ${locatingUser ? 'animate-spin text-amber-400' : 'text-sky-400'}`} />
            <span>
              {locatingUser
                ? 'Locating...'
                : userCoords
                ? (language === 'am' ? 'መገኛዬ ተገኝቷል' : 'Near Me (Active)')
                : (language === 'am' ? 'በአቅራቢያዬ ፈልግ' : 'Locate Me')}
            </span>
          </button>

          {/* Zoom In */}
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.3))}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.3))}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          {/* Reset Center */}
          <button
            onClick={handleResetView}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Reset Map View"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Neighborhood Filter Pills */}
      <div className="px-4 py-2.5 bg-slate-900/70 border-b border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none z-20 relative">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0">
          <MapPin className="h-3 w-3 text-amber-400" />
          <span>{language === 'am' ? 'አካባቢ:' : 'Sector:'}</span>
        </span>

        <button
          onClick={() => handleSelectDistrict('all')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition ${
            activeDistrict === 'all'
              ? 'bg-amber-500 text-black font-bold shadow-glowGold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {language === 'am' ? 'ሁሉም አዲስ አበባ' : 'All Addis Ababa'}
        </button>

        {ADDIS_DISTRICTS.map((d) => (
          <button
            key={d.id}
            onClick={() => handleSelectDistrict(d.id)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
              activeDistrict === d.id
                ? 'bg-amber-500 text-black font-bold shadow-glowGold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>{language === 'am' ? d.amharic : d.name}</span>
          </button>
        ))}
      </div>

      {/* Main Interactive Map Canvas Container */}
      <div className="relative h-[480px] sm:h-[560px] w-full bg-[#06090e] overflow-hidden select-none">
        {/* Dynamic Vector Cartographic Canvas */}
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center center',
          }}
        >
          <svg viewBox="0 0 1000 700" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Futuristic Map Grid Pattern */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.8" />
              </pattern>

              {/* District Radial Glows */}
              <radialGradient id="entotoGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.25)" />
                <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
              </radialGradient>
              <radialGradient id="boleGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(245, 158, 11, 0.25)" />
                <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
              </radialGradient>
              <radialGradient id="beaconGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(245, 158, 11, 0.8)" />
                <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
              </radialGradient>
            </defs>

            {/* Background Grid */}
            <rect width="1000" height="700" fill="url(#grid)" />

            {/* Addis Topography / Mountain Contour representation (Entoto in North) */}
            <path
              d="M 50 140 Q 250 80 500 110 T 950 90 L 950 0 L 50 0 Z"
              fill="rgba(16, 185, 129, 0.05)"
              stroke="rgba(16, 185, 129, 0.15)"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
            <text x="500" y="50" textAnchor="middle" fill="rgba(16, 185, 129, 0.35)" fontSize="11" fontWeight="bold" letterSpacing="4">
              ▲ ENTOTO MOUNTAIN RANGE (እንጦጦ ተራራ) ▲
            </text>

            {/* Major Arteries / Road Networks */}
            {ADDIS_ROADS.map((road, rIdx) => {
              const points = road.map((coord) => projectCoordinates(coord.lat, coord.lng));
              const pathD = points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
              return (
                <g key={rIdx}>
                  <path d={pathD} fill="none" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="5" strokeLinecap="round" />
                  <path d={pathD} fill="none" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3,3" />
                </g>
              );
            })}

            {/* District Circular Highlight Zones */}
            {ADDIS_DISTRICTS.map((d) => {
              const { x, y } = projectCoordinates(d.lat, d.lng);
              const isActive = activeDistrict === d.id;
              return (
                <g key={d.id} className="cursor-pointer" onClick={() => handleSelectDistrict(d.id)}>
                  <circle
                    cx={x}
                    cy={y}
                    r={d.radius * (isActive ? 1.3 : 1)}
                    fill={d.color}
                    stroke={isActive ? 'rgba(245, 158, 11, 0.6)' : 'rgba(255, 255, 255, 0.1)'}
                    strokeWidth={isActive ? 2 : 1}
                  />
                  <text
                    x={x}
                    y={y - d.radius - 4}
                    textAnchor="middle"
                    fill={isActive ? '#f59e0b' : 'rgba(255, 255, 255, 0.45)'}
                    fontSize={isActive ? '12' : '10'}
                    fontWeight="bold"
                    letterSpacing="0.5"
                  >
                    {language === 'am' ? d.amharic : d.name}
                  </text>
                </g>
              );
            })}

            {/* User Location Beacon (If GPS active) */}
            {projectedUser && (
              <g className="animate-pulse">
                <circle cx={projectedUser.x} cy={projectedUser.y} r="24" fill="rgba(56, 189, 248, 0.25)" />
                <circle cx={projectedUser.x} cy={projectedUser.y} r="14" fill="rgba(56, 189, 248, 0.5)" />
                <circle cx={projectedUser.x} cy={projectedUser.y} r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                <text x={projectedUser.x} y={projectedUser.y + 22} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="black">
                  📍 {language === 'am' ? 'የእርስዎ መገኛ' : 'You are here'}
                </text>
              </g>
            )}

            {/* Event Markers (Interactive Beacons) */}
            {filteredEvents.map((event) => {
              const lat = event.latitude || 9.0012;
              const lng = event.longitude || 38.7853;
              const { x, y } = projectCoordinates(lat, lng);
              const isSelected = selectedEventId === event.id;
              const isHovered = hoveredEventId === event.id;

              // Distance from user
              const distanceKm = userCoords ? calculateHaversineDistanceKm(userCoords.lat, userCoords.lng, lat, lng) : null;

              return (
                <g
                  key={event.id}
                  className="cursor-pointer transition-transform duration-200"
                  onClick={() => setSelectedEventId(event.id)}
                  onMouseEnter={() => setHoveredEventId(event.id)}
                  onMouseLeave={() => setHoveredEventId(null)}
                >
                  {/* Glowing Radar Pulse for Selected or Featured Event */}
                  {(isSelected || event.featured) && (
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? '28' : '20'}
                      fill="url(#beaconGlow)"
                      className="animate-ping opacity-60"
                    />
                  )}

                  {/* Marker Outer Ring */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? '18' : '14'}
                    fill={isSelected ? '#f59e0b' : '#0f172a'}
                    stroke={isSelected ? '#ffffff' : '#f59e0b'}
                    strokeWidth={isSelected ? '3' : '2'}
                    className="shadow-2xl filter drop-shadow(0px 4px 10px rgba(245,158,11,0.5))"
                  />

                  {/* Icon Emoji Inside Marker */}
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fontSize={isSelected ? '12' : '10'}
                  >
                    {event.categoryEmoji || '🎟️'}
                  </text>

                  {/* Venue / Event Label Callout */}
                  {(isSelected || isHovered) && (
                    <g className="animate-fadeIn">
                      <rect
                        x={x - 85}
                        y={y - 48}
                        width="170"
                        height="34"
                        rx="10"
                        fill="rgba(15, 23, 42, 0.95)"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                      />
                      <text
                        x={x}
                        y={y - 32}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {event.title.length > 22 ? event.title.substring(0, 20) + '...' : event.title}
                      </text>
                      <text
                        x={x}
                        y={y - 20}
                        textAnchor="middle"
                        fill="#f59e0b"
                        fontSize="8.5"
                        fontWeight="bold"
                      >
                        {event.venueName} {distanceKm !== null ? `• ${distanceKm} km` : ''}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Floating Selected Event Card Drawer (Overlay Bottom-Left) */}
        {selectedEvent && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-slate-900/95 border border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-2xl z-30 animate-in fade-in slide-in-from-bottom-3 space-y-3.5">
            {/* Header / Category */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span>{selectedEvent.categoryEmoji || '🎟️'}</span>
                  <span>{language === 'am' && selectedEvent.categoryAmharic ? selectedEvent.categoryAmharic : selectedEvent.category}</span>
                </span>
                {selectedEvent.featured && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-glowGold">
                    <Flame className="h-3 w-3" />
                    Hot
                  </span>
                )}
              </div>

              {/* User Distance Badge (if GPS active) */}
              {userCoords && (
                <div className="text-[11px] font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  <span>
                    {calculateHaversineDistanceKm(
                      userCoords.lat,
                      userCoords.lng,
                      selectedEvent.latitude || 9.0012,
                      selectedEvent.longitude || 38.7853
                    )}{' '}
                    km
                  </span>
                </div>
              )}
            </div>

            {/* Title & Venue */}
            <div className="space-y-1">
              <h4 className="text-sm sm:text-base font-black text-white line-clamp-1 leading-snug">
                {selectedEvent.title}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold text-amber-300">{selectedEvent.venueName}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 truncate">{selectedEvent.neighborhood || selectedEvent.venueAddress}</span>
              </div>
            </div>

            {/* Ethiopian Date & Price info */}
            <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-950/60 border border-white/5">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-bold text-amber-300">{selectedEvent.startTime.ethiopianDateFormatted}</span>
              </div>
              <div className="font-black text-white">
                {selectedEvent.minPrice > 0 ? (
                  <>
                    <span className="text-amber-400">{selectedEvent.minPrice.toLocaleString()}</span>{' '}
                    <span className="text-[10px] text-slate-400 font-normal">ETB</span>
                  </>
                ) : (
                  <span className="text-emerald-400">Free</span>
                )}
              </div>
            </div>

            {/* Action Buttons: 1. Estimate Ride Taxi Fare, 2. Get Tickets */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setRideModalEvent(selectedEvent)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition active:scale-95 shadow-sm"
              >
                <Car className="h-3.5 w-3.5 text-amber-400" />
                <span>{language === 'am' ? 'ራይድ ታሪፍ' : '🚕 Ride Fare'}</span>
              </button>

              <Link
                href={`/events/${selectedEvent.slug}`}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-black font-extrabold text-xs shadow-glowGold hover:from-amber-300 transition active:scale-95"
              >
                <Ticket className="h-3.5 w-3.5 text-black" />
                <span>{language === 'am' ? 'ቲኬት ይቁረጡ' : 'Get Tickets'}</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Ride Estimate Fare Modal Triggered from Map */}
      {rideModalEvent && (
        <RideEstimateModal
          event={rideModalEvent}
          userCoords={userCoords}
          onClose={() => setRideModalEvent(null)}
        />
      )}
    </div>
  );
}
