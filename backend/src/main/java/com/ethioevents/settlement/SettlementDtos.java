package com.ethioevents.settlement;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class SettlementDtos {

    public record SettlementSummaryDto(
            UUID id,
            UUID eventId,
            String eventTitle,
            String eventSlug,
            UUID organizerId,
            String organizationName,
            String organizerPhone,
            BigDecimal totalGrossRevenue,
            BigDecimal platformCommissionFee,
            BigDecimal payoutAmount,
            String bankName,
            String bankAccountNo,
            String status,
            String payoutReference,
            Instant processedAt,
            Instant createdAt
    ) {}

    public record CalculateSettlementResponse(
            UUID eventId,
            String eventTitle,
            UUID organizerId,
            String organizationName,
            String bankName,
            String bankAccountNo,
            BigDecimal totalGrossRevenue,
            BigDecimal commissionRatePercent,
            BigDecimal platformCommissionFee,
            BigDecimal payoutAmount,
            long totalPaidOrders,
            long totalTicketsSold,
            boolean alreadySettled,
            UUID existingSettlementId
    ) {}

    public record ProcessPayoutRequest(
            String payoutMethod,
            String payoutReference,
            boolean notifyOrganizerBySms
    ) {}
}
