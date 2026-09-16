'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'am';

export interface Translations {
  // Brand
  brandName: string;
  brandSubtitle: string;

  // Nav
  explore: string;
  organizerPortal: string;
  createEvent: string;
  myTickets: string;
  gateScanner: string;
  admin: string;

  // Hero & Discovery
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  allCategories: string;
  concerts: string;
  conferences: string;
  festivals: string;
  sports: string;
  verifiedBadge: string;
  getTickets: string;
  viewDetails: string;
  fromPrice: string;

  // Event Detail & Checkout
  eventOverview: string;
  dateAndTime: string;
  ethiopianTime: string;
  venueLocation: string;
  selectTickets: string;
  pricePerTicket: string;
  reserveAndPay: string;
  holdTimerNotice: string;
  checkoutTitle: string;
  fullName: string;
  phoneNumber: string;
  selectPaymentMethod: string;
  payWithTelebirr: string;
  payWithChapa: string;
  totalAmount: string;
  confirmOrder: string;

  // Order & Tickets
  paymentConfirmed: string;
  orderPending: string;
  downloadPdf: string;
  openGatePass: string;
  printPass: string;
  share: string;
  saveToWallet: string;
  ticketRef: string;
  attendee: string;

  // Gate Operations
  gateTitle: string;
  offlineReady: string;
  startCamera: string;
  stopCamera: string;
  manualCodePlaceholder: string;
  verifyCode: string;
  accessGranted: string;
  alreadyUsed: string;
  invalidTicket: string;
  downloadManifest: string;
  syncPending: string;
  liveStream: string;

  // Common
  loading: string;
  back: string;
  close: string;
  cancel: string;
  success: string;
  error: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    brandName: 'EthioEvents',
    brandSubtitle: 'Addis Ababa Events & Ticketing',
    explore: 'Explore',
    organizerPortal: 'Organizer Portal',
    createEvent: '+ Event',
    myTickets: 'My Tickets',
    gateScanner: 'Gate Scanner',
    admin: 'Admin',

    heroTitle: 'Experience the Best Events in',
    heroHighlight: 'Addis Ababa',
    heroSubtitle: 'Instant Telebirr & Chapa ticketing with tamper-proof offline Ed25519 entrance passes at Millennium Hall and top venues.',
    searchPlaceholder: 'Search concerts, conferences, festivals in Addis...',
    allCategories: 'All Events',
    concerts: 'Music & Concerts',
    conferences: 'Tech & Business',
    festivals: 'Culture & Festive',
    sports: 'Sports & Run',
    verifiedBadge: 'Verified Event',
    getTickets: 'Get Tickets',
    viewDetails: 'View Details',
    fromPrice: 'from',

    eventOverview: 'Event Overview',
    dateAndTime: 'Date & Time',
    ethiopianTime: 'Ethiopian Calendar',
    venueLocation: 'Venue & Location',
    selectTickets: 'Select Ticket Tiers',
    pricePerTicket: 'ETB / ticket',
    reserveAndPay: 'Reserve & Checkout',
    holdTimerNotice: 'Your tickets are held for 10 minutes to complete Telebirr or Chapa payment.',
    checkoutTitle: 'Fast Guest Checkout',
    fullName: 'Full Name',
    phoneNumber: 'Ethio Telecom Phone (+251)',
    selectPaymentMethod: 'Select Ethiopian Payment Method',
    payWithTelebirr: 'Pay with Telebirr',
    payWithChapa: 'Pay with Chapa (CBE / Bank / Telebirr)',
    totalAmount: 'Total Due',
    confirmOrder: 'Confirm & Pay Now',

    paymentConfirmed: 'Payment Confirmed! Your Tickets are Ready',
    orderPending: 'Order Pending Payment',
    downloadPdf: 'Download PDF Pass',
    openGatePass: 'Open Gate Pass',
    printPass: 'Print Pass',
    share: 'Share',
    saveToWallet: 'Save to Mobile Wallet',
    ticketRef: 'Ticket Code',
    attendee: 'Attendee Name',

    gateTitle: 'Venue Gate Operations',
    offlineReady: 'Offline Ed25519 Ready',
    startCamera: 'Start Camera',
    stopCamera: 'Stop Camera',
    manualCodePlaceholder: 'Enter Code e.g. ETH-8K9B2X',
    verifyCode: 'Verify Code',
    accessGranted: 'ACCESS GRANTED',
    alreadyUsed: 'ALREADY CHECKED IN',
    invalidTicket: 'INVALID / FORGED TICKET',
    downloadManifest: 'Download Manifest',
    syncPending: 'Sync Pending Scans',
    liveStream: 'Live Turnstile Stream',

