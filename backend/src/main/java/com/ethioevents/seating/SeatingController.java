package com.ethioevents.seating;

import com.ethioevents.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/seating")
public class SeatingController {

    private final SeatingService seatingService;

    public SeatingController(SeatingService seatingService) {
        this.seatingService = seatingService;
    }

    /**
     * Get interactive visual seating plan for an event with real-time seat availability
     */
    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<SeatingDtos.EventSeatingPlanDto>> getEventSeatingPlan(
            @PathVariable UUID eventId) {
        SeatingDtos.EventSeatingPlanDto plan = seatingService.getEventSeatingPlan(eventId);
        return ResponseEntity.ok(ApiResponse.ok(plan));
    }

    /**
     * Temporarily hold selected seats for 10 minutes during checkout
     */
    @PostMapping("/hold")
    public ResponseEntity<ApiResponse<SeatingDtos.HoldSeatsResponse>> holdSeats(
            @RequestBody SeatingDtos.HoldSeatsRequest request) {
        SeatingDtos.HoldSeatsResponse response = seatingService.holdSeats(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Release previously held seats upon customer cancellation or cart reset
     */
    @PostMapping("/release")
    public ResponseEntity<ApiResponse<String>> releaseHeldSeats(
            @RequestBody SeatingDtos.ReleaseSeatsRequest request) {
        seatingService.releaseHeldSeats(request);
        return ResponseEntity.ok(ApiResponse.ok("Seats successfully released"));
    }
}
