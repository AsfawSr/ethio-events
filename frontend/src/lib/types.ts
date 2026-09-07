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
