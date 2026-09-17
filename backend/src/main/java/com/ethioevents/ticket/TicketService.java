package com.ethioevents.ticket;

import com.ethioevents.auth.SmsGatewayService;
import com.ethioevents.common.ApiException;
import com.ethioevents.crypto.Ed25519TicketSigner;
import com.ethioevents.crypto.QrCodeGeneratorService;
import com.ethioevents.localization.LocalizedDateTimeDto;
import com.ethioevents.model.*;
import com.ethioevents.repository.OrderItemRepository;
import com.ethioevents.repository.TicketRepository;
import com.ethioevents.repository.TicketTransferRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TicketService {

    private static final Logger log = LoggerFactory.getLogger(TicketService.class);
    private static final String ALPHANUM = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

    private final TicketRepository ticketRepository;
    private final OrderItemRepository orderItemRepository;
    private final TicketTransferRepository ticketTransferRepository;
    private final Ed25519TicketSigner ticketSigner;
    private final QrCodeGeneratorService qrCodeGeneratorService;
    private final SmsGatewayService smsGatewayService;
    private final SecureRandom random = new SecureRandom();

    public TicketService(TicketRepository ticketRepository,
                         OrderItemRepository orderItemRepository,
                         TicketTransferRepository ticketTransferRepository,
                         Ed25519TicketSigner ticketSigner,
                         QrCodeGeneratorService qrCodeGeneratorService,
                         SmsGatewayService smsGatewayService) {
        this.ticketRepository = ticketRepository;
        this.orderItemRepository = orderItemRepository;
        this.ticketTransferRepository = ticketTransferRepository;
        this.ticketSigner = ticketSigner;
        this.qrCodeGeneratorService = qrCodeGeneratorService;
        this.smsGatewayService = smsGatewayService;
    }

    public record PublicTicketDetailsDto(
            String ticketCode,
            String eventTitle,
            String eventSlug,
            String venueName,
            String venueAddress,
            LocalizedDateTimeDto eventStartTime,
            String tierName,
            String attendeeName,
            String attendeePhone,
            String status,
            String qrCodeBase64,
            String qrPayload,
            String securityHash
    ) {}

    @Transactional
    public List<Ticket> generateTicketsForOrder(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        List<Ticket> generatedTickets = new ArrayList<>();

        for (OrderItem item : items) {
            for (int i = 0; i < item.getQuantity(); i++) {
                UUID ticketId = UUID.randomUUID();
                String ticketCode = generateHumanTicketCode();

                Ed25519TicketSigner.SignedTicketPayload signed =
                        ticketSigner.signTicket(ticketId, order.getEvent().getId(), ticketCode);

                Ticket ticket = new Ticket();
                ticket.setId(ticketId);
                ticket.setTicketCode(ticketCode);
                ticket.setOrder(order);
                ticket.setTicketType(item.getTicketType());
                ticket.setEvent(order.getEvent());
                ticket.setAttendeeName(order.getCustomerName());
                ticket.setAttendeePhone(order.getCustomerPhone());
                ticket.setSecurityHash(signed.securityHash());
                ticket.setDigitalSignature(signed.fullQrPayload());
                ticket.setStatus(TicketStatus.ISSUED);

                Ticket saved = ticketRepository.save(ticket);
                generatedTickets.add(saved);
                log.info("Generated cryptographic ticket {} for Order {}", ticketCode, order.getOrderNumber());
            }
        }

        // Send confirmation SMS with direct link to first ticket
        if (!generatedTickets.isEmpty()) {
            Ticket firstTicket = generatedTickets.get(0);
            String ticketPassUrl = "http://localhost:3000/t/" + firstTicket.getSecurityHash();
            smsGatewayService.sendTicketConfirmationSms(
                    order.getCustomerPhone(),
                    order.getEvent().getTitle(),
                    firstTicket.getTicketCode(),
                    ticketPassUrl
            );
        }

        return generatedTickets;
    }

    public Ticket getTicketBySecurityHash(String securityHash) {
        return ticketRepository.findBySecurityHash(securityHash)
                .orElseGet(() -> {
                    Optional<TicketTransfer> transferOpt = ticketTransferRepository.findByPreviousSecurityHash(securityHash);
                    if (transferOpt.isPresent()) {
                        TicketTransfer transfer = transferOpt.get();
                        throw new ApiException(HttpStatus.GONE, "TICKET_TRANSFERRED",
                                "This ticket pass was transferred to " + transfer.getRecipientName() + ". The previous pass has been cryptographically revoked.");
                    }
                    throw new ApiException(HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND", "Ticket pass not found or invalid link");
                });
    }

    public PublicTicketDetailsDto getPublicTicketBySecurityHash(String securityHash) {
        Ticket ticket = getTicketBySecurityHash(securityHash);
        return mapToPublicDto(ticket);
    }

    public PublicTicketDetailsDto getPublicTicketByCode(String ticketCode) {
        Ticket ticket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND", "Ticket pass not found"));

        return mapToPublicDto(ticket);
    }

    @Transactional
    public TicketDtos.TransferTicketResponse transferTicket(TicketDtos.TransferTicketRequest request) {
        if (request.ticketSecurityHash() == null || request.ticketSecurityHash().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PARAM", "Ticket security hash is required");
        }
        if (request.recipientName() == null || request.recipientName().trim().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PARAM", "Recipient full name is required");
        }
        if (request.recipientPhone() == null || request.recipientPhone().trim().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PARAM", "Recipient phone number is required");
        }

        Ticket ticket = ticketRepository.findBySecurityHash(request.ticketSecurityHash().trim())
                .orElseGet(() -> {
                    Optional<TicketTransfer> transferOpt = ticketTransferRepository.findByPreviousSecurityHash(request.ticketSecurityHash().trim());
                    if (transferOpt.isPresent()) {
                        throw new ApiException(HttpStatus.BAD_REQUEST, "ALREADY_TRANSFERRED",
                                "This ticket has already been transferred to " + transferOpt.get().getRecipientName());
                    }
                    throw new ApiException(HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND", "Active ticket pass not found");
                });

        if (ticket.getStatus() == TicketStatus.CHECKED_IN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TICKET_USED", "Cannot transfer a ticket that has already been checked in at the gate.");
        }
        if (ticket.getStatus() == TicketStatus.REVOKED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TICKET_REVOKED", "Cannot transfer a revoked ticket.");
        }

        String previousSecurityHash = ticket.getSecurityHash();
        String previousSignature = ticket.getDigitalSignature();
        String senderName = (request.senderName() != null && !request.senderName().isBlank())
                ? request.senderName().trim()
                : (ticket.getAttendeeName() != null ? ticket.getAttendeeName() : "Ticket Holder");
        String senderPhone = (request.senderPhone() != null && !request.senderPhone().isBlank())
                ? request.senderPhone().trim()
                : (ticket.getAttendeePhone() != null ? ticket.getAttendeePhone() : "");
        String recipientName = request.recipientName().trim();
        String recipientPhone = request.recipientPhone().trim();

        // Re-sign ticket cryptographically with brand new nonce & timestamp
        Ed25519TicketSigner.SignedTicketPayload newSigned =
                ticketSigner.signTicket(ticket.getId(), ticket.getEvent().getId(), ticket.getTicketCode());

        // Update ticket attendee info & active cryptographic credentials
        ticket.setAttendeeName(recipientName);
        ticket.setAttendeePhone(recipientPhone);
        ticket.setSecurityHash(newSigned.securityHash());
        ticket.setDigitalSignature(newSigned.fullQrPayload());
        ticket.setUpdatedAt(Instant.now());
        ticketRepository.save(ticket);

        // Record transfer audit log
        TicketTransfer transfer = new TicketTransfer();
        transfer.setTicket(ticket);
        transfer.setSenderName(senderName);
        transfer.setSenderPhone(senderPhone);
        transfer.setRecipientName(recipientName);
        transfer.setRecipientPhone(recipientPhone);
        transfer.setReason(request.reason());
        transfer.setPreviousSecurityHash(previousSecurityHash);
        transfer.setNewSecurityHash(newSigned.securityHash());
        transfer.setPreviousSignature(previousSignature);
        transfer.setNewSignature(newSigned.signatureHex());
        transfer.setTransferredAt(Instant.now());
        TicketTransfer savedTransfer = ticketTransferRepository.save(transfer);

        String newTicketPassUrl = "http://localhost:3000/t/" + newSigned.securityHash();

        // Dispatch SMS notification to recipient
        try {
            smsGatewayService.sendTicketTransferSms(
                    recipientPhone,
                    senderName,
                    ticket.getEvent().getTitle(),
                    ticket.getTicketCode(),
                    newTicketPassUrl
            );
        } catch (Exception e) {
            log.warn("Failed to dispatch transfer SMS: {}", e.getMessage());
        }

        log.info("Ticket {} successfully transferred from [{}] to [{}] with new security hash {}",
                ticket.getTicketCode(), senderName, recipientName, newSigned.securityHash());

        return new TicketDtos.TransferTicketResponse(
                savedTransfer.getId(),
                ticket.getTicketCode(),
                ticket.getEvent().getTitle(),
                previousSecurityHash,
                newSigned.securityHash(),
                newTicketPassUrl,
                recipientName,
                recipientPhone,
                savedTransfer.getTransferredAt()
        );
    }

    public List<TicketDtos.TicketTransferHistoryDto> getTransferHistoryByTicketCode(String ticketCode) {
        Ticket ticket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND", "Ticket not found"));

        return ticketTransferRepository.findByTicketIdOrderByTransferredAtDesc(ticket.getId())
                .stream()
                .map(t -> new TicketDtos.TicketTransferHistoryDto(
                        t.getId(),
                        t.getSenderName(),
                        t.getSenderPhone(),
                        t.getRecipientName(),
                        t.getRecipientPhone(),
                        t.getReason(),
                        t.getPreviousSecurityHash(),
                        t.getNewSecurityHash(),
                        t.getTransferredAt()
                ))
                .collect(Collectors.toList());
    }

    private PublicTicketDetailsDto mapToPublicDto(Ticket ticket) {
        // Use full signed payload if present, or construct v1 payload
        String qrPayload = ticket.getDigitalSignature();
        if (qrPayload == null || !qrPayload.startsWith("v1.")) {
            qrPayload = String.format("v1.%s.%s.%s", ticket.getId(), ticket.getEvent().getId(), ticket.getDigitalSignature());
        }
        String qrCodeBase64 = qrCodeGeneratorService.generateQrCodeBase64(qrPayload, 300, 300);

        return new PublicTicketDetailsDto(
                ticket.getTicketCode(),
                ticket.getEvent().getTitle(),
                ticket.getEvent().getSlug(),
                ticket.getEvent().getVenueName(),
                ticket.getEvent().getVenueAddress(),
                LocalizedDateTimeDto.fromInstant(ticket.getEvent().getStartTimeUtc()),
                ticket.getTicketType().getName(),
                ticket.getAttendeeName(),
                ticket.getAttendeePhone(),
                ticket.getStatus().name(),
                qrCodeBase64,
                qrPayload,
                ticket.getSecurityHash()
        );
    }

    private String generateHumanTicketCode() {
        StringBuilder sb = new StringBuilder("ETH-");
        for (int i = 0; i < 6; i++) {
            sb.append(ALPHANUM.charAt(random.nextInt(ALPHANUM.length())));
        }
        return sb.toString();
    }
}
