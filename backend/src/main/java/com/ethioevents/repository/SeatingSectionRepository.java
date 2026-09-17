package com.ethioevents.repository;

import com.ethioevents.model.SeatingSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SeatingSectionRepository extends JpaRepository<SeatingSection, UUID> {

    List<SeatingSection> findByEventIdOrderBySortOrderAsc(UUID eventId);

    void deleteByEventId(UUID eventId);
}
