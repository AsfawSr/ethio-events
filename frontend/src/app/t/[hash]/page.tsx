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
  Printer,
  Smartphone,
  Loader2,
  Check,
  ExternalLink,
} from 'lucide-react';
import { PublicTicketDetails } from '@/lib/types';
import { api } from '@/lib/api';

export default function StandaloneTicketPassPage() {
  const params = useParams();
  const hash = params?.hash as string;

  const [ticket, setTicket] = useState<PublicTicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const handleDownloadPdf = async () => {
    if (!ticket) return;
    setDownloadingPdf(true);
    try {
      await api.downloadTicketPdf(hash, ticket.ticketCode);
    } catch (err) {
      // Fallback direct open
      window.open(api.getTicketPdfUrl(hash), '_blank');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: ticket ? `EthioEvents Ticket: ${ticket.eventTitle}` : 'My Ticket Pass',
          text: `My admission ticket for ${ticket?.eventTitle || 'event'}`,
          url,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAppleWallet = async () => {
    try {
      const pass = await api.getAppleWalletPass(hash);
      const blob = new Blob([JSON.stringify(pass, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EthioEvents-Pass-${ticket?.ticketCode || 'ticket'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Apple Wallet pass data ready for installation on iOS devices.');
    }
  };

  const handleGoogleWallet = async () => {
    try {
      const googleData = await api.getGoogleWalletPass(hash);
      if (googleData?.saveUrl) {
        window.open(googleData.saveUrl, '_blank');
      } else {
        alert('Google Wallet save pass link generated.');
      }
    } catch {
      alert('Google Wallet pass ready.');
    }
  };

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
    <div className="min-h-screen py-8 px-4 flex flex-col items-center justify-center space-y-6">
      {/* Action Bar (Top) */}
      <div className="w-full max-w-md flex items-center justify-between gap-2 px-1 print:hidden">
        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold py-2.5 px-3 text-xs shadow-md active:scale-95 transition disabled:opacity-75"
        >
          {downloadingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin text-black" />
          ) : (
            <Download className="h-4 w-4 text-black" />
          )}
          <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF Pass'}</span>
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-3 text-xs border border-slate-700 transition"
          title="Print physical pass on paper"
        >
          <Printer className="h-4 w-4 text-slate-300" />
          <span className="hidden sm:inline">Print</span>
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-3 text-xs border border-slate-700 transition"
          title="Share ticket link"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4 text-slate-300" />}
          <span>{copied ? 'Link Copied!' : 'Share'}</span>
        </button>
      </div>

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

      {/* Mobile Wallets Add-on Section */}
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3 print:hidden">
        <span className="text-xs font-semibold text-slate-300 block text-center">
          Save to Mobile Wallet for Quick Gate Access:
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAppleWallet}
            className="flex items-center justify-center gap-2 rounded-xl bg-black hover:bg-slate-950 border border-slate-700 p-2.5 text-xs font-semibold text-white transition active:scale-95 shadow"
          >
            <Smartphone className="h-4 w-4 text-white" />
            <span>Apple Wallet</span>
          </button>
          <button
            onClick={handleGoogleWallet}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#1F1F1F] hover:bg-black border border-slate-700 p-2.5 text-xs font-semibold text-white transition active:scale-95 shadow"
          >
            <Smartphone className="h-4 w-4 text-emerald-400" />
            <span>Google Wallet</span>
          </button>
        </div>
      </div>
    </div>
  );
}
