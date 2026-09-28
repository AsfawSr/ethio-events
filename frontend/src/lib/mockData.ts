import {
  EventDetail,
  EventSummary,
  FilterMetadata,
  GuestReserveRequest,
  OrderDetails,
  PublicTicketDetails,
  ReservationResponse,
  SearchEventsParams,
  ExchangeRatesResponse,
} from './types';

export const MOCK_EVENTS: EventDetail[] = [
  {
    id: 'evt-rophnan-sost',
    title: 'ROPHNAN - SOST (፫) LIVE in Addis Ababa',
    slug: 'rophnan-sost-live-millennium-hall',
    description:
      'The ultimate electronic-folk spectacle by ROPHNAN. Featuring an immersive 360 audio-visual stage at Millennium Hall with special guest traditional instrumentalists from across Ethiopia.',
    venueName: 'Millennium Hall (ሚሌኒየም አዳራሽ)',
    venueAddress: 'Bole Sub-City, Africa Avenue, Addis Ababa',
    startTime: {
      isoUtc: new Date(Date.now() + 15 * 86400000).toISOString(),
      gregorianFormatted: 'Oct 15, 2026, 6:00 PM',
      ethiopianDateFormatted: 'ጥቅምት 5 ቀን 2019 ዓ.ም',
      ethiopianTimeFormatted: 'ምሽት 12:00 ሰዓት',
      ethiopianFullFormatted: 'ጥቅምት 5 ቀን 2019 ዓ.ም ምሽት 12:00 ሰዓት',
    },
    endTime: {
      isoUtc: new Date(Date.now() + 15 * 86400000 + 6 * 3600000).toISOString(),
      gregorianFormatted: 'Oct 16, 2026, 12:00 AM',
      ethiopianDateFormatted: 'ጥቅምት 6 ቀን 2019 ዓ.ም',
      ethiopianTimeFormatted: 'እኩለ ሌሊት 6:00 ሰዓት',
      ethiopianFullFormatted: 'ጥቅምት 6 ቀን 2019 ዓ.ም እኩለ ሌሊት 6:00 ሰዓት',
    },
    bannerImageUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
    status: 'PUBLISHED',
    organizerName: 'Admas Events & Entertainment',
    category: 'MUSIC_CONCERT',
    categoryAmharic: 'የሙዚቃ ኮንሰርት',
    categoryEmoji: '🎵',
    neighborhood: 'BOLE',
    neighborhoodAmharic: 'ቦሌ',
    featured: true,
    tags: ['EDM', 'Electronic', 'Rophnan', 'Live', 'Millennium Hall'],
    latitude: 8.9954,
    longitude: 38.7885,
    ticketTypes: [
      {
        id: 'tt-rophnan-eb',
        name: 'Early Bird General',
        description: 'Standing area access with standard stage view and souvenir wristband.',
        price: 800,
        currency: 'ETB',
        availableCapacity: 4820,
        maxPerUser: 5,
        isAvailable: true,
      },
      {
        id: 'tt-rophnan-vip',
        name: 'VIP Front Stage',
        description: 'Front circle priority access + fast-track gate entry and exclusive bar access.',
        price: 2500,
        currency: 'ETB',
        availableCapacity: 1420,
        maxPerUser: 5,
        isAvailable: true,
      },
      {
        id: 'tt-rophnan-vvip',
        name: 'VVIP Lounge & Drinks',
        description: 'Elevated luxury lounge with free welcome drinks & artist backstage meetup pass.',
        price: 6000,
        currency: 'ETB',
        availableCapacity: 185,
        maxPerUser: 4,
        isAvailable: true,
      },
    ],
  },
  {
    id: 'evt-addis-tech-2026',
    title: 'Addis Tech Summit & AI Expo 2026',
    slug: 'addis-tech-summit-2026',
    description:
      'Ethiopia’s premier tech, fintech, and AI summit bringing together 2,000+ software engineers, founders, venture capitalists, and policy makers from across the Horn of Africa.',
    venueName: 'Ethiopian Skylight Hotel',
    venueAddress: 'Bole Airport Road, Addis Ababa',
    startTime: {
      isoUtc: new Date(Date.now() + 30 * 86400000).toISOString(),
      gregorianFormatted: 'Nov 1, 2026, 9:00 AM',
      ethiopianDateFormatted: 'ጥቅምት 22 ቀን 2019 ዓ.ም',
      ethiopianTimeFormatted: 'ጠዋት 3:00 ሰዓት',
      ethiopianFullFormatted: 'ጥቅምት 22 ቀን 2019 ዓ.ም ጠዋት 3:00 ሰዓት',
    },
    endTime: {
      isoUtc: new Date(Date.now() + 32 * 86400000).toISOString(),
      gregorianFormatted: 'Nov 3, 2026, 6:00 PM',
      ethiopianDateFormatted: 'ጥቅምት 24 ቀን 2019 ዓ.ም',
      ethiopianTimeFormatted: 'ከቀኑ 12:00 ሰዓት',
      ethiopianFullFormatted: 'ጥቅምት 24 ቀን 2019 ዓ.ም ከቀኑ 12:00 ሰዓት',
    },
    bannerImageUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop',
    status: 'PUBLISHED',
    organizerName: 'Ethiopian Tech Innovation Hub',
    category: 'TECH_SUMMIT',
    categoryAmharic: 'የቴክኖሎጂ እና ፈጠራ ጉባኤ',
    categoryEmoji: '💻',
    neighborhood: 'BOLE',
    neighborhoodAmharic: 'ቦሌ',
    featured: true,
    tags: ['AI', 'Fintech', 'Skylight', 'Startup', 'Innovation'],
    latitude: 8.9882,
    longitude: 38.7891,
    ticketTypes: [
      {
        id: 'tt-tech-standard',
        name: 'Standard Pass (2 Days)',
        description: 'Full access to all keynote sessions, workshops, exhibitions, and networking app.',
        price: 1500,
        currency: 'ETB',
        availableCapacity: 950,
        maxPerUser: 5,
        isAvailable: true,
      },
      {
        id: 'tt-tech-vip',
        name: 'Executive VIP & Gala Dinner',
        description: 'Includes Executive VIP Lounge + 5-star Gala Dinner at Ethiopian Skylight Hotel.',
        price: 5000,
        currency: 'ETB',
        availableCapacity: 280,
        maxPerUser: 3,
        isAvailable: true,
      },
    ],
  },
  {
    id: 'evt-habesha-comedy-night',
    title: 'Habesha Stand-Up Comedy Night & Jazz',
    slug: 'habesha-comedy-night-ghion',
    description:
      'An evening of premier Ethiopian stand-up comedy and live Ethio-Jazz under the historic trees of Ghion Hotel Addis Ababa. Featuring top comedic storytellers and acoustic brass band.',
    venueName: 'Ghion Hotel Gardens',
    venueAddress: 'Ras Desta Damtew St, Addis Ababa',
    startTime: {
      isoUtc: new Date(Date.now() + 8 * 86400000).toISOString(),
      gregorianFormatted: 'Oct 8, 2026, 7:00 PM',
      ethiopianDateFormatted: 'መስከረም 28 ቀን 2019 ዓ.ም',
      ethiopianTimeFormatted: 'ምሽት 1:00 ሰዓት',
      ethiopianFullFormatted: 'መስከረም 28 ቀን 2019 ዓ.ም ምሽት 1:00 ሰዓት',
    },
    endTime: {
      isoUtc: new Date(Date.now() + 8 * 86400000 + 4 * 3600000).toISOString(),
      gregorianFormatted: 'Oct 8, 2026, 11:00 PM',
      ethiopianDateFormatted: 'መስከረም 28 ቀን 2019 ዓ.ም',
      ethiopianTimeFormatted: 'ምሽት 5:00 ሰዓት',
      ethiopianFullFormatted: 'መስከረም 28 ቀን 2019 ዓ.ም ምሽት 5:00 ሰዓት',
    },
    bannerImageUrl:
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
    status: 'PUBLISHED',
    organizerName: 'Addis Laughs & Arts Club',
    category: 'COMEDY_THEATRE',
    categoryAmharic: 'ኮሜዲ እና ቲያትር',
    categoryEmoji: '🎭',
    neighborhood: 'PIASSA',
    neighborhoodAmharic: 'ፒያሳ',
    featured: false,
    tags: ['Standup', 'Ethio-Jazz', 'Ghion', 'Comedy'],
    latitude: 9.0142,
    longitude: 38.7562,
    ticketTypes: [
      {
        id: 'tt-comedy-reg',
        name: 'Regular Seat',
        description: 'Table seating in garden amphitheater with complimentary spiced Ethiopian tea.',
        price: 500,
        currency: 'ETB',
        availableCapacity: 360,
        maxPerUser: 6,
        isAvailable: true,
      },
      {
        id: 'tt-comedy-front',
        name: 'Front Table (Includes Snacks)',
        description: 'Front-row round table for 2 with gourmet canapés and drinks.',
        price: 1800,
        currency: 'ETB',
        availableCapacity: 80,
        maxPerUser: 4,
        isAvailable: true,
      },
    ],
  },
  {
    id: 'evt-great-ethiopian-run',
    title: 'Great Ethiopian Run 10K International 2026',
    slug: 'great-ethiopian-run-10k-2026',
    description:
      'Africa’s biggest road race! Join 45,000 runners through the vibrant streets of Addis Ababa with live street music, cultural dancers, and cheering crowds.',
    venueName: 'Meskel Square (መስቀል አደባባይ)',
    venueAddress: 'Meskel Square, Addis Ababa',
    startTime: {
      isoUtc: new Date(Date.now() + 45 * 86400000).toISOString(),
      gregorianFormatted: 'Nov 18, 2026, 7:00 AM',
      ethiopianDateFormatted: 'ህዳር 9 ቀን 2019 ዓ.ም',
      ethiopianTimeFormatted: 'ጠዋት 1:00 ሰዓት',
      ethiopianFullFormatted: 'ህዳር 9 ቀን 2019 ዓ.ም ጠዋት 1:00 ሰዓት',
    },
    endTime: {
      isoUtc: new Date(Date.now() + 45 * 86400000 + 5 * 3600000).toISOString(),
      gregorianFormatted: 'Nov 18, 2026, 12:00 PM',
      ethiopianDateFormatted: 'ህዳር 9 ቀን 2019 ዓ.ም',
      ethiopianTimeFormatted: 'ቀትር 6:00 ሰዓት',
      ethiopianFullFormatted: 'ህዳር 9 ቀን 2019 ዓ.ም ቀትር 6:00 ሰዓት',
    },
    bannerImageUrl:
      'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?q=80&w=1200&auto=format&fit=crop',
    status: 'PUBLISHED',
    organizerName: 'Great Ethiopian Run Org',
    category: 'SPORTS_FITNESS',
    categoryAmharic: 'ስፖርት እና ጤና',
    categoryEmoji: '🏃',
    neighborhood: 'STADIUM',
    neighborhoodAmharic: 'ስታዲየም',
    featured: true,
    tags: ['10K', 'Running', 'Athletics', 'Meskel Square', 'Addis'],
    latitude: 9.0105,
    longitude: 38.7618,
    ticketTypes: [
      {
        id: 'tt-run-local',
        name: 'Local Citizen Entry (T-Shirt Included)',
        description: 'Official timing chip, high-tech running t-shirt, and finisher medal.',
        price: 650,
        currency: 'ETB',
        availableCapacity: 8500,
        maxPerUser: 5,
        isAvailable: true,
      },
      {
        id: 'tt-run-elite',
        name: 'Fast Wave / Elite Wave Entry',
        description: 'Starting wave A position for certified sub-40 minute runners.',
        price: 1200,
        currency: 'ETB',
        availableCapacity: 450,
        maxPerUser: 2,
        isAvailable: true,
      },
    ],
  },
  {
    id: 'evt-coffee-cupping-entoto',
    title: 'Addis Specialty Coffee & Cultural Expo',
    slug: 'addis-specialty-coffee-cultural-expo',
    description:
      'Experience the birthplace of Arabica coffee! Guided cupping sessions with master baristas, rare Sidama, Yirgacheffe, and Guji single-origin micro-lots, accompanied by traditional roasting ceremonies.',
    venueName: 'Entoto Natural Park Amphitheater',
    venueAddress: 'Entoto Hills, Northern Addis Ababa',
    startTime: {
      isoUtc: new Date(Date.now() + 20 * 86400000).toISOString(),
      gregorianFormatted: 'Oct 20, 2026, 10:00 AM',
      ethiopianDateFormatted: 'ጥቅምት 10 ቀን 2019 ዓ.ም',
      ethiopianTimeFormatted: 'ጠዋት 4:00 ሰዓት',
      ethiopianFullFormatted: 'ጥቅምት 10 ቀን 2019 ዓ.ም ጠዋት 4:00 ሰዓት',
    },
    endTime: {
      isoUtc: new Date(Date.now() + 20 * 86400000 + 7 * 3600000).toISOString(),
      gregorianFormatted: 'Oct 20, 2026, 5:00 PM',
      ethiopianDateFormatted: 'ጥቅምት 10 ቀን 2019 ዓ.ም',
      ethiopianTimeFormatted: 'ከቀኑ 11:00 ሰዓት',
      ethiopianFullFormatted: 'ጥቅምት 10 ቀን 2019 ዓ.ም ከቀኑ 11:00 ሰዓት',
    },
    bannerImageUrl:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1200&auto=format&fit=crop',
    status: 'PUBLISHED',
    organizerName: 'Ethiopian Coffee Heritage Guild',
    category: 'CULTURE_EXPO',
    categoryAmharic: 'ባህል እና ኤግዚቢሽን',
    categoryEmoji: '☕',
    neighborhood: 'ENTOTO',
    neighborhoodAmharic: 'እንጦጦ',
    featured: false,
    tags: ['Buna', 'Coffee', 'Cupping', 'Yirgacheffe', 'Entoto'],
    latitude: 9.0763,
    longitude: 38.7611,
    ticketTypes: [
      {
        id: 'tt-coffee-tasting',
        name: 'General Tasting & Entry Pass',
        description: 'Unlimited specialty coffee cupping samples + ceramic tasting cup.',
        price: 450,
        currency: 'ETB',
        availableCapacity: 1200,
        maxPerUser: 5,
        isAvailable: true,
      },
      {
        id: 'tt-coffee-masterclass',
        name: 'Masterclass with Q-Graders',
        description: '2-hour sensory calibration class with certified international Q-Graders + 250g rare lot bean bag.',
        price: 1900,
        currency: 'ETB',
        availableCapacity: 60,
        maxPerUser: 2,
        isAvailable: true,
      },
    ],
  },
];

