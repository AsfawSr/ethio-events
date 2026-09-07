package com.ethioevents.gate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class GateDtos {

    public record GateManifestDto(
            UUID eventId,
            String eventTitle,
            String masterPublicKeyHex,
            long totalAttendees,
            long checkedInCount,
            String manifestVersion,
            List<AttendeeManifestEntry> attendees
    ) {}

    public record AttendeeManifestEntry(
            UUID ticketId,
            String ticketCode,
            String tierName,
            String attendeeName,
            String attendeePhone,
            String digitalSignature,
            String status, // ISSUED, CHECKED_IN, REVOKED
            Instant checkedInAt
    ) {}

    public record OnlineValidateRequest(
            UUID eventId,
            String qrPayload,
            String ticketCode
    ) {}

    public record ValidateResultDto(
            String status, // SUCCESS, DUPLICATE, INVALID, REVOKED, WRONG_EVENT
            String message,
            String ticketCode,
            String tierName,
            String attendeeName,
            Instant checkedInAt
    ) {}

    public record BatchSyncRequest(
            UUID eventId,
            List<OfflineCheckInRecord> checkIns
    ) {}

    public record OfflineCheckInRecord(
            UUID ticketId,
            String ticketCode,
            Instant checkedInAt
    ) {}

    public record BatchSyncResponse(
            int processedCount,
            int successCount,
            int conflictCount,
            List<String> conflicts
    ) {}
}
