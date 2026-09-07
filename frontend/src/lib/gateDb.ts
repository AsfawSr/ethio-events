import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface AttendeeRecord {
  ticketId: string;
  ticketCode: string;
  tierName: string;
  attendeeName: string;
  attendeePhone: string;
  digitalSignature: string;
  status: 'ISSUED' | 'CHECKED_IN' | 'REVOKED';
  checkedInAt: string | null;
  eventId: string;
}

export interface SyncQueueRecord {
  id?: number;
  ticketId: string;
  ticketCode: string;
  eventId: string;
  checkedInAt: string;
  synced: boolean;
}

interface GateDatabaseSchema extends DBSchema {
  attendees: {
    key: string; // ticketId or ticketCode
    value: AttendeeRecord;
    indexes: {
      'by-event': string;
      'by-code': string;
    };
  };
  sync_queue: {
    key: number;
    value: SyncQueueRecord;
    autoIncrement: true;
    indexes: {
      'by-synced': number;
    };
  };
  event_keys: {
    key: string; // eventId
    value: {
      eventId: string;
      publicKeyHex: string;
      lastSyncedAt: string;
    };
  };
}

const DB_NAME = 'EthioEventsGateDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<GateDatabaseSchema>> | null = null;

export function getGateDb(): Promise<IDBPDatabase<GateDatabaseSchema>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only available in browser environments'));
  }

  if (!dbPromise) {
    dbPromise = openDB<GateDatabaseSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Attendees Store
        if (!db.objectStoreNames.contains('attendees')) {
          const attendeeStore = db.createObjectStore('attendees', { keyPath: 'ticketId' });
          attendeeStore.createIndex('by-event', 'eventId');
          attendeeStore.createIndex('by-code', 'ticketCode', { unique: true });
        }

        // Offline Sync Queue
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('by-synced', 'synced');
        }

        // Master Event Public Keys Cache
        if (!db.objectStoreNames.contains('event_keys')) {
          db.createObjectStore('event_keys', { keyPath: 'eventId' });
        }
      },
    });
  }

  return dbPromise;
}
