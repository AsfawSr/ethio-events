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
  category?: string;
  categoryAmharic?: string;
  categoryEmoji?: string;
  neighborhood?: string;
  neighborhoodAmharic?: string;
  featured?: boolean;
  tags?: string[];
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
  category?: string;
  categoryAmharic?: string;
  categoryEmoji?: string;
  neighborhood?: string;
  neighborhoodAmharic?: string;
  featured?: boolean;
  tags?: string[];
  ticketTypes: TicketType[];
}

export interface CategoryFilterItem {
  code: string;
  englishName: string;
  amharicName: string;
  iconEmoji: string;
  eventCount: number;
}

export interface NeighborhoodFilterItem {
  code: string;
  englishName: string;
  amharicName: string;
  eventCount: number;
}

export interface FilterMetadata {
  categories: CategoryFilterItem[];
  neighborhoods: NeighborhoodFilterItem[];
  minPrice: number;
  maxPrice: number;
  totalPublishedEvents: number;
}

export interface SearchEventsParams {
  q?: string;
  category?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  sort?: 'START_TIME_ASC' | 'PRICE_LOW_HIGH' | 'PRICE_HIGH_LOW' | 'FEATURED_FIRST' | string;
}

export interface GuestReserveRequest {
  ticketTypeId: string;
  quantity: number;
  customerPhone: string;
  customerName: string;
  promoCode?: string;
  affiliateCode?: string;
  selectedSeatIds?: string[];
}

export interface ValidatePromoResponse {
  valid: boolean;
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  finalTotal: number;
  message: string;
}

export interface PromoCodeItem {
  id: string;
  eventId?: string;
  eventTitle?: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  timesUsed: number;
  active: boolean;
  validUntil?: string;
  createdAt: string;
}

export interface GateCrewPinItem {
  id: string;
  eventId: string;
  eventTitle: string;
  gateName: string;
  pinCode: string;
  crewMemberName?: string;
  expiresAt: string;
  active: boolean;
  createdAt: string;
  lastUsedAt?: string;
  loginCount: number;
}

export interface GateCrewAuthResult {
  token: string;
  role: string;
  eventId: string;
  eventTitle: string;
  gateName: string;
  crewMemberName?: string;
  expiresAt: string;
}

export interface AffiliateItem {
  id: string;
  affiliateCode: string;
  promoterName: string;
  phoneNumber: string;
  email?: string;
  bankName: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  commissionRate: number;
  totalClicks: number;
  totalSalesCount: number;
  totalConversions?: number;
  totalGrossRevenueEtb: number;
  totalSalesEtb?: number;
  totalCommissionEarnedEtb: number;
  totalCommissionEtb?: number;
  paidCommissionEtb?: number;
  unpaidCommissionEtb?: number;
  active?: boolean;
  status: string;
  createdAt: string;
}

export interface AffiliateReferralItem {
  id: string;
  orderNumber: string;
  eventTitle: string;
  orderAmountEtb: number;
  orderAmount?: number;
  commissionEarnedEtb: number;
  commissionAmount?: number;
  customerName: string;
  customerPhone: string;
  status: string;
  createdAt: string;
}

export interface AffiliateDashboardData {
  affiliate: AffiliateItem;
  recentReferrals: AffiliateReferralItem[];
  conversionRate?: number;
  availableEvents: { id: string; title: string; slug: string; bannerImageUrl: string; minPrice: number }[];
}

export interface TrackClickResult {
  affiliateCode: string;
  promoterName?: string;
  commissionRate?: number;
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
  seatLabel?: string;
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
  seatLabel?: string;
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
  category?: string;
  neighborhood?: string;
  featured?: boolean;
  tags?: string;
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
  phoneNumber?: string;
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

export interface FileUploadResponse {
  fileUrl: string;
  url?: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
}

export interface CheckInLiveEvent {
  eventId: string;
  ticketCode: string;
  tierName: string;
  attendeeName: string;
  status: string;
  checkedInAt: string;
  totalCheckedIn: number;
  totalCapacity: number;
  gateSource: string;
}

export interface GateLiveStats {
  eventId: string;
  eventTitle: string;
  totalTickets: number;
  checkedInCount: number;
  occupancyPercent: number;
  recentCheckIns: CheckInLiveEvent[];
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

export interface TransferTicketRequest {
  ticketSecurityHash: string;
  senderName?: string;
  senderPhone?: string;
  recipientName: string;
  recipientPhone: string;
  reason?: string;
}

export interface TransferTicketResponse {
  transferId: string;
  ticketCode: string;
  eventTitle: string;
  previousSecurityHash: string;
  newSecurityHash: string;
  newTicketPassUrl: string;
  recipientName: string;
  recipientPhone: string;
  transferredAt: string;
}

export interface TicketTransferHistoryItem {
  id: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  reason?: string;
  previousSecurityHash: string;
  newSecurityHash: string;
  transferredAt: string;
}

export interface SeatItem {
  id: string;
  sectionId: string;
  sectionName: string;
  ticketTypeId?: string;
  tierName: string;
  price: number;
  rowIdentifier: string;
  seatNumber: string;
  seatLabel: string;
  gridRow: number;
  gridCol: number;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED';
  isAvailable: boolean;
  heldUntil?: string;
}

export interface SeatingSectionItem {
  id: string;
  sectionName: string;
  sectionType: 'TABLES' | 'THEATRE_ROWS' | 'BALCONY' | 'VIP_LOUNGE' | string;
  layoutConfig?: string;
  capacity: number;
  ticketTypeId?: string;
  tierName: string;
  basePrice: number;
  seats: SeatItem[];
}

export interface EventSeatingPlanData {
  eventId: string;
  eventTitle: string;
  venueName: string;
  sections: SeatingSectionItem[];
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  heldSeats: number;
}

export interface HoldSeatsRequest {
  eventId: string;
  sessionId: string;
  seatIds: string[];
}

export interface HoldSeatsResponse {
  success: boolean;
  seatsHeldCount: number;
  heldUntil: string;
  sessionId: string;
  heldSeats: SeatItem[];
}

export interface TierSalesBreakdown {
  tierName: string;
  soldCount: number;
  totalCapacity: number;
  revenue: number;
  percentOfTotal: number;
}

export interface PaymentMethodBreakdown {
  gateway: string;
  orderCount: number;
  totalVolume: number;
  volumePercent: number;
}

export interface HourlyCheckInStat {
  hourSlot: string;
  checkInCount: number;
  cumulativePercent: number;
}

export interface PromoterLeaderboardEntry {
  promoterCode: string;
  promoterName: string;
  salesCount: number;
  revenueGenerated: number;
  commissionEarned: number;
}

export interface EventAnalyticsSummary {
  eventId: string;
  eventTitle: string;
  venueName: string;
  totalTicketsIssued: number;
  totalCheckedIn: number;
  attendanceRatePercent: number;
  grossRevenueEtb: number;
  platformCommissionEtb: number;
  netOrganizerPayoutEtb: number;
  totalOrdersCount: number;
  averageOrderValueEtb: number;
  tierSales: TierSalesBreakdown[];
  paymentBreakdown: PaymentMethodBreakdown[];
  hourlyCheckIns: HourlyCheckInStat[];
  topPromoters: PromoterLeaderboardEntry[];
}


