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
  ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import { OrganizerProfile, OrganizerSession, EventSummary } from '@/lib/types';

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
  const [loading, setLoading] = useState(true);

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
    if (curSession && curSession.token) {
      loadDashboardData();
    } else {
      setLoading(false);
    }

    const handleAuthChange = () => {
      const s = authStorage.getSession();
      setSession(s);
      if (s && s.token) {
        loadDashboardData();
      }
    };
    window.addEventListener('ethioevents_auth_changed', handleAuthChange);
    return () => window.removeEventListener('ethioevents_auth_changed', handleAuthChange);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [prof, events] = await Promise.all([
        api.getOrganizerProfile().catch(() => null),
        api.getOrganizerEvents().catch(() => []),
      ]);
      setProfile(prof);
      setMyEvents(events);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

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
      await loadDashboardData();
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

          {/* My Organized Events Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                My Organized Events
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
        </div>
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
