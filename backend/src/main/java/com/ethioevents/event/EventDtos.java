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
            boolean isSoldOut,
            String category,
            String categoryAmharic,
            String categoryEmoji,
            String neighborhood,
            String neighborhoodAmharic,
            boolean featured,
            List<String> tags,
            Double latitude,
            Double longitude
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
            String category,
            String categoryAmharic,
            String categoryEmoji,
            String neighborhood,
            String neighborhoodAmharic,
            boolean featured,
            List<String> tags,
            Double latitude,
            Double longitude,
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
            String category,
            String neighborhood,
            Boolean featured,
            String tags,
            Double latitude,
            Double longitude,
            List<CreateTicketTypeRequest> ticketTypes
    ) {}

    public record CreateTicketTypeRequest(
            String name,
            String description,
            BigDecimal price,
            int totalCapacity,
            int maxPerUser
    ) {}

    public record CategoryFilterItemDto(
            String code,
            String englishName,
            String amharicName,
            String iconEmoji,
            long eventCount
    ) {}

    public record NeighborhoodFilterItemDto(
            String code,
            String englishName,
            String amharicName,
            long eventCount
    ) {}

    public record FilterMetadataDto(
            List<CategoryFilterItemDto> categories,
            List<NeighborhoodFilterItemDto> neighborhoods,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            long totalPublishedEvents
    ) {}
}
