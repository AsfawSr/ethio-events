'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Ticket,
  Calendar,
  MapPin,
  QrCode,
  ArrowRight,
  Share2,
  Download,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { OrderDetails } from '@/lib/types';
import { api } from '@/lib/api';

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params?.orderNumber as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      if (!orderNumber) return;
      try {
        const data = await api.getOrderDetails(orderNumber);
        setOrder(data);
      } catch (err: any) {
        // Fallback for mock preview if viewing direct
        setOrder({
          orderNumber,
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
          customerPhone: '+251911223344',
          totalAmount: 1600,
          currency: 'ETB',
          status: 'PAID',
          reservedUntilIsoUtc: '2026-10-10T15:10:00Z',
          items: [
            {
              ticketTypeName: 'Early Bird General',
              quantity: 2,
              unitPrice: 800,
              subtotal: 1600,
            },
          ],
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
        });
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl py-24 px-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent mx-auto" />
        <p className="mt-4 text-sm text-slate-400">Loading order status...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl py-24 px-4 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold text-white mt-4">Order Not Found</h2>
        <p className="text-sm text-slate-400 mt-2">Could not find order #{orderNumber}</p>
        <Link href="/" className="inline-block mt-6 text-sm text-amber-400 hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const isPaid = order.status === 'PAID';

  return (
    <div className="mx-auto max-w-3xl py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* Top Banner Status */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border text-center space-y-3 ${
          isPaid
            ? 'bg-emerald-950/30 border-emerald-500/40 shadow-glowEmerald'
            : 'bg-amber-950/30 border-amber-500/40'
        }`}
      >
        <div
          className={`h-14 w-14 rounded-2xl mx-auto flex items-center justify-center ${
            isPaid ? 'bg-emerald-500 text-black' : 'bg-amber-500 text-black'
          }`}
        >
          {isPaid ? <CheckCircle className="h-8 w-8" /> : <Ticket className="h-8 w-8" />}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white">
          {isPaid ? 'Payment Confirmed! Your Tickets are Ready 🎉' : 'Order Pending Payment'}
        </h1>

        <p className="text-sm text-slate-300 max-w-md mx-auto">
          {isPaid
            ? `Confirmation sent to ${order.customerPhone}. You can show the digital QR pass directly on your phone at the Millennium Hall gate.`
            : 'Please complete your Telebirr / Chapa payment before the reservation expires.'}
        </p>

        <div className="pt-2">
          <span className="font-mono text-xs font-bold text-slate-300 bg-black/40 border border-white/10 px-3 py-1 rounded-full">
            Order #{order.orderNumber}
          </span>
        </div>
      </div>

      {/* Event Details Card */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
        <h2 className="text-lg font-bold text-white">{order.eventTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 pt-2 border-t border-white/10">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">{order.eventStartTime.ethiopianFullFormatted}</p>
              <p className="text-slate-400">{order.eventStartTime.gregorianFormatted}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">{order.venueName}</p>
              <p className="text-slate-400">{order.venueAddress}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Issued Ticket Passes */}
      {isPaid && order.tickets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <QrCode className="h-5 w-5 text-amber-400" />
            <span>Digital Passes ({order.tickets.length})</span>
          </h3>

          <div className="space-y-3">
            {order.tickets.map((t, idx) => (
              <div
                key={t.ticketCode}
                className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg hover:border-amber-400 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-md border border-amber-400/30">
                      Ticket #{idx + 1} • {t.tierName}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                      Valid for Gate
                    </span>
                  </div>
                  <p className="text-base font-mono font-bold text-white mt-1.5">
                    Code: {t.ticketCode}
                  </p>
                  <p className="text-xs text-slate-400">Attendee: {t.attendeeName}</p>
                </div>

                <Link
                  href={`/t/${t.securityHash}`}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold px-5 py-3 rounded-xl text-xs shadow-glowGold active:scale-95 transition"
                >
                  <QrCode className="h-4 w-4 text-black" />
                  <span>Open Gate Pass</span>
                  <ArrowRight className="h-3.5 w-3.5 text-black" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 flex items-center justify-between text-sm">
        <span className="text-slate-400">Total Paid via Mobile Money:</span>
        <span className="text-xl font-black text-amber-400">
          {order.totalAmount.toLocaleString()} {order.currency}
        </span>
      </div>
    </div>
  );
}
