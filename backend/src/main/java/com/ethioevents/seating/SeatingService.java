package com.ethioevents.seating;

import com.ethioevents.common.ApiException;
import com.ethioevents.model.*;
import com.ethioevents.repository.EventRepository;
import com.ethioevents.repository.SeatRepository;
import com.ethioevents.repository.SeatingSectionRepository;
import com.ethioevents.repository.TicketTypeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SeatingService {

    private static final Logger log = LoggerFactory.getLogger(SeatingService.class);

    private final SeatingSectionRepository sectionRepository;
    private final SeatRepository seatRepository;
    private final EventRepository eventRepository;
    private final TicketTypeRepository ticketTypeRepository;

    public SeatingService(SeatingSectionRepository sectionRepository,
                          SeatRepository seatRepository,
                          EventRepository eventRepository,
                          TicketTypeRepository ticketTypeRepository) {
        this.sectionRepository = sectionRepository;
        this.seatRepository = seatRepository;
        this.eventRepository = eventRepository;
        this.ticketTypeRepository = ticketTypeRepository;
    }

    @Transactional
    public void releaseExpiredHolds() {
        int released = seatRepository.releaseExpiredSeatHolds(Instant.now());
        if (released > 0) {
            log.info("Auto-released {} expired seat holds", released);
        }
    }

    @Transactional
    public SeatingDtos.EventSeatingPlanDto getEventSeatingPlan(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "Event not found"));

        // Clean up expired holds
        releaseExpiredHolds();

        List<SeatingSection> sections = sectionRepository.findByEventIdOrderBySortOrderAsc(eventId);

        // Auto-seed default layout if no sections exist yet
        if (sections.isEmpty()) {
            generateDefaultLayoutForEvent(event);
            sections = sectionRepository.findByEventIdOrderBySortOrderAsc(eventId);
        }

        List<Seat> allSeats = seatRepository.findByEventIdOrderByGridRowAscGridColAsc(eventId);
        Map<UUID, List<Seat>> seatsBySection = allSeats.stream()
                .collect(Collectors.groupingBy(s -> s.getSection().getId()));

        int totalSeats = allSeats.size();
        int availableSeats = 0;
        int bookedSeats = 0;
        int heldSeats = 0;

        List<SeatingDtos.SeatingSectionDto> sectionDtos = new ArrayList<>();

        for (SeatingSection sec : sections) {
            List<Seat> sectionSeats = seatsBySection.getOrDefault(sec.getId(), Collections.emptyList());
            List<SeatingDtos.SeatDto> seatDtos = new ArrayList<>();

            for (Seat seat : sectionSeats) {
                boolean isAvail = seat.isAvailableNow();
                if (seat.getStatus() == SeatStatus.BOOKED) {
                    bookedSeats++;
                } else if (seat.getStatus() == SeatStatus.HELD && !isAvail) {
                    heldSeats++;
                } else if (isAvail) {
                    availableSeats++;
                }

                BigDecimal finalPrice = (seat.getTicketType() != null ? seat.getTicketType().getPrice() : BigDecimal.ZERO)
                        .add(seat.getPriceModifier() != null ? seat.getPriceModifier() : BigDecimal.ZERO);

                seatDtos.add(new SeatingDtos.SeatDto(
                        seat.getId(),
                        sec.getId(),
                        sec.getSectionName(),
                        seat.getTicketType() != null ? seat.getTicketType().getId() : null,
                        seat.getTicketType() != null ? seat.getTicketType().getName() : "Standard",
                        finalPrice,
                        seat.getRowIdentifier(),
                        seat.getSeatNumber(),
                        seat.getSeatLabel(),
                        seat.getGridRow(),
                        seat.getGridCol(),
                        seat.getStatus().name(),
                        isAvail,
                        seat.getHeldUntil()
                ));
            }

            BigDecimal basePrice = sec.getTicketType() != null ? sec.getTicketType().getPrice() : BigDecimal.ZERO;

            sectionDtos.add(new SeatingDtos.SeatingSectionDto(
                    sec.getId(),
                    sec.getSectionName(),
                    sec.getSectionType(),
                    sec.getLayoutConfig(),
                    sec.getCapacity(),
                    sec.getTicketType() != null ? sec.getTicketType().getId() : null,
                    sec.getTicketType() != null ? sec.getTicketType().getName() : "General",
                    basePrice,
                    seatDtos
            ));
        }

        return new SeatingDtos.EventSeatingPlanDto(
                event.getId(),
                event.getTitle(),
                event.getVenueName(),
                sectionDtos,
                totalSeats,
                availableSeats,
                bookedSeats,
                heldSeats
        );
    }

    @Transactional
    public SeatingDtos.HoldSeatsResponse holdSeats(SeatingDtos.HoldSeatsRequest req) {
        if (req.seatIds() == null || req.seatIds().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "No seat IDs provided to hold");
        }
        if (req.sessionId() == null || req.sessionId().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "Session ID required for seat holds");
        }

        releaseExpiredHolds();

        List<Seat> requestedSeats = seatRepository.findByIdIn(req.seatIds());
        if (requestedSeats.size() != req.seatIds().size()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "SEAT_NOT_FOUND", "One or more selected seats do not exist");
        }

        Instant now = Instant.now();
        Instant holdExpiry = now.plus(Duration.ofMinutes(10));

        for (Seat seat : requestedSeats) {
            if (!seat.getEvent().getId().equals(req.eventId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "WRONG_EVENT", "Seat " + seat.getSeatLabel() + " is not for this event");
            }
            if (seat.getStatus() == SeatStatus.BOOKED) {
                throw new ApiException(HttpStatus.CONFLICT, "SEAT_BOOKED", "Seat " + seat.getSeatLabel() + " is already booked and unavailable.");
            }
            if (seat.getStatus() == SeatStatus.BLOCKED) {
                throw new ApiException(HttpStatus.CONFLICT, "SEAT_BLOCKED", "Seat " + seat.getSeatLabel() + " is currently blocked by the organizer.");
            }
            if (seat.getStatus() == SeatStatus.HELD) {
                if (seat.getHeldUntil() != null && seat.getHeldUntil().isAfter(now)) {
                    if (!req.sessionId().equals(seat.getHeldBySessionId())) {
                        throw new ApiException(HttpStatus.CONFLICT, "SEAT_HELD",
                                "Seat " + seat.getSeatLabel() + " is temporarily held by another customer.");
                    }
                }
            }
        }

        // Apply hold to all requested seats
        List<SeatingDtos.SeatDto> heldSeatDtos = new ArrayList<>();
        for (Seat seat : requestedSeats) {
            seat.setStatus(SeatStatus.HELD);
            seat.setHeldUntil(holdExpiry);
            seat.setHeldBySessionId(req.sessionId());
            seat.setUpdatedAt(now);
            seatRepository.save(seat);

            BigDecimal finalPrice = (seat.getTicketType() != null ? seat.getTicketType().getPrice() : BigDecimal.ZERO)
                    .add(seat.getPriceModifier() != null ? seat.getPriceModifier() : BigDecimal.ZERO);

            heldSeatDtos.add(new SeatingDtos.SeatDto(
                    seat.getId(),
                    seat.getSection().getId(),
                    seat.getSection().getSectionName(),
                    seat.getTicketType() != null ? seat.getTicketType().getId() : null,
                    seat.getTicketType() != null ? seat.getTicketType().getName() : "Standard",
                    finalPrice,
                    seat.getRowIdentifier(),
                    seat.getSeatNumber(),
                    seat.getSeatLabel(),
                    seat.getGridRow(),
                    seat.getGridCol(),
                    SeatStatus.HELD.name(),
                    true,
                    holdExpiry
            ));
        }

        log.info("Held {} seats for session {} until {}", requestedSeats.size(), req.sessionId(), holdExpiry);

        return new SeatingDtos.HoldSeatsResponse(
                true,
                requestedSeats.size(),
                holdExpiry,
                req.sessionId(),
                heldSeatDtos
        );
    }

    @Transactional
    public void releaseHeldSeats(SeatingDtos.ReleaseSeatsRequest req) {
        if (req.seatIds() != null && !req.seatIds().isEmpty()) {
            List<Seat> seats = seatRepository.findByIdIn(req.seatIds());
            for (Seat seat : seats) {
                if (req.sessionId() == null || req.sessionId().equals(seat.getHeldBySessionId())) {
                    seat.setStatus(SeatStatus.AVAILABLE);
                    seat.setHeldUntil(null);
                    seat.setHeldBySessionId(null);
                    seatRepository.save(seat);
                }
            }
        } else if (req.sessionId() != null) {
            seatRepository.releaseSeatsHeldBySession(req.sessionId());
        }
    }

    @Transactional
    public void confirmSeatsForOrder(Order order, List<UUID> seatIds, List<Ticket> generatedTickets) {
        if (seatIds == null || seatIds.isEmpty()) return;

        List<Seat> seats = seatRepository.findByIdIn(seatIds);
        int idx = 0;
        for (Seat seat : seats) {
            seat.setStatus(SeatStatus.BOOKED);
            seat.setCurrentOrder(order);
            seat.setHeldUntil(null);
            seat.setHeldBySessionId(null);

            if (generatedTickets != null && idx < generatedTickets.size()) {
                Ticket ticket = generatedTickets.get(idx);
                seat.setCurrentTicket(ticket);
                ticket.setSeat(seat);
                ticket.setSeatLabel(seat.getSeatLabel());
            }

            seatRepository.save(seat);
            idx++;
        }
        log.info("Confirmed and booked {} seats for Order {}", seats.size(), order.getOrderNumber());
    }

    @Transactional
    public void generateDefaultLayoutForEvent(Event event) {
        List<TicketType> tiers = ticketTypeRepository.findByEventId(event.getId());
        TicketType vipTier = tiers.stream().filter(t -> t.getName().toLowerCase().contains("vip")).findFirst().orElse(null);
        TicketType regTier = tiers.stream().filter(t -> !t.getName().toLowerCase().contains("vip")).findFirst().orElse(tiers.isEmpty() ? null : tiers.get(0));

        // 1. VIP Tables Section (Stage Front)
        SeatingSection vipSection = new SeatingSection();
        vipSection.setEvent(event);
        vipSection.setTicketType(vipTier != null ? vipTier : regTier);
        vipSection.setSectionName("VIP Diamond Tables (መድረክ ፊት ለፊት)");
        vipSection.setSectionType("TABLES");
        vipSection.setCapacity(36);
        vipSection.setSortOrder(1);
        SeatingSection savedVipSec = sectionRepository.save(vipSection);

        // Create 6 VIP Tables with 6 seats each
        for (int tableNum = 1; tableNum <= 6; tableNum++) {
            int row = (tableNum - 1) / 3;
            int col = (tableNum - 1) % 3;
            for (int seatNum = 1; seatNum <= 6; seatNum++) {
                Seat seat = new Seat();
                seat.setSection(savedVipSec);
                seat.setEvent(event);
                seat.setTicketType(vipTier != null ? vipTier : regTier);
                seat.setRowIdentifier("Table " + tableNum);
                seat.setSeatNumber("Seat " + seatNum);
                seat.setSeatLabel(String.format("VIP Table %d - Seat %d", tableNum, seatNum));
                seat.setGridRow(row * 3 + (seatNum <= 3 ? 0 : 1));
                seat.setGridCol(col * 4 + ((seatNum - 1) % 3));
                seat.setStatus(SeatStatus.AVAILABLE);
                seatRepository.save(seat);
            }
        }

        // 2. Main Floor Auditorium Rows
        SeatingSection mainFloor = new SeatingSection();
        mainFloor.setEvent(event);
        mainFloor.setTicketType(regTier);
        mainFloor.setSectionName("Main Auditorium Seating (ዋናው አዳራሽ)");
        mainFloor.setSectionType("THEATRE_ROWS");
        mainFloor.setCapacity(40);
        mainFloor.setSortOrder(2);
        SeatingSection savedMainFloor = sectionRepository.save(mainFloor);

        String[] rowLetters = {"Row A", "Row B", "Row C", "Row D"};
        for (int r = 0; r < rowLetters.length; r++) {
            for (int s = 1; s <= 10; s++) {
                Seat seat = new Seat();
                seat.setSection(savedMainFloor);
                seat.setEvent(event);
                seat.setTicketType(regTier);
                seat.setRowIdentifier(rowLetters[r]);
                seat.setSeatNumber(String.valueOf(s));
                seat.setSeatLabel(String.format("%s - Seat %d", rowLetters[r], s));
                seat.setGridRow(r);
                seat.setGridCol(s - 1);
                seat.setStatus(SeatStatus.AVAILABLE);
                seatRepository.save(seat);
            }
        }

        log.info("Auto-generated default venue seating layout for event {}", event.getTitle());
    }
}
