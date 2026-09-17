package com.ethioevents.event;

import com.ethioevents.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventDtos.EventSummaryDto>>> getEvents(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String neighborhood,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) String sort) {
        if (q != null || category != null || neighborhood != null || minPrice != null || maxPrice != null || featured != null || sort != null) {
            return ResponseEntity.ok(ApiResponse.ok(eventService.searchAndFilterEvents(q, category, neighborhood, minPrice, maxPrice, featured, sort)));
        }
        return ResponseEntity.ok(ApiResponse.ok(eventService.getPublishedEvents()));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<EventDtos.EventSummaryDto>>> getFeaturedEvents() {
        return ResponseEntity.ok(ApiResponse.ok(eventService.getFeaturedEvents()));
    }

    @GetMapping("/meta/filters")
    public ResponseEntity<ApiResponse<EventDtos.FilterMetadataDto>> getFilterMetadata() {
        return ResponseEntity.ok(ApiResponse.ok(eventService.getFilterMetadata()));
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
