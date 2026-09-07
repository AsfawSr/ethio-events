package com.ethioevents.repository;

import com.ethioevents.model.Ticket;
import com.ethioevents.model.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    Optional<Ticket> findByTicketCode(String ticketCode);
    Optional<Ticket> findBySecurityHash(String securityHash);
    List<Ticket> findByOrderId(UUID orderId);
    List<Ticket> findByEventId(UUID eventId);

    @Query("SELECT t FROM Ticket t WHERE t.event.id = :eventId AND (t.updatedAt > :since OR :since IS NULL)")
    List<Ticket> findManifestForGate(@Param("eventId") UUID eventId, @Param("since") Instant since);

    long countByEventIdAndStatus(UUID eventId, TicketStatus status);
}
