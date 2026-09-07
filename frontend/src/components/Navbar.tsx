'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Ticket, QrCode, Sparkles, Phone, Compass, Building2 } from 'lucide-react';
import MyTicketsModal from './MyTicketsModal';
import { authStorage } from '@/lib/auth';
import { OrganizerSession } from '@/lib/types';

export default function Navbar() {
  const [showMyTicketsModal, setShowMyTicketsModal] = useState(false);
  const [organizerSession, setOrganizerSession] = useState<OrganizerSession | null>(null);

  useEffect(() => {
    setOrganizerSession(authStorage.getSession());
    const handleAuth = () => setOrganizerSession(authStorage.getSession());
    window.addEventListener('ethioevents_auth_changed', handleAuth);
    return () => window.removeEventListener('ethioevents_auth_changed', handleAuth);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#080c14]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 shadow-glowGold text-black font-black text-xl tracking-tight transition-transform group-hover:scale-105">
              🇪🇹
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Ethio<span className="text-amber-400">Events</span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  Addis
                </span>
              </span>
              <span className="text-[11px] text-slate-400 -mt-0.5">የአዲስ አበባ መድረኮች</span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="hidden lg:flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition"
            >
              <Compass className="h-4 w-4 text-amber-400" />
              Explore
            </Link>

            {/* Organizer Hub / Dashboard Link */}
            <Link
              href="/organizer"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl transition shadow-sm"
            >
              <Building2 className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">
                {organizerSession?.organizationName ? organizerSession.organizationName : 'Organizer Portal'}
              </span>
              <span className="sm:hidden">Organizer</span>
            </Link>

            {/* Create Event Button */}
            <Link
              href="/events/create"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/50 px-3 py-2 rounded-xl transition shadow-sm active:scale-95"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>+ Event</span>
            </Link>

            {/* My Tickets Button (Zero-login on-demand lookup) */}
            <button
              onClick={() => setShowMyTicketsModal(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-3 py-2 rounded-xl transition shadow-sm active:scale-95"
            >
              <Ticket className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">My Tickets</span>
              <span className="sm:hidden">Tickets</span>
            </button>

            {/* Venue Gate Check Link */}
            <Link
              href="/gate"
              className="flex items-center gap-1.5 text-sm font-semibold text-black bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 px-3.5 py-2 rounded-xl transition shadow-glowGold active:scale-95"
            >
              <QrCode className="h-4 w-4 text-black" />
              <span className="hidden md:inline">Gate Scanner</span>
              <span className="md:hidden">Gate</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Quick My Tickets Modal */}
      {showMyTicketsModal && (
        <MyTicketsModal onClose={() => setShowMyTicketsModal(false)} />
      )}
    </>
  );
}
