package com.ethioevents.reservation;

import com.ethioevents.common.ApiException;
import com.ethioevents.model.Order;
import com.ethioevents.model.OrderItem;
import com.ethioevents.model.OrderStatus;
import com.ethioevents.model.TicketType;
import com.ethioevents.repository.OrderItemRepository;
import com.ethioevents.repository.OrderRepository;
import com.ethioevents.repository.TicketTypeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class TicketReservationService {

    private static final Logger log = LoggerFactory.getLogger(TicketReservationService.class);
    public static final Duration LOCK_DURATION = Duration.ofMinutes(10);

    private final TicketTypeRepository ticketTypeRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public TicketReservationService(TicketTypeRepository ticketTypeRepository,
                                    OrderRepository orderRepository,
                                    OrderItemRepository orderItemRepository) {
        this.ticketTypeRepository = ticketTypeRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    /**
     * Atomically holds ticket capacity for 10 minutes.
     */
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public TicketType holdTicketCapacity(UUID ticketTypeId, int requestedQuantity) {
        if (requestedQuantity <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QUANTITY", "Quantity must be greater than zero");
        }

        TicketType ticketType = ticketTypeRepository.findByIdForUpdate(ticketTypeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "TICKET_TYPE_NOT_FOUND", "Ticket tier not found"));

        if (ticketType.getAvailableCapacity() < requestedQuantity) {
            throw new ApiException(HttpStatus.CONFLICT, "INSUFFICIENT_INVENTORY",
                    String.format("Sorry, only %d tickets remain for %s", ticketType.getAvailableCapacity(), ticketType.getName()));
        }

        // Atomically transfer from available to reserved
        ticketType.setAvailableCapacity(ticketType.getAvailableCapacity() - requestedQuantity);
        ticketType.setReservedCapacity(ticketType.getReservedCapacity() + requestedQuantity);

        TicketType saved = ticketTypeRepository.save(ticketType);
        log.info("Reserved {} tickets for {}. Remaining available: {}, Reserved: {}",
                requestedQuantity, ticketType.getName(), saved.getAvailableCapacity(), saved.getReservedCapacity());
        return saved;
    }

    /**
     * Releases reserved capacity back to available when an order expires or is cancelled.
     */
    @Transactional
    public void releaseReservedCapacity(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem item : items) {
            TicketType ticketType = ticketTypeRepository.findByIdForUpdate(item.getTicketType().getId()).orElse(null);
            if (ticketType != null) {
                int qtyToRelease = Math.min(item.getQuantity(), ticketType.getReservedCapacity());
                ticketType.setReservedCapacity(ticketType.getReservedCapacity() - qtyToRelease);
                ticketType.setAvailableCapacity(ticketType.getAvailableCapacity() + qtyToRelease);
                ticketTypeRepository.save(ticketType);
                log.info("Released {} reserved tickets back to available for tier {}", qtyToRelease, ticketType.getName());
            }
        }
    }

    /**
     * Permanently commits reserved capacity upon successful payment.
     */
    @Transactional
    public void commitReservation(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem item : items) {
            TicketType ticketType = ticketTypeRepository.findByIdForUpdate(item.getTicketType().getId()).orElse(null);
            if (ticketType != null) {
                int qtyToCommit = Math.min(item.getQuantity(), ticketType.getReservedCapacity());
                ticketType.setReservedCapacity(ticketType.getReservedCapacity() - qtyToCommit);
                ticketTypeRepository.save(ticketType);
                log.info("Permanently committed {} tickets for order {}", qtyToCommit, order.getOrderNumber());
            }
        }
    }
}
