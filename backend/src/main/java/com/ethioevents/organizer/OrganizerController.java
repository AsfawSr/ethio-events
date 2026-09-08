package com.ethioevents.organizer;

import com.ethioevents.auth.AuthDtos;
import com.ethioevents.common.ApiException;
import com.ethioevents.common.ApiResponse;
import com.ethioevents.event.EventDtos;
import com.ethioevents.event.EventService;
import com.ethioevents.model.*;
import com.ethioevents.repository.EventRepository;
import com.ethioevents.repository.OrderRepository;
import com.ethioevents.repository.OrganizerRepository;
import com.ethioevents.repository.TicketRepository;
import com.ethioevents.repository.TicketTypeRepository;
import com.ethioevents.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/organizer")
@Transactional(readOnly = true)
public class OrganizerController {

    private final OrganizerRepository organizerRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final OrderRepository orderRepository;
    private final TicketRepository ticketRepository;
    private final EventService eventService;

    private final TicketTypeRepository ticketTypeRepository;

    public OrganizerController(OrganizerRepository organizerRepository,
                               UserRepository userRepository,
                               EventRepository eventRepository,
                               OrderRepository orderRepository,
                               TicketRepository ticketRepository,
                               TicketTypeRepository ticketTypeRepository,
                               EventService eventService) {
        this.organizerRepository = organizerRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.orderRepository = orderRepository;
        this.ticketRepository = ticketRepository;
        this.ticketTypeRepository = ticketTypeRepository;
        this.eventService = eventService;
    }

    private Organizer getAuthenticatedOrganizer(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required");
        }
        try {
            UUID userId = UUID.fromString(authentication.getName());
            return organizerRepository.findByUserId(userId).orElseThrow(() ->
                    new ApiException(HttpStatus.FORBIDDEN, "NOT_AN_ORGANIZER", "User is not registered as an organizer"));
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_USER_ID", "Invalid user identifier");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthDtos.OrganizerProfileDto>> getOrganizerProfile(Authentication authentication) {
        Organizer organizer = getAuthenticatedOrganizer(authentication);
        User user = organizer.getUser();

        List<Event> events = eventRepository.findByOrganizerIdOrderByCreatedAtDesc(organizer.getId());
        long totalEvents = events.size();

        List<Order> confirmedOrders = orderRepository.findByEventOrganizerIdAndStatus(organizer.getId(), OrderStatus.PAID);
        BigDecimal totalRevenue = confirmedOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalTicketsSold = confirmedOrders.stream()
                .mapToLong(o -> o.getItems().stream().mapToInt(OrderItem::getQuantity).sum())
                .sum();

        AuthDtos.OrganizerProfileDto profile = new AuthDtos.OrganizerProfileDto(
                organizer.getId(),
                organizer.getOrganizationName(),
                organizer.getBusinessLicenseNo(),
                organizer.getBankName(),
                organizer.getBankAccountNo(),
                organizer.getBankAccountName(),
                organizer.getStatus().name(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getEmail(),
                totalEvents,
                totalTicketsSold,
                totalRevenue
        );

        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @GetMapping("/my-events")
    public ResponseEntity<ApiResponse<List<EventDtos.EventSummaryDto>>> getMyEvents(Authentication authentication) {
        Organizer organizer = getAuthenticatedOrganizer(authentication);
        List<Event> events = eventRepository.findByOrganizerIdOrderByCreatedAtDesc(organizer.getId());

        List<EventDtos.EventSummaryDto> summaries = events.stream().map(event -> {
            List<TicketType> tiers = ticketTypeRepository.findByEventId(event.getId());
            BigDecimal minPrice = tiers != null ? tiers.stream().map(TicketType::getPrice).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO) : BigDecimal.ZERO;
            BigDecimal maxPrice = tiers != null ? tiers.stream().map(TicketType::getPrice).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO) : BigDecimal.ZERO;
            boolean isSoldOut = tiers != null && tiers.stream().mapToInt(TicketType::getAvailableCapacity).sum() == 0;

            return new EventDtos.EventSummaryDto(
                    event.getId(),
                    event.getTitle(),
                    event.getSlug(),
                    event.getDescription(),
                    event.getVenueName(),
                    event.getVenueAddress(),
                    com.ethioevents.localization.LocalizedDateTimeDto.fromInstant(event.getStartTimeUtc()),
                    com.ethioevents.localization.LocalizedDateTimeDto.fromInstant(event.getEndTimeUtc()),
                    event.getBannerImageUrl(),
                    event.getStatus().name(),
                    minPrice,
                    maxPrice,
                    "ETB",
                    isSoldOut
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(summaries));
    }
}
