'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  TrendingUp,
  DollarSign,
  Ticket,
  Users,
  Eye,
  Calendar,
  MapPin,
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
  Search,
  Filter,
  CreditCard,
  Phone,
  Mail,
  ShieldCheck,
  Ban,
  MessageSquare,
  Send,
  Radio,
  Calculator,
  ArrowUpRight,
  Check,
  Lock,
  LogOut,
  KeyRound,
  Fingerprint,
  Shield,
  Clock,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import {
  AdminAnalytics,
  EventModerationItem,
  AdminOrganizerItem,
  SmsLogItem,
  SettlementSummaryItem,
  SettlementCalculation,
  OrganizerSession
} from '@/lib/types';

export default function AdminPortalPage() {
  // Session & Auth state
  const [session, setSession] = useState<OrganizerSession | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Admin Login Gateway Form State
  const [loginMode, setLoginMode] = useState<'passcode' | 'otp'>('passcode');
  const [adminPhone, setAdminPhone] = useState('+251911000001');
  const [adminPasscode, setAdminPasscode] = useState('Admin@EthioEvents2026!');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard Data State
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [events, setEvents] = useState<EventModerationItem[]>([]);
  const [organizers, setOrganizers] = useState<AdminOrganizerItem[]>([]);
  const [smsLogs, setSmsLogs] = useState<SmsLogItem[]>([]);
  const [settlements, setSettlements] = useState<SettlementSummaryItem[]>([]);
  const [settlementCalc, setSettlementCalc] = useState<SettlementCalculation | null>(null);
  const [selectedEventForCalc, setSelectedEventForCalc] = useState<string>('');
  const [calculatingSettlement, setCalculatingSettlement] = useState(false);
  const [generatingSettlement, setGeneratingSettlement] = useState(false);
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null);
  const [smsPhoneFilter, setSmsPhoneFilter] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [retryingSmsId, setRetryingSmsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'approvals' | 'organizers' | 'financials' | 'sms'>('approvals');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_APPROVAL');
  const [searchQuery, setSearchQuery] = useState('');

  // Moderation state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackInput, setFeedbackInput] = useState<{ [key: string]: string }>({});
  const [showRejectPromptId, setShowRejectPromptId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const curSession = authStorage.getSession();
    setSession(curSession);
    setAuthChecking(false);

    if (curSession && curSession.token && curSession.role === 'ADMIN') {
      loadAdminData();
    } else {
      setLoading(false);
    }

    const handleAuthChange = () => {
      const s = authStorage.getSession();
      setSession(s);
      if (s && s.token && s.role === 'ADMIN') {
        loadAdminData();
      } else {
        setLoading(false);
      }
    };

    window.addEventListener('ethioevents_auth_changed', handleAuthChange);
    return () => window.removeEventListener('ethioevents_auth_changed', handleAuthChange);
  }, [statusFilter, activeTab]);

  const loadAdminData = async () => {
    try {
      setRefreshing(true);
      const [analyticsData, eventsData, organizersData, smsLogsData, settlementsData] = await Promise.all([
        api.getAdminAnalytics().catch((err) => {
          if (err?.message?.includes('401') || err?.message?.includes('UNAUTHORIZED') || err?.message?.includes('403')) {
            authStorage.clearSession();
          }
          return null;
        }),
        api.getAdminEvents(statusFilter === 'ALL' ? undefined : statusFilter).catch(() => []),
        api.getAdminOrganizers().catch(() => []),
        api.getAdminSmsLogs(smsPhoneFilter || undefined).catch(() => []),
        api.getAdminSettlements().catch(() => []),
      ]);

      setAnalytics(analyticsData);
      setEvents(eventsData);
      setOrganizers(organizersData);
      setSmsLogs(smsLogsData);
      setSettlements(settlementsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auth Handlers
  const handlePasscodeLogin = async (e?: React.FormEvent, customPass?: string) => {
    if (e) e.preventDefault();
    const pass = customPass !== undefined ? customPass : adminPasscode;
    if (!pass) {
      setLoginError('Please enter the Admin Security Passkey.');
      return;
    }
    try {
      setLoginLoading(true);
      setLoginError(null);
      const res = await api.adminLogin({
        phoneNumber: adminPhone,
        passcode: pass,
      });
      authStorage.setSession(res);
      setSession(res);
      showToast('🛡️ Welcome, EthioEvents Platform Administrator!');
      await loadAdminData();
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed. Please verify your security key.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!adminPhone) {
      setLoginError('Please enter an admin phone number.');
      return;
    }
    try {
      setLoginLoading(true);
      setLoginError(null);
      await api.requestOtp(adminPhone);
      setOtpSent(true);
      showToast(`Verification code dispatched to ${adminPhone}`);
    } catch (err: any) {
      setLoginError(err.message || 'Failed to dispatch SMS verification code.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setLoginError('Please enter the 6-digit SMS verification code.');
      return;
    }
    try {
      setLoginLoading(true);
      setLoginError(null);
      const res = await api.adminLogin({
        phoneNumber: adminPhone,
        otpCode: otpCode,
      });
      authStorage.setSession(res);
      setSession(res);
      showToast('🛡️ Phone verification successful! Governance console unlocked.');
      await loadAdminData();
    } catch (err: any) {
      setLoginError(err.message || 'Invalid or expired SMS OTP code.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to terminate this Governance Admin session?')) {
      authStorage.clearSession();
      setSession(null);
      showToast('🔒 Governance session locked.');
    }
  };

  const handleCalculateSettlement = async (eventId: string) => {
    if (!eventId) return;
    try {
      setCalculatingSettlement(true);
      const calc = await api.calculateAdminSettlement(eventId);
      setSettlementCalc(calc);
    } catch (err: any) {
      alert(`Calculation failed: ${err.message}`);
    } finally {
      setCalculatingSettlement(false);
    }
  };

  const handleGenerateSettlement = async (eventId: string) => {
    if (!eventId) return;
    try {
      setGeneratingSettlement(true);
      const res = await api.generateAdminSettlement(eventId);
      showToast(`✅ Generated settlement batch for "${res.eventTitle}" (${res.payoutAmount.toLocaleString()} ETB)`);
      setSettlementCalc(null);
      await loadAdminData();
    } catch (err: any) {
      alert(`Settlement generation failed: ${err.message}`);
    } finally {
      setGeneratingSettlement(false);
    }
  };

  const handleProcessPayout = async (settlementId: string, orgName: string, amount: number) => {
    try {
      setProcessingPayoutId(settlementId);
      const res = await api.processAdminPayout(settlementId, { notifyOrganizerBySms: true });
      showToast(`🎉 Payout of ${amount.toLocaleString()} ETB disbursed to ${orgName}! Ref: ${res.payoutReference}`);
      await loadAdminData();
    } catch (err: any) {
      alert(`Payout processing failed: ${err.message}`);
    } finally {
      setProcessingPayoutId(null);
    }
  };

  const handleRetrySms = async (id: string, phone: string) => {
    try {
      setRetryingSmsId(id);
      await api.retryAdminSms(id);
      showToast(`⚡ SMS successfully re-dispatched to ${phone}`);
      const updatedLogs = await api.getAdminSmsLogs(smsPhoneFilter || undefined).catch(() => []);
      setSmsLogs(updatedLogs);
    } catch (err: any) {
      alert(`SMS retry failed: ${err.message}`);
    } finally {
      setRetryingSmsId(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Event Approval
  const handleApprove = async (eventId: string, title: string) => {
    try {
      setActionLoadingId(eventId);
      await api.approveEvent(eventId);
      showToast(`✅ "${title}" has been APPROVED and is now live on the homepage!`);
      await loadAdminData();
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Event Rejection
  const handleReject = async (eventId: string, title: string) => {
    try {
      setActionLoadingId(eventId);
      const feedback = feedbackInput[eventId] || 'Event does not meet current platform standards';
      await api.rejectEvent(eventId, feedback);
      setShowRejectPromptId(null);
      showToast(`❌ "${title}" has been marked as REJECTED.`);
      await loadAdminData();
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Organizer Verification
  const handleVerifyOrg = async (orgId: string, orgName: string) => {
    try {
      setActionLoadingId(orgId);
      await api.verifyOrganizer(orgId);
      showToast(`🛡️ ${orgName} verified successfully!`);
      await loadAdminData();
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Organizer Suspension
  const handleSuspendOrg = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to suspend ${orgName}?`)) return;
    try {
      setActionLoadingId(orgId);
      await api.suspendOrganizer(orgId);
      showToast(`⚠️ ${orgName} suspended.`);
      await loadAdminData();
    } catch (err: any) {
      alert(`Suspension failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.venueName.toLowerCase().includes(q) ||
      e.organizationName.toLowerCase().includes(q)
    );
  });

  // 1. Initial Loading Screen
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-slate-300">
        <div className="relative mb-4">
          <div className="h-16 w-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 animate-ping absolute inset-0"></div>
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black text-2xl shadow-glowGold relative">
            🛡️
          </div>
        </div>
        <p className="text-sm font-semibold tracking-wider uppercase text-amber-400">Verifying Governance Credentials...</p>
      </div>
    );
  }

  // 2. Unauthenticated Admin Gate Screen
  if (!session || !session.token || session.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Decorative Lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-amber-500/40 bg-slate-900/95 backdrop-blur-xl p-4 text-sm font-semibold text-amber-300 shadow-2xl shadow-amber-500/20 animate-in fade-in slide-in-from-bottom-5">
            {toastMessage}
          </div>
        )}

        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-black font-black text-3xl shadow-glowGold mb-2">
              🛡️
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ethio<span className="text-amber-400">Events</span> Governance
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 flex items-center justify-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              Restricted Platform Administrator Access
            </p>
          </div>

          {/* Main Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Mode Switcher */}
            <div className="flex rounded-2xl bg-slate-950/80 p-1 border border-slate-800/80">
              <button
                type="button"
                onClick={() => { setLoginMode('passcode'); setLoginError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  loginMode === 'passcode'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="h-4 w-4" />
                Security Passkey
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('otp'); setLoginError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  loginMode === 'otp'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                SMS Two-Factor (2FA)
              </button>
            </div>

            {/* Error Banner */}
            {loginError && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2.5 animate-in fade-in">
                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Form Mode 1: Passkey */}
            {loginMode === 'passcode' && (
              <form onSubmit={handlePasscodeLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Admin Identifier (Phone)</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      placeholder="+251911000001"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Master Governance Passcode</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      required
                    />
                  </div>
                </div>

                {/* Quick 1-Click Demo Admin Button */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-center justify-between">
                  <div className="text-[11px] text-amber-300/80">
                    <span className="font-bold text-amber-300">Demo Passkey:</span> <code className="bg-black/40 px-1 py-0.5 rounded text-amber-200">Admin@EthioEvents2026!</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminPhone('+251911000001');
                      setAdminPasscode('Admin@EthioEvents2026!');
                      handlePasscodeLogin(undefined, 'Admin@EthioEvents2026!');
                    }}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition active:scale-95"
                  >
                    ⚡ Auto-Fill & Login
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 py-3 text-sm font-bold text-black shadow-glowGold transition-all disabled:opacity-50 active:scale-98"
                >
                  {loginLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-black" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-black" />
                  )}
                  <span>{loginLoading ? 'Authenticating...' : 'Authorize Governance Access'}</span>
                </button>
              </form>
            )}

            {/* Form Mode 2: SMS OTP */}
            {loginMode === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Registered Admin Phone</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                        placeholder="+251911000001"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={loginLoading}
                      className="rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2.5 text-xs font-bold text-amber-300 transition shrink-0 disabled:opacity-50"
                    >
                      {otpSent ? 'Resend' : 'Send Code'}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <label className="text-xs font-semibold text-slate-300">6-Digit Verification Code</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-2.5 text-sm text-white font-mono tracking-widest text-center placeholder-slate-600 focus:border-amber-400 focus:outline-none"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Check your SMS inbox for the EthioTelecom / AfricasTalking verification code.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading || !otpSent || otpCode.length !== 6}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 py-3 text-sm font-bold text-black shadow-glowGold transition-all disabled:opacity-50 active:scale-98"
                >
                  {loginLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-black" />
                  ) : (
                    <UserCheck className="h-4 w-4 text-black" />
                  )}
                  <span>{loginLoading ? 'Verifying...' : 'Verify OTP & Unlock'}</span>
                </button>
              </form>
            )}

            {/* Regulatory & Security Compliance */}
            <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                256-Bit TLS / JWT Audited
              </span>
              <span>FDRE Proclamation 1205/2020</span>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-amber-400 inline-flex items-center gap-1 transition"
            >
              ← Return to EthioEvents Public Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Dashboard
  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-amber-500/40 bg-slate-900/95 backdrop-blur-xl p-4 text-sm font-semibold text-amber-300 shadow-2xl shadow-amber-500/20 animate-in fade-in slide-in-from-bottom-5">
            {toastMessage}
          </div>
        )}

        {/* Top Active Session Governance Bar */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-300">Governance Session Active:</span>
              <span className="text-slate-200 font-semibold">{session.fullName || 'EthioEvents Admin'}</span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono">
                {session.phoneNumber || '+251911000001'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-slate-400 text-[11px]">
              🔒 256-Bit AES / Ed25519 Verified
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-red-300 hover:text-red-200 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 px-3 py-1.5 rounded-xl transition active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5 text-red-400" />
              Sign Out & Lock
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-black font-black text-2xl shadow-glowGold">
                🛡️
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                  Platform Admin Portal
                  <span className="text-xs uppercase font-bold tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                    Super Admin
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Addis Ababa Event Moderation, Organizer Compliance & Platform Financials
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAdminData}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition"
            >
              <ExternalLink className="h-4 w-4 text-amber-400" />
              Client Home Page
            </Link>
          </div>
        </div>

        {/* KPI Analytics Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* GMV Volume */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 p-5">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Gross Platform GMV</span>
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-white">
              {(analytics?.totalGrossRevenueEtb || 0).toLocaleString()} <span className="text-amber-400 text-sm">ETB</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Total Telebirr & Chapa sales</p>
          </div>

          {/* Platform Commission */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 p-5">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Platform Commission (5%)</span>
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="text-2xl font-black text-emerald-300">
              {(analytics?.platformCommissionFeeEtb || 0).toLocaleString()} <span className="text-emerald-400 text-sm">ETB</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Platform earnings retained</p>
          </div>

          {/* Total Tickets Issued */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Tickets Issued</span>
              <Ticket className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {(analytics?.totalTicketsIssued || 0).toLocaleString()}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Ed25519 digitally signed passes</p>
          </div>

          {/* Pending Moderation Queue */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
              {analytics?.pendingEventsCount && analytics.pendingEventsCount > 0 ? (
                <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
              ) : null}
            </div>
            <div className="text-2xl font-black text-amber-300">
              {analytics?.pendingEventsCount || 0}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Events waiting for admin review</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'approvals'
                  ? 'bg-amber-500 text-black shadow-glowGold'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              Event Moderation Queue
              {analytics?.pendingEventsCount && analytics.pendingEventsCount > 0 ? (
                <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs text-white">
                  {analytics.pendingEventsCount}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('organizers')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'organizers'
                  ? 'bg-amber-500 text-black shadow-glowGold'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
              }`}
            >
              <Building2 className="h-4 w-4" />
              Organizers & Compliance ({organizers.length})
            </button>

            <button
              onClick={() => setActiveTab('financials')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'financials'
                  ? 'bg-amber-500 text-black shadow-glowGold'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Financial Settlements
            </button>

            <button
              onClick={() => setActiveTab('sms')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'sms'
                  ? 'bg-amber-500 text-black shadow-glowGold'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              SMS & Notifications ({smsLogs.length})
            </button>
          </div>

          {/* Search bar */}
          {activeTab === 'approvals' && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: EVENT APPROVAL / MODERATION QUEUE */}
        {/* ======================================================== */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            {/* Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold mr-1">Filter by:</span>
              {[
                { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
                { label: 'Published & Live', value: 'PUBLISHED' },
                { label: 'Rejected', value: 'REJECTED' },
                { label: 'All Events', value: 'ALL' },
              ].map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setStatusFilter(chip.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    statusFilter === chip.value
                      ? 'bg-amber-400 text-black font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Events List */}
            {filteredEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-12 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-3 opacity-80" />
                <h3 className="text-base font-bold text-white">No Events in this Queue</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {statusFilter === 'PENDING_APPROVAL'
                    ? 'All submitted events have been moderated. Good job!'
                    : 'No events match the selected status filter.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-4 hover:border-slate-700 transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      {/* Left: Poster + Core Details */}
                      <div className="flex gap-4 flex-1">
                        <img
                          src={evt.bannerImageUrl}
                          alt={evt.title}
                          className="h-28 w-32 rounded-xl object-cover border border-white/10 flex-shrink-0"
                        />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                                evt.status === 'PUBLISHED'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : evt.status === 'PENDING_APPROVAL'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {evt.status}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-amber-400" />
                              <strong className="text-slate-200">{evt.organizationName}</strong>
                              {evt.organizerPhone && ` (${evt.organizerPhone})`}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-white truncate">{evt.title}</h3>
                          <p className="text-xs text-slate-400 line-clamp-2">{evt.description}</p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-amber-400" />
                              {evt.venueName} • {evt.venueAddress}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-amber-400" />
                              {evt.startTime.ethiopianFullFormatted}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Moderation Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-2.5 flex-shrink-0">
                        {evt.status === 'PENDING_APPROVAL' && (
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleApprove(evt.id, evt.title)}
                              disabled={actionLoadingId === evt.id}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-black transition shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Approve & Publish
                            </button>

                            <button
                              onClick={() => setShowRejectPromptId(evt.id)}
                              disabled={actionLoadingId === evt.id}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 px-3.5 py-2 text-xs font-bold text-rose-300 transition active:scale-95"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </button>
                          </div>
                        )}

                        {evt.status === 'PUBLISHED' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Live on Homepage
                            </span>
                            <button
                              onClick={() => handleReject(evt.id, evt.title)}
                              className="text-xs text-rose-400 hover:text-rose-300 underline"
                            >
                              Unpublish / Take Down
                            </button>
                          </div>
                        )}

                        {evt.status === 'REJECTED' && (
                          <button
                            onClick={() => handleApprove(evt.id, evt.title)}
                            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 transition"
                          >
                            Re-Approve Event
                          </button>
                        )}

                        <Link
                          href={`/events/${evt.slug}`}
                          target="_blank"
                          className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-1"
                        >
                          Preview Event Page
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>

                    {/* Rejection Feedback Box */}
                    {showRejectPromptId === evt.id && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 space-y-2 animate-in fade-in duration-200">
                        <label className="block text-xs font-semibold text-rose-300">
                          Rejection Reason & Feedback for Organizer:
                        </label>
                        <input
                          type="text"
                          value={feedbackInput[evt.id] || ''}
                          onChange={(e) =>
                            setFeedbackInput({ ...feedbackInput, [evt.id]: e.target.value })
                          }
                          placeholder="e.g. Invalid banner resolution or pricing discrepancy"
                          className="w-full rounded-lg border border-rose-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setShowRejectPromptId(null)}
                            className="px-3 py-1 rounded text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleReject(evt.id, evt.title)}
                            disabled={actionLoadingId === evt.id}
                            className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                          >
                            Confirm Rejection
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Ticket Tiers Preview Table */}
                    <div className="border-t border-white/5 pt-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Configured Ticket Tiers ({evt.ticketTiers.length}):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {evt.ticketTiers.map((tier) => (
                          <div
                            key={tier.id}
                            className="rounded-lg bg-slate-800/70 border border-slate-700/80 p-2 text-xs"
                          >
                            <div className="font-bold text-white truncate">{tier.name}</div>
                            <div className="text-amber-400 font-extrabold">{tier.price} ETB</div>
                            <div className="text-[10px] text-slate-400">
                              Capacity: {tier.availableCapacity} / {tier.maxPerUser} per user
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ORGANIZERS DIRECTORY & COMPLIANCE */}
        {/* ======================================================== */}
        {activeTab === 'organizers' && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Registered Promoters & Organizers</h3>
                <p className="text-xs text-slate-400">
                  Verify business licenses and settlement bank accounts for payout authorization.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/40">
                  <tr>
                    <th className="py-3 px-4">Organization Name</th>
                    <th className="py-3 px-4">Contact Person</th>
                    <th className="py-3 px-4">Phone / Email</th>
                    <th className="py-3 px-4">TIN / License</th>
                    <th className="py-3 px-4">Payout Account</th>
                    <th className="py-3 px-4">Events</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {organizers.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-amber-400 flex-shrink-0" />
                        {org.organizationName}
                      </td>
                      <td className="py-3.5 px-4">{org.ownerName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        <div>{org.ownerPhone}</div>
                        {org.ownerEmail && <div className="text-[10px] text-slate-500">{org.ownerEmail}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {org.businessLicenseNo || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{org.bankName}</div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {org.bankAccountNo} ({org.bankAccountName})
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">{org.totalEventsCount}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                            org.status === 'VERIFIED'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : org.status === 'SUSPENDED'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {org.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {org.status !== 'VERIFIED' ? (
                          <button
                            onClick={() => handleVerifyOrg(org.id, org.organizationName)}
                            disabled={actionLoadingId === org.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold transition mr-2"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Verify
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspendOrg(org.id, org.organizationName)}
                            disabled={actionLoadingId === org.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 text-[11px] font-bold transition"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: FINANCIAL SETTLEMENTS & COMMISSION */}
        {/* ======================================================== */}
        {activeTab === 'financials' && (
          <div className="space-y-8">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Completed Ticket Orders
                </span>
                <div className="text-2xl font-black text-white">
                  {analytics?.totalOrdersCompleted || 0}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Direct Telebirr & Chapa sales</p>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-slate-900/60 p-5">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1">
                  Net Organizer Pool (95%)
                </span>
                <div className="text-2xl font-black text-amber-400">
                  {((analytics?.totalGrossRevenueEtb || 0) * 0.95).toLocaleString()} <span className="text-xs font-normal">ETB</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Total net payout liability</p>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-5">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  Platform Commission (5%)
                </span>
                <div className="text-2xl font-black text-emerald-400">
                  {(analytics?.platformCommissionFeeEtb || 0).toLocaleString()} <span className="text-xs font-normal">ETB</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">EthioEvents transaction fee retained</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Settlements Processed
                </span>
                <div className="text-2xl font-black text-white">
                  {settlements.length}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Bank transfers & till disbursements</p>
              </div>
            </div>

            {/* Event Settlement Calculator & Batch Generator */}
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/90 to-slate-950 p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-amber-400" />
                    Event Settlement Calculator & Batch Generator
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Select an event to preview revenue totals, calculate 5% commission, and generate organizer bank transfer
                  </p>
                </div>

                {/* Event Selector */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedEventForCalc}
                    onChange={(e) => {
                      setSelectedEventForCalc(e.target.value);
                      if (e.target.value) handleCalculateSettlement(e.target.value);
                      else setSettlementCalc(null);
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none max-w-xs"
                  >
                    <option value="">-- Choose Published Event --</option>
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} ({evt.organizationName})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleCalculateSettlement(selectedEventForCalc)}
                    disabled={!selectedEventForCalc || calculatingSettlement}
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-4 py-2 text-xs transition shadow-glowGold disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Calculator className={`h-3.5 w-3.5 ${calculatingSettlement ? 'animate-spin' : ''}`} />
                    <span>{calculatingSettlement ? 'Calculating...' : 'Calculate'}</span>
                  </button>
                </div>
              </div>

              {/* Settlement Preview Card */}
              {settlementCalc && (
                <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">{settlementCalc.eventTitle}</h4>
                      <p className="text-xs text-slate-400">
                        Organizer: <strong className="text-white">{settlementCalc.organizationName}</strong> • Bank:{' '}
                        <strong className="text-amber-300 font-mono">
                          {settlementCalc.bankName} ({settlementCalc.bankAccountNo})
                        </strong>
                      </p>
                    </div>

                    {settlementCalc.alreadySettled ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold">
                        <Check className="h-3.5 w-3.5" />
                        Settlement Batch Generated
                      </span>
                    ) : (
                      <button
                        onClick={() => handleGenerateSettlement(settlementCalc.eventId)}
                        disabled={generatingSettlement}
                        className="bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold px-4 py-2 rounded-xl text-xs shadow-glowGold transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <ArrowUpRight className="h-4 w-4 text-black" />
                        <span>{generatingSettlement ? 'Generating...' : 'Generate Settlement Batch'}</span>
                      </button>
                    )}
                  </div>

                  {/* Financial Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5">
                      <span className="text-slate-400 block text-[11px]">Paid Orders / Tickets</span>
                      <strong className="text-sm text-white font-bold block mt-0.5">
                        {settlementCalc.totalPaidOrders} orders ({settlementCalc.totalTicketsSold} tickets)
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5">
                      <span className="text-slate-400 block text-[11px]">Gross Revenue</span>
                      <strong className="text-sm text-white font-bold block mt-0.5">
                        {settlementCalc.totalGrossRevenue.toLocaleString()} ETB
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
                      <span className="text-emerald-400 block text-[11px]">Platform Fee (5%)</span>
                      <strong className="text-sm text-emerald-300 font-bold block mt-0.5">
                        - {settlementCalc.platformCommissionFee.toLocaleString()} ETB
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30">
                      <span className="text-amber-300 block text-[11px]">Net Organizer Payout (95%)</span>
                      <strong className="text-base text-amber-400 font-black block mt-0.5">
                        {settlementCalc.payoutAmount.toLocaleString()} ETB
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Settlements Ledger Table */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-xl space-y-0">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Organizer Settlements & Payout Ledger</h3>
                  <p className="text-xs text-slate-400">All recorded event disbursements and bank transfers</p>
                </div>
                <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-white/10">
                  {settlements.length} Records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="px-5 py-3.5 font-bold">Event & Organizer</th>
                      <th className="px-5 py-3.5 font-bold">Bank / Till Info</th>
                      <th className="px-5 py-3.5 font-bold text-right">Gross GMV</th>
                      <th className="px-5 py-3.5 font-bold text-right">5% Platform Fee</th>
                      <th className="px-5 py-3.5 font-bold text-right">Net Payout</th>
                      <th className="px-5 py-3.5 font-bold text-center">Status</th>
                      <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {settlements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                          No settlements generated yet. Select an event above to calculate and generate a settlement batch.
                        </td>
                      </tr>
                    ) : (
                      settlements.map((st) => (
                        <tr key={st.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-5 py-4">
                            <p className="font-bold text-white text-xs">{st.eventTitle}</p>
                            <p className="text-slate-400 text-[11px]">{st.organizationName}</p>
                            {st.payoutReference && (
                              <span className="font-mono text-[10px] text-amber-400/80 bg-black/40 px-1.5 py-0.5 rounded border border-amber-500/20 mt-1 inline-block">
                                Ref: {st.payoutReference}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-300">{st.bankName}</p>
                            <p className="font-mono text-slate-400 text-[11px]">{st.bankAccountNo}</p>
                          </td>
                          <td className="px-5 py-4 text-right font-mono font-bold text-slate-300">
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
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse'
                              }`}
                            >
                              {st.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {st.status !== 'COMPLETED' ? (
                              <button
                                onClick={() => handleProcessPayout(st.id, st.organizationName, st.payoutAmount)}
                                disabled={processingPayoutId === st.id}
                                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold px-3 py-1.5 rounded-xl text-xs shadow transition active:scale-95 disabled:opacity-50"
                              >
                                <CreditCard className={`h-3.5 w-3.5 ${processingPayoutId === st.id ? 'animate-spin' : ''}`} />
                                <span>{processingPayoutId === st.id ? 'Disbursing...' : 'Disburse Payout'}</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">
                                Disbursed on {st.processedAt ? new Date(st.processedAt).toLocaleDateString() : 'N/A'}
                              </span>
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

        {/* ======================================================== */}
        {/* TAB 4: SMS & NOTIFICATIONS MONITORING */}
        {/* ======================================================== */}
        {activeTab === 'sms' && (
          <div className="space-y-6">
            {/* Header & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/70 border border-white/10">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Radio className="h-5 w-5 text-amber-400" />
                  SMS Notification Audit & Dispatch Logs
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time delivery history across Ethio Telecom, Africa's Talking, Twilio, and Mock gateways
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter by Phone (+251...)"
                  value={smsPhoneFilter}
                  onChange={(e) => setSmsPhoneFilter(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-amber-400 focus:outline-none"
                />
                <button
                  onClick={() => loadAdminData()}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold px-3 py-1.5 text-xs transition"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Provider Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/20">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">Ethio Telecom</span>
                <span className="text-xs text-slate-400 mt-1 block">Shortcode Gateway</span>
                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 rounded">Ready</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-sky-500/20">
                <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider block">Africa's Talking</span>
                <span className="text-xs text-slate-400 mt-1 block">East Africa SMS API</span>
                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold bg-sky-400/20 text-sky-300 rounded">Ready</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-purple-500/20">
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">Twilio Global</span>
                <span className="text-xs text-slate-400 mt-1 block">International Fallback</span>
                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold bg-purple-400/20 text-purple-300 rounded">Ready</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">Dev Mock Sim</span>
                <span className="text-xs text-slate-400 mt-1 block">Console Logger</span>
                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold bg-emerald-400/20 text-emerald-300 rounded">Active Dev</span>
              </div>
            </div>

            {/* Logs Table */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="px-5 py-3 font-bold">Recipient Phone</th>
                      <th className="px-5 py-3 font-bold">Message Type</th>
                      <th className="px-5 py-3 font-bold">Provider</th>
                      <th className="px-5 py-3 font-bold">Delivery Status</th>
                      <th className="px-5 py-3 font-bold">Message Snippet</th>
                      <th className="px-5 py-3 font-bold">Timestamp</th>
                      <th className="px-5 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {smsLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                          No SMS logs found. Dispatches will appear here upon customer booking or login OTP requests.
                        </td>
                      </tr>
                    ) : (
                      smsLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-5 py-4 font-mono font-bold text-white whitespace-nowrap">
                            {log.phoneNumber}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                log.messageType === 'OTP'
                                  ? 'bg-sky-400/20 text-sky-300 border border-sky-400/30'
                                  : log.messageType === 'TICKET_CONFIRMATION'
                                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                  : 'bg-purple-400/20 text-purple-300 border border-purple-400/30'
                              }`}
                            >
                              {log.messageType}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono text-slate-300">
                            <span className="font-semibold text-[11px] text-amber-400">
                              {log.provider}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.status === 'SENT' || log.status === 'DELIVERED'
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {log.status === 'SENT' || log.status === 'DELIVERED' ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <XCircle className="h-3 w-3 text-rose-400" />
                              )}
                              <span>{log.status}</span>
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-300 max-w-xs truncate" title={log.content}>
                            {log.content}
                          </td>
                          <td className="px-5 py-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleTimeString()} • {new Date(log.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleRetrySms(log.id, log.phoneNumber)}
                              disabled={retryingSmsId === log.id}
                              className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold border border-white/10 transition active:scale-95 disabled:opacity-50"
                            >
                              <Send className={`h-3 w-3 text-amber-400 ${retryingSmsId === log.id ? 'animate-spin' : ''}`} />
                              <span>{retryingSmsId === log.id ? 'Sending...' : 'Resend'}</span>
                            </button>
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
      </div>
    </div>
  );
}
