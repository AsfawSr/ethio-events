package com.ethioevents.repository;

import com.ethioevents.model.GateCrewPin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GateCrewPinRepository extends JpaRepository<GateCrewPin, UUID> {

    List<GateCrewPin> findByEventIdOrderByCreatedAtDesc(UUID eventId);

    List<GateCrewPin> findByOrganizerIdOrderByCreatedAtDesc(UUID organizerId);

    Optional<GateCrewPin> findByPinCodeAndActiveTrue(String pinCode);

    Optional<GateCrewPin> findByEventIdAndPinCodeAndActiveTrue(UUID eventId, String pinCode);
}
