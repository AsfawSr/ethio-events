package com.ethioevents.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "seats")
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private SeatingSection section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ticket_type_id")
    private TicketType ticketType;

    @Column(name = "row_identifier", nullable = false, length = 30)
    private String rowIdentifier; // e.g. 'Table 1', 'Row A'

    @Column(name = "seat_number", nullable = false, length = 30)
    private String seatNumber; // e.g. 'Seat 1', 'Seat 2'

    @Column(name = "seat_label", nullable = false, length = 100)
    private String seatLabel; // e.g. 'VIP Table 1 - Seat A'

    @Column(name = "grid_row", nullable = false)
    private int gridRow = 0;

    @Column(name = "grid_col", nullable = false)
    private int gridCol = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private SeatStatus status = SeatStatus.AVAILABLE;

    @Column(name = "price_modifier", precision = 12, scale = 2)
    private BigDecimal priceModifier = BigDecimal.ZERO;

    @Column(name = "held_until")
    private Instant heldUntil;

    @Column(name = "held_by_session_id", length = 100)
    private String heldBySessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_order_id")
    private Order currentOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_ticket_id")
    private Ticket currentTicket;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Seat() {}

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isAvailableNow() {
        if (this.status == SeatStatus.BOOKED || this.status == SeatStatus.BLOCKED) {
            return false;
        }
        if (this.status == SeatStatus.HELD) {
            if (this.heldUntil != null && this.heldUntil.isBefore(Instant.now())) {
                return true; // Hold expired
            }
            return false;
        }
        return true;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public SeatingSection getSection() { return section; }
    public void setSection(SeatingSection section) { this.section = section; }

    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }

    public TicketType getTicketType() { return ticketType; }
    public void setTicketType(TicketType ticketType) { this.ticketType = ticketType; }

    public String getRowIdentifier() { return rowIdentifier; }
    public void setRowIdentifier(String rowIdentifier) { this.rowIdentifier = rowIdentifier; }

    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }

    public String getSeatLabel() { return seatLabel; }
    public void setSeatLabel(String seatLabel) { this.seatLabel = seatLabel; }

    public int getGridRow() { return gridRow; }
    public void setGridRow(int gridRow) { this.gridRow = gridRow; }

    public int getGridCol() { return gridCol; }
    public void setGridCol(int gridCol) { this.gridCol = gridCol; }

    public SeatStatus getStatus() { return status; }
    public void setStatus(SeatStatus status) { this.status = status; }

    public BigDecimal getPriceModifier() { return priceModifier; }
    public void setPriceModifier(BigDecimal priceModifier) { this.priceModifier = priceModifier; }

    public Instant getHeldUntil() { return heldUntil; }
    public void setHeldUntil(Instant heldUntil) { this.heldUntil = heldUntil; }

    public String getHeldBySessionId() { return heldBySessionId; }
    public void setHeldBySessionId(String heldBySessionId) { this.heldBySessionId = heldBySessionId; }

    public Order getCurrentOrder() { return currentOrder; }
    public void setCurrentOrder(Order currentOrder) { this.currentOrder = currentOrder; }

    public Ticket getCurrentTicket() { return currentTicket; }
    public void setCurrentTicket(Ticket currentTicket) { this.currentTicket = currentTicket; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
