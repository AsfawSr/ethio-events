package com.ethioevents.event;

import com.ethioevents.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventDtos.EventSummaryDto>>> getEvents() {
        return ResponseEntity.ok(ApiResponse.ok(eventService.getPublishedEvents()));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<EventDtos.EventDetailDto>> getEventBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(eventService.getEventBySlug(slug)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EventDtos.EventDetailDto>> createEvent(
            @RequestBody EventDtos.CreateEventRequest request) {
        EventDtos.EventDetailDto response = eventService.createEvent(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
