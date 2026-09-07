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

    const json: ApiResponse<T> = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || 'An unexpected error occurred');
    }
    return json.data;
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
};
