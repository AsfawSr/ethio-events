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
  Printer,
  Loader2,
  Check,
  ExternalLink,
  Gift,
  Heart,
  Globe,
  Smartphone,
  Mail,
} from 'lucide-react';
import { OrderDetails } from '@/lib/types';
import { api } from '@/lib/api';

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params?.orderNumber as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

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

  const handleDownloadSinglePdf = async (securityHash: string, ticketCode: string) => {
    setDownloadingCode(ticketCode);
    try {
      await api.downloadTicketPdf(securityHash, ticketCode);
    } catch {
      window.open(api.getTicketPdfUrl(securityHash), '_blank');
    } finally {
      setDownloadingCode(null);
    }
  };

  const handleDownloadAllPdfs = async () => {
    if (!order || !order.tickets.length) return;
    setDownloadingAll(true);
    try {
      for (const t of order.tickets) {
        if (t.securityHash) {
          await api.downloadTicketPdf(t.securityHash, t.ticketCode);
        }
      }
    } catch {
      // ignore
    } finally {
      setDownloadingAll(false);
    }
  };

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
  const isGift = order.isGift;
  const isForeignCurrency = order.currency && order.currency !== 'ETB';

  return (
    <div className="mx-auto max-w-3xl py-12 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* Top Banner Status */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border text-center space-y-3 ${
          isPaid
            ? isGift
              ? 'bg-gradient-to-b from-purple-950/40 via-indigo-950/30 to-slate-900 border-purple-500/40 shadow-2xl'
              : 'bg-emerald-950/30 border-emerald-500/40 shadow-glowEmerald'
            : 'bg-amber-950/30 border-amber-500/40'
        }`}
      >
        <div
          className={`h-14 w-14 rounded-2xl mx-auto flex items-center justify-center ${
            isPaid
              ? isGift
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-emerald-500 text-black'
              : 'bg-amber-500 text-black'
          }`}
        >
          {isPaid ? (
            isGift ? (
              <Gift className="h-8 w-8" />
            ) : (
              <CheckCircle className="h-8 w-8" />
            )
          ) : (
            <Ticket className="h-8 w-8" />
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white">
          {isPaid
            ? isGift
              ? 'Diaspora Gift Pass Sent to Addis Ababa! 🎁'
              : 'Payment Confirmed! Your Tickets are Ready 🎉'
            : 'Order Pending Payment'}
        </h1>

        <p className="text-sm text-slate-300 max-w-md mx-auto">
          {isPaid ? (
            isGift ? (
              <span>
                Gift pass &amp; personal message delivered via AfroMessage SMS to{' '}
                <strong className="text-amber-300">{order.giftRecipientPhone || order.customerPhone}</strong>.
              </span>
            ) : (
              `Confirmation sent to ${order.customerPhone}. You can show the digital QR pass directly on your phone at the gate.`
            )
          ) : (
            'Please complete your payment before the reservation expires.'
          )}
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-300 bg-black/40 border border-white/10 px-3 py-1 rounded-full">
            Order #{order.orderNumber}
          </span>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            Status: {order.status}
          </span>
          {isGift && (
            <span className="text-xs font-bold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-3 py-1 rounded-full flex items-center gap-1">
              <Gift className="h-3 w-3" />
              Diaspora Gift
            </span>
          )}
          {isForeignCurrency && (
            <span className="text-xs font-bold text-blue-300 bg-blue-500/20 border border-blue-500/40 px-3 py-1 rounded-full flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {order.currency}
            </span>
          )}
        </div>
      </div>

      {/* Diaspora Gift Greeting Card Banner */}
      {isGift && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900/30 via-slate-900 to-indigo-950/40 border border-purple-500/40 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
              <Heart className="h-4 w-4 text-pink-400" />
              <span>Personalized Diaspora Gift Greeting</span>
            </div>
            <span className="text-[11px] font-mono text-purple-300/80 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              AfroMessage SMS Dispatched
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5">
                <p className="text-slate-400 font-medium">To Recipient in Ethiopia:</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {order.giftRecipientName || order.customerName}
                </p>
                <p className="text-xs font-mono text-amber-400">{order.giftRecipientPhone || order.customerPhone}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5">
                <p className="text-slate-400 font-medium">From (Purchaser):</p>
                <p className="text-sm font-bold text-white mt-0.5">{order.customerName}</p>
                {order.purchaserEmail && <p className="text-xs text-slate-400">{order.purchaserEmail}</p>}
                {order.purchaserCountry && (
                  <p className="text-[11px] text-purple-300">Country: {order.purchaserCountry}</p>
                )}
              </div>
            </div>

            {order.giftMessage && (
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs">
                <p className="text-slate-400 text-[11px] font-semibold mb-1">Gift Note / መልዕክት:</p>
                <p className="text-sm italic text-purple-200 font-serif">"{order.giftMessage}"</p>
              </div>
            )}
          </div>
        </div>
      )}

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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <QrCode className="h-5 w-5 text-amber-400" />
              <span>Digital Passes ({order.tickets.length})</span>
            </h3>

            {order.tickets.length > 1 && (
              <button
                onClick={handleDownloadAllPdfs}
                disabled={downloadingAll}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-amber-400 transition"
              >
                {downloadingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                <span>Download All PDFs</span>
              </button>
            )}
          </div>

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
                  <p className="text-xs text-slate-400">
                    Attendee: <strong className="text-white">{t.attendeeName}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadSinglePdf(t.securityHash, t.ticketCode)}
                    disabled={downloadingCode === t.ticketCode}
                    className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold px-3 py-2.5 rounded-xl text-xs active:scale-95 transition"
                    title="Download PDF"
                  >
                    {downloadingCode === t.ticketCode ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                    ) : (
                      <Download className="h-4 w-4 text-amber-400" />
                    )}
                    <span className="hidden sm:inline">PDF</span>
                  </button>

                  <Link
                    href={`/t/${t.securityHash}`}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-glowGold active:scale-95 transition"
                  >
                    <QrCode className="h-4 w-4 text-black" />
                    <span>Open Live Pass</span>
                    <ArrowRight className="h-3.5 w-3.5 text-black" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Footer with Dual Currency breakdown */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
        <div>
          <p className="text-slate-400 text-xs font-medium">Payment Gateway &amp; Settlement:</p>
          <p className="text-white font-semibold text-xs mt-0.5">
            {order.paymentGateway === 'STRIPE_DIASPORA'
              ? 'International Card / Stripe Diaspora'
              : order.paymentGateway === 'CHAPA'
              ? 'Chapa Financial Gateway'
              : 'Telebirr 1-Tap Mobile Money'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs">Total Amount Paid:</p>
          <p className="text-xl font-black text-amber-400">
            {isForeignCurrency && order.foreignAmount ? (
              <>
                {order.foreignAmount.toFixed(2)} {order.currency}{' '}
                <span className="text-xs font-normal text-slate-400">
                  ({order.totalAmount.toLocaleString()} ETB)
                </span>
              </>
            ) : (
              `${order.totalAmount.toLocaleString()} ETB`
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

