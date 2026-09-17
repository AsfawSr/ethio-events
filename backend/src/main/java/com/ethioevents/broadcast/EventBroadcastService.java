package com.ethioevents.broadcast;

import com.ethioevents.auth.SmsGatewayDispatcher;
import com.ethioevents.localization.EthiopianTimeConverter;
import com.ethioevents.model.*;
import com.ethioevents.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
public class EventBroadcastService {

    private static final Logger log = LoggerFactory.getLogger(EventBroadcastService.class);

    private final EventBroadcastRepository broadcastRepository;
    private final EventRepository eventRepository;
    private final TicketRepository ticketRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final SmsGatewayDispatcher smsDispatcher;
    private final ExecutorService broadcastExecutor = Executors.newFixedThreadPool(4);

    @Value("${ethioevents.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    public EventBroadcastService(
            EventBroadcastRepository broadcastRepository,
            EventRepository eventRepository,
            TicketRepository ticketRepository,
            TicketTypeRepository ticketTypeRepository,
            SmsGatewayDispatcher smsDispatcher) {
        this.broadcastRepository = broadcastRepository;
        this.eventRepository = eventRepository;
        this.ticketRepository = ticketRepository;
        this.ticketTypeRepository = ticketTypeRepository;
        this.smsDispatcher = smsDispatcher;
    }

    /**
     * Estimates recipient count based on target filter
     */
    @Transactional(readOnly = true)
    public BroadcastDtos.AudienceEstimateResponse estimateAudience(UUID eventId, String targetFilter, UUID targetTicketTypeId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found with ID: " + eventId));

        List<Ticket> tickets = getEligibleTickets(event, targetFilter, targetTicketTypeId);
        Set<String> uniquePhones = tickets.stream()
                .map(this::resolvePhoneNumber)
                .filter(p -> p != null && !p.isBlank())
                .collect(Collectors.toSet());

        String targetTierName = "All Tiers";
        if (targetTicketTypeId != null) {
            targetTierName = ticketTypeRepository.findById(targetTicketTypeId)
                    .map(TicketType::getName)
                    .orElse("Specific Tier");
        } else if ("VIP_ONLY".equalsIgnoreCase(targetFilter)) {
            targetTierName = "VIP & VVIP Passes";
        }

        return new BroadcastDtos.AudienceEstimateResponse(
                eventId,
                targetFilter != null ? targetFilter : "ALL_ATTENDEES",
                uniquePhones.size(),
                tickets.size(),
                targetTierName
        );
    }

    /**
     * Creates and immediately fires or schedules a broadcast campaign
     */
    @Transactional
    public BroadcastDtos.BroadcastCampaignResponse createBroadcastCampaign(BroadcastDtos.CreateBroadcastRequest request, UUID organizerId) {
        Event event = eventRepository.findById(request.eventId())
                .orElseThrow(() -> new IllegalArgumentException("Event not found with ID: " + request.eventId()));

        EventBroadcastCampaign campaign = new EventBroadcastCampaign();
        campaign.setEventId(event.getId());
        campaign.setOrganizerId(organizerId != null ? organizerId : (event.getOrganizer() != null ? event.getOrganizer().getId() : null));
        campaign.setTitle(request.title());
        campaign.setTargetFilter(request.targetFilter() != null ? request.targetFilter() : "ALL_ATTENDEES");
        campaign.setTargetTicketTypeId(request.targetTicketTypeId());
        campaign.setMessageContent(request.messageContent());
        campaign.setLanguage(request.language() != null ? request.language() : "en");
        campaign.setScheduledAt(request.scheduledAt());
        campaign.setStatus("PROCESSING");
        campaign.setSentAt(OffsetDateTime.now());

        // Resolve recipients
        List<Ticket> tickets = getEligibleTickets(event, campaign.getTargetFilter(), campaign.getTargetTicketTypeId());
        Map<String, Ticket> phoneToTicketMap = new LinkedHashMap<>();
        for (Ticket t : tickets) {
            String phone = resolvePhoneNumber(t);
            if (phone != null && !phone.isBlank() && !phoneToTicketMap.containsKey(phone)) {
                phoneToTicketMap.put(phone, t);
            }
        }

        campaign.setRecipientCount(phoneToTicketMap.size());
        EventBroadcastCampaign saved = broadcastRepository.save(campaign);

        // Dispatch asynchronously
        CompletableFuture.runAsync(() -> dispatchBulkSms(saved.getId(), event, phoneToTicketMap, campaign.getMessageContent()), broadcastExecutor);

        return mapToResponse(saved, event.getTitle());
    }

