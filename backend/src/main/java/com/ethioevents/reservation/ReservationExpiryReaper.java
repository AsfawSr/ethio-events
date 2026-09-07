package com.ethioevents.reservation;

import com.ethioevents.model.Order;
import com.ethioevents.model.OrderStatus;
import com.ethioevents.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
public class ReservationExpiryReaper {

    private static final Logger log = LoggerFactory.getLogger(ReservationExpiryReaper.class);

    private final OrderRepository orderRepository;
    private final TicketReservationService ticketReservationService;

    public ReservationExpiryReaper(OrderRepository orderRepository,
                                   TicketReservationService ticketReservationService) {
        this.orderRepository = orderRepository;
        this.ticketReservationService = ticketReservationService;
    }

    /**
     * Periodically sweeps expired reservations and restores ticket capacity.
     */
    @Scheduled(fixedRate = 15000) // Runs every 15 seconds
    @Transactional
    public void sweepExpiredReservations() {
        Instant now = Instant.now();
        List<Order> expiredOrders = orderRepository.findExpiredOrders(OrderStatus.PENDING, now);

        if (!expiredOrders.isEmpty()) {
            log.info("Found {} expired pending orders to reclaim", expiredOrders.size());
            for (Order order : expiredOrders) {
                try {
                    order.setStatus(OrderStatus.EXPIRED);
                    orderRepository.save(order);
                    ticketReservationService.releaseReservedCapacity(order);
                    log.info("Expired order {} and restored ticket inventory", order.getOrderNumber());
                } catch (Exception e) {
                    log.error("Failed to expire order: " + order.getOrderNumber(), e);
                }
            }
        }
    }
}
