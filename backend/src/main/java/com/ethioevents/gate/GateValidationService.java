package com.ethioevents.gate;

import com.ethioevents.common.ApiException;
import com.ethioevents.crypto.Ed25519TicketSigner;
import com.ethioevents.model.Event;
import com.ethioevents.model.Ticket;
import com.ethioevents.model.TicketStatus;
import com.ethioevents.repository.EventRepository;
import com.ethioevents.repository.TicketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GateValidationService {

    private static final Logger log = LoggerFactory.getLogger(GateValidationService.class);

    private final EventRepository eventRepository;
    private final TicketRepository ticketRepository;
    private final Ed25519TicketSigner ticketSigner;

    public GateValidationService(EventRepository eventRepository,
                                 TicketRepository ticketRepository,
                                 Ed25519TicketSigner ticketSigner) {
        this.eventRepository = eventRepository;
        this.ticketRepository = ticketRepository;
        this.ticketSigner = ticketSigner;
    }

    public GateDtos.GateManifestDto getEventManifest(UUID eventId, Instant since) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "Event not found"));

        List<Ticket> tickets = ticketRepository.findManifestForGate(eventId, since);
        long checkedIn = ticketRepository.countByEventIdAndStatus(eventId, TicketStatus.CHECKED_IN);

        List<GateDtos.AttendeeManifestEntry> entries = tickets.stream().map(t -> new GateDtos.AttendeeManifestEntry(
                t.getId(),
                t.getTicketCode(),
                t.getTicketType().getName(),
                t.getAttendeeName(),
                t.getAttendeePhone(),
                t.getDigitalSignature(),
                t.getStatus().name(),
                t.getCheckedInAtUtc()
        )).collect(Collectors.toList());

        return new GateDtos.GateManifestDto(
                event.getId(),
                event.getTitle(),
                ticketSigner.getPublicKeyHex(),
                tickets.size(),
                checkedIn,
                "v1-" + System.currentTimeMillis(),
                entries
        );
    }

    @Transactional
    public GateDtos.ValidateResultDto validateTicketOnline(GateDtos.OnlineValidateRequest request) {
        Ticket ticket = null;

        // Try lookup by QR payload or ticket code
        if (request.qrPayload() != null && !request.qrPayload().isBlank()) {
            boolean isValidSig = ticketSigner.verifyQrPayload(request.qrPayload());
            if (!isValidSig) {
                return new GateDtos.ValidateResultDto("INVALID", "Invalid or counterfeit ticket signature", null, null, null, null);
            }
            String[] parts = request.qrPayload().split("\\.");
            try {
                UUID ticketId = UUID.fromString(parts[1]);
                ticket = ticketRepository.findById(ticketId).orElse(null);
            } catch (Exception ignored) {}
        } else if (request.ticketCode() != null) {
            ticket = ticketRepository.findByTicketCode(request.ticketCode().trim()).orElse(null);
        }

        if (ticket == null) {
            return new GateDtos.ValidateResultDto("INVALID", "Ticket not found in system database", null, null, null, null);
        }

        if (!ticket.getEvent().getId().equals(request.eventId())) {
            return new GateDtos.ValidateResultDto("WRONG_EVENT", "This ticket is for a different event: " + ticket.getEvent().getTitle(),
                    ticket.getTicketCode(), ticket.getTicketType().getName(), ticket.getAttendeeName(), null);
        }

        if (ticket.getStatus() == TicketStatus.CHECKED_IN) {
            return new GateDtos.ValidateResultDto("DUPLICATE", "Ticket ALREADY used and checked in!",
                    ticket.getTicketCode(), ticket.getTicketType().getName(), ticket.getAttendeeName(), ticket.getCheckedInAtUtc());
        }

        if (ticket.getStatus() == TicketStatus.REVOKED) {
            return new GateDtos.ValidateResultDto("REVOKED", "Ticket has been cancelled or revoked",
                    ticket.getTicketCode(), ticket.getTicketType().getName(), ticket.getAttendeeName(), null);
        }

        // Successfully check in
        ticket.setStatus(TicketStatus.CHECKED_IN);
        ticket.setCheckedInAtUtc(Instant.now());
        Ticket saved = ticketRepository.save(ticket);

        return new GateDtos.ValidateResultDto(
                "SUCCESS",
                "Access Granted - Welcome!",
                saved.getTicketCode(),
                saved.getTicketType().getName(),
                saved.getAttendeeName(),
                saved.getCheckedInAtUtc()
        );
    }

    @Transactional
    public GateDtos.BatchSyncResponse processBatchSync(GateDtos.BatchSyncRequest request) {
        int successCount = 0;
        int conflictCount = 0;
        List<String> conflicts = new ArrayList<>();

        for (GateDtos.OfflineCheckInRecord record : request.checkIns()) {
            Optional<Ticket> ticketOpt = record.ticketId() != null
                    ? ticketRepository.findById(record.ticketId())
                    : ticketRepository.findByTicketCode(record.ticketCode());

            if (ticketOpt.isPresent()) {
                Ticket ticket = ticketOpt.get();
                if (ticket.getStatus() == TicketStatus.CHECKED_IN) {
                    conflictCount++;
                    conflicts.add(ticket.getTicketCode() + " (Already checked in)");
                } else {
                    ticket.setStatus(TicketStatus.CHECKED_IN);
                    ticket.setCheckedInAtUtc(record.checkedInAt() != null ? record.checkedInAt() : Instant.now());
                    ticketRepository.save(ticket);
                    successCount++;
                }
            } else {
                conflictCount++;
                conflicts.add((record.ticketCode() != null ? record.ticketCode() : record.ticketId().toString()) + " (Ticket not found)");
            }
        }

        return new GateDtos.BatchSyncResponse(request.checkIns().size(), successCount, conflictCount, conflicts);
    }
}
