package com.ethioevents.gate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class GateLiveStreamService {

    private static final Logger log = LoggerFactory.getLogger(GateLiveStreamService.class);
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

    // Map of EventId -> List of active SSE Emitters
    private final Map<UUID, List<SseEmitter>> eventEmitters = new ConcurrentHashMap<>();

    // In-memory recent check-ins ring buffer for live stats playback (max 30 per event)
    private final Map<UUID, List<GateDtos.CheckInLiveEvent>> recentCheckInsMap = new ConcurrentHashMap<>();

    public SseEmitter subscribe(UUID eventId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        eventEmitters.computeIfAbsent(eventId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(eventId, emitter));
        emitter.onTimeout(() -> removeEmitter(eventId, emitter));
        emitter.onError(e -> removeEmitter(eventId, emitter));

        // Send initial connected handshake event
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of(
                            "message", "Subscribed to live turnstile stream for event " + eventId,
                            "timestamp", System.currentTimeMillis()
                    )));

            // Replay recent check-ins if available
            List<GateDtos.CheckInLiveEvent> recent = recentCheckInsMap.get(eventId);
            if (recent != null && !recent.isEmpty()) {
                emitter.send(SseEmitter.event()
                        .name("history")
                        .data(recent));
            }
        } catch (IOException e) {
            removeEmitter(eventId, emitter);
        }

        log.info("Client subscribed to Gate Live Stream for event: {}. Total active subscribers: {}",
                eventId, getSubscriberCount(eventId));

        return emitter;
    }

    public void broadcastCheckIn(UUID eventId, GateDtos.CheckInLiveEvent checkInEvent) {
        // Record in recent list
        recentCheckInsMap.compute(eventId, (k, list) -> {
            if (list == null) list = new CopyOnWriteArrayList<>();
            list.add(0, checkInEvent);
            if (list.size() > 30) {
                list = new CopyOnWriteArrayList<>(list.subList(0, 30));
            }
            return list;
        });

        List<SseEmitter> emitters = eventEmitters.get(eventId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        List<SseEmitter> deadEmitters = new ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("checkin")
                        .data(checkInEvent));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
        }
    }

    public List<GateDtos.CheckInLiveEvent> getRecentCheckIns(UUID eventId) {
        List<GateDtos.CheckInLiveEvent> list = recentCheckInsMap.get(eventId);
        return list != null ? new ArrayList<>(list) : Collections.emptyList();
    }

    public int getSubscriberCount(UUID eventId) {
        List<SseEmitter> list = eventEmitters.get(eventId);
        return list != null ? list.size() : 0;
    }

    private void removeEmitter(UUID eventId, SseEmitter emitter) {
        List<SseEmitter> emitters = eventEmitters.get(eventId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                eventEmitters.remove(eventId);
            }
        }
    }

    /**
     * Heartbeat every 20 seconds to prevent reverse proxy/load balancer timeout drops
     */
    @Scheduled(fixedRate = 20000)
    public void sendHeartbeats() {
        eventEmitters.forEach((eventId, emitters) -> {
            List<SseEmitter> dead = new ArrayList<>();
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("ping")
                            .data(System.currentTimeMillis()));
                } catch (Exception e) {
                    dead.add(emitter);
                }
            }
            if (!dead.isEmpty()) {
                emitters.removeAll(dead);
            }
        });
    }
}
