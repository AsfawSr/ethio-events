package com.ethioevents.promo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class PromoDtos {

    public record ValidatePromoRequest(
            UUID eventId,
            @NotBlank String code,
            @NotNull BigDecimal subtotal,
            int ticketCount
    ) {}

    public record ValidatePromoResponse(
            boolean valid,
            String code,
            String discountType,
            BigDecimal discountValue,
            BigDecimal discountAmount,
            BigDecimal finalTotal,
            String message
    ) {}

    public record CreatePromoCodeRequest(
            UUID eventId,
            @NotBlank String code,
            String discountType, // "PERCENTAGE" or "FIXED_AMOUNT"
            @NotNull BigDecimal discountValue,
            BigDecimal minOrderAmount,
            BigDecimal maxDiscountAmount,
            Integer maxUses,
            Instant validUntil
    ) {}

    public record PromoCodeDto(
            UUID id,
            UUID eventId,
            String eventTitle,
            String code,
            String discountType,
            BigDecimal discountValue,
            BigDecimal minOrderAmount,
            BigDecimal maxDiscountAmount,
            Integer maxUses,
            Integer timesUsed,
            boolean active,
            Instant validUntil,
            Instant createdAt
    ) {}
}