    /**
     * Dispatches individual SMS messages with dynamic placeholders replaced
     */
    private void dispatchBulkSms(UUID campaignId, Event event, Map<String, Ticket> phoneToTicketMap, String messageTemplate) {
        int delivered = 0;
        int failed = 0;

        String formattedEventTime = EthiopianTimeConverter.toEthiopianTime(event.getStartTimeUtc()).fullTimeFormatted();

        for (Map.Entry<String, Ticket> entry : phoneToTicketMap.entrySet()) {
            String phone = entry.getKey();
            Ticket ticket = entry.getValue();

            String attendeeName = ticket.getAttendeeName() != null && !ticket.getAttendeeName().isBlank()
                    ? ticket.getAttendeeName()
                    : (ticket.getOrder() != null && ticket.getOrder().getCustomerName() != null ? ticket.getOrder().getCustomerName() : "Attendee");

            String passLink = frontendBaseUrl + "/t/" + ticket.getSecurityHash();

            // Replace dynamic placeholders
            String customizedMessage = messageTemplate
                    .replace("{name}", attendeeName)
                    .replace("{event}", event.getTitle())
                    .replace("{venue}", event.getVenueName())
                    .replace("{time}", formattedEventTime)
                    .replace("{pass_link}", passLink);

            try {
                smsDispatcher.sendBroadcastSms(phone, customizedMessage, event.getTitle());
                delivered++;
            } catch (Exception e) {
                log.error("Failed to send broadcast SMS to {}: {}", phone, e.getMessage());
                failed++;
            }
        }

        final int finalDelivered = delivered;
        final int finalFailed = failed;

        broadcastRepository.findById(campaignId).ifPresent(c -> {
            c.setDeliveredCount(finalDelivered);
            c.setFailedCount(finalFailed);
            c.setStatus(finalFailed == phoneToTicketMap.size() && !phoneToTicketMap.isEmpty() ? "FAILED" : "COMPLETED");
            broadcastRepository.save(c);
            log.info("✓ [Broadcast Campaign {}] Completed. Sent: {}, Delivered: {}, Failed: {}", campaignId, phoneToTicketMap.size(), finalDelivered, finalFailed);
        });
    }

    /**
     * Sends a test preview SMS to the organizer's personal phone
     */
    public boolean sendTestBroadcast(BroadcastDtos.TestBroadcastRequest request) {
        Event event = eventRepository.findById(request.eventId())
                .orElseThrow(() -> new IllegalArgumentException("Event not found with ID: " + request.eventId()));

        String formattedTime = EthiopianTimeConverter.toEthiopianTime(event.getStartTimeUtc()).fullTimeFormatted();
        String samplePassLink = frontendBaseUrl + "/t/preview_test_pass";

        String renderedMessage = request.messageContent()
                .replace("{name}", "Test Attendee")
                .replace("{event}", event.getTitle())
                .replace("{venue}", event.getVenueName())
                .replace("{time}", formattedTime)
                .replace("{pass_link}", samplePassLink);

        log.info("Sending test broadcast SMS to {} for event '{}'", request.testPhoneNumber(), event.getTitle());
        return smsDispatcher.sendBroadcastSms(request.testPhoneNumber(), renderedMessage, "[TEST] " + event.getTitle());
    }

    @Transactional(readOnly = true)
    public List<BroadcastDtos.BroadcastCampaignResponse> getCampaignsForEvent(UUID eventId) {
        Event event = eventRepository.findById(eventId).orElse(null);
        String eventTitle = event != null ? event.getTitle() : "Event";
        return broadcastRepository.findByEventIdOrderByCreatedAtDesc(eventId).stream()
                .map(c -> mapToResponse(c, eventTitle))
                .collect(Collectors.toList());
    }

    private List<Ticket> getEligibleTickets(Event event, String targetFilter, UUID targetTicketTypeId) {
        List<Ticket> allTickets = ticketRepository.findByEventId(event.getId());

        return allTickets.stream()
                .filter(t -> t.getStatus() != TicketStatus.REVOKED)
                .filter(t -> {
                    if (targetTicketTypeId != null && t.getTicketType() != null) {
                        return targetTicketTypeId.equals(t.getTicketType().getId());
                    }
                    if ("VIP_ONLY".equalsIgnoreCase(targetFilter) && t.getTicketType() != null) {
                        String tierName = t.getTicketType().getName().toLowerCase();
                        return tierName.contains("vip") || tierName.contains("vvip");
                    }
                    if ("REGULAR_ONLY".equalsIgnoreCase(targetFilter) && t.getTicketType() != null) {
                        String tierName = t.getTicketType().getName().toLowerCase();
                        return !tierName.contains("vip") && !tierName.contains("vvip");
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    private String resolvePhoneNumber(Ticket t) {
        if (t.getAttendeePhone() != null && !t.getAttendeePhone().isBlank()) {
            return t.getAttendeePhone().trim();
        }
        if (t.getOrder() != null) {
            if (t.getOrder().isGift() && t.getOrder().getGiftRecipientPhone() != null) {
                return t.getOrder().getGiftRecipientPhone().trim();
            }
            if (t.getOrder().getCustomerPhone() != null) {
                return t.getOrder().getCustomerPhone().trim();
            }
        }
        return null;
    }

    private BroadcastDtos.BroadcastCampaignResponse mapToResponse(EventBroadcastCampaign c, String eventTitle) {
        String targetTierName = "All Tiers";
        if (c.getTargetTicketTypeId() != null) {
            targetTierName = ticketTypeRepository.findById(c.getTargetTicketTypeId())
                    .map(TicketType::getName)
                    .orElse("Specific Tier");
        } else if ("VIP_ONLY".equalsIgnoreCase(c.getTargetFilter())) {
            targetTierName = "VIP & VVIP Passes";
        }

        return new BroadcastDtos.BroadcastCampaignResponse(
                c.getId(),
                c.getEventId(),
                eventTitle,
                c.getTitle(),
                c.getTargetFilter(),
                c.getTargetTicketTypeId(),
                targetTierName,
                c.getMessageContent(),
                c.getLanguage(),
                c.getRecipientCount(),
                c.getDeliveredCount(),
                c.getFailedCount(),
                c.getStatus(),
                c.getScheduledAt(),
                c.getSentAt(),
                c.getCreatedAt()
        );
    }
}
