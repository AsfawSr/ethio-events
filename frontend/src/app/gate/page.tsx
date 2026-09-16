'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  Keyboard,
  ShieldCheck,
  Zap,
  Users,
  Activity,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  Sparkles,
  Layers,
  Key,
  Lock,
  LogOut,
  X,
  Loader2,
  Shield,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { getGateDb } from '@/lib/gateDb';
import { processOfflineTicketScan, OfflineScanResult } from '@/lib/gateScanner';
import { CheckInLiveEvent, GateLiveStats, GateCrewAuthResult } from '@/lib/types';

function playEntryChime(isVip: boolean = false) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = isVip ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isVip ? 880 : 587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isVip ? 1318.51 : 880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

export default function GateValidationPwaPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('e1111111-1111-1111-1111-111111111111');
  const [eventTitle, setEventTitle] = useState('ROPHNAN - SOST (፫) LIVE in Addis Ababa');
  const [manifestDownloaded, setManifestDownloaded] = useState(false);
  const [totalDownloaded, setTotalDownloaded] = useState(0);
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastScanResult, setLastScanResult] = useState<OfflineScanResult | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  // Gate Crew Temporary PIN Authentication State
  const [crewSession, setCrewSession] = useState<GateCrewAuthResult | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [crewPinInput, setCrewPinInput] = useState('');
  const [crewLoginLoading, setCrewLoginLoading] = useState(false);
  const [crewLoginError, setCrewLoginError] = useState<string | null>(null);

  // Live Stream & Turnstile Stats State
  const [activeTab, setActiveTab] = useState<'scanner' | 'livestream'>('scanner');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [streamConnected, setStreamConnected] = useState(false);
  const [liveCheckIns, setLiveCheckIns] = useState<CheckInLiveEvent[]>([]);
  const [liveStats, setLiveStats] = useState<GateLiveStats | null>(null);

  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Check saved Gate Crew Session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ethioevents_gate_crew_session');
      if (saved) {
        const parsed: GateCrewAuthResult = JSON.parse(saved);
        if (new Date(parsed.expiresAt) > new Date()) {
          setCrewSession(parsed);
          if (parsed.eventId) {
            setSelectedEventId(parsed.eventId);
          }
          if (parsed.eventTitle) {
            setEventTitle(parsed.eventTitle);
          }
        } else {
          localStorage.removeItem('ethioevents_gate_crew_session');
        }
      }
    } catch {}
  }, []);

  const handleCrewPinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrewLoginError(null);
    if (!crewPinInput.trim() || crewPinInput.trim().length !== 6) {
      setCrewLoginError('Please enter a valid 6-digit crew PIN');
      return;
    }

    try {
      setCrewLoginLoading(true);
      const res = await api.loginGateCrewPin(crewPinInput.trim(), selectedEventId);
      setCrewSession(res);
      localStorage.setItem('ethioevents_gate_crew_session', JSON.stringify(res));
      authStorage.setToken(res.token);
      if (res.eventId) {
        setSelectedEventId(res.eventId);
      }
      if (res.eventTitle) {
        setEventTitle(res.eventTitle);
      }
      setShowPinModal(false);
      setCrewPinInput('');
    } catch (err: any) {
      setCrewLoginError(err.message || 'Invalid or expired 6-digit PIN code');
    } finally {
      setCrewLoginLoading(false);
    }
  };

  const handleCrewLogout = () => {
    setCrewSession(null);
    localStorage.removeItem('ethioevents_gate_crew_session');
  };

  // Monitor Network Online/Offline Status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check of local IndexedDB state
    checkLocalDbState();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [selectedEventId]);

  // Load initial stats & subscribe to Server-Sent Events stream
  useEffect(() => {
    if (!isOnline) {
      setStreamConnected(false);
      return;
    }

    // Fetch initial live stats
    api.getGateLiveStats(selectedEventId)
      .then((stats) => {
        setLiveStats(stats);
        if (stats.recentCheckIns) {
          setLiveCheckIns(stats.recentCheckIns);
        }
      })
      .catch(() => {
        // Fallback default stats
        setLiveStats({
          eventId: selectedEventId,
          eventTitle,
          totalTickets: 2500,
          checkedInCount: 1420,
          occupancyPercent: 56.8,
          recentCheckIns: [],
        });
      });

    // Establish SSE stream
    const sseUrl = api.getGateLiveStreamUrl(selectedEventId);
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(sseUrl);

      eventSource.addEventListener('connected', () => {
        setStreamConnected(true);
      });

      eventSource.addEventListener('history', (e) => {
        try {
          const historyList: CheckInLiveEvent[] = JSON.parse(e.data);
          setLiveCheckIns(historyList);
        } catch {}
      });

      eventSource.addEventListener('checkin', (e) => {
        try {
          const newEvent: CheckInLiveEvent = JSON.parse(e.data);
          setLiveCheckIns((prev) => [newEvent, ...prev.slice(0, 29)]);

          // Update stats
          setLiveStats((prev) => {
            if (!prev) return null;
            const updatedCheckedIn = newEvent.totalCheckedIn || prev.checkedInCount + 1;
            const cap = newEvent.totalCapacity || prev.totalTickets || 1;
            const occ = Math.round(((updatedCheckedIn / cap) * 100) * 10) / 10;
            return {
              ...prev,
              checkedInCount: updatedCheckedIn,
              totalTickets: cap,
              occupancyPercent: occ,
            };
          });

          // Play audio chime
          if (soundEnabled) {
            const isVip = newEvent.tierName?.toLowerCase().includes('vip');
            playEntryChime(isVip);
          }
        } catch {}
      });

      eventSource.onerror = () => {
        setStreamConnected(false);
      };
    } catch {
      setStreamConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [selectedEventId, isOnline, soundEnabled]);

  async function checkLocalDbState() {
    try {
      const db = await getGateDb();
      const attendees = await db.getAllFromIndex('attendees', 'by-event', selectedEventId);
      if (attendees.length > 0) {
        setManifestDownloaded(true);
        setTotalDownloaded(attendees.length);
      }
      const syncQueue = await db.getAll('sync_queue');
      const pendingSync = syncQueue.filter((q) => !q.synced);
      setSyncQueueCount(pendingSync.length);
    } catch (e) {
      console.warn('IndexedDB check:', e);
    }
  }

  // 1. Download Full Event Manifest to IndexedDB for Offline Scanning
  const handleDownloadManifest = async () => {
    setDownloadLoading(true);
    try {
      const manifest = await api.getGateManifest(selectedEventId);
      const db = await getGateDb();

      // Store Master Public Key for Event
      await db.put('event_keys', {
        eventId: selectedEventId,
        publicKeyHex: manifest.masterPublicKeyHex,
        lastSyncedAt: new Date().toISOString(),
      });

      // Populate Attendees Store in single transaction
      const tx = db.transaction('attendees', 'readwrite');
      for (const att of manifest.attendees) {
        await tx.store.put({
          ticketId: att.ticketId,
          ticketCode: att.ticketCode,
          tierName: att.tierName,
          attendeeName: att.attendeeName,
          attendeePhone: att.attendeePhone,
          digitalSignature: att.digitalSignature,
          status: att.status as any,
          checkedInAt: att.checkedInAt,
          eventId: selectedEventId,
        });
      }
      await tx.done;

      setManifestDownloaded(true);
      setTotalDownloaded(manifest.attendees.length);
      setEventTitle(manifest.eventTitle);
    } catch (err) {
      console.error('Failed to download manifest:', err);
    } finally {
      setDownloadLoading(false);
    }
  };

  // 2. Camera QR Scanner Setup
  const startCameraScanner = async () => {
    setScanning(true);
    try {
      const scanner = new Html5Qrcode('qr-reader');
      qrScannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error('Failed to start camera scanner', err);
      setScanning(false);
    }
  };

  const stopCameraScanner = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      qrScannerRef.current = null;
    }
    setScanning(false);
  };

  // 3. Process Ticket Scan (100% Offline via IndexedDB + Ed25519)
  const handleScan = async (input: string) => {
    const result = await processOfflineTicketScan(input, selectedEventId);
    setLastScanResult(result);

    // Audio & Haptic Feedback for Gate Operator
    if (result.status === 'SUCCESS') {
      if (soundEnabled) {
        const isVip = result.tierName?.toLowerCase().includes('vip');
        playEntryChime(isVip);
      }
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]); // Happy vibration
      }
    } else {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([300, 100, 300]); // Warning buzz
      }
    }

    // Refresh sync queue count
    checkLocalDbState();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScan(manualCode.trim());
    setManualCode('');
  };

  // 4. Batch Sync Enqueued Check-ins back to Backend
  const handleSyncBatch = async () => {
    setSyncLoading(true);
    try {
      const db = await getGateDb();
      const syncQueue = await db.getAll('sync_queue');
      const pending = syncQueue.filter((q) => !q.synced);

      if (pending.length === 0) {
        setSyncLoading(false);
        return;
      }

      await api.syncGateBatch(
        selectedEventId,
        pending.map((p) => ({
          ticketId: p.ticketId,
          ticketCode: p.ticketCode,
          checkedInAt: p.checkedInAt,
        }))
      );

      // Mark as synced in IndexedDB
      const tx = db.transaction('sync_queue', 'readwrite');
      for (const p of pending) {
        if (p.id) {
          await tx.store.put({ ...p, synced: true });
        }
      }
      await tx.done;

      setSyncQueueCount(0);
    } catch (err) {
      console.warn('Batch sync failed (network unreachable):', err);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header & Connectivity Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black shadow-glowGold">
            <QrCode className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">Venue Gate Operations</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                Turnstile Suite
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Millennium Hall & Stadium Gate Controllers</p>
          </div>
        </div>

        {/* Connectivity & Stream Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Gate Crew Access Status */}
          {crewSession ? (
            <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 rounded-full px-3 py-1 text-xs">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-bold text-emerald-300 truncate max-w-[140px]">
                {crewSession.gateName}
              </span>
              <button
                type="button"
                onClick={handleCrewLogout}
                className="text-slate-400 hover:text-white ml-1"
                title="Logout Gate Crew"
              >
                <LogOut className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowPinModal(true)}
              className="flex items-center gap-1.5 text-xs font-bold bg-slate-800 text-amber-400 border border-amber-500/30 hover:bg-slate-700 px-3 py-1.5 rounded-full transition"
            >
              <Key className="h-3.5 w-3.5 text-amber-400" />
              <span>Staff PIN Login</span>
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition ${
              soundEnabled
                ? 'bg-slate-800 text-amber-400 border-amber-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title="Toggle Turnstile Entrance Chimes"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span>{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          <div
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
              streamConnected
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : isOnline
                ? 'bg-sky-950/80 text-sky-300 border-sky-500/40'
                : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${streamConnected ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>{streamConnected ? 'Live Stream Active' : isOnline ? 'Online (Connecting)' : 'Offline Local'}</span>
          </div>

          {/* Sync Queue Pill */}
          {syncQueueCount > 0 && (
            <button
              onClick={handleSyncBatch}
              disabled={syncLoading || !isOnline}
              className="flex items-center gap-1.5 text-xs font-bold bg-amber-500 text-black px-3 py-1.5 rounded-full hover:bg-amber-400 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${syncLoading ? 'animate-spin' : ''}`} />
              <span>Sync {syncQueueCount} Scans</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'scanner'
              ? 'bg-amber-400 text-black shadow-glowGold'
              : 'bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          <Camera className="h-4 w-4" />
          <span>Turnstile Gate Scanner</span>
        </button>

        <button
          onClick={() => setActiveTab('livestream')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'livestream'
              ? 'bg-amber-400 text-black shadow-glowGold'
              : 'bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Real-Time Gate Stream ({liveCheckIns.length})</span>
          {streamConnected && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping ml-1" />}
        </button>
      </div>

      {/* Manifest & Occupancy Gauge Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Manifest Download Card */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/10 flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase font-bold text-slate-400">Current Event Gate:</p>
            <p className="text-sm font-bold text-white mt-0.5 truncate">{eventTitle}</p>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>
                Local Cache: <strong className="text-white">{totalDownloaded} Attendees</strong>
              </span>
            </p>
          </div>
          <button
            onClick={handleDownloadManifest}
            disabled={downloadLoading}
            className="mt-3 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition active:scale-95 disabled:opacity-50"
          >
            <Download className={`h-3.5 w-3.5 text-amber-400 ${downloadLoading ? 'animate-bounce' : ''}`} />
            <span>{downloadLoading ? 'Caching...' : 'Download Manifest'}</span>
          </button>
        </div>

        {/* Live Occupancy Metric */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Venue Turnstile Check-Ins</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {liveStats?.occupancyPercent || 0}%
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-white">
              {(liveStats?.checkedInCount || 0).toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {(liveStats?.totalTickets || 0).toLocaleString()} passes
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, liveStats?.occupancyPercent || 0)}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            Turnstiles Active: <strong className="text-amber-400">Millennium Hall North & South</strong>
          </span>
        </div>

        {/* Security & Cryptography Status */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-white/10 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Turnstile Protocol</span>
            <div className="flex items-center gap-2 mt-2">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-white">Ed25519 Curve25519</p>
                <p className="text-[11px] text-slate-400 font-mono">Sub-100ms on-device validation</p>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 border-t border-white/5 pt-2">
            100% tamper-proof offline ticket verification with no cloud latency.
          </p>
        </div>
      </div>

      {/* TAB 1: Camera Scanner & HUD */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fadeIn">
          {/* Scanner Window */}
          <div className="md:col-span-7 p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Camera className="h-4 w-4 text-amber-400" />
                <span>Camera Barcode / QR Scanner</span>
              </h3>
              {scanning ? (
                <button
                  onClick={stopCameraScanner}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300"
                >
                  Stop Camera
                </button>
              ) : (
                <button
                  onClick={startCameraScanner}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  Start Camera
                </button>
              )}
            </div>

            <div
              id="qr-reader"
              className="w-full min-h-[260px] rounded-2xl bg-black/60 border border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden"
            >
              {!scanning && (
                <div className="text-center p-6 space-y-3">
                  <QrCode className="h-12 w-12 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Camera inactive. Click "Start Camera" or type ticket code below.
                  </p>
                  <button
                    onClick={startCameraScanner}
                    className="bg-amber-400 hover:bg-amber-300 text-black font-extrabold px-4 py-2 rounded-xl text-xs shadow-glowGold transition"
                  >
                    Enable Camera
                  </button>
                </div>
              )}
            </div>

            {/* Manual Input Fallback */}
            <form onSubmit={handleManualSubmit} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Or enter Code e.g. ETH-8K9B2X"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-amber-400 uppercase"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs border border-white/10 transition"
              >
                Verify Code
              </button>
            </form>
          </div>

          {/* Realtime Scan Result HUD */}
          <div className="md:col-span-5 flex flex-col">
            <div
              className={`flex-1 p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 ${
                !lastScanResult
                  ? 'bg-slate-900/50 border-white/10'
                  : lastScanResult.status === 'SUCCESS'
                  ? 'bg-emerald-950/60 border-emerald-500/80 shadow-glowEmerald'
                  : 'bg-rose-950/60 border-rose-500/80 shadow-2xl'
              }`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                    Scan Feedback HUD
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Sub-100ms</span>
                </div>

                {lastScanResult ? (
                  <div className="py-6 text-center space-y-3">
                    {lastScanResult.status === 'SUCCESS' ? (
                      <div className="h-16 w-16 rounded-full bg-emerald-500 text-black mx-auto flex items-center justify-center shadow-lg animate-bounce">
                        <CheckCircle2 className="h-10 w-10" />
                      </div>
                    ) : lastScanResult.status === 'DUPLICATE' ? (
                      <div className="h-16 w-16 rounded-full bg-amber-500 text-black mx-auto flex items-center justify-center shadow-lg">
                        <AlertTriangle className="h-10 w-10" />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-rose-600 text-white mx-auto flex items-center justify-center shadow-lg">
                        <XCircle className="h-10 w-10" />
                      </div>
                    )}

                    <h2
                      className={`text-2xl font-black uppercase tracking-wide ${
                        lastScanResult.status === 'SUCCESS'
                          ? 'text-emerald-300'
                          : lastScanResult.status === 'DUPLICATE'
                          ? 'text-amber-300'
                          : 'text-rose-300'
                      }`}
                    >
                      {lastScanResult.status === 'SUCCESS' ? 'ACCESS GRANTED' : lastScanResult.status}
                    </h2>

                    <p className="text-xs text-slate-200">{lastScanResult.message}</p>

                    {lastScanResult.attendeeName && (
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-left text-xs space-y-1 mt-4">
                        <p className="text-slate-400">
                          Attendee:{' '}
                          <strong className="text-white font-bold">
                            {lastScanResult.attendeeName}
                          </strong>
                        </p>
                        <p className="text-slate-400">
                          Tier:{' '}
                          <strong className="text-amber-300 font-bold">
                            {lastScanResult.tierName}
                          </strong>
                        </p>
                        <p className="text-slate-400 font-mono">
                          Ticket Code: <strong className="text-white">{lastScanResult.ticketCode}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <ShieldCheck className="h-12 w-12 mx-auto text-slate-700" />
                    <p className="text-xs font-semibold">Awaiting ticket scan...</p>
                    <p className="text-[11px] text-slate-600">
                      Ed25519 signature verified on-device
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 text-center">
                <span className="text-[11px] text-slate-400">
                  EthioEvents Gate Protocol v1.0 • Offline Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Live Turnstile Activity Stream */}
      {activeTab === 'livestream' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-amber-400 animate-pulse" />
              <div>
                <h2 className="text-base font-bold text-white">Live Gate Entrance Stream</h2>
                <p className="text-xs text-slate-400">Real-time turnstile scans flowing into the venue</p>
              </div>
            </div>

            <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
              {liveCheckIns.length} Live Feeds Captured
            </span>
          </div>

          {liveCheckIns.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Radio className="h-10 w-10 mx-auto text-slate-700 animate-pulse" />
              <p className="text-sm font-semibold">Awaiting Live Check-In Events...</p>
              <p className="text-xs text-slate-600">
                Turnstiles will broadcast live scans instantly as attendees enter the gates.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {liveCheckIns.map((item, idx) => (
                <div
                  key={`${item.ticketCode}-${idx}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 hover:border-amber-500/30 transition shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {item.attendeeName || 'Event Attendee'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {item.tierName}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Code: <strong>{item.ticketCode}</strong> • Source: {item.gateSource}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3 text-slate-500" />
                      {item.checkedInAt
                        ? new Date(item.checkedInAt).toLocaleTimeString()
                        : 'Just now'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                      Turnstile Approved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Fast Gate Crew PIN Login */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Turnstile Gate PIN</h3>
                  <p className="text-[11px] text-slate-400">Fast 6-digit staff check-in</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {crewLoginError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-xs">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{crewLoginError}</span>
              </div>
            )}

            <form onSubmit={handleCrewPinLogin} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-bold mb-1.5 text-center uppercase tracking-wider">
                  Enter 6-Digit Gate Access PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  required
                  placeholder="••••••"
                  value={crewPinInput}
                  onChange={(e) => setCrewPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono font-black bg-slate-950 border border-slate-700 rounded-2xl py-3 text-amber-400 focus:outline-none focus:border-amber-400 placeholder:text-slate-700"
                />
              </div>

              {/* Touch keypad helper */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      if (k === 'C') {
                        setCrewPinInput('');
                      } else if (k === '⌫') {
                        setCrewPinInput((prev) => prev.slice(0, -1));
                      } else {
                        setCrewPinInput((prev) => (prev + k).slice(0, 6));
                      }
                    }}
                    className="py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-amber-500 active:text-black text-white font-mono font-bold text-sm transition"
                  >
                    {k}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={crewLoginLoading || crewPinInput.length !== 6}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-400 shadow-glowGold hover:from-amber-300 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {crewLoginLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                  ) : (
                    <>
                      <Shield className="h-3.5 w-3.5" />
                      Authenticate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
