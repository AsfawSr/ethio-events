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
  // Public Event Discovery & Registration
  getEvents: () => fetchApi<EventSummary[]>('/events'),
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

  simulatePaymentSuccess: (orderNumber: string, gateway: 'TELEBIRR' | 'CHAPA' = 'TELEBIRR') =>
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
};

