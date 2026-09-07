package com.ethioevents.repository;

import com.ethioevents.model.GateCrewAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GateCrewAssignmentRepository extends JpaRepository<GateCrewAssignment, UUID> {
    boolean existsByUserIdAndEventId(UUID userId, UUID eventId);
    Optional<GateCrewAssignment> findByUserIdAndEventId(UUID userId, UUID eventId);
}
