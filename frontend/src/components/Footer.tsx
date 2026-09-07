import React from 'react';
import { ShieldCheck, Zap, Lock, Smartphone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#05080f] py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white">
                Ethio<span className="text-amber-400">Events</span>
              </span>
              <span className="text-xs font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full">
                Addis Ababa
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              The fastest event ticketing platform for concerts, festivals, and summits across Addis Ababa. Seamless 1-tap checkout via Telebirr and Chapa with offline-verified digital QR passes.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-sky-950/80 text-sky-400 border border-sky-800/50 px-2.5 py-1 rounded-lg">
                <Smartphone className="h-3.5 w-3.5" /> Powered by Telebirr
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-2.5 py-1 rounded-lg">
                <ShieldCheck className="h-3.5 w-3.5" /> Chapa Payments
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-purple-950/80 text-purple-400 border border-purple-800/50 px-2.5 py-1 rounded-lg">
                <Lock className="h-3.5 w-3.5" /> Ed25519 Cryptographic Passes
              </span>
            </div>
          </div>

          {/* Venues */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-3">Popular Venues</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-amber-400 transition">Millennium Hall (ሚሌኒየም አዳራሽ)</span></li>
              <li><span className="hover:text-amber-400 transition">Ethiopian Skylight Hotel</span></li>
              <li><span className="hover:text-amber-400 transition">Ghion Hotel Gardens</span></li>
              <li><span className="hover:text-amber-400 transition">Meskel Square Amphitheatre</span></li>
              <li><span className="hover:text-amber-400 transition">Addis Ababa Exhibition Center</span></li>
            </ul>
          </div>

          {/* Gate & Organizers */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-3">Crew & Organizers</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/gate" className="text-amber-400 hover:underline flex items-center gap-1">Gate Scanner PWA (Offline)</a></li>
              <li><span className="hover:text-amber-400 transition">Organizer Dashboard</span></li>
              <li><span className="hover:text-amber-400 transition">Direct CBE & Telebirr Payouts</span></li>
              <li><span className="hover:text-amber-400 transition">Support: +251 911 00 00 01</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 EthioEvents Platform PLC. All rights reserved. Addis Ababa, Ethiopia.</p>
          <p className="flex items-center gap-1">
            <span>Built with Spring Boot 21</span> • <span>Next.js 15</span> • <span>Telebirr &amp; Chapa</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
