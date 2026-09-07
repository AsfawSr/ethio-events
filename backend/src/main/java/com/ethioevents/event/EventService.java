package com.ethioevents.event;

import com.ethioevents.common.ApiException;
import com.ethioevents.localization.LocalizedDateTimeDto;
import com.ethioevents.model.Event;
import com.ethioevents.model.EventStatus;
import com.ethioevents.model.Organizer;
import com.ethioevents.model.OrganizerStatus;
import com.ethioevents.model.TicketType;
import com.ethioevents.repository.EventRepository;
import com.ethioevents.repository.OrganizerRepository;
import com.ethioevents.repository.TicketTypeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class EventService {

    private final EventRepository eventRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final OrganizerRepository organizerRepository;

    public EventService(EventRepository eventRepository,
                        TicketTypeRepository ticketTypeRepository,
                        OrganizerRepository organizerRepository) {
        this.eventRepository = eventRepository;
        this.ticketTypeRepository = ticketTypeRepository;
        this.organizerRepository = organizerRepository;
    }

    public List<EventDtos.EventSummaryDto> getPublishedEvents() {
        List<Event> events = eventRepository.findByStatusOrderByStartTimeUtcAsc(EventStatus.PUBLISHED);

        return events.stream().map(event -> {
            List<TicketType> tiers = ticketTypeRepository.findByEventId(event.getId());

            BigDecimal minPrice = tiers.stream().map(TicketType::getPrice).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            BigDecimal maxPrice = tiers.stream().map(TicketType::getPrice).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            boolean isSoldOut = tiers.stream().mapToInt(TicketType::getAvailableCapacity).sum() == 0;

            return new EventDtos.EventSummaryDto(
                    event.getId(),
                    event.getTitle(),
                    event.getSlug(),
                    event.getDescription(),
                    event.getVenueName(),
                    event.getVenueAddress(),
                    LocalizedDateTimeDto.fromInstant(event.getStartTimeUtc()),
                    LocalizedDateTimeDto.fromInstant(event.getEndTimeUtc()),
                    event.getBannerImageUrl(),
                    event.getStatus().name(),
                    minPrice,
                    maxPrice,
                    "ETB",
                    isSoldOut
            );
        }).collect(Collectors.toList());
    }

    public EventDtos.EventDetailDto getEventBySlug(String slug) {
        Event event = eventRepository.findBySlug(slug)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "Event not found"));

        List<TicketType> tiers = ticketTypeRepository.findByEventId(event.getId());

        List<EventDtos.TicketTypeDto> tierDtos = tiers.stream().map(t -> new EventDtos.TicketTypeDto(
                t.getId(),
                t.getName(),
                t.getDescription(),
                t.getPrice(),
                "ETB",
                t.getAvailableCapacity(),
                t.getMaxPerUser(),
                t.getAvailableCapacity() > 0
        )).collect(Collectors.toList());

        return new EventDtos.EventDetailDto(
                event.getId(),
                event.getTitle(),
                event.getSlug(),
                event.getDescription(),
                event.getVenueName(),
                event.getVenueAddress(),
                LocalizedDateTimeDto.fromInstant(event.getStartTimeUtc()),
                LocalizedDateTimeDto.fromInstant(event.getEndTimeUtc()),
                event.getBannerImageUrl(),
                event.getStatus().name(),
                event.getOrganizer().getOrganizationName(),
                tierDtos
        );
    }

    @Transactional
    public EventDtos.EventDetailDto createEvent(EventDtos.CreateEventRequest request) {
        if (request.ticketTypes() == null || request.ticketTypes().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NO_TICKET_TYPES", "At least one ticket tier is required to register an event");
        }

        // Get or fallback to active organizer
        Organizer organizer = organizerRepository.findAll().stream().findFirst().orElseThrow(() ->
                new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "NO_ORGANIZER", "No registered organizer found in system"));

        String baseSlug = request.title().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        if (baseSlug.isBlank()) baseSlug = "addis-event";
        String uniqueSlug = baseSlug + "-" + (System.currentTimeMillis() % 100000);

        Instant startTime = Instant.parse(request.startTimeIsoUtc());
        Instant endTime = Instant.parse(request.endTimeIsoUtc());

        Event event = new Event();
        event.setOrganizer(organizer);
        event.setTitle(request.title().trim());
        event.setSlug(uniqueSlug);
        event.setDescription(request.description().trim());
        event.setVenueName(request.venueName().trim());
        event.setVenueAddress(request.venueAddress().trim());
        event.setStartTimeUtc(startTime);
        event.setEndTimeUtc(endTime);
        event.setBannerImageUrl(request.bannerImageUrl().trim());
        event.setStatus(EventStatus.PUBLISHED);

        Event savedEvent = eventRepository.save(event);

        List<EventDtos.TicketTypeDto> createdTiers = new ArrayList<>();
        for (EventDtos.CreateTicketTypeRequest tReq : request.ticketTypes()) {
            TicketType tt = new TicketType();
            tt.setEvent(savedEvent);
            tt.setName(tReq.name().trim());
            tt.setDescription(tReq.description() != null ? tReq.description().trim() : "");
            tt.setPrice(tReq.price());
            tt.setTotalCapacity(tReq.totalCapacity());
            tt.setAvailableCapacity(tReq.totalCapacity());
            tt.setReservedCapacity(0);
            tt.setMaxPerUser(tReq.maxPerUser() > 0 ? tReq.maxPerUser() : 5);
            tt.setSalesStartUtc(Instant.now());
            tt.setSalesEndUtc(startTime);

            TicketType savedTier = ticketTypeRepository.save(tt);
            createdTiers.add(new EventDtos.TicketTypeDto(
                    savedTier.getId(),
                    savedTier.getName(),
                    savedTier.getDescription(),
                    savedTier.getPrice(),
                    "ETB",
                    savedTier.getAvailableCapacity(),
                    savedTier.getMaxPerUser(),
                    true
            ));
        }

        return new EventDtos.EventDetailDto(
                savedEvent.getId(),
                savedEvent.getTitle(),
                savedEvent.getSlug(),
                savedEvent.getDescription(),
                savedEvent.getVenueName(),
                savedEvent.getVenueAddress(),
                LocalizedDateTimeDto.fromInstant(savedEvent.getStartTimeUtc()),
                LocalizedDateTimeDto.fromInstant(savedEvent.getEndTimeUtc()),
                savedEvent.getBannerImageUrl(),
                savedEvent.getStatus().name(),
                organizer.getOrganizationName(),
                createdTiers
        );
    }
}
