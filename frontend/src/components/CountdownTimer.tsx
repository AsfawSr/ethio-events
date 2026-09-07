'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAtIso: string;
  onExpire?: () => void;
}

export default function CountdownTimer({ expiresAtIso, onExpire }: CountdownTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const diff = Math.floor((new Date(expiresAtIso).getTime() - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((new Date(expiresAtIso).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsRemaining(0);
        clearInterval(interval);
        if (onExpire) onExpire();
      } else {
        setSecondsRemaining(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAtIso, onExpire]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isUrgent = secondsRemaining < 120; // under 2 minutes
  const totalDuration = 600; // 10 minutes total
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / totalDuration) * 100));

  return (
    <div
      className={`w-full rounded-2xl p-4 border transition-all ${
        isUrgent
          ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 animate-pulse-slow'
          : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-medium text-sm">
          {isUrgent ? (
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          ) : (
            <Clock className="h-4 w-4 text-amber-400" />
          )}
          <span>
            {isUrgent ? 'Hurry! Reservation expiring soon' : 'Tickets held for you:'}
          </span>
        </div>
        <div className="font-mono font-bold text-lg tracking-wider text-white bg-black/40 px-3 py-0.5 rounded-lg border border-white/10">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isUrgent ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-400 mt-1.5 text-center">
        Complete your Telebirr or Chapa payment before the timer reaches 00:00 to guarantee your seat.
      </p>
    </div>
  );
}
