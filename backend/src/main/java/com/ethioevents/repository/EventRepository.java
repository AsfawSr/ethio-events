package com.ethioevents.repository;

import com.ethioevents.model.Event;
import com.ethioevents.model.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {
    Optional<Event> findBySlug(String slug);
    List<Event> findByStatusOrderByStartTimeUtcAsc(EventStatus status);
    List<Event> findByOrganizerIdOrderByCreatedAtDesc(UUID organizerId);
}
