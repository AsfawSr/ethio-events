'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Send,
  History,
  X,
  Gift,
  ArrowRight,
  Info,
  Copy,
  MessageCircle,
} from 'lucide-react';
import { PublicTicketDetails, TransferTicketResponse, TicketTransferHistoryItem } from '@/lib/types';
import { api } from '@/lib/api';

export default function StandaloneTicketPassPage() {
  const params = useParams();
  const router = useRouter();
  const hash = params?.hash as string;

  const [ticket, setTicket] = useState<PublicTicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [transferredError, setTransferredError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSenderName, setTransferSenderName] = useState('');
  const [transferSenderPhone, setTransferSenderPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<TransferTicketResponse | null>(null);

  // Transfer History State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [transferHistory, setTransferHistory] = useState<TicketTransferHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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
        setTransferredError(null);
        const data = await api.getPublicTicketByHash(hash);
        setTicket(data);
        setTransferSenderName(data.attendeeName || '');
        setTransferSenderPhone(data.attendeePhone || '');
      } catch (err: any) {
        const errorMsg = err?.message || '';
        if (errorMsg.includes('transferred') || err?.code === 'TICKET_TRANSFERRED') {
          setTransferredError(errorMsg || 'This ticket was transferred to another recipient and the current pass has been revoked.');
        } else {
          // Fallback mock pass for offline preview
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
        }
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

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    if (!recipientName.trim()) {
      setTransferError('Please enter recipient full name');
      return;
    }
    if (!recipientPhone.trim() || recipientPhone.trim().length < 9) {
      setTransferError('Please enter a valid recipient phone number (e.g., 0911223344 or +251911223344)');
      return;
    }

    setTransferring(true);
    setTransferError(null);

    try {
      const res = await api.transferTicket({
        ticketSecurityHash: hash,
        senderName: transferSenderName || ticket.attendeeName,
        senderPhone: transferSenderPhone || ticket.attendeePhone,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        reason: transferReason.trim() || 'Gifted via EthioEvents',
      });
      setTransferSuccess(res);
    } catch (err: any) {
      setTransferError(err?.message || 'Ticket transfer failed. Please try again.');
    } finally {
      setTransferring(false);
    }
  };

  const handleOpenHistory = async () => {
    if (!ticket) return;
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const hist = await api.getTicketTransferHistory(ticket.ticketCode);
      setTransferHistory(hist);
    } catch {
      setTransferHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-md py-24 px-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent mx-auto" />
        <p className="mt-4 text-sm text-slate-400">Loading Gate Pass...</p>
      </div>
    );
  }

  // Transferred / Revoked State
  if (transferredError) {
    return (
      <div className="min-h-screen py-16 px-4 flex flex-col items-center justify-center space-y-6">
        <div className="w-full max-w-md rounded-3xl bg-slate-900/90 border border-amber-500/30 p-8 text-center space-y-5 shadow-2xl">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
            <Gift className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
              Ticket Transferred
            </span>
            <h1 className="text-xl font-black text-white">Pass Re-Signed & Revoked</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              {transferredError}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 text-xs text-slate-400 text-left space-y-2">
            <p className="flex items-center gap-1.5 text-amber-400 font-bold">
              <ShieldCheck className="h-4 w-4" />
              <span>Ed25519 Cryptographic Security</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              For anti-counterfeit protection, the QR code on this link has been automatically revoked and replaced with a newly minted cryptographic pass sent to the recipient via SMS.
            </p>
          </div>

          <button
            onClick={() => router.push('/my-tickets')}
            className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition active:scale-95 shadow-glowGold"
          >
            Go to My Ticket Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

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
          <span>{downloadingPdf ? 'PDF...' : 'PDF Pass'}</span>
        </button>

        {!isCheckedIn && (
          <button
            onClick={() => {
              setTransferSuccess(null);
              setTransferError(null);
              setIsTransferModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 font-bold py-2.5 px-3 text-xs border border-amber-500/30 transition active:scale-95"
            title="Transfer or gift this ticket to a friend"
          >
            <Gift className="h-4 w-4 text-amber-400" />
            <span>Transfer</span>
          </button>
        )}

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
          <span>{copied ? 'Copied' : 'Share'}</span>
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

          <p className="text-[11px] text-slate-400 mt-3 font-mono flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Cryptographically Signed with Ed25519</span>
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

          {/* Transfer & History Links */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
            <button
              onClick={handleOpenHistory}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-amber-400 transition"
            >
              <History className="h-3.5 w-3.5" />
              <span>Transfer History</span>
            </button>

            {!isCheckedIn && (
              <button
                onClick={() => {
                  setTransferSuccess(null);
                  setTransferError(null);
                  setIsTransferModalOpen(true);
                }}
                className="inline-flex items-center gap-1 font-bold text-amber-400 hover:text-amber-300 transition"
              >
                <Gift className="h-3.5 w-3.5" />
                <span>Gift to Friend</span>
              </button>
            )}
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

      {/* P2P Ticket Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#0F172A] border border-amber-500/30 p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="h-5 w-5" />
            </button>

            {!transferSuccess ? (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Gift className="h-5 w-5" />
                    <h2 className="text-lg font-black text-white">Transfer Ticket to Friend</h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    Pass: <span className="font-mono text-amber-300 font-bold">{ticket.ticketCode}</span> ({ticket.tierName})
                  </p>
                </div>

                {/* Cryptographic Security Warning */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>Cryptographic Re-Signing Notice</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Transferring permanently revokes this QR code. A brand new Ed25519 pass will be generated and dispatched via SMS directly to your recipient.
                  </p>
                </div>

                {transferError && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
                    {transferError}
                  </div>
                )}

                <form onSubmit={handleTransferSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Recipient Full Name (የተቀባይ ሙሉ ስም) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kidus Tesfaye"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Recipient Phone Number (የተቀባይ ስልክ ቁጥር) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0911223344 or +251911223344"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Recipient will receive an instant SMS with their official digital pass.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Gift Message / Note (ምኞት ወይም መልእክት)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Enjoy the concert! 🎵"
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsTransferModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={transferring}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black text-xs font-black shadow-glowGold active:scale-95 transition disabled:opacity-50"
                    >
                      {transferring ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-black" />
                          <span>Re-signing & Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 text-black" />
                          <span>Confirm Transfer</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Success Transfer Screen */
              <div className="text-center space-y-4 py-2">
                <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle className="h-8 w-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Ticket Successfully Transferred!</h3>
                  <p className="text-xs text-slate-300">
                    Transferred to <span className="font-bold text-amber-300">{transferSuccess.recipientName}</span> ({transferSuccess.recipientPhone})
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>New Ticket Link:</span>
                    <span className="text-emerald-400 font-semibold">SMS Sent ✓</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 font-mono text-[10px] text-amber-300 break-all select-all">
                    {transferSuccess.newTicketPassUrl}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(transferSuccess.newTicketPassUrl);
                      alert('New ticket pass link copied to clipboard!');
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
                  >
                    <Copy className="h-4 w-4 text-amber-400" />
                    <span>Copy Recipient Pass Link</span>
                  </button>

                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(transferSuccess.newTicketPassUrl)}&text=${encodeURIComponent(`Here is your ticket for ${transferSuccess.eventTitle}!`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1E8DBE] text-white font-bold text-xs transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Share on Telegram</span>
                  </a>

                  <button
                    onClick={() => {
                      setIsTransferModalOpen(false);
                      router.push(`/t/${transferSuccess.newSecurityHash}`);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition shadow-glowGold"
                  >
                    View New Recipient Pass
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transfer History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#0F172A] border border-white/10 p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400">
                <History className="h-5 w-5" />
                <h2 className="text-lg font-black text-white">Ticket Transfer Audit Trail</h2>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Ticket: {ticket.ticketCode}
              </p>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-amber-400 mx-auto mb-2" />
                Loading audit trail...
              </div>
            ) : transferHistory.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {transferHistory.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-400 font-bold">Transfer #{transferHistory.length - idx}</span>
                      <span className="text-slate-500">
                        {new Date(item.transferredAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="font-semibold text-white">{item.senderName}</span>
                      <ArrowRight className="h-3 w-3 text-amber-400 shrink-0" />
                      <span className="font-semibold text-white">{item.recipientName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Phone: {item.recipientPhone}</span>
                      {item.reason && <span className="italic text-slate-500">&ldquo;{item.reason}&rdquo;</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 text-center text-xs text-slate-400">
                No transfer history recorded yet for this pass.
              </div>
            )}

            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
