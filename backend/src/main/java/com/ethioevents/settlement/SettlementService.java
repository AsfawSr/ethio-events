package com.ethioevents.settlement;

import com.ethioevents.auth.SmsGatewayService;
import com.ethioevents.common.ApiException;
import com.ethioevents.model.*;
import com.ethioevents.repository.EventRepository;
import com.ethioevents.repository.OrderRepository;
import com.ethioevents.repository.SettlementRepository;
import com.ethioevents.repository.TicketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SettlementService {

    private static final Logger log = LoggerFactory.getLogger(SettlementService.class);
    private static final BigDecimal COMMISSION_PERCENT = new BigDecimal("0.05"); // 5% Standard platform fee
    private static final SecureRandom random = new SecureRandom();

    private final SettlementRepository settlementRepository;
    private final EventRepository eventRepository;
    private final OrderRepository orderRepository;
    private final TicketRepository ticketRepository;
    private final SmsGatewayService smsGatewayService;

    public SettlementService(
            SettlementRepository settlementRepository,
            EventRepository eventRepository,
            OrderRepository orderRepository,
            TicketRepository ticketRepository,
            SmsGatewayService smsGatewayService) {
        this.settlementRepository = settlementRepository;
        this.eventRepository = eventRepository;
        this.orderRepository = orderRepository;
        this.ticketRepository = ticketRepository;
        this.smsGatewayService = smsGatewayService;
    }

    /**
     * Preview calculate the settlement numbers for an event without persisting.
     */
    public SettlementDtos.CalculateSettlementResponse calculateSettlement(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "Event not found"));

        Organizer organizer = event.getOrganizer();
        List<Order> paidOrders = orderRepository.findByEventIdAndStatus(eventId, OrderStatus.PAID);

        BigDecimal gross = paidOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal commission = gross.multiply(COMMISSION_PERCENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal payout = gross.subtract(commission).setScale(2, RoundingMode.HALF_UP);

        long totalTicketsSold = ticketRepository.countByEventId(eventId);

        List<Settlement> existing = settlementRepository.findByEventId(eventId);
        boolean alreadySettled = !existing.isEmpty();
        UUID existingId = alreadySettled ? existing.get(0).getId() : null;

        return new SettlementDtos.CalculateSettlementResponse(
                event.getId(),
                event.getTitle(),
                organizer != null ? organizer.getId() : null,
                organizer != null ? organizer.getOrganizationName() : "N/A",
                organizer != null ? organizer.getBankName() : "N/A",
                organizer != null ? organizer.getBankAccountNo() : "N/A",
                gross,
                BigDecimal.valueOf(5.0),
                commission,
                payout,
                paidOrders.size(),
                totalTicketsSold,
                alreadySettled,
                existingId
        );
    }

    /**
     * Generate a new PENDING settlement ledger record for an event.
     */
    @Transactional
    public SettlementDtos.SettlementSummaryDto generateSettlement(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "Event not found"));

        Organizer organizer = event.getOrganizer();
        if (organizer == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NO_ORGANIZER", "Event does not have an assigned organizer");
        }

        List<Settlement> existing = settlementRepository.findByEventId(eventId);
        if (!existing.isEmpty()) {
            return mapToSummary(existing.get(0));
        }

        List<Order> paidOrders = orderRepository.findByEventIdAndStatus(eventId, OrderStatus.PAID);
        BigDecimal gross = paidOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal commission = gross.multiply(COMMISSION_PERCENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal payout = gross.subtract(commission).setScale(2, RoundingMode.HALF_UP);

        Settlement settlement = new Settlement();
        settlement.setEvent(event);
        settlement.setOrganizer(organizer);
        settlement.setTotalGrossRevenue(gross);
        settlement.setPlatformCommissionFee(commission);
        settlement.setPayoutAmount(payout);
        settlement.setBankName(organizer.getBankName());
        settlement.setBankAccountNo(organizer.getBankAccountNo());
        settlement.setStatus(SettlementStatus.PENDING);

        Settlement saved = settlementRepository.save(settlement);
        log.info("Generated pending settlement for event '{}' [ID: {}]. Payout amount: {} ETB",
                event.getTitle(), saved.getId(), payout);

        return mapToSummary(saved);
    }

    /**
     * Process bank/Telebirr payout transfer and complete the settlement.
     */
    @Transactional
    public SettlementDtos.SettlementSummaryDto processPayout(UUID settlementId, SettlementDtos.ProcessPayoutRequest request) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SETTLEMENT_NOT_FOUND", "Settlement record not found"));

        if (settlement.getStatus() == SettlementStatus.COMPLETED) {
            log.info("Settlement {} is already marked as COMPLETED (Idempotent)", settlementId);
            return mapToSummary(settlement);
        }

        String ref = request != null && request.payoutReference() != null && !request.payoutReference().isBlank()
                ? request.payoutReference().trim()
                : "SETTLE-" + (System.currentTimeMillis() % 1000000) + "-" + (1000 + random.nextInt(9000));

        settlement.setStatus(SettlementStatus.COMPLETED);
        settlement.setPayoutReference(ref);
        settlement.setProcessedAt(Instant.now());

        Settlement saved = settlementRepository.save(settlement);
        log.info("Completed payout for settlement {}! Transferred {} ETB to {} account {} (Ref: {})",
                settlementId, saved.getPayoutAmount(), saved.getBankName(), saved.getBankAccountNo(), ref);

        // Send SMS confirmation to Organizer
        if (request == null || request.notifyOrganizerBySms()) {
            Organizer organizer = saved.getOrganizer();
            if (organizer != null && organizer.getUser() != null) {
                String ownerPhone = organizer.getUser().getPhoneNumber();
                String eventTitle = saved.getEvent().getTitle();
                String smsContent = String.format(
                        "EthioEvents Settlement: %s ETB has been disbursed to your %s account %s for '%s'. Reference: %s. የክፍያ ማስተላለፍ ተጠናቋል።",
                        saved.getPayoutAmount().toPlainString(),
                        saved.getBankName(),
                        saved.getBankAccountNo(),
                        eventTitle,
                        ref
                );
                try {
                    smsGatewayService.sendEventUpdateSms(ownerPhone, eventTitle, smsContent);
                } catch (Exception e) {
                    log.warn("Failed to send settlement confirmation SMS: " + e.getMessage());
                }
            }
        }

        return mapToSummary(saved);
    }

    public List<SettlementDtos.SettlementSummaryDto> getAllSettlements() {
        return settlementRepository.findByOrderByCreatedAtDesc().stream()
                .map(this::mapToSummary)
                .collect(Collectors.toList());
    }

    public List<SettlementDtos.SettlementSummaryDto> getSettlementsForOrganizer(UUID organizerId) {
        return settlementRepository.findByOrganizerIdOrderByCreatedAtDesc(organizerId).stream()
                .map(this::mapToSummary)
                .collect(Collectors.toList());
    }

    private SettlementDtos.SettlementSummaryDto mapToSummary(Settlement s) {
        Event e = s.getEvent();
        Organizer o = s.getOrganizer();
        User u = o != null ? o.getUser() : null;

        return new SettlementDtos.SettlementSummaryDto(
                s.getId(),
                e != null ? e.getId() : null,
                e != null ? e.getTitle() : "N/A",
                e != null ? e.getSlug() : "",
                o != null ? o.getId() : null,
                o != null ? o.getOrganizationName() : "N/A",
                u != null ? u.getPhoneNumber() : "",
                s.getTotalGrossRevenue(),
                s.getPlatformCommissionFee(),
                s.getPayoutAmount(),
                s.getBankName(),
                s.getBankAccountNo(),
                s.getStatus().name(),
                s.getPayoutReference(),
                s.getProcessedAt(),
                s.getCreatedAt()
        );
    }
}
