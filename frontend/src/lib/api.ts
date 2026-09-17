import {
  ApiResponse,
  EventDetail,
  EventSummary,
  GuestReserveRequest,
  OrderDetails,
  OrganizerProfile,
  OrganizerRegisterRequest,
  OrganizerSession,
  PublicTicketDetails,
  ReservationResponse,
} from './types';
import { authStorage } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const token = authStorage.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string>),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // response body was empty or non-JSON
    }

    if (!res.ok) {
      const errMsg = json?.error?.message || json?.message || `Request failed with HTTP ${res.status}`;
      throw new Error(errMsg);
    }

    if (json && json.success === false) {
      throw new Error(json.error?.message || 'An unexpected error occurred');
    }

    return json?.data !== undefined ? json.data : json;
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Public Event Discovery, Categorization, Neighborhoods & Search
  getEvents: (params?: import('./types').SearchEventsParams) => {
    if (!params) return fetchApi<EventSummary[]>('/events');
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.category && params.category !== 'ALL') query.set('category', params.category);
    if (params.neighborhood && params.neighborhood !== 'ALL') query.set('neighborhood', params.neighborhood);
    if (params.minPrice !== undefined) query.set('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) query.set('maxPrice', params.maxPrice.toString());
    if (params.featured !== undefined) query.set('featured', params.featured.toString());
    if (params.sort) query.set('sort', params.sort);
    const queryString = query.toString();
    return fetchApi<EventSummary[]>(`/events${queryString ? `?${queryString}` : ''}`);
  },
  getFeaturedEvents: () => fetchApi<EventSummary[]>('/events/featured'),
  getFilterMetadata: () => fetchApi<import('./types').FilterMetadata>('/events/meta/filters'),
  getEventBySlug: (slug: string) => fetchApi<EventDetail>(`/events/${slug}`),
  createEvent: (data: any) =>
    fetchApi<EventDetail>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Organizer Account & Dashboard
  registerOrganizer: (data: OrganizerRegisterRequest) =>
    fetchApi<OrganizerSession>('/auth/organizer/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getOrganizerProfile: () => fetchApi<OrganizerProfile>('/organizer/me'),
  getOrganizerEvents: () => fetchApi<EventSummary[]>('/organizer/my-events'),

  // Platform Admin & Event Moderation
  getAdminAnalytics: () => fetchApi<import('./types').AdminAnalytics>('/admin/analytics'),
  getAdminEvents: (status?: string) =>
    fetchApi<import('./types').EventModerationItem[]>(`/admin/events${status ? `?status=${status}` : ''}`),
  approveEvent: (id: string) =>
    fetchApi<EventDetail>(`/admin/events/${id}/approve`, { method: 'POST' }),
  rejectEvent: (id: string, feedback?: string) =>
    fetchApi<EventDetail>(`/admin/events/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }),
  getAdminOrganizers: () => fetchApi<import('./types').AdminOrganizerItem[]>('/admin/organizers'),
  verifyOrganizer: (id: string) =>
    fetchApi<string>(`/admin/organizers/${id}/verify`, { method: 'POST' }),
  suspendOrganizer: (id: string) =>
    fetchApi<string>(`/admin/organizers/${id}/suspend`, { method: 'POST' }),

  // Frictionless Guest Checkout (10-Minute Hold)
  reserveGuestOrder: (data: GuestReserveRequest) =>
    fetchApi<ReservationResponse>('/orders/guest-reserve', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getOrderDetails: (orderNumber: string) =>
    fetchApi<OrderDetails>(`/orders/${orderNumber}`),

  getMyTicketsByPhone: (phone: string) =>
    fetchApi<OrderDetails[]>(`/orders/my-tickets?phone=${encodeURIComponent(phone)}`),

  // Standalone Public Ticket Pass (Zero-login gate entry link)
  getPublicTicketByHash: (securityHash: string) =>
    fetchApi<PublicTicketDetails>(`/tickets/public/pass/${securityHash}`),

  getTicketPdfUrl: (securityHash: string) =>
    `${API_BASE}/tickets/public/pass/${securityHash}/pdf`,

  downloadTicketPdf: async (securityHash: string, ticketCode: string) => {
    const url = `${API_BASE}/tickets/public/pass/${securityHash}/pdf`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to generate PDF ticket pass');
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `EthioEvents-Ticket-${ticketCode}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  },

  getAppleWalletPass: (securityHash: string) =>
    fetchApi<Record<string, any>>(`/tickets/public/pass/${securityHash}/wallet/apple`),

  getGoogleWalletPass: (securityHash: string) =>
    fetchApi<Record<string, any>>(`/tickets/public/pass/${securityHash}/wallet/google`),

  // Payment Initiation
  initiateTelebirr: (orderNumber: string) =>
    fetchApi<{ toPayUrl: string; outTradeNo: string; transactionRef: string }>(
      '/payments/telebirr/initiate',
      {
        method: 'POST',
        body: JSON.stringify({ orderNumber }),
      }
    ),

  initiateChapa: (orderNumber: string) =>
    fetchApi<{ checkoutUrl: string; txRef: string }>('/payments/chapa/initiate', {
      method: 'POST',
      body: JSON.stringify({ orderNumber }),
    }),

  getExchangeRates: () =>
    fetchApi<import('./types').ExchangeRatesResponse>('/payments/exchange-rates'),

  initiateStripe: (orderNumber: string) =>
    fetchApi<import('./types').StripeCheckoutResponse>('/payments/stripe/initiate', {
      method: 'POST',
      body: JSON.stringify({ orderNumber }),
    }),

  simulateStripeSuccess: (orderNumber: string) =>
    fetchApi<string>('/payments/stripe/simulate-success', {
      method: 'POST',
      body: JSON.stringify({ orderNumber }),
    }),

  simulatePaymentSuccess: (orderNumber: string, gateway: 'TELEBIRR' | 'CHAPA' | 'STRIPE_DIASPORA' = 'TELEBIRR') =>
    fetchApi<string>('/payments/simulate-success', {
      method: 'POST',
      body: JSON.stringify({ orderNumber, gateway }),
    }),

  // OTP Verification for "My Tickets" lookup
  requestOtp: (phoneNumber: string) =>
    fetchApi<string>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }),

  verifyOtp: (phoneNumber: string, otpCode: string) =>
    fetchApi<{ token: string; userId: string; phoneNumber: string; fullName: string; role: string }>(
      '/auth/otp/verify',
      {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, otpCode }),
      }
    ),

  adminLogin: (credentials: { phoneNumber?: string; passcode?: string; otpCode?: string }) =>
    fetchApi<OrganizerSession>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // Venue Gate Validation & Offline Sync
  getGateManifest: (eventId: string, since?: string) =>
    fetchApi<{
      eventId: string;
      eventTitle: string;
      masterPublicKeyHex: string;
      totalAttendees: number;
      checkedInCount: number;
      manifestVersion: string;
      attendees: Array<{
        ticketId: string;
        ticketCode: string;
        tierName: string;
        attendeeName: string;
        attendeePhone: string;
        digitalSignature: string;
        status: string;
        checkedInAt: string | null;
      }>;
    }>(`/gate/manifest/${eventId}${since ? `?since=${since}` : ''}`),

  validateTicketOnline: (eventId: string, qrPayload?: string, ticketCode?: string) =>
    fetchApi<{
      status: 'SUCCESS' | 'DUPLICATE' | 'INVALID' | 'REVOKED' | 'WRONG_EVENT';
      message: string;
      ticketCode?: string;
      tierName?: string;
      attendeeName?: string;
      checkedInAt?: string;
    }>('/gate/validate-online', {
      method: 'POST',
      body: JSON.stringify({ eventId, qrPayload, ticketCode }),
    }),

  syncGateBatch: (eventId: string, checkIns: Array<{ ticketId: string; ticketCode: string; checkedInAt: string }>) =>
    fetchApi<{
      processedCount: number;
      successCount: number;
      conflictCount: number;
      conflicts: string[];
    }>('/gate/sync-batch', {
      method: 'POST',
      body: JSON.stringify({ eventId, checkIns }),
    }),

  getGateLiveStats: (eventId: string) =>
    fetchApi<import('./types').GateLiveStats>(`/gate/live-stats/${eventId}`),

  getGateLiveStreamUrl: (eventId: string) =>
    `${API_BASE}/gate/live-stream/${eventId}`,

  // Admin SMS & Notifications Monitoring
  getAdminSmsLogs: (phone?: string) =>
    fetchApi<import('./types').SmsLogItem[]>(`/admin/sms/logs${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`),

  retryAdminSms: (id: string) =>
    fetchApi<import('./types').SmsLogItem>(`/admin/sms/retry/${id}`, {
      method: 'POST',
    }),

  // Settlements & Organizer Payouts
  getAdminSettlements: () =>
    fetchApi<import('./types').SettlementSummaryItem[]>('/admin/settlements'),

  calculateAdminSettlement: (eventId: string) =>
    fetchApi<import('./types').SettlementCalculation>(`/admin/settlements/calculate/${eventId}`),

  generateAdminSettlement: (eventId: string) =>
    fetchApi<import('./types').SettlementSummaryItem>(`/admin/settlements/generate/${eventId}`, {
      method: 'POST',
    }),

  processAdminPayout: (
    settlementId: string,
    data?: { payoutMethod?: string; payoutReference?: string; notifyOrganizerBySms?: boolean }
  ) =>
    fetchApi<import('./types').SettlementSummaryItem>(`/admin/settlements/${settlementId}/process-payout`, {
      method: 'POST',
      body: JSON.stringify(data || { notifyOrganizerBySms: true }),
    }),

  getOrganizerSettlements: () =>
    fetchApi<import('./types').SettlementSummaryItem[]>('/organizer/settlements'),

  // Media & Image Uploads
  uploadImage: async (file: File): Promise<import('./types').FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = authStorage.getToken();
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${API_BASE}/uploads/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {}

    if (!res.ok) {
      const errMsg = json?.error?.message || json?.message || `Upload failed with HTTP ${res.status}`;
      throw new Error(errMsg);
    }

    if (json && json.success === false) {
      throw new Error(json.error?.message || 'Upload failed');
    }

    return json?.data !== undefined ? json.data : json;
  },

  // Promo Codes & Discounts
  validatePromoCode: (data: { eventId?: string; code: string; subtotal: number; ticketCount: number }) =>
    fetchApi<import('./types').ValidatePromoResponse>('/promo/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createPromoCode: (data: any) =>
    fetchApi<import('./types').PromoCodeItem>('/promo', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getEventPromoCodes: (eventId: string) =>
    fetchApi<import('./types').PromoCodeItem[]>(`/promo/event/${eventId}`),

  getAllPromoCodes: () =>
    fetchApi<import('./types').PromoCodeItem[]>('/promo'),

  // Gate Crew Temporary Access PINs
  getGateCrewPins: (eventId: string) =>
    fetchApi<import('./types').GateCrewPinItem[]>(`/gate/crew/event/${eventId}`),

  createGateCrewPin: (data: { eventId: string; gateName: string; crewMemberName?: string; validHours?: number }) =>
    fetchApi<import('./types').GateCrewPinItem>('/gate/crew/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  revokeGateCrewPin: (pinId: string) =>
    fetchApi<string>(`/gate/crew/${pinId}`, {
      method: 'DELETE',
    }),

  loginGateCrewPin: (pinCode: string, eventId?: string) =>
    fetchApi<import('./types').GateCrewAuthResult>('/gate/crew/login', {
      method: 'POST',
      body: JSON.stringify({ pinCode, eventId }),
    }),

  // Promoter & Influencer Affiliate Engine
  trackAffiliateClick: (code: string, eventId?: string) =>
    fetchApi<import('./types').TrackClickResult>(`/affiliates/track?code=${encodeURIComponent(code)}${eventId ? `&eventId=${eventId}` : ''}`, {
      method: 'POST',
    }),

  registerAffiliate: (data: any) =>
    fetchApi<import('./types').AffiliateItem>('/affiliates/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAffiliateDashboard: (identifier: string) =>
    fetchApi<import('./types').AffiliateDashboardData>(`/affiliates/portal/${encodeURIComponent(identifier)}`),

  getOrganizerAffiliates: () =>
    fetchApi<import('./types').AffiliateItem[]>('/affiliates/organizer'),

  createOrganizerAffiliate: (data: any) =>
    fetchApi<import('./types').AffiliateItem>('/affiliates/organizer/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // P2P Ticket Transfer & Cryptographic Re-Signing
  transferTicket: (data: import('./types').TransferTicketRequest) =>
    fetchApi<import('./types').TransferTicketResponse>('/tickets/public/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTicketTransferHistory: (ticketCode: string) =>
    fetchApi<import('./types').TicketTransferHistoryItem[]>(`/tickets/public/transfers/${encodeURIComponent(ticketCode)}`),

  // Interactive Venue Seating & VIP Table Floor Plan Engine
  getEventSeatingPlan: (eventId: string) =>
    fetchApi<import('./types').EventSeatingPlanData>(`/seating/event/${eventId}`),

  holdSeats: (data: import('./types').HoldSeatsRequest) =>
    fetchApi<import('./types').HoldSeatsResponse>('/seating/hold', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  releaseHeldSeats: (data: { eventId: string; sessionId: string; seatIds?: string[] }) =>
    fetchApi<string>('/seating/release', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Financial Reports, Attendance Analytics & CSV Exports
  getEventAnalytics: (eventId: string) =>
    fetchApi<import('./types').EventAnalyticsSummary>(`/reports/events/${eventId}/analytics`),

  getAttendeeCsvUrl: (eventId: string) => `${API_BASE}/reports/events/${eventId}/attendees/csv`,
  getFinancialCsvUrl: (eventId: string) => `${API_BASE}/reports/events/${eventId}/financials/csv`,

  // Organizer SMS Broadcast Campaigns & Automated Pre-Event Reminders (AfroMessage Engine)
  getEventBroadcasts: (eventId: string) =>
    fetchApi<import('./types').BroadcastCampaignItem[]>(`/organizer/broadcasts/event/${eventId}`),

  createBroadcastCampaign: (data: import('./types').CreateBroadcastRequest) =>
    fetchApi<import('./types').BroadcastCampaignItem>('/organizer/broadcasts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendTestBroadcast: (data: import('./types').TestBroadcastRequest) =>
    fetchApi<boolean>('/organizer/broadcasts/test-send', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAudienceEstimate: (eventId: string, targetFilter?: string, targetTicketTypeId?: string) =>
    fetchApi<import('./types').AudienceEstimateResponse>(
      `/organizer/broadcasts/audience-count?eventId=${eventId}${
        targetFilter ? `&targetFilter=${targetFilter}` : ''
      }${targetTicketTypeId ? `&targetTicketTypeId=${targetTicketTypeId}` : ''}`
    ),

  getEventReminders: (eventId: string) =>
    fetchApi<import('./types').AutomatedReminderConfig>(`/organizer/reminders/event/${eventId}`),

  updateEventReminders: (eventId: string, data: import('./types').UpdateRemindersRequest) =>
    fetchApi<import('./types').AutomatedReminderConfig>(`/organizer/reminders/event/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

