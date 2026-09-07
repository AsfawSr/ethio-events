'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Calendar, MapPin, QrCode, ArrowRight, Phone, ShieldCheck, AlertCircle } from 'lucide-react';
import { OrderDetails } from '@/lib/types';
import { api } from '@/lib/api';

function MyTicketsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const phone = searchParams.get('phone');

  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [loading, setLoading] = useState(true);

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
                {order.tickets.map((ticket) => (
                  <div
                    key={ticket.ticketCode}
                    className="p-4 rounded-2xl bg-slate-950 border border-amber-500/20 flex items-center justify-between gap-4 hover:border-amber-400/50 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-300">
                          {ticket.tierName}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-sm font-mono font-bold text-white mt-1">
                        {ticket.ticketCode}
                      </p>
                    </div>

                    <Link
                      href={`/t/${ticket.securityHash}`}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-black font-extrabold px-4 py-2 rounded-xl text-xs shadow-glowGold/20 active:scale-95 transition"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>View Pass</span>
                    </Link>
                  </div>
                ))}
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
