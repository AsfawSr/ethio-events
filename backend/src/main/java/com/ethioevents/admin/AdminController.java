package com.ethioevents.admin;

import com.ethioevents.common.ApiException;
import com.ethioevents.common.ApiResponse;
import com.ethioevents.event.EventDtos;
import com.ethioevents.event.EventService;
import com.ethioevents.model.*;
import com.ethioevents.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
@Transactional(readOnly = true)
public class AdminController {

    private final EventService eventService;
    private final EventRepository eventRepository;
    private final OrganizerRepository organizerRepository;
    private final OrderRepository orderRepository;
    private final TicketRepository ticketRepository;

    public AdminController(EventService eventService,
                           EventRepository eventRepository,
                           OrganizerRepository organizerRepository,
                           OrderRepository orderRepository,
                           TicketRepository ticketRepository) {
        this.eventService = eventService;
        this.eventRepository = eventRepository;
        this.organizerRepository = organizerRepository;
        this.orderRepository = orderRepository;
        this.ticketRepository = ticketRepository;
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<AdminDtos.AdminAnalyticsDto>> getAdminAnalytics() {
        List<Order> paidOrders = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.PAID)
                .toList();

        BigDecimal totalGrossRevenue = paidOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Standard 5% platform commission
        BigDecimal platformCommission = totalGrossRevenue.multiply(BigDecimal.valueOf(0.05))
                .setScale(2, RoundingMode.HALF_UP);

        long totalOrdersCompleted = paidOrders.size();
        long totalTicketsIssued = ticketRepository.count();
        long totalOrganizers = organizerRepository.count();
        long pendingEvents = eventRepository.countByStatus(EventStatus.PENDING_APPROVAL);
        long publishedEvents = eventRepository.countByStatus(EventStatus.PUBLISHED);

        AdminDtos.AdminAnalyticsDto analytics = new AdminDtos.AdminAnalyticsDto(
                totalGrossRevenue,
                platformCommission,
                totalTicketsIssued,
                totalOrdersCompleted,
                totalOrganizers,
                pendingEvents,
                publishedEvents
        );

        return ResponseEntity.ok(ApiResponse.ok(analytics));
    }

    @GetMapping("/events")
    public ResponseEntity<ApiResponse<List<AdminDtos.EventModerationDto>>> getAdminEvents(
            @RequestParam(required = false) String status) {
        EventStatus statusFilter = null;
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            try {
                statusFilter = EventStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        List<AdminDtos.EventModerationDto> events = eventService.getEventsForAdmin(statusFilter);
        return ResponseEntity.ok(ApiResponse.ok(events));
    }

    @PostMapping("/events/{id}/approve")
    @Transactional
    public ResponseEntity<ApiResponse<EventDtos.EventDetailDto>> approveEvent(@PathVariable UUID id) {
        EventDtos.EventDetailDto approved = eventService.approveEvent(id);
        return ResponseEntity.ok(ApiResponse.ok(approved));
    }

    @PostMapping("/events/{id}/reject")
    @Transactional
    public ResponseEntity<ApiResponse<EventDtos.EventDetailDto>> rejectEvent(
            @PathVariable UUID id,
            @RequestBody(required = false) AdminDtos.ModerateEventRequest request) {
        String feedback = request != null ? request.feedback() : "Event does not meet platform guidelines";
        EventDtos.EventDetailDto rejected = eventService.rejectEvent(id, feedback);
        return ResponseEntity.ok(ApiResponse.ok(rejected));
    }

    @GetMapping("/organizers")
    public ResponseEntity<ApiResponse<List<AdminDtos.AdminOrganizerDto>>> getAdminOrganizers() {
        List<Organizer> organizers = organizerRepository.findAll();

        List<AdminDtos.AdminOrganizerDto> dtos = organizers.stream().map(org -> {
            User owner = org.getUser();
            long eventsCount = eventRepository.findByOrganizerIdOrderByCreatedAtDesc(org.getId()).size();

            return new AdminDtos.AdminOrganizerDto(
                    org.getId(),
                    org.getOrganizationName(),
                    org.getBusinessLicenseNo(),
                    org.getBankName(),
                    org.getBankAccountNo(),
                    org.getBankAccountName(),
                    org.getStatus().name(),
                    owner != null ? owner.getFullName() : "N/A",
                    owner != null ? owner.getPhoneNumber() : "N/A",
                    owner != null ? owner.getEmail() : "",
                    eventsCount,
                    org.getCreatedAt()
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(dtos));
    }

    @PostMapping("/organizers/{id}/verify")
    @Transactional
    public ResponseEntity<ApiResponse<String>> verifyOrganizer(@PathVariable UUID id) {
        Organizer organizer = organizerRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORGANIZER_NOT_FOUND", "Organizer not found"));
        organizer.setStatus(OrganizerStatus.VERIFIED);
        organizerRepository.save(organizer);
        return ResponseEntity.ok(ApiResponse.ok("Organizer verified successfully"));
    }

    @PostMapping("/organizers/{id}/suspend")
    @Transactional
    public ResponseEntity<ApiResponse<String>> suspendOrganizer(@PathVariable UUID id) {
        Organizer organizer = organizerRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORGANIZER_NOT_FOUND", "Organizer not found"));
        organizer.setStatus(OrganizerStatus.SUSPENDED);
        organizerRepository.save(organizer);
        return ResponseEntity.ok(ApiResponse.ok("Organizer suspended"));
    }
}
