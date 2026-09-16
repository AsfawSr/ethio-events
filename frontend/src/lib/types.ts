export interface LocalizedDateTime {
  isoUtc: string;
  gregorianFormatted: string;
  ethiopianDateFormatted: string;
  ethiopianTimeFormatted: string;
  ethiopianFullFormatted: string;
}

export interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  availableCapacity: number;
  maxPerUser: number;
  isAvailable: boolean;
}

export interface EventSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  venueName: string;
  venueAddress: string;
  startTime: LocalizedDateTime;
  endTime: LocalizedDateTime;
  bannerImageUrl: string;
  status: string;
  minPrice: number;
  maxPrice: number;
  currency: string;
  isSoldOut: boolean;
}

export interface EventDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  venueName: string;
  venueAddress: string;
  startTime: LocalizedDateTime;
  endTime: LocalizedDateTime;
  bannerImageUrl: string;
  status: string;
  organizerName: string;
  ticketTypes: TicketType[];
}

export interface GuestReserveRequest {
  ticketTypeId: string;
  quantity: number;
  customerPhone: string;
  customerName: string;
}

export interface ReservationResponse {
  orderNumber: string;
  eventTitle: string;
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  status: string;
  reservedUntilIsoUtc: string;
  expiresInSeconds: number;
  eventStartTime: LocalizedDateTime;
}

export interface OrderItem {
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderTicket {
  ticketCode: string;
  tierName: string;
  attendeeName: string;
  securityHash: string;
  status: string;
}

export interface OrderDetails {
  orderNumber: string;
  eventTitle: string;
  eventSlug: string;
  venueName: string;
  venueAddress: string;
  eventStartTime: LocalizedDateTime;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  currency: string;
  status: string;
  reservedUntilIsoUtc: string;
  items: OrderItem[];
  tickets: OrderTicket[];
}

export interface PublicTicketDetails {
  ticketCode: string;
  eventTitle: string;
  eventSlug: string;
  venueName: string;
  venueAddress: string;
  eventStartTime: LocalizedDateTime;
  tierName: string;
  attendeeName: string;
  attendeePhone: string;
  status: string;
  qrCodeBase64: string;
  qrPayload: string;
  securityHash: string;
}

export interface CreateTicketTypeRequest {
  name: string;
  description: string;
  price: number;
  totalCapacity: number;
  maxPerUser: number;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  venueName: string;
  venueAddress: string;
  startTimeIsoUtc: string;
  endTimeIsoUtc: string;
  bannerImageUrl: string;
  organizerName: string;
  organizerId?: string;
  ticketTypes: CreateTicketTypeRequest[];
}

export interface OrganizerRegisterRequest {
  phoneNumber: string;
  fullName: string;
  email?: string;
  organizationName: string;
  businessLicenseNo?: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
}

export interface OrganizerProfile {
  id: string;
  organizationName: string;
  businessLicenseNo: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  status: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenueEtb: number;
}

export interface OrganizerSession {
  token: string;
  userId: string;
  phoneNumber: string;
  fullName: string;
  role: string;
  organizerId?: string;
  organizationName?: string;
}

export interface AdminAnalytics {
  totalGrossRevenueEtb: number;
  platformCommissionFeeEtb: number;
  totalTicketsIssued: number;
  totalOrdersCompleted: number;
  totalOrganizers: number;
  pendingEventsCount: number;
  publishedEventsCount: number;
}

export interface EventModerationItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  venueName: string;
  venueAddress: string;
  startTime: LocalizedDateTime;
  endTime: LocalizedDateTime;
  bannerImageUrl: string;
  status: string;
  organizerId: string;
  organizationName: string;
  organizerPhone: string;
  organizerEmail: string;
  minPrice: number;
  maxPrice: number;
  totalCapacity: number;
  ticketTiers: TicketType[];
  createdAt: string;
}

export interface AdminOrganizerItem {
  id: string;
  organizationName: string;
  businessLicenseNo: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  status: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  totalEventsCount: number;
  createdAt: string;
}

export interface SmsLogItem {
  id: string;
  phoneNumber: string;
  messageType: 'OTP' | 'TICKET_CONFIRMATION' | 'EVENT_UPDATE' | string;
  provider: 'MOCK' | 'ETHIO_TELECOM' | 'AFRICASTALKING' | 'TWILIO' | string;
  status: 'SENT' | 'FAILED' | 'DELIVERED' | string;
  content: string;
  externalMessageId?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface SettlementSummaryItem {
  id: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  organizerId: string;
  organizationName: string;
  organizerPhone: string;
  totalGrossRevenue: number;
  platformCommissionFee: number;
  payoutAmount: number;
  bankName: string;
  bankAccountNo: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | string;
  payoutReference?: string;
  processedAt?: string;
  createdAt: string;
}

export interface SettlementCalculation {
  eventId: string;
  eventTitle: string;
  organizerId: string;
  organizationName: string;
  bankName: string;
  bankAccountNo: string;
  totalGrossRevenue: number;
  commissionRatePercent: number;
  platformCommissionFee: number;
  payoutAmount: number;
  totalPaidOrders: number;
  totalTicketsSold: number;
  alreadySettled: boolean;
  existingSettlementId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
