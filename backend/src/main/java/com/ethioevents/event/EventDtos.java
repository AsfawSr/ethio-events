package com.ethioevents.event;

import com.ethioevents.localization.LocalizedDateTimeDto;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class EventDtos {

    public record EventSummaryDto(
            UUID id,
            String title,
            String slug,
            String description,
            String venueName,
            String venueAddress,
            LocalizedDateTimeDto startTime,
            LocalizedDateTimeDto endTime,
            String bannerImageUrl,
            String status,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String currency,
            boolean isSoldOut
    ) {}

    public record EventDetailDto(
            UUID id,
            String title,
            String slug,
            String description,
            String venueName,
            String venueAddress,
            LocalizedDateTimeDto startTime,
            LocalizedDateTimeDto endTime,
            String bannerImageUrl,
            String status,
            String organizerName,
            List<TicketTypeDto> ticketTypes
    ) {}

    public record TicketTypeDto(
            UUID id,
            String name,
            String description,
            BigDecimal price,
            String currency,
            int availableCapacity,
            int maxPerUser,
            boolean isAvailable
    ) {}

    public record CreateEventRequest(
            String title,
            String description,
            String venueName,
            String venueAddress,
            String startTimeIsoUtc,
            String endTimeIsoUtc,
            String bannerImageUrl,
            String organizerName,
            String organizerId,
            List<CreateTicketTypeRequest> ticketTypes
    ) {}

    public record CreateTicketTypeRequest(
            String name,
            String description,
            BigDecimal price,
            int totalCapacity,
            int maxPerUser
    ) {}
}
