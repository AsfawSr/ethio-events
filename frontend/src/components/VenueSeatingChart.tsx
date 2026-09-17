'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  RefreshCw,
  Info,
  Layers,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { EventSeatingPlanData, SeatItem, SeatingSectionItem } from '@/lib/types';
import { api } from '@/lib/api';

interface VenueSeatingChartProps {
  eventId: string;
  onConfirmSeats: (seats: SeatItem[]) => void;
  onCancel?: () => void;
}

export default function VenueSeatingChart({
  eventId,
  onConfirmSeats,
  onCancel,
}: VenueSeatingChartProps) {
  const [seatingPlan, setSeatingPlan] = useState<EventSeatingPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [selectedSeats, setSelectedSeats] = useState<SeatItem[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<SeatItem | null>(null);
  const [holding, setHolding] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(0);

  // Generate or retrieve persistent checkout session ID
  useEffect(() => {
    let sId = sessionStorage.getItem('ethioevents_seating_session_id');
    if (!sId) {
      sId = 'sess-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now();
      sessionStorage.setItem('ethioevents_seating_session_id', sId);
    }
    setSessionId(sId);
  }, []);

  // Fetch seating plan from API
  const fetchPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEventSeatingPlan(eventId);
      setSeatingPlan(data);
    } catch (err: any) {
      // Fallback mock seating plan if API unavailable
      setSeatingPlan({
        eventId,
        eventTitle: 'ROPHNAN - SOST (፫) LIVE in Addis Ababa',
        venueName: 'Millennium Hall (ሚሌኒየም አዳራሽ)',
        totalSeats: 76,
        availableSeats: 64,
        bookedSeats: 8,
        heldSeats: 4,
        sections: [
          {
            id: 'sec-vip',
            sectionName: 'VIP Diamond Tables (መድረክ ፊት ለፊት)',
            sectionType: 'TABLES',
            capacity: 36,
            tierName: 'VIP Front Stage',
            basePrice: 2500,
            seats: Array.from({ length: 36 }, (_, i) => {
              const tableNum = Math.floor(i / 6) + 1;
              const seatNum = (i % 6) + 1;
              const isBooked = i === 2 || i === 3 || i === 14 || i === 15;
              const isHeld = i === 8 || i === 9;
              return {
                id: `seat-vip-${i}`,
                sectionId: 'sec-vip',
                sectionName: 'VIP Diamond Tables',
                tierName: 'VIP Front Stage',
                price: 2500,
                rowIdentifier: `Table ${tableNum}`,
                seatNumber: `Seat ${seatNum}`,
                seatLabel: `VIP Table ${tableNum} - Seat ${seatNum}`,
                gridRow: Math.floor((tableNum - 1) / 3),
                gridCol: (tableNum - 1) % 3,
                status: isBooked ? 'BOOKED' : isHeld ? 'HELD' : 'AVAILABLE',
                isAvailable: !isBooked && !isHeld,
              };
            }),
          },
          {
            id: 'sec-theatre',
            sectionName: 'Main Auditorium Seating (ዋናው አዳራሽ)',
            sectionType: 'THEATRE_ROWS',
            capacity: 40,
            tierName: 'Early Bird General',
            basePrice: 800,
            seats: Array.from({ length: 40 }, (_, i) => {
              const rowLetters = ['Row A', 'Row B', 'Row C', 'Row D'];
              const rIdx = Math.floor(i / 10);
              const sNum = (i % 10) + 1;
              const isBooked = i === 4 || i === 5 || i === 22 || i === 23;
              const isHeld = i === 18 || i === 19;
              return {
                id: `seat-gen-${i}`,
                sectionId: 'sec-theatre',
                sectionName: 'Main Auditorium',
                tierName: 'Early Bird General',
                price: 800,
                rowIdentifier: rowLetters[rIdx],
                seatNumber: `${sNum}`,
                seatLabel: `${rowLetters[rIdx]} - Seat ${sNum}`,
                gridRow: rIdx,
                gridCol: sNum - 1,
                status: isBooked ? 'BOOKED' : isHeld ? 'HELD' : 'AVAILABLE',
                isAvailable: !isBooked && !isHeld,
              };
            }),
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [eventId]);

  // Hold Timer Countdown
  useEffect(() => {
    if (!holdExpiresAt) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((holdExpiresAt.getTime() - Date.now()) / 1000));
      setTimeLeftSec(remaining);
      if (remaining <= 0) {
        setHoldExpiresAt(null);
        setSelectedSeats([]);
        setHoldError('Seat hold expired. Please re-select your seats.');
        fetchPlan();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [holdExpiresAt]);

  const handleSeatClick = (seat: SeatItem) => {
    if (!seat.isAvailable && seat.status !== 'AVAILABLE') return;

    setHoldError(null);
    const isSelected = selectedSeats.some((s) => s.id === seat.id);

    if (isSelected) {
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 8) {
        setHoldError('Maximum 8 seats allowed per checkout');
        return;
      }
      setSelectedSeats((prev) => [...prev, seat]);
    }
  };

  const handleLockAndConfirm = async () => {
    if (selectedSeats.length === 0) return;

    setHolding(true);
    setHoldError(null);

    try {
      const res = await api.holdSeats({
        eventId,
        sessionId,
        seatIds: selectedSeats.map((s) => s.id),
      });

      if (res.heldUntil) {
        setHoldExpiresAt(new Date(res.heldUntil));
      } else {
        setHoldExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
      }

      onConfirmSeats(selectedSeats);
    } catch (err: any) {
      setHoldError(err?.message || 'Could not lock selected seats. Please select other available seats.');
      fetchPlan(); // Refresh layout to show latest booked/held states
    } finally {
      setHolding(false);
    }
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((acc, s) => acc + s.price, 0);
  };

  if (loading) {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900/80 border border-white/10 space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent mx-auto" />
        <p className="text-xs text-slate-400">Rendering venue seating floor plan...</p>
      </div>
    );
  }

  if (error || !seatingPlan) {
    return (
      <div className="p-8 text-center rounded-3xl bg-slate-900/80 border border-white/10 space-y-3">
        <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
        <p className="text-sm font-bold text-white">Could not load seating plan</p>
        <button
          onClick={fetchPlan}
          className="px-4 py-2 bg-amber-400 text-black text-xs font-bold rounded-xl shadow-glowGold"
        >
          Retry
        </button>
      </div>
    );
  }

  const sectionsToShow =
    selectedSectionId === 'all'
      ? seatingPlan.sections
      : seatingPlan.sections.filter((s) => s.id === selectedSectionId);

  return (
    <div className="rounded-3xl bg-[#090D16] border border-amber-500/30 shadow-2xl p-4 sm:p-6 space-y-6 text-white animate-fadeIn">
      {/* Venue Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <h3 className="text-base font-black text-white">Interactive Venue Floor Plan</h3>
            <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded uppercase">
              Live Seating
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {seatingPlan.venueName} &bull; Click any available seat or VIP table to reserve
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setSelectedSectionId('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              selectedSectionId === 'all'
                ? 'bg-amber-400 text-black shadow-glowGold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Sections ({seatingPlan.availableSeats})
          </button>
          {seatingPlan.sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setSelectedSectionId(sec.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                selectedSectionId === sec.id
                  ? 'bg-amber-400 text-black shadow-glowGold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sec.sectionName.split('(')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Seat Status Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs bg-slate-900/60 p-2.5 rounded-2xl border border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-emerald-500 border border-emerald-300 shadow-sm" />
          <span className="text-slate-300 font-medium">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-400 border border-yellow-200 shadow-glowGold animate-pulse" />
          <span className="text-amber-300 font-bold">Selected by You</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-slate-700 border border-slate-600 opacity-60" />
          <span className="text-slate-500">Temporarily Held</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-600 border border-rose-400 opacity-80" />
          <span className="text-slate-500">Booked / Sold</span>
        </div>
      </div>

      {/* Active Hold Countdown Banner */}
      {holdExpiresAt && timeLeftSec > 0 && (
        <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Seats Temporarily Locked for You</span>
          </div>
          <span className="font-mono font-black text-sm bg-black/40 px-2.5 py-0.5 rounded-lg border border-amber-400/30">
            {Math.floor(timeLeftSec / 60)}:{(timeLeftSec % 60).toString().padStart(2, '0')}
          </span>
        </div>
      )}

      {holdError && (
        <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{holdError}</span>
        </div>
      )}

      {/* Interactive Floor Map Canvas Area */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-white/10 space-y-8 relative overflow-hidden">
        {/* Stage / Podium Representation */}
        <div className="relative mx-auto max-w-lg">
          <div className="h-10 rounded-2xl bg-gradient-to-r from-amber-500/30 via-amber-400 to-yellow-500/30 border-2 border-amber-400/80 shadow-glowGold flex items-center justify-center font-black tracking-widest text-xs uppercase text-black">
            🎵 STAGE / ቴአትር መድረክ
          </div>
          <div className="h-2 w-3/4 mx-auto bg-amber-400/20 blur-sm rounded-full mt-1" />
        </div>

        {/* Render Sections */}
        <div className="space-y-10">
          {sectionsToShow.map((section) => (
            <div key={section.id} className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">{section.sectionName}</span>
                </div>
                <span className="text-[11px] font-mono text-amber-400 font-bold">
                  {section.basePrice.toLocaleString()} ETB / seat
                </span>
              </div>

              {/* VIP TABLES LAYOUT */}
              {section.sectionType === 'TABLES' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-2">
                  {/* Group seats by table */}
                  {Array.from(new Set(section.seats.map((s) => s.rowIdentifier))).map((tableId) => {
                    const tableSeats = section.seats.filter((s) => s.rowIdentifier === tableId);
                    return (
                      <div
                        key={tableId}
                        className="p-4 rounded-3xl bg-slate-900/80 border border-amber-500/20 flex flex-col items-center justify-center space-y-3 relative hover:border-amber-400/40 transition"
                      >
                        {/* Circular Table Graphic with Radial Seats */}
                        <div className="relative h-32 w-32 flex items-center justify-center">
                          {/* Central Table Badge */}
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-950 border-2 border-amber-400/60 shadow-inner flex flex-col items-center justify-center text-center p-1">
                            <span className="text-[10px] font-black text-amber-300 leading-tight">
                              {tableId}
                            </span>
                            <span className="text-[8px] text-slate-400 uppercase font-mono">VIP</span>
                          </div>

                          {/* Radial Seats positioned around table */}
                          {tableSeats.map((seat, seatIdx) => {
                            const angle = (seatIdx * (360 / tableSeats.length) - 90) * (Math.PI / 180);
                            const radius = 46; // Distance from center
                            const x = Math.round(radius * Math.cos(angle));
                            const y = Math.round(radius * Math.sin(angle));

                            const isSelected = selectedSeats.some((s) => s.id === seat.id);
                            const isAvailable = seat.isAvailable && seat.status === 'AVAILABLE';

                            return (
                              <button
                                key={seat.id}
                                type="button"
                                onClick={() => handleSeatClick(seat)}
                                onMouseEnter={() => setHoveredSeat(seat)}
                                onMouseLeave={() => setHoveredSeat(null)}
                                disabled={!isAvailable && !isSelected}
                                style={{
                                  transform: `translate(${x}px, ${y}px)`,
                                }}
                                className={`absolute h-7 w-7 rounded-full text-[9px] font-black flex items-center justify-center transition-all duration-200 active:scale-95 ${
                                  isSelected
                                    ? 'bg-amber-400 text-black ring-4 ring-amber-400/50 shadow-glowGold scale-110 z-10'
                                    : isAvailable
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow hover:scale-110 cursor-pointer'
                                    : seat.status === 'HELD'
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                                    : 'bg-rose-900/80 text-rose-300 cursor-not-allowed opacity-70'
                                }`}
                                title={`${seat.seatLabel} • ${seat.price} ETB`}
                              >
                                {seatIdx + 1}
                              </button>
                            );
                          })}
                        </div>

                        <span className="text-[11px] font-semibold text-slate-300">
                          {tableId} (6 Chairs)
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* AUDITORIUM THEATRE ROWS LAYOUT */}
              {section.sectionType === 'THEATRE_ROWS' && (
                <div className="space-y-3 py-2">
                  {Array.from(new Set(section.seats.map((s) => s.rowIdentifier))).map((rowId) => {
                    const rowSeats = section.seats.filter((s) => s.rowIdentifier === rowId);
                    return (
                      <div key={rowId} className="flex items-center gap-2 justify-center">
                        <span className="w-14 text-right text-[11px] font-bold font-mono text-amber-400 shrink-0">
                          {rowId}
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                          {rowSeats.map((seat) => {
                            const isSelected = selectedSeats.some((s) => s.id === seat.id);
                            const isAvailable = seat.isAvailable && seat.status === 'AVAILABLE';

                            return (
                              <button
                                key={seat.id}
                                type="button"
                                onClick={() => handleSeatClick(seat)}
                                onMouseEnter={() => setHoveredSeat(seat)}
                                onMouseLeave={() => setHoveredSeat(null)}
                                disabled={!isAvailable && !isSelected}
                                className={`h-8 w-8 rounded-xl text-[10px] font-bold flex items-center justify-center transition-all duration-200 active:scale-95 ${
                                  isSelected
                                    ? 'bg-amber-400 text-black ring-2 ring-amber-300 shadow-glowGold scale-105 z-10'
                                    : isAvailable
                                    ? 'bg-slate-800 hover:bg-emerald-500 hover:text-black text-emerald-400 border border-emerald-500/30 cursor-pointer'
                                    : seat.status === 'HELD'
                                    ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed opacity-50'
                                    : 'bg-rose-950 text-rose-500 border border-rose-800/40 cursor-not-allowed opacity-50'
                                }`}
                                title={`${seat.seatLabel} • ${seat.price} ETB`}
                              >
                                {seat.seatNumber}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Hover Tooltip Float */}
        {hoveredSeat && (
          <div className="p-3 rounded-2xl bg-black/90 border border-amber-500/40 shadow-2xl text-xs space-y-1 flex items-center justify-between">
            <div>
              <p className="font-black text-white">{hoveredSeat.seatLabel}</p>
              <p className="text-[11px] text-slate-400">{hoveredSeat.tierName}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-amber-400 font-mono text-sm">{hoveredSeat.price} ETB</p>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  hoveredSeat.isAvailable
                    ? 'text-emerald-400 bg-emerald-950'
                    : hoveredSeat.status === 'HELD'
                    ? 'text-amber-400 bg-amber-950'
                    : 'text-rose-400 bg-rose-950'
                }`}
              >
                {hoveredSeat.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Seats Confirmation Tray */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase font-bold text-slate-400 block">
            Selected Seats ({selectedSeats.length}):
          </span>
          {selectedSeats.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {selectedSeats.map((s) => (
                <span
                  key={s.id}
                  className="text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-lg"
                >
                  {s.seatLabel}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5">Please click seats on the floor plan above</p>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {selectedSeats.length > 0 && (
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Price</span>
              <p className="text-lg font-black text-amber-400 font-mono">
                {calculateTotal().toLocaleString()} ETB
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleLockAndConfirm}
            disabled={selectedSeats.length === 0 || holding}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs shadow-glowGold active:scale-95 transition disabled:opacity-50"
          >
            {holding ? (
              <span>Locking Seats...</span>
            ) : (
              <>
                <span>Lock & Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
