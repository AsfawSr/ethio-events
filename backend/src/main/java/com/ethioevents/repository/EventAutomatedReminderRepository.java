package com.ethioevents.repository;

import com.ethioevents.model.EventAutomatedReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventAutomatedReminderRepository extends JpaRepository<EventAutomatedReminder, UUID> {
    List<EventAutomatedReminder> findByEventId(UUID eventId);
    Optional<EventAutomatedReminder> findByEventIdAndReminderType(UUID eventId, String reminderType);
    boolean existsByEventIdAndReminderTypeAndStatus(UUID eventId, String reminderType, String status);
}
