package com.ethioevents.repository;

import com.ethioevents.model.Seat;
import com.ethioevents.model.SeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface SeatRepository extends JpaRepository<Seat, UUID> {

    List<Seat> findByEventIdOrderByGridRowAscGridColAsc(UUID eventId);

    List<Seat> findBySectionIdOrderByGridRowAscGridColAsc(UUID sectionId);

    List<Seat> findByIdIn(List<UUID> ids);

    List<Seat> findByEventIdAndStatus(UUID eventId, SeatStatus status);

    List<Seat> findByHeldBySessionId(String sessionId);

    @Modifying
    @Query("UPDATE Seat s SET s.status = 'AVAILABLE', s.heldUntil = null, s.heldBySessionId = null " +
           "WHERE s.status = 'HELD' AND s.heldUntil < :now")
    int releaseExpiredSeatHolds(@Param("now") Instant now);

    @Modifying
    @Query("UPDATE Seat s SET s.status = 'AVAILABLE', s.heldUntil = null, s.heldBySessionId = null " +
           "WHERE s.heldBySessionId = :sessionId AND s.status = 'HELD'")
    int releaseSeatsHeldBySession(@Param("sessionId") String sessionId);

    void deleteByEventId(UUID eventId);
}
