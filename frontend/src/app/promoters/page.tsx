'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Users,
  MousePointerClick,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  Share2,
  Sparkles,
  Search,
  ExternalLink,
  Building,
  CreditCard,
  Send,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AffiliateDashboardData, EventSummary, AffiliateItem } from '@/lib/types';

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

export default function PromotersPortalPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'register'>('dashboard');

  // Lookup state
  const [lookupQuery, setLookupQuery] = useState('');
  const [dashboardData, setDashboardData] = useState<AffiliateDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event list for link generator
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEventSlug, setSelectedEventSlug] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Registration state
  const [regForm, setRegForm] = useState({
    promoterName: '',
    phoneNumber: '',
    email: '',
    affiliateCode: '',
    bankName: ETHIOPIAN_BANKS[0],
    bankAccountNo: '',
    bankAccountName: '',
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<AffiliateItem | null>(null);

  // Load available events for link builder
  useEffect(() => {
    api.getEvents()
      .then((evts) => {
        setEvents(evts);
        if (evts.length > 0) {
          setSelectedEventSlug(evts[0].slug);
        }
      })
      .catch(() => {});

    // Check if affiliate code is remembered in localStorage
    const savedCode = localStorage.getItem('ethioevents_affiliate_code');
    if (savedCode) {
      setLookupQuery(savedCode);
      fetchDashboard(savedCode);
    }
  }, []);

  const fetchDashboard = async (identifier: string) => {
    if (!identifier.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAffiliateDashboard(identifier.trim());
      setDashboardData(data);
      localStorage.setItem('ethioevents_affiliate_code', data.affiliate.affiliateCode);
    } catch (err: any) {
      setError(err.message || 'Could not find promoter account. Please check your code or phone number.');
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDashboard(lookupQuery);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (!regForm.promoterName.trim() || !regForm.phoneNumber.trim() || !regForm.affiliateCode.trim()) {
      setRegError('Please complete all required fields');
      return;
    }

    try {
      setRegLoading(true);
      const created = await api.registerAffiliate({
        promoterName: regForm.promoterName.trim(),
        phoneNumber: regForm.phoneNumber.trim(),
        email: regForm.email.trim() || undefined,
        affiliateCode: regForm.affiliateCode.trim().toLowerCase(),
        bankName: regForm.bankName,
        bankAccountNo: regForm.bankAccountNo.trim() || undefined,
        bankAccountName: regForm.bankAccountName.trim() || regForm.promoterName.trim(),
      });
      setRegSuccess(created);
      localStorage.setItem('ethioevents_affiliate_code', created.affiliateCode);
      fetchDashboard(created.affiliateCode);
      setActiveTab('dashboard');
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. The affiliate code may already be taken.');
    } finally {
      setRegLoading(false);
    }
  };

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://ethioevents.et';
  const generatedTrackingUrl = dashboardData
    ? selectedEventSlug
      ? `${currentHost}/events/${selectedEventSlug}?ref=${dashboardData.affiliate.affiliateCode}`
      : `${currentHost}/?ref=${dashboardData.affiliate.affiliateCode}`
    : '';

  const handleCopyLink = () => {
    if (!generatedTrackingUrl) return;
    navigator.clipboard.writeText(generatedTrackingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header Hero */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-400 shadow-glowGold text-black font-black text-2xl mb-2">
            🚀
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
            Promoter & Influencer Hub
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Share event links across Telegram channels, TikTok, and campuses. Earn automatic 5%–15% commission on every ticket sold with instant CBE & Telebirr payouts.
          </p>

          {/* Navigation Pill Tabs */}
          <div className="inline-flex rounded-xl bg-slate-900 border border-white/10 p-1 mt-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'dashboard'
                  ? 'bg-amber-400 text-black shadow-glowGold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Promoter Dashboard
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-6 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'register'
                  ? 'bg-amber-400 text-black shadow-glowGold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Become an Ambassador
            </button>
          </div>
        </div>

        {/* TAB 1: DASHBOARD & LOOKUP */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Lookup Bar */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl">
              <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Enter your Affiliate Code (e.g. tikvahethiopia) or Phone Number..."
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold px-5 py-2.5 transition shadow-glowGold disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span>Access Dashboard</span>
                </button>
              </form>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300 text-xs">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* If no dashboard loaded yet */}
            {!dashboardData && !loading && (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/20 p-12 text-center space-y-4">
                <Sparkles className="mx-auto h-12 w-12 text-amber-400/40" />
                <h3 className="text-base font-bold text-white">Track Your Referral Performance</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Enter your promoter code above or register a new ambassador code to start generating tracking links.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setLookupQuery('tikvahethiopia');
                      fetchDashboard('tikvahethiopia');
                    }}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline"
                  >
                    View Demo Promoter Profile (@tikvahethiopia)
                  </button>
                </div>
              </div>
            )}

            {/* Render Full Dashboard When Found */}
            {dashboardData && (
              <div className="space-y-6 animate-fadeIn">
                {/* Promoter Profile Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/20 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center font-black text-xl">
                      ⭐
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-xl font-black text-white">{dashboardData.affiliate.promoterName}</h2>
                        <span className="font-mono text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-lg">
                          @{dashboardData.affiliate.affiliateCode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Commission Rate: <strong className="text-emerald-400">{dashboardData.affiliate.commissionRate}% per ticket</strong> • Payouts: {dashboardData.affiliate.bankName}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Unpaid Available Balance
                    </span>
                    <div className="text-2xl font-black text-emerald-400 mt-0.5 font-mono">
                      {(dashboardData.affiliate.unpaidCommissionEtb ?? dashboardData.affiliate.totalCommissionEarnedEtb ?? 0).toLocaleString()} <span className="text-sm text-emerald-300">ETB</span>
                    </div>
                  </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-bold uppercase">Total Clicks</span>
                      <MousePointerClick className="h-4 w-4 text-sky-400" />
                    </div>
                    <div className="text-2xl font-black text-white font-mono">
                      {dashboardData.affiliate.totalClicks.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Unique link visitors</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-bold uppercase">Orders Sold</span>
                      <Users className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-white font-mono">
                      {(dashboardData.affiliate.totalConversions ?? dashboardData.affiliate.totalSalesCount ?? 0).toLocaleString()}
                    </div>
                    <p className="text-[11px] text-emerald-400 mt-1">
                      {dashboardData.conversionRate || Math.round(((dashboardData.affiliate.totalSalesCount || 0) / Math.max(1, dashboardData.affiliate.totalClicks)) * 100 * 10) / 10}% Conversion Rate
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-bold uppercase">Gross Sales Driven</span>
                      <TrendingUp className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-white font-mono">
                      {(dashboardData.affiliate.totalSalesEtb ?? dashboardData.affiliate.totalGrossRevenueEtb ?? 0).toLocaleString()} <span className="text-xs text-amber-400">ETB</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Total revenue generated</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-bold uppercase">Lifetime Earnings</span>
                      <DollarSign className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                      {(dashboardData.affiliate.totalCommissionEtb ?? dashboardData.affiliate.totalCommissionEarnedEtb ?? 0).toLocaleString()} <span className="text-xs text-amber-300">ETB</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Paid: {(dashboardData.affiliate.paidCommissionEtb || 0).toLocaleString()} ETB</p>
                  </div>
                </div>

                {/* Referral Link Builder Card */}
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-5 w-5 text-amber-400" />
                      <h3 className="text-base font-bold text-white">Your Custom Tracking Link</h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      Share this on your Telegram Channel or TikTok Bio
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-400 mb-1">Target Event</label>
                      <select
                        value={selectedEventSlug}
                        onChange={(e) => setSelectedEventSlug(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-amber-400"
                      >
                        <option value="">Home Page (All Events)</option>
                        {events.map((evt) => (
                          <option key={evt.id} value={evt.slug}>
                            {evt.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 mb-1">Your Tracking URL</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={generatedTrackingUrl}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-amber-300 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-glowGold flex-shrink-0"
                        >
                          {copiedLink ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                        <a
                          href={`https://t.me/share/url?url=${encodeURIComponent(generatedTrackingUrl)}&text=${encodeURIComponent(`Get your official verified tickets for ${events.find(e => e.slug === selectedEventSlug)?.title || 'EthioEvents'} via Telebirr & Chapa!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-[#229ED9] hover:bg-[#1E88E5] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition flex-shrink-0"
                          title="Share to Telegram"
                        >
                          <Send className="h-4 w-4" />
                          <span className="hidden md:inline">Telegram</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Referral Conversions Ledger */}
                <div className="rounded-3xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-xl">
                  <div className="p-5 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-amber-400" />
                      <span>Recent Ticket Referral Conversions</span>
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {dashboardData.recentReferrals.length} Orders Recorded
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                        <tr>
                          <th className="px-5 py-3.5 font-bold">Order #</th>
                          <th className="px-5 py-3.5 font-bold">Event</th>
                          <th className="px-5 py-3.5 font-bold text-right">Order Amount</th>
                          <th className="px-5 py-3.5 font-bold text-right">Your Commission</th>
                          <th className="px-5 py-3.5 font-bold text-center">Status</th>
                          <th className="px-5 py-3.5 font-bold text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {dashboardData.recentReferrals.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                              No ticket sales generated yet. Share your tracking link on Telegram and social media!
                            </td>
                          </tr>
                        ) : (
                          dashboardData.recentReferrals.map((ref) => (
                            <tr key={ref.id} className="hover:bg-slate-800/40 transition">
                              <td className="px-5 py-4 font-mono font-bold text-white">
                                {ref.orderNumber}
                              </td>
                              <td className="px-5 py-4 text-slate-300 font-semibold">
                                {ref.eventTitle}
                              </td>
                              <td className="px-5 py-4 text-right font-mono text-slate-300">
                                {(ref.orderAmount ?? ref.orderAmountEtb ?? 0).toLocaleString()} ETB
                              </td>
                              <td className="px-5 py-4 text-right font-mono font-black text-emerald-400">
                                + {(ref.commissionAmount ?? ref.commissionEarnedEtb ?? 0).toLocaleString()} ETB
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                                  {ref.status}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right font-mono text-slate-400 text-[11px]">
                                {new Date(ref.createdAt).toLocaleDateString()}
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
        )}

        {/* TAB 2: PROMOTER REGISTRATION */}
        {activeTab === 'register' && (
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-2xl">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span>Join the EthioEvents Ambassador Program</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Promote Ethiopia's biggest concerts, festivals, and summits. Receive an instant 5% commission on all referred ticket purchases.
              </p>
            </div>

            {regError && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300 text-xs">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Promoter / Telegram Channel Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tikvah Ethiopia or DJ Rody"
                    value={regForm.promoterName}
                    onChange={(e) => setRegForm({ ...regForm, promoterName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Desired Affiliate Tag (Code) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono font-bold">@</span>
                    <input
                      type="text"
                      required
                      placeholder="tikvahethiopia"
                      value={regForm.affiliateCode}
                      onChange={(e) => setRegForm({ ...regForm, affiliateCode: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Ethiopian Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0911234567 or 0712345678"
                    value={regForm.phoneNumber}
                    onChange={(e) => setRegForm({ ...regForm, phoneNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="promoter@ethioevents.et"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Payout Banking Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      Bank / Mobile Money Provider *
                    </label>
                    <select
                      value={regForm.bankName}
                      onChange={(e) => setRegForm({ ...regForm, bankName: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400"
                    >
                      {ETHIOPIAN_BANKS.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      Account / Telebirr Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1000123456789 or 0911234567"
                      value={regForm.bankAccountNo}
                      onChange={(e) => setRegForm({ ...regForm, bankAccountNo: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 px-6 py-3 text-xs font-bold text-black shadow-glowGold hover:from-amber-300 transition disabled:opacity-50"
                >
                  {regLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-black" />
                      Register & Get Tracking Links
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
