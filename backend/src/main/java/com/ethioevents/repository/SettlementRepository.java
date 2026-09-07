package com.ethioevents.repository;

import com.ethioevents.model.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, UUID> {
    List<Settlement> findByOrganizerId(UUID organizerId);
    List<Settlement> findByEventId(UUID eventId);
}
