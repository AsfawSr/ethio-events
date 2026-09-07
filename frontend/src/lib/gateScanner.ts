import * as ed from '@noble/ed25519';
import { getGateDb, AttendeeRecord } from './gateDb';

export interface OfflineScanResult {
  status: 'SUCCESS' | 'DUPLICATE' | 'INVALID' | 'REVOKED' | 'WRONG_EVENT';
  message: string;
  ticketCode?: string;
  tierName?: string;
  attendeeName?: string;
  checkedInAt?: string;
}

export async function processOfflineTicketScan(
  qrPayloadOrCode: string,
  currentEventId: string
): Promise<OfflineScanResult> {
  const db = await getGateDb();
  const input = qrPayloadOrCode.trim();

  // 1. Check if input is a cryptographic QR string: v1.<ticketId>.<eventId>.<nonce>.<timestamp>.<signatureHex>
  if (input.startsWith('v1.')) {
    const parts = input.split('.');
    if (parts.length >= 6) {
      const [_, ticketId, eventId, nonce, timestamp, signatureHex] = parts;

      if (eventId !== currentEventId) {
        return {
          status: 'WRONG_EVENT',
          message: 'This ticket belongs to a different event!',
        };
      }

      // Check Master Public Key for Event
      const keyRecord = await db.get('event_keys', currentEventId);
      if (keyRecord && keyRecord.publicKeyHex) {
        try {
          const rawMessage = `${ticketId}.${eventId}.${nonce}.${timestamp}`;
          const messageBytes = new TextEncoder().encode(rawMessage);
          const isValid = await ed.verify(signatureHex, messageBytes, keyRecord.publicKeyHex);
          if (!isValid) {
            return {
              status: 'INVALID',
              message: 'Counterfeit Ticket! Digital signature verification failed.',
            };
          }
        } catch (e) {
          console.warn('Crypto verification fallback:', e);
        }
      }

      // Query Local IndexedDB
      const attendee = await db.get('attendees', ticketId);
      if (!attendee) {
        return {
          status: 'INVALID',
          message: 'Ticket not found in downloaded gate manifest.',
        };
      }

      return checkInAttendee(attendee, db, currentEventId);
    }
  }

  // 2. Fallback: Human Ticket Code lookup (e.g. "ETH-7F9A2B")
  const cleanCode = input.toUpperCase();
  const attendeeByCode = await db.getFromIndex('attendees', 'by-code', cleanCode);
  if (attendeeByCode) {
    if (attendeeByCode.eventId !== currentEventId) {
      return {
        status: 'WRONG_EVENT',
        message: 'This ticket belongs to a different event!',
      };
    }
    return checkInAttendee(attendeeByCode, db, currentEventId);
  }

  return {
    status: 'INVALID',
    message: 'Invalid ticket code or unrecognized QR format.',
  };
}

async function checkInAttendee(
  attendee: AttendeeRecord,
  db: any,
  eventId: string
): Promise<OfflineScanResult> {
  if (attendee.status === 'CHECKED_IN') {
    return {
      status: 'DUPLICATE',
      message: `ALREADY USED! Checked in at ${attendee.checkedInAt ? new Date(attendee.checkedInAt).toLocaleTimeString() : 'earlier'}`,
      ticketCode: attendee.ticketCode,
      tierName: attendee.tierName,
      attendeeName: attendee.attendeeName,
      checkedInAt: attendee.checkedInAt || undefined,
    };
  }

  if (attendee.status === 'REVOKED') {
    return {
      status: 'REVOKED',
      message: 'This ticket has been CANCELLED or REVOKED.',
      ticketCode: attendee.ticketCode,
      tierName: attendee.tierName,
      attendeeName: attendee.attendeeName,
    };
  }

  // Mark as CHECKED_IN locally in IndexedDB
  const nowIso = new Date().toISOString();
  attendee.status = 'CHECKED_IN';
  attendee.checkedInAt = nowIso;

  const tx = db.transaction(['attendees', 'sync_queue'], 'readwrite');
  await tx.objectStore('attendees').put(attendee);
  await tx.objectStore('sync_queue').add({
    ticketId: attendee.ticketId,
    ticketCode: attendee.ticketCode,
    eventId: eventId,
    checkedInAt: nowIso,
    synced: false,
  });
  await tx.done;

  return {
    status: 'SUCCESS',
    message: 'ACCESS GRANTED - Welcome to the Event!',
    ticketCode: attendee.ticketCode,
    tierName: attendee.tierName,
    attendeeName: attendee.attendeeName,
    checkedInAt: nowIso,
  };
}
