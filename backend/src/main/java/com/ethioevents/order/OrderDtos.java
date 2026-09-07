package com.ethioevents.order;

import com.ethioevents.localization.LocalizedDateTimeDto;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class OrderDtos {

    public record GuestReserveRequest(
            @NotNull(message = "Ticket type is required")
            UUID ticketTypeId,

            @Min(value = 1, message = "Quantity must be at least 1")
            int quantity,

            @NotBlank(message = "Customer phone is required")
            String customerPhone,

            @NotBlank(message = "Customer full name is required")
            String customerName
    ) {}

    public record ReservationResponse(
            String orderNumber,
            String eventTitle,
            String ticketTypeName,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal totalAmount,
            String currency,
            String status,
            String reservedUntilIsoUtc,
            long expiresInSeconds,
            LocalizedDateTimeDto eventStartTime
    ) {}

    public record OrderDetailsResponse(
            String orderNumber,
            String eventTitle,
            String eventSlug,
            String venueName,
            String venueAddress,
            LocalizedDateTimeDto eventStartTime,
            String customerName,
            String customerPhone,
            BigDecimal totalAmount,
            String currency,
            String status,
            String reservedUntilIsoUtc,
            List<OrderItemDto> items,
            List<OrderTicketDto> tickets
    ) {}

    public record OrderItemDto(
            String ticketTypeName,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal subtotal
    ) {}

    public record OrderTicketDto(
            String ticketCode,
            String tierName,
            String attendeeName,
            String securityHash,
            String status
    ) {}
}
