'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Phone,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  DollarSign,
  Plus,
  QrCode,
  ExternalLink,
  Calendar,
  MapPin,
  LogOut,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  UserCheck,
  Layers,
  ArrowRight,
  Radio,
  Activity,
  Clock,
  Tag,
  Percent,
  X,
  Loader2,
  Key,
  Shield,
  Copy
} from 'lucide-react';
import { api } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { OrganizerProfile, OrganizerSession, EventSummary, SettlementSummaryItem, CheckInLiveEvent, GateLiveStats, PromoCodeItem, GateCrewPinItem } from '@/lib/types';

const ETHIOPIAN_BANKS = [
  'Commercial Bank of Ethiopia (CBE)',
  'Telebirr Merchant Payout',
  'Awash Bank',
  'Dashen Bank',
  'Bank of Abyssinia (BOA)',
  'Cooperative Bank of Oromia (Coop)',
  'Nib International Bank',
  'Zemen Bank',
  'Hibret Bank',
];

export default function OrganizerPortalPage() {
  const [session, setSession] = useState<OrganizerSession | null>(null);
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [myEvents, setMyEvents] = useState<EventSummary[]>([]);
  const [settlements, setSettlements] = useState<SettlementSummaryItem[]>([]);
  const [promos, setPromos] = useState<PromoCodeItem[]>([]);
  const [dashboardTab, setDashboardTab] = useState<'events' | 'settlements' | 'livegate' | 'promos'>('events');
  const [loading, setLoading] = useState(true);

  // Promo Code Form Modal
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: '',
    eventId: '',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderAmount: 0,
    maxUses: 100,
  });
  const [promoCreating, setPromoCreating] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Live Turnstile Stream & Crew PINs for Organizers
  const [selectedLiveEventId, setSelectedLiveEventId] = useState<string>('');
  const [liveCheckIns, setLiveCheckIns] = useState<CheckInLiveEvent[]>([]);
  const [liveStats, setLiveStats] = useState<GateLiveStats | null>(null);
  const [streamActive, setStreamActive] = useState(false);

  // Gate Crew Temporary Access PINs State
  const [crewPins, setCrewPins] = useState<GateCrewPinItem[]>([]);
  const [showCrewPinModal, setShowCrewPinModal] = useState(false);
  const [crewPinForm, setCrewPinForm] = useState({
    gateName: 'Main Turnstile Gate 1',
    crewMemberName: '',
    validHours: 24,
  });
  const [crewPinCreating, setCrewPinCreating] = useState(false);
  const [crewPinError, setCrewPinError] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  // Auth Tabs (unauthenticated state)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration form state
  const [regForm, setRegForm] = useState({
    organizationName: '',
    fullName: '',
    phoneNumber: '',
    email: '',
    businessLicenseNo: '',
    bankName: ETHIOPIAN_BANKS[0],
    bankAccountNo: '',
    bankAccountName: '',
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Check initial session
  useEffect(() => {
    const curSession = authStorage.getSession();
    setSession(curSession);
    if (curSession && curSession.token && (curSession.role === 'ORGANIZER' || !!curSession.organizerId)) {
      loadDashboardData();
    } else {
      setLoading(false);
    }

    const handleAuthChange = () => {
      const s = authStorage.getSession();
      setSession(s);
      if (s && s.token && (s.role === 'ORGANIZER' || !!s.organizerId)) {
        loadDashboardData();
      } else {
        setLoading(false);
      }
    };
    window.addEventListener('ethioevents_auth_changed', handleAuthChange);
    return () => window.removeEventListener('ethioevents_auth_changed', handleAuthChange);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [prof, events, stl, prm] = await Promise.all([
        api.getOrganizerProfile(),
        api.getOrganizerEvents().catch(() => []),
        api.getOrganizerSettlements().catch(() => []),
        api.getAllPromoCodes().catch(() => []),
      ]);
      setProfile(prof);
      setMyEvents(events);
      setSettlements(stl);
      setPromos(prm);
      if (events.length > 0) {
        setSelectedLiveEventId((prev) => prev || events[0].id);
      }
    } catch (err: any) {
      console.warn('Organizer profile unavailable:', err);
      authStorage.clearSession();
      setSession(null);
      setProfile(null);
      setMyEvents([]);
      setSettlements([]);
      setPromos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.code.trim()) {
      setPromoError('Please enter a promo code (e.g. EARLY20)');
      return;
    }

    setPromoCreating(true);
    setPromoError(null);
    try {
      const created = await api.createPromoCode({
        code: promoForm.code.trim().toUpperCase(),
        eventId: promoForm.eventId || undefined,
        discountType: promoForm.discountType,
        discountValue: Number(promoForm.discountValue),
        minOrderAmount: Number(promoForm.minOrderAmount) || 0,
        maxUses: Number(promoForm.maxUses) || 100,
      });

      setPromos((prev) => [created, ...prev]);
      setShowPromoModal(false);
      setPromoForm({
        code: '',
        eventId: '',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderAmount: 0,
        maxUses: 100,
      });
    } catch (err: any) {
      setPromoError(err.message || 'Failed to create promo code');
    } finally {
      setPromoCreating(false);
    }
  };

  // Organizer Live Turnstile Stream Subscription
  useEffect(() => {
    if (!selectedLiveEventId) return;

    api.getGateLiveStats(selectedLiveEventId)
      .then((st) => {
        setLiveStats(st);
        if (st.recentCheckIns) setLiveCheckIns(st.recentCheckIns);
      })
      .catch(() => {
        setLiveStats(null);
        setLiveCheckIns([]);
      });

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(api.getGateLiveStreamUrl(selectedLiveEventId));
      eventSource.addEventListener('connected', () => setStreamActive(true));
      eventSource.addEventListener('history', (e) => {
        try {
          const list: CheckInLiveEvent[] = JSON.parse(e.data);
          setLiveCheckIns(list);
        } catch {}
      });
      eventSource.addEventListener('checkin', (e) => {
        try {
          const checkin: CheckInLiveEvent = JSON.parse(e.data);
          setLiveCheckIns((prev) => [checkin, ...prev.slice(0, 29)]);
          setLiveStats((prev) => {
            if (!prev) return null;
            const updated = checkin.totalCheckedIn || prev.checkedInCount + 1;
            const cap = checkin.totalCapacity || prev.totalTickets || 1;
            return {
              ...prev,
              checkedInCount: updated,
              totalTickets: cap,
              occupancyPercent: Math.round(((updated / cap) * 100) * 10) / 10,
            };
          });
        } catch {}
      });
      eventSource.onerror = () => setStreamActive(false);
    } catch {
      setStreamActive(false);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [selectedLiveEventId]);

  // Handle OTP Request
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginPhone.trim()) {
      setLoginError('Please enter your phone number');
      return;
    }
    try {
      setLoginLoading(true);
      await api.requestOtp(loginPhone.trim());
      setOtpSent(true);
    } catch (err: any) {
      setLoginError(err.message || 'Failed to send OTP code');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle OTP Verification & Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginOtp.trim()) {
      setLoginError('Please enter the 6-digit OTP code');
      return;
    }
    try {
      setLoginLoading(true);
      const res = await api.verifyOtp(loginPhone.trim(), loginOtp.trim());
      
      const newSession: OrganizerSession = {
        token: res.token,
        userId: res.userId,
        phoneNumber: res.phoneNumber,
        fullName: res.fullName,
        role: res.role,
        organizerId: (res as any).organizerId,
        organizationName: (res as any).organizationName,
      };

      authStorage.setSession(newSession);
      setSession(newSession);

      // If user is not yet an organizer, prompt them to complete organization registration
      if (res.role !== 'ORGANIZER' && !(res as any).organizerId) {
        setRegForm((prev) => ({
          ...prev,
          phoneNumber: res.phoneNumber,
          fullName: res.fullName || '',
        }));
        setActiveTab('register');
        setRegError('Your phone is verified! Please complete the form below to register as an event organizer.');
        setLoading(false);
      } else {
        await loadDashboardData();
      }
    } catch (err: any) {
      setLoginError(err.message || 'Invalid verification code');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Organizer Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regForm.organizationName.trim() || !regForm.phoneNumber.trim() || !regForm.bankAccountNo.trim()) {
      setRegError('Please complete all required fields');
      return;
    }

    try {
      setRegLoading(true);
      const res = await api.registerOrganizer({
        organizationName: regForm.organizationName.trim(),
        fullName: regForm.fullName.trim() || 'Organizer Representative',
        phoneNumber: regForm.phoneNumber.trim(),
        email: regForm.email.trim() || undefined,
        businessLicenseNo: regForm.businessLicenseNo.trim() || undefined,
        bankName: regForm.bankName,
        bankAccountNo: regForm.bankAccountNo.trim(),
        bankAccountName: regForm.bankAccountName.trim() || regForm.organizationName.trim(),
      });

      authStorage.setSession(res);
      setSession(res);
      await loadDashboardData();
    } catch (err: any) {
      console.error('Registration failed:', err);
      setRegError(err.message || 'Failed to create organizer account');
    } finally {
      setRegLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    authStorage.clearSession();
    setSession(null);
    setProfile(null);
    setMyEvents([]);
    setSettlements([]);
    setPromos([]);
  };

  // Handle Create Promo Code
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    if (!promoForm.code.trim()) {
      setPromoError('Promo code name is required (e.g. ADDISVIP)');
      return;
    }
    try {
      setPromoCreating(true);
      const created = await api.createPromoCode({
        code: promoForm.code.trim().toUpperCase(),
        eventId: promoForm.eventId || undefined,
        discountType: promoForm.discountType,
        discountValue: Number(promoForm.discountValue),
        minOrderAmount: Number(promoForm.minOrderAmount) || 0,
        maxUses: Number(promoForm.maxUses) || undefined,
      });
      setPromos((prev) => [created, ...prev]);
      setShowPromoModal(false);
      setPromoForm({
        code: '',
        eventId: '',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderAmount: 0,
        maxUses: 100,
      });
    } catch (err: any) {
      setPromoError(err.message || 'Failed to create promo code');
    } finally {
      setPromoCreating(false);
    }
  };

  // Load Gate Crew PINs whenever selected event changes
  useEffect(() => {
    if (!selectedLiveEventId) return;
    api.getGateCrewPins(selectedLiveEventId)
      .then((pins) => setCrewPins(pins))
      .catch(() => setCrewPins([]));
  }, [selectedLiveEventId]);

  // Handle Create Gate Crew PIN
  const handleCreateCrewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrewPinError(null);
    if (!selectedLiveEventId) {
      setCrewPinError('Please select an active event first');
      return;
    }
    try {
      setCrewPinCreating(true);
      const newPin = await api.createGateCrewPin({
        eventId: selectedLiveEventId,
        gateName: crewPinForm.gateName.trim() || 'Main Turnstile Gate',
        crewMemberName: crewPinForm.crewMemberName.trim() || undefined,
        validHours: Number(crewPinForm.validHours) || 24,
      });
      setCrewPins((prev) => [newPin, ...prev]);
      setShowCrewPinModal(false);
      setCrewPinForm({
        gateName: 'Main Turnstile Gate 1',
        crewMemberName: '',
        validHours: 24,
      });
    } catch (err: any) {
      setCrewPinError(err.message || 'Failed to generate gate crew PIN');
    } finally {
      setCrewPinCreating(false);
    }
  };

  // Handle Revoke Gate Crew PIN
  const handleRevokeCrewPin = async (pinId: string) => {
    try {
      await api.revokeGateCrewPin(pinId);
      setCrewPins((prev) =>
        prev.map((p) => (p.id === pinId ? { ...p, active: false } : p))
      );
    } catch (err) {
      console.warn('Failed to revoke crew pin:', err);
    }
  };

  // If loading session
  if (loading && session) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center p-6 text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-sm font-medium">Loading Organizer Portal...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // LOGGED-IN ORGANIZER DASHBOARD VIEW
  // ==========================================
  if (session && session.token) {
    return (
      <div className="min-h-screen bg-[#080C14] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black font-black text-2xl shadow-glowGold">
                  🏢
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                    {profile?.organizationName || session.organizationName || 'Organizer Dashboard'}
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      VERIFIED 🇪🇹
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400">
                    Host: {profile?.ownerName || session.fullName} • Phone: {session.phoneNumber}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/events/create"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 px-4 py-2.5 text-sm font-bold text-black shadow-glowGold hover:from-amber-300 hover:to-yellow-300 transition active:scale-95"
              >
                <Plus className="h-4 w-4 text-black" />
                Register New Event
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Total Revenue */}
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 p-6 relative overflow-hidden">
              <div className="flex items-center justify-between text-amber-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Sales Revenue</span>
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="text-3xl font-black text-white">
                {(profile?.totalRevenueEtb || 0).toLocaleString()} <span className="text-amber-400 text-lg">ETB</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Processed via Telebirr & Chapa
              </p>
            </div>

            {/* Total Tickets Sold */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Tickets Sold</span>
                <Ticket className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {(profile?.totalTicketsSold || 0).toLocaleString()}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Verified with Ed25519 cryptographic signatures
              </p>
            </div>

            {/* Total Events Organized */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Active Events</span>
                <Layers className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="text-3xl font-black text-white">
                {myEvents.length || profile?.totalEvents || 0}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Published & ready for Addis Ababa attendees
              </p>
            </div>
          </div>

          {/* Payout & Banking Details Card */}
          {profile?.bankAccountNo && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-amber-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Payout Account: {profile.bankName}</h4>
                  <p className="text-xs text-slate-400">
                    Account: <span className="font-mono text-slate-300">{profile.bankAccountNo}</span> ({profile.bankAccountName})
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg w-fit">
                Automatic Direct Settlement
              </span>
            </div>
          )}

          {/* Dashboard Navigation Tabs */}
          <div className="flex items-center gap-3 border-b border-white/10 pb-2">
            <button
              onClick={() => setDashboardTab('events')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                dashboardTab === 'events'
                  ? 'bg-amber-500 text-black shadow-glowGold'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
              }`}
            >
              <Layers className="h-4 w-4" />
              My Events ({myEvents.length})
            </button>

            <button
              onClick={() => setDashboardTab('settlements')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                dashboardTab === 'settlements'
                  ? 'bg-amber-500 text-black shadow-glowGold'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Settlements & Payout Ledger ({settlements.length})
            </button>

            <button
              onClick={() => setDashboardTab('livegate')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                dashboardTab === 'livegate'
                  ? 'bg-amber-500 text-black shadow-glowGold'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
              }`}
            >
              <Radio className="h-4 w-4 text-emerald-400" />
              Live Gate Stream
              {streamActive && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping ml-1" />}
            </button>

            <button
              onClick={() => setDashboardTab('promos')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                dashboardTab === 'promos'
                  ? 'bg-amber-500 text-black shadow-glowGold'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
              }`}
            >
              <Tag className="h-4 w-4" />
              Promo Codes ({promos.length})
            </button>
          </div>

          {/* TAB 1: My Organized Events Section */}
          {dashboardTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  My Published Events
                  <span className="text-xs font-normal text-slate-400">({myEvents.length})</span>
                </h2>
                <Link
                  href="/events/create"
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
                >
                  + Add Another Event
                </Link>
              </div>

              {myEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-12 text-center">
                  <Sparkles className="mx-auto h-12 w-12 text-amber-400 mb-3 opacity-60" />
                  <h3 className="text-lg font-bold text-white">No Events Published Yet</h3>
                  <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
                    Create your first concert, summit, or festival to start selling tickets via Telebirr & Chapa.
                  </p>
                  <Link
                    href="/events/create"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 px-6 py-2.5 text-sm font-bold text-black shadow-glowGold hover:from-amber-300 hover:to-yellow-300 transition"
                  >
                    <Plus className="h-4 w-4 text-black" />
                    Publish First Event
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition"
                    >
                      <div className="flex gap-4">
                        <img
                          src={evt.bannerImageUrl}
                          alt={evt.title}
                          className="h-20 w-24 rounded-xl object-cover border border-white/10 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded mb-1">
                            {evt.status}
                          </span>
                          <h3 className="text-base font-bold text-white truncate">{evt.title}</h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
                            <MapPin className="h-3 w-3 text-amber-400 flex-shrink-0" />
                            {evt.venueName}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3 text-amber-400 flex-shrink-0" />
                            {evt.startTime.ethiopianDateFormatted}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                        <div>
                          <span className="text-slate-400">Tiers: </span>
                          <span className="font-bold text-white">
                            {evt.minPrice} - {evt.maxPrice} ETB
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/gate`}
                            className="flex items-center gap-1 font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                          >
                            <QrCode className="h-3.5 w-3.5 text-amber-400" />
                            Gate Scanner
                          </Link>
                          <Link
                            href={`/events/${evt.slug}`}
                            className="flex items-center gap-1 font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 transition"
                          >
                            View Page
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Settlements & Payout Ledger */}
          {dashboardTab === 'settlements' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-amber-400" />
                    Direct Bank Settlements & Disbursements
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Net 95% ticket revenue disbursements to {profile?.bankName} ({profile?.bankAccountNo})
                  </p>
                </div>
              </div>

              {/* Settlements Table */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="px-5 py-3.5 font-bold">Event</th>
                        <th className="px-5 py-3.5 font-bold">Bank Account</th>
                        <th className="px-5 py-3.5 font-bold text-right">Gross Sales</th>
                        <th className="px-5 py-3.5 font-bold text-right">Platform Fee (5%)</th>
                        <th className="px-5 py-3.5 font-bold text-right">Net Payout</th>
                        <th className="px-5 py-3.5 font-bold text-center">Status</th>
                        <th className="px-5 py-3.5 font-bold text-right">Payout Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {settlements.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                            No settlement disbursements recorded yet. Payout batches are generated once event ticket sales conclude.
                          </td>
                        </tr>
                      ) : (
                        settlements.map((st) => (
                          <tr key={st.id} className="hover:bg-slate-800/40 transition">
                            <td className="px-5 py-4 font-bold text-white">
                              {st.eventTitle}
                            </td>
                            <td className="px-5 py-4 text-slate-300">
                              <p className="font-semibold">{st.bankName}</p>
                              <p className="font-mono text-slate-400 text-[11px]">{st.bankAccountNo}</p>
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-slate-300">
                              {st.totalGrossRevenue.toLocaleString()} ETB
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-emerald-400">
                              - {st.platformCommissionFee.toLocaleString()} ETB
                            </td>
                            <td className="px-5 py-4 text-right font-mono font-black text-amber-400 text-sm">
                              {st.payoutAmount.toLocaleString()} ETB
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  st.status === 'COMPLETED'
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                {st.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right font-mono text-slate-400 text-[11px]">
                              {st.payoutReference ? (
                                <span className="text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-500/20">
                                  {st.payoutReference}
                                </span>
                              ) : (
                                'Pending Generation'
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Live Gate Activity Stream Section */}
          {dashboardTab === 'livegate' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Event Selector Header & Live Stream Pill */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-white/10">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Select Active Event to Monitor:</span>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedLiveEventId}
                      onChange={(e) => setSelectedLiveEventId(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-white text-sm font-semibold rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-400"
                    >
                      {myEvents.map((evt) => (
                        <option key={evt.id} value={evt.id}>
                          {evt.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
                      streamActive
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    <Radio className={`h-3.5 w-3.5 ${streamActive ? 'animate-pulse text-emerald-400' : ''}`} />
                    <span>{streamActive ? 'SSE Live Stream Connected' : 'Connecting to Gate...'}</span>
                  </div>

                  <Link
                    href="/gate"
                    className="text-xs font-bold bg-amber-400 hover:bg-amber-300 text-black px-3 py-1.5 rounded-full transition shadow"
                  >
                    Open Gate Scanner PWA
                  </Link>
                </div>
              </div>

              {/* Live Occupancy Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/10">
                  <span className="text-xs font-bold uppercase text-slate-400">Total Check-Ins</span>
                  <div className="text-2xl font-black text-white mt-1">
                    {(liveStats?.checkedInCount || 0).toLocaleString()}
                  </div>
                  <p className="text-[11px] text-emerald-400 mt-1">Attendees admitted at turnstiles</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/10">
                  <span className="text-xs font-bold uppercase text-slate-400">Turnstile Occupancy</span>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {liveStats?.occupancyPercent || 0}%
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, liveStats?.occupancyPercent || 0)}%` }}
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/10">
                  <span className="text-xs font-bold uppercase text-slate-400">Gate Verification Speed</span>
                  <div className="text-2xl font-black text-white mt-1">
                    &lt; 100 ms
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Ed25519 Curve25519 offline turnstile cryptographic engine</p>
                </div>
              </div>

              {/* Check-In Event Ticker */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-amber-400" />
                    <span>Real-Time Gate Entrance Feed</span>
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    {liveCheckIns.length} Recents Captured
                  </span>
                </div>

                {liveCheckIns.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 space-y-2">
                    <Radio className="h-8 w-8 mx-auto text-slate-700 animate-pulse" />
                    <p className="text-sm font-semibold">Awaiting turnstile scans for this event...</p>
                    <p className="text-xs text-slate-600">
                      Entrances scanned at Millennium Hall turnstiles or mobile gate scanners will stream here live.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {liveCheckIns.map((item, idx) => (
                      <div
                        key={`${item.ticketCode}-${idx}`}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-white/5 hover:border-amber-500/30 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs sm:text-sm">
                                {item.attendeeName || 'Attendee'}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                {item.tierName}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                              Code: <strong>{item.ticketCode}</strong> • {item.gateSource}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3 text-slate-500" />
                            {item.checkedInAt ? new Date(item.checkedInAt).toLocaleTimeString() : 'Just now'}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold block">
                            Admitted
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Turnstile Gate Crew Temporary PIN Management */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Key className="h-4 w-4 text-amber-400" />
                      <span>Gate Crew Temporary Access PINs</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Generate fast 6-digit access codes for volunteer turnstile staff on event day.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCrewPinModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 px-3.5 py-2 text-xs font-bold text-black shadow-glowGold hover:from-amber-300 transition w-fit"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Generate Staff PIN
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 font-bold">6-Digit PIN</th>
                        <th className="px-4 py-3 font-bold">Gate Station</th>
                        <th className="px-4 py-3 font-bold">Staff Member</th>
                        <th className="px-4 py-3 font-bold text-center">Logins</th>
                        <th className="px-4 py-3 font-bold">Expires</th>
                        <th className="px-4 py-3 font-bold text-center">Status</th>
                        <th className="px-4 py-3 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {crewPins.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                            No gate staff PINs generated for this event yet. Click "Generate Staff PIN" to create temporary codes.
                          </td>
                        </tr>
                      ) : (
                        crewPins.map((cp) => (
                          <tr key={cp.id} className="hover:bg-slate-800/40 transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg text-sm tracking-wider">
                                  {cp.pinCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(cp.pinCode);
                                    setCopiedPin(cp.pinCode);
                                    setTimeout(() => setCopiedPin(null), 2000);
                                  }}
                                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                                  title="Copy PIN Code"
                                >
                                  {copiedPin === cp.pinCode ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-semibold text-white">
                              {cp.gateName}
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {cp.crewMemberName || <span className="text-slate-500 italic">Unassigned Volunteer</span>}
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-slate-300">
                              {cp.loginCount}
                            </td>
                            <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                              {new Date(cp.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(cp.expiresAt).toLocaleDateString()})
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  cp.active
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                                }`}
                              >
                                {cp.active ? 'ACTIVE' : 'REVOKED'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {cp.active && (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeCrewPin(cp.id)}
                                  className="text-rose-400 hover:text-rose-300 font-semibold text-[11px] hover:underline"
                                >
                                  Revoke
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Promo Codes & Discount Vouchers Section */}
          {dashboardTab === 'promos' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Tag className="h-5 w-5 text-amber-400" />
                    Promo Codes & Group Discounts
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generate discount voucher codes for early birds, bulk group buyers, and VIP partners.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPromoModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 px-4 py-2 text-xs font-bold text-black shadow-glowGold hover:from-amber-300 hover:to-yellow-300 transition w-fit"
                >
                  <Plus className="h-4 w-4 text-black" />
                  Create Promo Code
                </button>
              </div>

              {/* Promo Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/10">
                  <span className="text-xs font-bold uppercase text-slate-400">Total Active Codes</span>
                  <div className="text-2xl font-black text-white mt-1">
                    {promos.filter((p) => p.active).length}
                  </div>
                  <p className="text-[11px] text-amber-400 mt-1">Ready for checkout redemption</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/10">
                  <span className="text-xs font-bold uppercase text-slate-400">Total Redemptions</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {promos.reduce((acc, p) => acc + (p.timesUsed || 0), 0)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Tickets reserved with discounts</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/10">
                  <span className="text-xs font-bold uppercase text-slate-400">Supported Currencies</span>
                  <div className="text-2xl font-black text-indigo-400 mt-1">
                    ETB / %
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Percentage & Fixed discount models</p>
                </div>
              </div>

              {/* Promo Table */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="px-5 py-3.5 font-bold">Voucher Code</th>
                        <th className="px-5 py-3.5 font-bold">Target Event</th>
                        <th className="px-5 py-3.5 font-bold">Discount Rate</th>
                        <th className="px-5 py-3.5 font-bold">Min Order</th>
                        <th className="px-5 py-3.5 font-bold">Redemptions</th>
                        <th className="px-5 py-3.5 font-bold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {promos.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                            No promo codes created yet. Click "Create Promo Code" to add special discounts.
                          </td>
                        </tr>
                      ) : (
                        promos.map((p) => {
                          const percentCap = p.maxUses ? Math.min(100, Math.round((p.timesUsed / p.maxUses) * 100)) : 0;
                          return (
                            <tr key={p.id} className="hover:bg-slate-800/40 transition">
                              <td className="px-5 py-4">
                                <span className="inline-flex items-center gap-1.5 font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-lg text-xs">
                                  <Tag className="h-3 w-3" />
                                  {p.code}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-slate-300">
                                {p.eventTitle || <span className="text-slate-500 italic">All Organized Events</span>}
                              </td>
                              <td className="px-5 py-4 font-bold text-emerald-400">
                                {p.discountType === 'PERCENTAGE'
                                  ? `${p.discountValue}% OFF`
                                  : `${p.discountValue} ETB OFF`}
                              </td>
                              <td className="px-5 py-4 font-mono text-slate-400">
                                {p.minOrderAmount && p.minOrderAmount > 0 ? `${p.minOrderAmount.toLocaleString()} ETB` : 'No Minimum'}
                              </td>
                              <td className="px-5 py-4">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                                    <span>{p.timesUsed} used</span>
                                    <span>{p.maxUses ? `/ ${p.maxUses}` : '(Unlimited)'}</span>
                                  </div>
                                  {p.maxUses && (
                                    <div className="w-28 h-1 rounded-full bg-slate-800 overflow-hidden">
                                      <div
                                        className="h-full bg-amber-400 rounded-full"
                                        style={{ width: `${percentCap}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    p.active
                                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                                  }`}
                                >
                                  {p.active ? 'ACTIVE' : 'EXPIRED'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Create Promo Code */}
        {showPromoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Create New Promo Voucher</h3>
                    <p className="text-xs text-slate-400">Configure discount code for ticket reservations</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {promoError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-xs">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{promoError}</span>
                </div>
              )}

              <form onSubmit={handleCreatePromo} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Promo Code (Voucher Keyword) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ADDISVIP20 or HABESHA50"
                    value={promoForm.code}
                    onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold uppercase focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Applicable Event
                  </label>
                  <select
                    value={promoForm.eventId}
                    onChange={(e) => setPromoForm({ ...promoForm, eventId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400"
                  >
                    <option value="">All My Organized Events (Global Storewide)</option>
                    {myEvents.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      Discount Type
                    </label>
                    <select
                      value={promoForm.discountType}
                      onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400"
                    >
                      <option value="PERCENTAGE">Percentage (%) Off</option>
                      <option value="FIXED_AMOUNT">Fixed Amount (ETB) Off</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      Discount Value *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        required
                        value={promoForm.discountValue}
                        onChange={(e) => setPromoForm({ ...promoForm, discountValue: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-amber-400"
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400 font-bold">
                        {promoForm.discountType === 'PERCENTAGE' ? '%' : 'ETB'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      Min. Order Amount (ETB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={promoForm.minOrderAmount}
                      onChange={(e) => setPromoForm({ ...promoForm, minOrderAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                      placeholder="0 for none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      Max Total Redemptions
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={promoForm.maxUses}
                      onChange={(e) => setPromoForm({ ...promoForm, maxUses: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowPromoModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={promoCreating}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 px-5 py-2 text-xs font-bold text-black shadow-glowGold hover:from-amber-300 hover:to-yellow-300 transition disabled:opacity-50"
                  >
                    {promoCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-black" />
                        Generating Voucher...
                      </>
                    ) : (
                      <>
                        <Tag className="h-4 w-4 text-black" />
                        Save & Activate Promo Code
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Generate Gate Crew PIN */}
        {showCrewPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Generate Turnstile Staff PIN</h3>
                    <p className="text-xs text-slate-400">Create a 6-digit access code for event day staff</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCrewPinModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {crewPinError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-xs">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{crewPinError}</span>
                </div>
              )}

              <form onSubmit={handleCreateCrewPin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Gate Station / Turnstile Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. North Turnstile 1 or VIP Gate A"
                    value={crewPinForm.gateName}
                    onChange={(e) => setCrewPinForm({ ...crewPinForm, gateName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Crew / Volunteer Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dawit Kebede or Shift Team B"
                    value={crewPinForm.crewMemberName}
                    onChange={(e) => setCrewPinForm({ ...crewPinForm, crewMemberName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    PIN Validity Window (Hours)
                  </label>
                  <select
                    value={crewPinForm.validHours}
                    onChange={(e) => setCrewPinForm({ ...crewPinForm, validHours: parseInt(e.target.value) || 24 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400"
                  >
                    <option value="6">6 Hours (Single Shift)</option>
                    <option value="12">12 Hours (Half Day)</option>
                    <option value="24">24 Hours (Event Day Standard)</option>
                    <option value="48">48 Hours (Multi-Day Festival)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCrewPinModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={crewPinCreating}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 px-5 py-2 text-xs font-bold text-black shadow-glowGold hover:from-amber-300 hover:to-yellow-300 transition disabled:opacity-50"
                  >
                    {crewPinCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-black" />
                        Generating PIN...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 text-black" />
                        Generate 6-Digit PIN
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

  // ==========================================
  // UNAUTHENTICATED ORGANIZER AUTH VIEW
  // ==========================================
  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 shadow-glowGold text-black font-black text-2xl mb-4">
            🏢
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Organizer Portal
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Create an account or log in to publish events, manage tickets, and track Telebirr/CBE revenues.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 rounded-xl bg-slate-900 border border-white/10 p-1 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`py-2.5 text-sm font-bold rounded-lg transition ${
              activeTab === 'login'
                ? 'bg-amber-500 text-black shadow-glowGold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Organizer Login
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`py-2.5 text-sm font-bold rounded-lg transition ${
              activeTab === 'register'
                ? 'bg-amber-500 text-black shadow-glowGold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* TAB 1: LOGIN */}
        {activeTab === 'login' && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Phone className="h-5 w-5 text-amber-400" />
                Phone-Centric Organizer Login
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your registered Ethiopian phone number to receive a secure SMS OTP.
              </p>
            </div>

            {loginError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Organizer Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-400 font-medium">
                      🇪🇹 +251
                    </span>
                    <input
                      type="tel"
                      required
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="911223344"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-20 pr-4 py-3 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 py-3 font-bold text-black shadow-glowGold hover:from-amber-300 hover:to-yellow-300 transition active:scale-95 disabled:opacity-50 text-sm"
                >
                  {loginLoading ? 'Sending OTP Code...' : 'Send Verification OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-widest font-mono text-xl rounded-xl border border-slate-700 bg-slate-800/90 py-3 text-white focus:border-amber-400 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1 text-center">
                    (Mock OTP is active: code sent to {loginPhone})
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 py-3 font-bold text-black shadow-glowGold hover:from-amber-300 hover:to-yellow-300 transition active:scale-95 disabled:opacity-50 text-sm"
                >
                  {loginLoading ? 'Verifying...' : 'Verify & Enter Dashboard'}
                </button>

                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-xs text-slate-400 hover:text-white transition py-1 text-center"
                >
                  Change Phone Number
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: REGISTER */}
        {activeTab === 'register' && (
          <form
            onSubmit={handleRegister}
            className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 space-y-5"
          >
            <div className="border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-400" />
                Register Organization / Promoter
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Fill in your company & settlement details to publish events with automated payouts.
              </p>
            </div>

            {regError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            {/* Organization Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Organization / Company Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={regForm.organizationName}
                onChange={(e) => setRegForm({ ...regForm, organizationName: e.target.value })}
                placeholder="e.g. Habesha Concerts PLC, Addis Tech Expo"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none text-sm"
              />
            </div>

            {/* Representative Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contact Person Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regForm.fullName}
                  onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                  placeholder="e.g. Dawit Yohannes"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number <span className="text-amber-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={regForm.phoneNumber}
                  onChange={(e) => setRegForm({ ...regForm, phoneNumber: e.target.value })}
                  placeholder="0911223344"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Email & License */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="info@habeshaconcerts.et"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  TIN / Trade License No.
                </label>
                <input
                  type="text"
                  value={regForm.businessLicenseNo}
                  onChange={(e) => setRegForm({ ...regForm, businessLicenseNo: e.target.value })}
                  placeholder="TIN-00982314"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Bank / Payout Section */}
            <div className="pt-2 border-t border-white/10 space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Settlement & Payout Account
              </span>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bank / Mobile Money Provider <span className="text-amber-400">*</span>
                </label>
                <select
                  value={regForm.bankName}
                  onChange={(e) => setRegForm({ ...regForm, bankName: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-white focus:border-amber-400 focus:outline-none text-sm"
                >
                  {ETHIOPIAN_BANKS.map((b, i) => (
                    <option key={i} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Account / Till Number <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.bankAccountNo}
                    onChange={(e) => setRegForm({ ...regForm, bankAccountNo: e.target.value })}
                    placeholder="1000123456789"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Account Holder Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.bankAccountName}
                    onChange={(e) => setRegForm({ ...regForm, bankAccountName: e.target.value })}
                    placeholder="Habesha Concerts PLC"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 py-3.5 font-bold text-black shadow-glowGold hover:from-amber-300 hover:to-yellow-300 transition active:scale-95 disabled:opacity-50 text-sm mt-4"
            >
              {regLoading ? 'Creating Account...' : 'Complete Organizer Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
