import { useState, useEffect } from 'react';
import { api } from './api';
import { CurrencyInfo, SupportedCurrency } from './types';

export const DEFAULT_CURRENCIES: CurrencyInfo[] = [
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'ETB', flag: '🇪🇹', etbRate: 1 },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', etbRate: 125.00 },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', etbRate: 138.00 },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', etbRate: 163.00 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦', etbRate: 92.50 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', flag: '🇦🇪', etbRate: 34.00 },
];

const CURRENCY_STORAGE_KEY = 'ethioevents_selected_currency';

export function getStoredCurrency(): SupportedCurrency {
  if (typeof window === 'undefined') return 'ETB';
  try {
    const item = localStorage.getItem(CURRENCY_STORAGE_KEY) as SupportedCurrency;
    if (item && DEFAULT_CURRENCIES.some((c) => c.code === item)) {
      return item;
    }
  } catch {}
  return 'ETB';
}

export function setStoredCurrency(currency: SupportedCurrency): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    window.dispatchEvent(new Event('ethioevents_currency_changed'));
  } catch (e) {
    console.error('Failed to save currency:', e);
  }
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState<SupportedCurrency>('ETB');
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>(DEFAULT_CURRENCIES);
  const [ratesLoaded, setRatesLoaded] = useState(false);

  useEffect(() => {
    setCurrencyState(getStoredCurrency());

    const fetchRates = async () => {
      try {
        const data = await api.getExchangeRates();
        if (data && data.currencies && data.currencies.length > 0) {
          setCurrencies(data.currencies as CurrencyInfo[]);
        }
      } catch (err) {
        // Fallback to default benchmark rates
      } finally {
        setRatesLoaded(true);
      }
    };
    fetchRates();

    const handleCurrencyChange = () => {
      setCurrencyState(getStoredCurrency());
    };
    window.addEventListener('ethioevents_currency_changed', handleCurrencyChange);
    return () => window.removeEventListener('ethioevents_currency_changed', handleCurrencyChange);
  }, []);

  const setCurrency = (c: SupportedCurrency) => {
    setStoredCurrency(c);
    setCurrencyState(c);
  };

  const getCurrencyInfo = (code: string = currency): CurrencyInfo => {
    return currencies.find((c) => c.code === code) || currencies[0];
  };

  const convertEtb = (etbAmount: number, targetCurrency: string = currency): number => {
    if (!etbAmount) return 0;
    if (targetCurrency === 'ETB') return etbAmount;
    const info = getCurrencyInfo(targetCurrency);
    if (!info || info.etbRate <= 0) return etbAmount;
    return parseFloat((etbAmount / info.etbRate).toFixed(2));
  };

  const formatPrice = (etbAmount: number, showDual: boolean = false): string => {
    if (etbAmount === 0) return 'Free (ነፃ)';
    const currentInfo = getCurrencyInfo(currency);

    if (currency === 'ETB') {
      return `${etbAmount.toLocaleString()} ETB`;
    }

    const converted = convertEtb(etbAmount, currency);
    const foreignFormatted = `${currentInfo.symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currentInfo.code}`;

    if (showDual) {
      return `${foreignFormatted} (${etbAmount.toLocaleString()} ETB)`;
    }
    return foreignFormatted;
  };

  return {
    currency,
    setCurrency,
    currencies,
    ratesLoaded,
    getCurrencyInfo,
    convertEtb,
    formatPrice,
  };
}
