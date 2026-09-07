package com.ethioevents.ticket;

import com.ethioevents.auth.SmsGatewayService;
import com.ethioevents.common.ApiException;
import com.ethioevents.crypto.Ed25519TicketSigner;
import com.ethioevents.crypto.QrCodeGeneratorService;
import com.ethioevents.localization.LocalizedDateTimeDto;
import com.ethioevents.model.*;
import com.ethioevents.repository.OrderItemRepository;
import com.ethioevents.repository.TicketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

    private static final Logger log = LoggerFactory.getLogger(TicketService.class);
    private static final String ALPHANUM = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

    private final TicketRepository ticketRepository;
    private final OrderItemRepository orderItemRepository;
    private final Ed25519TicketSigner ticketSigner;
    private final QrCodeGeneratorService qrCodeGeneratorService;
    private final SmsGatewayService smsGatewayService;
    private final SecureRandom random = new SecureRandom();

    public TicketService(TicketRepository ticketRepository,
                         OrderItemRepository orderItemRepository,
                         Ed25519TicketSigner ticketSigner,
                         QrCodeGeneratorService qrCodeGeneratorService,
                         SmsGatewayService smsGatewayService) {
        this.ticketRepository = ticketRepository;
        this.orderItemRepository = orderItemRepository;
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
                ticket.setDigitalSignature(signed.signatureHex());
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

    public PublicTicketDetailsDto getPublicTicketBySecurityHash(String securityHash) {
        Ticket ticket = ticketRepository.findBySecurityHash(securityHash)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND", "Ticket pass not found or invalid link"));

        return mapToPublicDto(ticket);
    }

    public PublicTicketDetailsDto getPublicTicketByCode(String ticketCode) {
        Ticket ticket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND", "Ticket pass not found"));

        return mapToPublicDto(ticket);
    }

    private PublicTicketDetailsDto mapToPublicDto(Ticket ticket) {
        // Rebuild QR payload
        String qrPayload = String.format("v1.%s.%s.%s", ticket.getId(), ticket.getEvent().getId(), ticket.getDigitalSignature());
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
