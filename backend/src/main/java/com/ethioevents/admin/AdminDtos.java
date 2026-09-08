package com.ethioevents.admin;

import com.ethioevents.event.EventDtos;
import com.ethioevents.localization.LocalizedDateTimeDto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class AdminDtos {

    public record AdminAnalyticsDto(
            BigDecimal totalGrossRevenueEtb,
            BigDecimal platformCommissionFeeEtb,
            long totalTicketsIssued,
            long totalOrdersCompleted,
            long totalOrganizers,
            long pendingEventsCount,
            long publishedEventsCount
    ) {}

    public record EventModerationDto(
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
            UUID organizerId,
            String organizationName,
            String organizerPhone,
            String organizerEmail,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            int totalCapacity,
            List<EventDtos.TicketTypeDto> ticketTiers,
            Instant createdAt
    ) {}

    public record ModerateEventRequest(
            String feedback
    ) {}

    public record AdminOrganizerDto(
            UUID id,
            String organizationName,
            String businessLicenseNo,
            String bankName,
            String bankAccountNo,
            String bankAccountName,
            String status,
            String ownerName,
            String ownerPhone,
            String ownerEmail,
            long totalEventsCount,
            Instant createdAt
    ) {}
}
