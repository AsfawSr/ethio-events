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
  Ban
} from 'lucide-react';
import { api } from '@/lib/api';
import { AdminAnalytics, EventModerationItem, AdminOrganizerItem } from '@/lib/types';

export default function AdminPortalPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [events, setEvents] = useState<EventModerationItem[]>([]);
  const [organizers, setOrganizers] = useState<AdminOrganizerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'approvals' | 'organizers' | 'financials'>('approvals');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_APPROVAL');
  const [searchQuery, setSearchQuery] = useState('');

  // Moderation state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackInput, setFeedbackInput] = useState<{ [key: string]: string }>({});
  const [showRejectPromptId, setShowRejectPromptId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, [statusFilter]);

  const loadAdminData = async () => {
    try {
      setRefreshing(true);
      const [analyticsData, eventsData, organizersData] = await Promise.all([
        api.getAdminAnalytics().catch(() => null),
        api.getAdminEvents(statusFilter === 'ALL' ? undefined : statusFilter).catch(() => []),
        api.getAdminOrganizers().catch(() => []),
      ]);

      setAnalytics(analyticsData);
      setEvents(eventsData);
      setOrganizers(organizersData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-amber-500/40 bg-slate-900/95 backdrop-blur-xl p-4 text-sm font-semibold text-amber-300 shadow-2xl shadow-amber-500/20 animate-in fade-in slide-in-from-bottom-5">
            {toastMessage}
          </div>
        )}

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
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Completed Ticket Orders
                </span>
                <div className="text-3xl font-black text-white">
                  {analytics?.totalOrdersCompleted || 0}
                </div>
                <p className="mt-2 text-xs text-slate-400">Direct Telebirr & Chapa settlements</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Net Organizer Payout Pool (95%)
                </span>
                <div className="text-3xl font-black text-amber-400">
                  {((analytics?.totalGrossRevenueEtb || 0) * 0.95).toLocaleString()} ETB
                </div>
                <p className="mt-2 text-xs text-slate-400">Eligible for CBE / Telebirr bank transfer</p>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-6">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  Platform Commission (5%)
                </span>
                <div className="text-3xl font-black text-emerald-400">
                  {(analytics?.platformCommissionFeeEtb || 0).toLocaleString()} ETB
                </div>
                <p className="mt-2 text-xs text-slate-400">EthioEvents transaction fee retained</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-400" />
                Automated Settlement Process
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                When ticket sales conclude for an event, the system calculates the gross volume, subtracts the 5% platform commission fee, and releases the net 95% funds directly into the organizer’s designated Commercial Bank of Ethiopia (CBE) account or Telebirr merchant till.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
