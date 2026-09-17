package com.ethioevents.seating;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class SeatingDtos {

    public record SeatDto(
            UUID id,
            UUID sectionId,
            String sectionName,
            UUID ticketTypeId,
            String tierName,
            BigDecimal price,
            String rowIdentifier,
            String seatNumber,
            String seatLabel,
            int gridRow,
            int gridCol,
            String status,
            boolean isAvailable,
            Instant heldUntil
    ) {}

    public record SeatingSectionDto(
            UUID id,
            String sectionName,
            String sectionType,
            String layoutConfig,
            int capacity,
            UUID ticketTypeId,
            String tierName,
            BigDecimal basePrice,
            List<SeatDto> seats
    ) {}

    public record EventSeatingPlanDto(
            UUID eventId,
            String eventTitle,
            String venueName,
            List<SeatingSectionDto> sections,
            int totalSeats,
            int availableSeats,
            int bookedSeats,
            int heldSeats
    ) {}

    public record HoldSeatsRequest(
            UUID eventId,
            String sessionId,
            List<UUID> seatIds
    ) {}

    public record HoldSeatsResponse(
            boolean success,
            int seatsHeldCount,
            Instant heldUntil,
            String sessionId,
            List<SeatDto> heldSeats
    ) {}

    public record ReleaseSeatsRequest(
            UUID eventId,
            String sessionId,
            List<UUID> seatIds
    ) {}

    public record GenerateVenueLayoutRequest(
            UUID eventId,
            String templateType // 'MILLENNIUM_VIP_TABLES', 'THEATRE_AUDITORIUM', 'SKY_LOUNGE_CABANAS'
    ) {}

    public record UpdateSeatStatusRequest(
            String status // 'AVAILABLE', 'BOOKED', 'BLOCKED'
    ) {}
}