    loading: 'Loading...',
    back: 'Back',
    close: 'Close',
    cancel: 'Cancel',
    success: 'Success',
    error: 'Error',
  },

  am: {
    brandName: 'ኢትዮ ኢቨንትስ',
    brandSubtitle: 'የአዲስ አበባ መድረኮች እና የኢ-ቲኬት ስርዓት',
    explore: 'መድረኮች',
    organizerPortal: 'የአዘጋጅ ገጽ',
    createEvent: '+ መድረክ መዝግብ',
    myTickets: 'ቲኬቶቼ',
    gateScanner: 'በር መቆጣጠሪያ',
    admin: 'አድሚን',

    heroTitle: 'ምርጥ የአዲስ አበባ መድረኮችን',
    heroHighlight: 'ይቀላቀሉ',
    heroSubtitle: 'ፈጣን የቴሌብር እና የቻፓ ክፍያ፣ አስተማማኝ የኢ-ቲኬት መግቢያ በሚሌኒየም አዳራሽ እና በመላው አዲስ አበባ።',
    searchPlaceholder: 'ኮንሰርቶችን፣ ስብሰባዎችን፣ ፌስቲቫሎችን ይፈልጉ...',
    allCategories: 'ሁሉም መድረኮች',
    concerts: 'ሙዚቃና ኮንሰርት',
    conferences: 'ቴክኖሎጂና ስብሰባ',
    festivals: 'ባህላዊና ፌስቲቫል',
    sports: 'ስፖርትና ሩጫ',
    verifiedBadge: 'የተረጋገጠ መድረክ',
    getTickets: 'ቲኬት ይቁረጡ',
    viewDetails: 'ዝርዝር መረጃ',
    fromPrice: 'ከ',

    eventOverview: 'የመድረኩ ዝርዝር መረጃ',
    dateAndTime: 'ቀን እና ሰዓት',
    ethiopianTime: 'የኢትዮጵያ ዘመን አቆጣጠር',
    venueLocation: 'የመድረኩ ቦታ እና አድራሻ',
    selectTickets: 'የቲኬት አይነት ይምረጡ',
    pricePerTicket: 'ብር / በቲኬት',
    reserveAndPay: 'ቲኬት ይያዙና ይክፈሉ',
    holdTimerNotice: 'የመረጧቸው ቲኬቶች በቴሌብር ወይም በባንክ ክፍያ እስኪፈጽሙ ድረስ ለ10 ደቂቃ ተይዘው ይቆያሉ።',
    checkoutTitle: 'ቀጥተኛ የቲኬት መግዣ',
    fullName: 'ሙሉ ስም',
    phoneNumber: 'የስልክ ቁጥር (+251)',
    selectPaymentMethod: 'የክፍያ አማራጭ ይምረጡ',
    payWithTelebirr: 'በቴሌብር ይክፈሉ',
    payWithChapa: 'በቻፓ ይክፈሉ (ንግድ ባንክ / ሌሎች ባንኮች)',
    totalAmount: 'አጠቃላይ ክፍያ',
    confirmOrder: 'ክፍያውን አጠናቅቅ',

    paymentConfirmed: 'ክፍያዎ ተረጋግጧል! ቲኬትዎ ተዘጋጅቷል',
    orderPending: 'ክፍያ በመጠባበቅ ላይ',
    downloadPdf: 'ፒዲኤፍ (PDF) አውርድ',
    openGatePass: 'የመግቢያ ፓስ ክፈት',
    printPass: 'ቲኬት አትም',
    share: 'አጋራ',
    saveToWallet: 'ወደ ሞባይል ዋሌት አስገባ',
    ticketRef: 'የቲኬት ቁጥር',
    attendee: 'የተሳታፊ ስም',

    gateTitle: 'የመግቢያ በር መቆጣጠሪያ',
    offlineReady: 'ኢንተርኔት የማይፈልግ (Offline)',
    startCamera: 'ካሜራ ክፈት',
    stopCamera: 'ካሜራ ዝጋ',
    manualCodePlaceholder: 'የቲኬት ቁጥር አስገባ e.g. ETH-8K9B2X',
    verifyCode: 'ቲኬት አረጋግጥ',
    accessGranted: 'ይግቡ - እንኳን ደህና መጡ',
    alreadyUsed: 'ቀደም ሲል የገባ ቲኬት',
    invalidTicket: 'ትክክለኛ ያልሆነ ቲኬት',
    downloadManifest: 'የመድረኩን መረጃ አውርድ',
    syncPending: 'ያለቁ ስካኖችን ላክ',
    liveStream: 'የቀጥታ የመግቢያ ስትሪም',

    loading: 'በመጫን ላይ...',
    back: 'ተመለስ',
    close: 'ዝጋ',
    cancel: 'ሰርዝ',
    success: 'ተሳክቷል',
    error: 'ስህተት',
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
});

const STORAGE_KEY = 'ethioevents_lang';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as Language;
      if (saved === 'am' || saved === 'en') {
        setLanguageState(saved);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
      window.dispatchEvent(new CustomEvent('ethioevents_lang_changed', { detail: lang }));
    }
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
