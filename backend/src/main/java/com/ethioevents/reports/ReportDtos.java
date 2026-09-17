package com.ethioevents.reports;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class ReportDtos {

    public record TierSalesBreakdownDto(
            String tierName,
            int soldCount,
            int totalCapacity,
            BigDecimal revenue,
            double percentOfTotal
    ) {}

    public record PaymentMethodBreakdownDto(
            String gateway,
            int orderCount,
            BigDecimal totalVolume,
            double volumePercent
    ) {}

    public record HourlyCheckInStatDto(
            String hourSlot,
            int checkInCount,
            double cumulativePercent
    ) {}

    public record PromoterLeaderboardEntryDto(
            String promoterCode,
            String promoterName,
            int salesCount,
            BigDecimal revenueGenerated,
            BigDecimal commissionEarned
    ) {}

    public record EventAnalyticsSummaryDto(
            UUID eventId,
            String eventTitle,
            String venueName,
            long totalTicketsIssued,
            long totalCheckedIn,
            double attendanceRatePercent,
            BigDecimal grossRevenueEtb,
            BigDecimal platformCommissionEtb,
            BigDecimal netOrganizerPayoutEtb,
            long totalOrdersCount,
            BigDecimal averageOrderValueEtb,
            List<TierSalesBreakdownDto> tierSales,
            List<PaymentMethodBreakdownDto> paymentBreakdown,
            List<HourlyCheckInStatDto> hourlyCheckIns,
            List<PromoterLeaderboardEntryDto> topPromoters
    ) {}
}