export function toEventSummary(event: EventDetail): EventSummary {
  const prices = event.ticketTypes.map((t) => t.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const isSoldOut = event.ticketTypes.every((t) => t.availableCapacity <= 0);

  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    startTime: event.startTime,
    endTime: event.endTime,
    bannerImageUrl: event.bannerImageUrl,
    status: event.status,
    minPrice,
    maxPrice,
    currency: 'ETB',
    isSoldOut,
    category: event.category,
    categoryAmharic: event.categoryAmharic,
    categoryEmoji: event.categoryEmoji,
    neighborhood: event.neighborhood,
    neighborhoodAmharic: event.neighborhoodAmharic,
    featured: event.featured,
    tags: event.tags,
    latitude: event.latitude,
    longitude: event.longitude,
  };
}

export function getMockEvents(params?: SearchEventsParams): EventSummary[] {
  let list = MOCK_EVENTS.map(toEventSummary);

  if (!params) return list;

  if (params.q) {
    const q = params.q.toLowerCase().trim();
    list = list.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.venueName.toLowerCase().includes(q) ||
        e.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  if (params.category && params.category !== 'ALL') {
    list = list.filter((e) => e.category === params.category);
  }

  if (params.neighborhood && params.neighborhood !== 'ALL') {
    list = list.filter((e) => e.neighborhood === params.neighborhood);
  }

  if (params.minPrice !== undefined) {
    list = list.filter((e) => e.maxPrice >= params.minPrice!);
  }

  if (params.maxPrice !== undefined) {
    list = list.filter((e) => e.minPrice <= params.maxPrice!);
  }

  if (params.featured) {
    list = list.filter((e) => e.featured === true);
  }

  if (params.sort === 'PRICE_LOW_HIGH') {
    list.sort((a, b) => a.minPrice - b.minPrice);
  } else if (params.sort === 'PRICE_HIGH_LOW') {
    list.sort((a, b) => b.maxPrice - a.maxPrice);
  } else if (params.sort === 'FEATURED_FIRST') {
    list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  } else {
    // START_TIME_ASC
    list.sort((a, b) => new Date(a.startTime.isoUtc).getTime() - new Date(b.startTime.isoUtc).getTime());
  }

  return list;
}

export function getMockFeaturedEvents(): EventSummary[] {
  return MOCK_EVENTS.filter((e) => e.featured).map(toEventSummary);
}

export function getMockEventBySlug(slug: string): EventDetail | null {
  return MOCK_EVENTS.find((e) => e.slug === slug) || MOCK_EVENTS[0] || null;
}

export function getMockFilterMetadata(): FilterMetadata {
  return {
    categories: [
      { code: 'ALL', englishName: 'All Categories', amharicName: 'ሁሉም ምድቦች', iconEmoji: '✨', eventCount: 5 },
      { code: 'MUSIC_CONCERT', englishName: 'Music Concert', amharicName: 'የሙዚቃ ኮንሰርት', iconEmoji: '🎵', eventCount: 1 },
      { code: 'TECH_SUMMIT', englishName: 'Tech & Fintech', amharicName: 'የቴክኖሎጂ እና ፈጠራ', iconEmoji: '💻', eventCount: 1 },
      { code: 'COMEDY_THEATRE', englishName: 'Comedy & Theater', amharicName: 'ኮሜዲ እና ቲያትር', iconEmoji: '🎭', eventCount: 1 },
      { code: 'SPORTS_FITNESS', englishName: 'Sports & Fitness', amharicName: 'ስፖርት እና ጤና', iconEmoji: '🏃', eventCount: 1 },
      { code: 'CULTURE_EXPO', englishName: 'Culture & Expo', amharicName: 'ባህል እና ኤግዚቢሽን', iconEmoji: '☕', eventCount: 1 },
    ],
    neighborhoods: [
      { code: 'ALL', englishName: 'All Addis Ababa', amharicName: 'መላው አዲስ አበባ', eventCount: 5 },
      { code: 'BOLE', englishName: 'Bole', amharicName: 'ቦሌ', eventCount: 2 },
      { code: 'PIASSA', englishName: 'Piassa & Arada', amharicName: 'ፒያሳ እና አራዳ', eventCount: 1 },
      { code: 'STADIUM', englishName: 'Stadium & Meskel Sq', amharicName: 'ስታዲየም እና መስቀል አደባባይ', eventCount: 1 },
      { code: 'ENTOTO', englishName: 'Entoto Hills', amharicName: 'እንጦጦ', eventCount: 1 },
      { code: 'KAZANCHIS', englishName: 'Kazanchis & UNECA', amharicName: 'ካዛንቺስ', eventCount: 0 },
      { code: 'SARBET', englishName: 'Sarbet & Old Airport', amharicName: 'ሳርቤት', eventCount: 0 },
      { code: 'CMC', englishName: 'CMC & Ayat', amharicName: 'ሲኤምሲ', eventCount: 0 },
    ],
    minPrice: 450,
    maxPrice: 6000,
    totalPublishedEvents: 5,
  };
}

export function createMockReservation(data: GuestReserveRequest): ReservationResponse {
  const event = MOCK_EVENTS[0];
  const ticket = event.ticketTypes.find((t) => t.id === data.ticketTypeId) || event.ticketTypes[0];
  const quantity = Math.max(1, data.quantity || 1);
  const totalAmount = ticket.price * quantity;
  const orderNumber = `EE-MOCK-${Math.floor(100000 + Math.random() * 900000)}`;

  return {
    orderNumber,
    eventTitle: event.title,
    ticketTypeName: ticket.name,
    quantity,
    unitPrice: ticket.price,
    totalAmount,
    currency: 'ETB',
    status: 'PENDING_PAYMENT',
    reservedUntilIsoUtc: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    expiresInSeconds: 600,
    eventStartTime: event.startTime,
  };
}

export function getMockOrder(orderNumber: string): OrderDetails {
  const event = MOCK_EVENTS[0];
  const ticket = event.ticketTypes[0];

  return {
    orderNumber,
    eventTitle: event.title,
    eventSlug: event.slug,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    eventStartTime: event.startTime,
    customerName: 'Abebe Bikila',
    customerPhone: '+251911223344',
    totalAmount: ticket.price * 2,
    currency: 'ETB',
    paymentGateway: 'TELEBIRR',
    status: 'PAID',
    reservedUntilIsoUtc: new Date(Date.now() + 86400000).toISOString(),
    items: [
      {
        ticketTypeName: ticket.name,
        quantity: 2,
        unitPrice: ticket.price,
        subtotal: ticket.price * 2,
      },
    ],
    tickets: [
      {
        ticketCode: 'ET-MOCK-001',
        tierName: ticket.name,
        attendeeName: 'Abebe Bikila',
        securityHash: 'sec-hash-001-demo',
        status: 'VALID',
        seatLabel: 'General Admission - Gate A',
      },
      {
        ticketCode: 'ET-MOCK-002',
        tierName: ticket.name,
        attendeeName: 'Chaltu Tadesse',
        securityHash: 'sec-hash-002-demo',
        status: 'VALID',
        seatLabel: 'General Admission - Gate A',
      },
    ],
  };
}

export function getMockPublicTicket(securityHash: string): PublicTicketDetails {
  const event = MOCK_EVENTS[0];
  const ticket = event.ticketTypes[0];

  return {
    ticketCode: `ET-${securityHash.substring(0, 8).toUpperCase()}`,
    eventTitle: event.title,
    eventSlug: event.slug,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    eventStartTime: event.startTime,
    tierName: ticket.name,
    attendeeName: 'Abebe Bikila',
    attendeePhone: '+251911223344',
    status: 'VALID',
    // 1x1 transparent SVG base64 or valid QR SVG placeholder
    qrCodeBase64: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23ffffff"/><rect x="20" y="20" width="50" height="50" fill="%23111827"/><rect x="130" y="20" width="50" height="50" fill="%23111827"/><rect x="20" y="130" width="50" height="50" fill="%23111827"/><rect x="90" y="90" width="20" height="20" fill="%23111827"/></svg>',
    qrPayload: `ETHIO_EVENTS_V1:${securityHash}:ED25519_MOCK_SIG`,
    securityHash,
    seatLabel: 'Gate A - Fast Track Entry',
  };
}

export function getMockExchangeRates(): ExchangeRatesResponse {
  return {
    baseCurrency: 'ETB',
    lastUpdated: new Date().toISOString(),
    currencies: [
      { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', flag: '🇪🇹', etbRate: 1.0 },
      { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', etbRate: 125.0 },
      { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', etbRate: 135.0 },
      { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', etbRate: 160.0 },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', etbRate: 92.0 },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', etbRate: 34.0 },
    ],
  };
}

export function createMockEvent(data: any): EventDetail {
  const slug = (data.title || 'new-event')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') + `-${Math.floor(1000 + Math.random() * 9000)}`;

  const newEvent: EventDetail = {
    id: `evt-${Date.now()}`,
    title: data.title,
    slug,
    description: data.description || '',
    venueName: data.venueName,
    venueAddress: data.venueAddress,
    startTime: {
      isoUtc: data.startTimeIsoUtc,
      gregorianFormatted: new Date(data.startTimeIsoUtc).toLocaleDateString(),
      ethiopianDateFormatted: 'ጥቅምት 12 ቀን 2019 ዓ.ም',
      ethiopianTimeFormatted: 'ቀን',
      ethiopianFullFormatted: new Date(data.startTimeIsoUtc).toLocaleString(),
    },
    endTime: {
      isoUtc: data.endTimeIsoUtc,
      gregorianFormatted: new Date(data.endTimeIsoUtc).toLocaleDateString(),
      ethiopianDateFormatted: 'ጥቅምት 12 ቀን 2019 ዓ.ም',
      ethiopianTimeFormatted: 'ቀን',
      ethiopianFullFormatted: new Date(data.endTimeIsoUtc).toLocaleString(),
    },
    bannerImageUrl: data.bannerImageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop',
    status: 'PUBLISHED',
    organizerName: data.organizerName || 'Addis Organizer',
    category: data.category || 'MUSIC_CONCERT',
    neighborhood: data.neighborhood || 'BOLE',
    featured: !!data.featured,
    tags: typeof data.tags === 'string' ? data.tags.split(',') : (data.tags || []),
    latitude: 9.01,
    longitude: 38.76,
    ticketTypes: (data.ticketTypes || []).map((t: any, idx: number) => ({
      id: `tt-${Date.now()}-${idx}`,
      name: t.name,
      description: t.description || '',
      price: Number(t.price) || 0,
      currency: 'ETB',
      availableCapacity: Number(t.totalCapacity) || 50,
      maxPerUser: Number(t.maxPerUser) || 5,
      isAvailable: true,
    })),
  };

  MOCK_EVENTS.unshift(newEvent);
  return newEvent;
}

