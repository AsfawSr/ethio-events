import { OrganizerSession } from './types';

const STORAGE_KEY = 'ethioevents_organizer_session';

export const authStorage = {
  getSession: (): OrganizerSession | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  setSession: (session: OrganizerSession): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      window.dispatchEvent(new Event('ethioevents_auth_changed'));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  },

  clearSession: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event('ethioevents_auth_changed'));
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  },

  getToken: (): string | null => {
    const session = authStorage.getSession();
    return session ? session.token : null;
  },

  isOrganizer: (): boolean => {
    const session = authStorage.getSession();
    return !!session && session.role === 'ORGANIZER';
  },
};
