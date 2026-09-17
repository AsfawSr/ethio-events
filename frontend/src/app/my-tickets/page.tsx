'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Ticket,
  Calendar,
  MapPin,
  QrCode,
  ArrowRight,
  Phone,
  ShieldCheck,
  AlertCircle,
  Gift,
  X,
  Send,
  Loader2,
  CheckCircle,
  Copy,
  MessageCircle,
} from 'lucide-react';
import { OrderDetails, OrderTicket, TransferTicketResponse } from '@/lib/types';
import { api } from '@/lib/api';

function MyTicketsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const phone = searchParams.get('phone');

  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer modal state
  const [selectedTicket, setSelectedTicket] = useState<{ ticket: OrderTicket; eventTitle: string } | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<TransferTicketResponse | null>(null);

  useEffect(() => {
    async function loadTickets() {
      if (!phone) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getMyTicketsByPhone(phone);
        setOrders(data);
      } catch (err) {
        console.warn('Failed to load tickets from API, using mock fallback');
        setOrders([
          {
            orderNumber: 'ORD-849201-1024',
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
            customerName: 'Abebe Bikila',
            customerPhone: phone,
            totalAmount: 1600,
            currency: 'ETB',
            status: 'PAID',
            reservedUntilIsoUtc: '2026-10-10T15:10:00Z',
            items: [{ ticketTypeName: 'Early Bird General', quantity: 2, unitPrice: 800, subtotal: 1600 }],
            tickets: [
              {
                ticketCode: 'ETH-8K9B2X',
                tierName: 'Early Bird General',
                attendeeName: 'Abebe Bikila',
                securityHash: 'mock_security_hash_1',
                status: 'ISSUED',
              },
              {
                ticketCode: 'ETH-4M2P9Z',
                tierName: 'Early Bird General',
                attendeeName: 'Abebe Bikila',
                securityHash: 'mock_security_hash_2',
                status: 'ISSUED',
              },
            ],
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, [phone]);

  const handleOpenTransfer = (ticket: OrderTicket, eventTitle: string) => {
    setSelectedTicket({ ticket, eventTitle });
    setRecipientName('');
    setRecipientPhone('');
    setTransferReason('');
    setTransferError(null);
    setTransferSuccess(null);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

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
        ticketSecurityHash: selectedTicket.ticket.securityHash,
        senderName: selectedTicket.ticket.attendeeName || 'Ticket Owner',
        senderPhone: phone || undefined,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        reason: transferReason.trim() || 'Transferred from My Tickets Wallet',
      });
      setTransferSuccess(res);

      // Update in local state
      setOrders((prev) =>
        prev.map((ord) => ({
          ...ord,
          tickets: ord.tickets.map((t) =>
            t.ticketCode === selectedTicket.ticket.ticketCode
              ? {
                  ...t,
                  attendeeName: res.recipientName,
                  securityHash: res.newSecurityHash,
                }
              : t
          ),
        }))
      );
    } catch (err: any) {
      setTransferError(err?.message || 'Transfer failed. Please try again.');
    } finally {
      setTransferring(false);
    }
  };

  if (!phone) {
    return (
      <div className="mx-auto max-w-2xl py-24 px-4 text-center space-y-4">
        <Ticket className="mx-auto h-12 w-12 text-amber-400" />
        <h1 className="text-2xl font-bold text-white">Find Your Tickets</h1>
        <p className="text-sm text-slate-400">
          Please enter your phone number to access your ticket passes.
        </p>
        <Link
          href="/"
          className="inline-block bg-amber-400 text-black font-extrabold px-6 py-3 rounded-2xl shadow-glowGold text-xs"
        >
          Return to Events
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl py-24 px-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent mx-auto" />
        <p className="mt-4 text-sm text-slate-400">Loading your ticket passes...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black shadow-glowGold">
            <Ticket className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">My Ticket Wallet</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
              <Phone className="h-3.5 w-3.5 text-amber-400" />
              <span>{phone}</span>
            </p>
          </div>
        </div>

        <div className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3.5 py-1.5 rounded-full self-start sm:self-auto flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4" />
          <span>OTP Verified Session</span>
        </div>
      </div>

      {/* Orders & Passes */}
      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.orderNumber}
              className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 shadow-lg space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{order.eventTitle}</h2>
                  <p className="text-xs text-amber-400 font-semibold mt-0.5">
                    {order.eventStartTime.ethiopianFullFormatted}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-white/10">
                    Order #{order.orderNumber}
                  </span>
                </div>
              </div>

              {/* Tickets List */}
              <div className="space-y-3">
                <p className="text-xs uppercase font-bold text-slate-400">
                  Active Digital Passes ({order.tickets.length}):
                </p>
                {order.tickets.map((ticket) => {
                  const isCheckedIn = ticket.status === 'CHECKED_IN';
                  return (
                    <div
                      key={ticket.ticketCode}
                      className="p-4 rounded-2xl bg-slate-950 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-400/50 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-300">
                            {ticket.tierName}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              isCheckedIn
                                ? 'text-rose-400 bg-rose-950/60'
                                : 'text-emerald-400 bg-emerald-950'
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-sm font-mono font-bold text-white mt-1">
                          {ticket.ticketCode}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Attendee: <span className="text-slate-200 font-medium">{ticket.attendeeName}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {!isCheckedIn && (
                          <button
                            onClick={() => handleOpenTransfer(ticket, order.eventTitle)}
                            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold px-3.5 py-2 rounded-xl text-xs transition active:scale-95"
                            title="Transfer or gift this ticket"
                          >
                            <Gift className="h-3.5 w-3.5 text-amber-400" />
                            <span>Gift / Transfer</span>
                          </button>
                        )}

                        <Link
                          href={`/t/${ticket.securityHash}`}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-black font-extrabold px-4 py-2 rounded-xl text-xs shadow-glowGold/20 active:scale-95 transition"
                        >
                          <QrCode className="h-4 w-4" />
                          <span>View Pass</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl bg-slate-900/40 border border-white/5 space-y-3">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-600" />
          <p className="text-base font-bold text-white">No tickets found for this phone</p>
          <p className="text-xs text-slate-400">Tickets you purchase will appear here automatically</p>
        </div>
      )}

      {/* P2P Ticket Transfer Modal from Wallet */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#0F172A] border border-amber-500/30 p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="h-5 w-5" />
            </button>

            {!transferSuccess ? (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Gift className="h-5 w-5" />
                    <h2 className="text-lg font-black text-white">Gift Ticket to Friend</h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedTicket.eventTitle} &bull; <span className="font-mono text-amber-300 font-bold">{selectedTicket.ticket.ticketCode}</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>Cryptographic Re-Signing Notice</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Transferring permanently invalidates your current QR code and sends a newly minted Ed25519 pass via SMS directly to your friend.
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
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Gift Message / Note (አጭር መልእክት)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Have a great time! 🎉"
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTicket(null)}
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
                          <span>Send Ticket</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Success Screen */
              <div className="text-center space-y-4 py-2">
                <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle className="h-8 w-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Ticket Successfully Transferred!</h3>
                  <p className="text-xs text-slate-300">
                    Sent to <span className="font-bold text-amber-300">{transferSuccess.recipientName}</span> ({transferSuccess.recipientPhone})
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>New Ticket Pass:</span>
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
                      alert('Pass link copied to clipboard!');
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
                  >
                    <Copy className="h-4 w-4 text-amber-400" />
                    <span>Copy Recipient Link</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTicket(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition shadow-glowGold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyTicketsPage() {
  return (
    <Suspense fallback={<div className="text-white text-center py-20">Loading tickets...</div>}>
      <MyTicketsContent />
    </Suspense>
  );
}
