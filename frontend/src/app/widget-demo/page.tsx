'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import {
  Globe,
  Sparkles,
  Ticket,
  Code,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Terminal,
  CheckCircle2,
} from 'lucide-react';

export default function WidgetDemoPage() {
  const [eventLogs, setEventLogs] = useState<any[]>([]);
  const [selectedDemoEvent, setSelectedDemoEvent] = useState('rophnan-sost-live-millennium-hall');

  useEffect(() => {
    const handleOrderCompleted = (e: any) => {
      const detail = e.detail || {};
      setEventLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          orderNumber: detail.orderNumber,
          eventTitle: detail.eventTitle,
          totalPaidEtb: detail.totalPaidEtb,
          customerName: detail.customerName,
          paymentMethod: detail.paymentMethod,
        },
        ...prev,
      ]);
    };

    window.addEventListener('ethioevents:order_completed', handleOrderCompleted);
    return () => window.removeEventListener('ethioevents:order_completed', handleOrderCompleted);
  }, []);

  return (
    <div className="min-h-screen bg-[#06090F] text-slate-100 font-sans">
      {/* Script injection for the widget SDK */}
      <Script src="/widget.js" strategy="afterInteractive" />

      {/* External Host Brand Navbar */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-black font-black text-lg">
              HF
            </div>
            <div>
              <span className="font-black text-white text-base tracking-tight">HABESHAFEST OFFICIAL</span>
              <span className="block text-[10px] text-amber-400 font-mono uppercase">
                Simulated External Organizer Website (WordPress / React)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/organizer"
              className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-white/10 transition flex items-center gap-1.5"
            >
              <span>Back to Organizer Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner of External Website */}
      <section className="relative overflow-hidden py-16 px-4 bg-gradient-to-b from-purple-950/40 via-slate-900/20 to-[#06090F] border-b border-white/5">
        <div className="mx-auto max-w-5xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
            <Globe className="h-3.5 w-3.5" />
            <span>EthioEvents White-Label Drop-In Widget Demo</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Seamless In-Website Ticket Sales in Ethiopia
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            This demo demonstrates how an external brand (music label, venue, conference) embeds EthioEvents
            directly on their website with <strong>instant Telebirr & CBE checkout</strong> and zero redirects.
          </p>

          {/* Trigger Modal Button Demo */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              className="ethioevents-buy-btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 px-6 py-3 text-sm font-black text-black shadow-glowGold hover:scale-105 transition"
              data-event-slug={selectedDemoEvent}
              data-theme="dark"
              data-lang="en"
            >
              <Ticket className="h-4 w-4 text-black" />
              <span>🎟️ Test Modal Popup Trigger</span>
            </button>
            <span className="text-xs text-slate-400 font-mono">
              (Opens lightbox powered by <code className="text-amber-400">widget.js</code>)
            </span>
          </div>
        </div>
      </section>

      {/* Main Grid: Inline Embed on Left, Live Conversion Listener on Right */}
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Inline Embedded Widget */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Live Inline Embedded Ticket Box</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Auto-resizing IFrame</span>
            </div>

            <p className="text-xs text-slate-400">
              Below is an actual live <code className="text-amber-400">&lt;div id="ethioevents-ticket-widget"&gt;</code> rendering the standalone checkout.
            </p>

            {/* Embedded Container */}
            <div className="rounded-2xl border border-white/15 bg-slate-900/60 p-2 sm:p-4 shadow-2xl">
              <div
                id="ethioevents-ticket-widget"
                data-event-slug={selectedDemoEvent}
                data-theme="dark"
                data-lang="en"
              />
            </div>
          </div>

          {/* Right Column: Host Analytics & PostMessage Event Terminal */}
          <div className="lg:col-span-5 space-y-6">
            {/* Real-time Host Website Event Listener */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Host Conversion Event Stream</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse">
                  LISTENING
                </span>
              </div>

              <p className="text-xs text-slate-400">
                When a customer buys a ticket inside the embedded widget, EthioEvents fires <code className="text-emerald-400 font-mono">ethioevents:order_completed</code> on the parent host site so you can trigger Google Analytics or Meta Pixel conversion events.
              </p>

              {/* Event Logs Box */}
              <div className="rounded-xl bg-slate-950 p-3 font-mono text-[11px] h-52 overflow-y-auto space-y-2 border border-white/5">
                {eventLogs.length === 0 ? (
                  <div className="text-slate-500 text-center py-12">
                    Waiting for test checkout in the widget...
                    <p className="text-[10px] text-slate-600 mt-1">Complete a reservation on the left to see live payload</p>
                  </div>
                ) : (
                  eventLogs.map((log, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>✓ Order #{log.orderNumber}</span>
                        <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                      </div>
                      <div className="text-[10px] text-slate-300">
                        Attendee: <strong>{log.customerName}</strong> • Paid:{' '}
                        <strong className="text-emerald-400">{log.totalPaidEtb} ETB</strong> via {log.paymentMethod}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Embed Snippet Quick Copy */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                2-Line Integration Snippet
              </span>
              <pre className="p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] overflow-x-auto border border-white/5">
{`<!-- 1. Place Container -->
<div id="ethioevents-ticket-widget" 
     data-event-slug="rophnan-sost-live-millennium-hall" 
     data-theme="dark" 
     data-lang="en"></div>

<!-- 2. Load SDK -->
<script src="https://ethioevents.et/widget.js" async></script>`}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
