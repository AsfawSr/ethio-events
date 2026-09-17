package com.ethioevents.repository;

import com.ethioevents.model.EventBroadcastCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventBroadcastRepository extends JpaRepository<EventBroadcastCampaign, UUID> {
    List<EventBroadcastCampaign> findByEventIdOrderByCreatedAtDesc(UUID eventId);
    List<EventBroadcastCampaign> findByOrganizerIdOrderByCreatedAtDesc(UUID organizerId);
    List<EventBroadcastCampaign> findByStatusOrderByCreatedAtAsc(String status);
}
