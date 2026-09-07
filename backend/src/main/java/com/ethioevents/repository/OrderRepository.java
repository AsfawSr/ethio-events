package com.ethioevents.repository;

import com.ethioevents.model.Order;
import com.ethioevents.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Order> findByCustomerPhoneOrderByCreatedAtDesc(String customerPhone);

    @Query("SELECT o FROM Order o WHERE o.status = :status AND o.reservedUntilUtc < :now")
    List<Order> findExpiredOrders(@Param("status") OrderStatus status, @Param("now") Instant now);

    List<Order> findByEventOrganizerIdAndStatus(UUID organizerId, OrderStatus status);
    List<Order> findByEventIdAndStatus(UUID eventId, OrderStatus status);
}
