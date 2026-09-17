package com.ethioevents.broadcast;

import java.time.OffsetDateTime;
import java.util.UUID;

public class BroadcastDtos {

    public record CreateBroadcastRequest(
            UUID eventId,
            String title,
            String targetFilter, // ALL_ATTENDEES, VIP_ONLY, SPECIFIC_TIER
            UUID targetTicketTypeId,
            String messageContent,
            String language,
            OffsetDateTime scheduledAt
    ) {}

    public record BroadcastCampaignResponse(
            UUID id,
            UUID eventId,
            String eventTitle,
            String title,
            String targetFilter,
            UUID targetTicketTypeId,
            String targetTierName,
            String messageContent,
            String language,
            int recipientCount,
            int deliveredCount,
            int failedCount,
            String status,
            OffsetDateTime scheduledAt,
            OffsetDateTime sentAt,
            OffsetDateTime createdAt
    ) {}

    public record AudienceEstimateResponse(
            UUID eventId,
            String targetFilter,
            int estimatedRecipientsCount,
            int totalTicketsCount,
            String targetTierName
    ) {}

    public record TestBroadcastRequest(
            UUID eventId,
            String testPhoneNumber,
            String messageContent
    ) {}

    public record AutomatedReminderConfig(
            UUID eventId,
            String eventTitle,
            boolean tMinus24HoursEnabled,
            boolean tMinus24HoursSent,
            OffsetDateTime tMinus24HoursSentAt,
            int tMinus24HoursTotalSent,
            boolean tMinus2HoursEnabled,
            boolean tMinus2HoursSent,
            OffsetDateTime tMinus2HoursSentAt,
            int tMinus2HoursTotalSent
    ) {}

    public record UpdateRemindersRequest(
            Boolean tMinus24HoursEnabled,
            Boolean tMinus2HoursEnabled
    ) {}
}
