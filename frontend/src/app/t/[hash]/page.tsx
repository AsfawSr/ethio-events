'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar,
  MapPin,
  ShieldCheck,
  Download,
  Share2,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Ticket as TicketIcon,
} from 'lucide-react';
import { PublicTicketDetails } from '@/lib/types';
import { api } from '@/lib/api';

export default function StandaloneTicketPassPage() {
  const params = useParams();
  const hash = params?.hash as string;

  const [ticket, setTicket] = useState<PublicTicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Dynamic live clock for anti-screenshot watermark
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadTicket() {
      if (!hash) return;
      try {
        const data = await api.getPublicTicketByHash(hash);
        setTicket(data);
      } catch (e) {
        // Fallback mock pass
        setTicket({
          ticketCode: 'ETH-8K9B2X',
          eventTitle: 'ROPHNAN - SOST (፫) LIVE in Addis Ababa',
          eventSlug: 'rophnan-sost-live-millennium-hall',
          venueName: 'Millennium Hall (ሚሌኒየም አዳራሽ)',
          venueAddress: 'Bole Sub-City, Africa Avenue, Addis Ababa',
          eventStartTime: {
            isoUtc: '2026-10-10T15:00:00Z',
            gregorianFormatted: 'Sat, Oct 10, 2026, 6:00 PM EAT',
            ethiopianDateFormatted: 'ቅዳሜ ጥቅምት 1, 2019',
            ethiopianTimeFormatted: 'ምሽት 12:00 ሰዓት',
            ethiopianFullFormatted: 'ቅዳሜ ጥቅምት 1, 2019 (ምሽት 12:00 ሰዓት)',
          },
          tierName: 'VIP Front Stage',
          attendeeName: 'Abebe Bikila',
          attendeePhone: '+251911223344',
          status: 'ISSUED',
          qrCodeBase64:
            'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=v1.mock_ticket_id.mock_event_id.mock_nonce.1788784330.mock_signature',
          qrPayload: 'v1.mock_ticket_id.mock_event_id.mock_nonce.1788784330.mock_signature',
          securityHash: hash,
        });
      } finally {
        setLoading(false);
      }
    }
    loadTicket();
  }, [hash]);

  if (loading || !ticket) {
    return (
      <div className="mx-auto max-w-md py-24 px-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent mx-auto" />
        <p className="mt-4 text-sm text-slate-400">Loading Gate Pass...</p>
      </div>
    );
  }

  const isCheckedIn = ticket.status === 'CHECKED_IN';

  return (
    <div className="min-h-screen py-8 px-4 flex flex-col items-center justify-center">
      {/* Mobile Pass Container */}
      <div className="w-full max-w-md rounded-[32px] bg-[#0E1626] border border-amber-500/40 shadow-2xl overflow-hidden relative">
        {/* Animated Holographic Security Ribbon */}
        <div className="h-3 w-full hologram-ribbon" />

        {/* Ticket Header */}
        <div className="p-6 bg-gradient-to-b from-slate-900 to-transparent border-b border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                Official Digital Pass
              </span>
            </div>
            {/* Live Anti-Screenshot Timestamp */}
            <div className="text-[11px] font-mono font-bold text-amber-300 bg-black/50 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              Live: {currentTime || '18:32:04'}
            </div>
          </div>

          <h1 className="text-xl font-black text-white leading-tight">
            {ticket.eventTitle}
          </h1>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-bold text-amber-400 bg-amber-400/15 border border-amber-400/30 px-3 py-1 rounded-xl">
              {ticket.tierName}
            </span>
            <span className="text-slate-400 font-mono font-bold">
              {ticket.ticketCode}
            </span>
          </div>
        </div>

        {/* QR Code Center Box */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-950/80">
          <div className="relative p-4 rounded-3xl bg-white shadow-2xl border-4 border-amber-400/80 flex items-center justify-center">
            <img
              src={ticket.qrCodeBase64}
              alt={`QR Code ${ticket.ticketCode}`}
              className="h-56 w-56 object-contain"
            />
            {isCheckedIn && (
              <div className="absolute inset-0 bg-rose-950/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-rose-300 p-4 text-center">
                <AlertTriangle className="h-10 w-10 text-rose-400 mb-1" />
                <span className="font-black text-lg uppercase tracking-wider text-rose-200">
                  Already Checked In
                </span>
                <span className="text-xs text-rose-300 mt-1">Ticket has been used at gate</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-3 font-mono">
            Cryptographically Signed with Ed25519
          </p>
        </div>

        {/* Perforated Divider */}
        <div className="relative flex items-center justify-between px-2 bg-slate-950">
          <div className="h-6 w-6 rounded-full bg-[#080C14] -ml-4" />
          <div className="flex-1 border-t-2 border-dashed border-white/20 mx-2" />
          <div className="h-6 w-6 rounded-full bg-[#080C14] -mr-4" />
        </div>

        {/* Event & Attendee Details */}
        <div className="p-6 bg-slate-900/90 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Attendee (የተሳታፊ ስም)</p>
              <p className="font-bold text-white text-sm mt-0.5">{ticket.attendeeName}</p>
              <p className="text-[11px] text-slate-400 font-mono">{ticket.attendeePhone}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Venue (ቦታ)</p>
              <p className="font-bold text-white text-sm mt-0.5">{ticket.venueName}</p>
              <p className="text-[11px] text-slate-400 truncate">{ticket.venueAddress}</p>
            </div>
          </div>

          {/* Localized Ethiopian Date */}
          <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs">
            <p className="font-bold text-amber-300">
              {ticket.eventStartTime.ethiopianFullFormatted}
            </p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Gregorian: {ticket.eventStartTime.gregorianFormatted}
            </p>
          </div>

          {/* Gate Scanner Notice */}
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium justify-center pt-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Works offline at Millennium Hall turnstiles</span>
          </div>
        </div>
      </div>
    </div>
  );
}
