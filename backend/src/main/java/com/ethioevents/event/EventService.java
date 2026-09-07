package com.ethioevents.event;

import com.ethioevents.common.ApiException;
import com.ethioevents.localization.LocalizedDateTimeDto;
import com.ethioevents.model.Event;
import com.ethioevents.model.EventStatus;
import com.ethioevents.model.TicketType;
import com.ethioevents.repository.EventRepository;
import com.ethioevents.repository.TicketTypeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class EventService {

    private final EventRepository eventRepository;
    private final TicketTypeRepository ticketTypeRepository;

    public EventService(EventRepository eventRepository, TicketTypeRepository ticketTypeRepository) {
        this.eventRepository = eventRepository;
        this.ticketTypeRepository = ticketTypeRepository;
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
}
