package com.ethioevents.broadcast;

import com.ethioevents.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizer")
@CrossOrigin(origins = "*")
public class BroadcastController {

    private final EventBroadcastService broadcastService;
    private final ScheduledEventReminderService reminderService;

    public BroadcastController(
            EventBroadcastService broadcastService,
            ScheduledEventReminderService reminderService) {
        this.broadcastService = broadcastService;
        this.reminderService = reminderService;
    }

    @PostMapping("/broadcasts")
    public ResponseEntity<ApiResponse<BroadcastDtos.BroadcastCampaignResponse>> createBroadcast(
            @RequestBody BroadcastDtos.CreateBroadcastRequest request,
            @RequestAttribute(value = "userId", required = false) UUID userId) {
        BroadcastDtos.BroadcastCampaignResponse response = broadcastService.createBroadcastCampaign(request, userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/broadcasts/event/{eventId}")
    public ResponseEntity<ApiResponse<List<BroadcastDtos.BroadcastCampaignResponse>>> getEventBroadcasts(
            @PathVariable UUID eventId) {
        List<BroadcastDtos.BroadcastCampaignResponse> response = broadcastService.getCampaignsForEvent(eventId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/broadcasts/test-send")
    public ResponseEntity<ApiResponse<Boolean>> sendTestBroadcast(
            @RequestBody BroadcastDtos.TestBroadcastRequest request) {
        boolean result = broadcastService.sendTestBroadcast(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/broadcasts/audience-count")
    public ResponseEntity<ApiResponse<BroadcastDtos.AudienceEstimateResponse>> getAudienceEstimate(
            @RequestParam UUID eventId,
            @RequestParam(required = false, defaultValue = "ALL_ATTENDEES") String targetFilter,
            @RequestParam(required = false) UUID targetTicketTypeId) {
        BroadcastDtos.AudienceEstimateResponse response = broadcastService.estimateAudience(eventId, targetFilter, targetTicketTypeId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/reminders/event/{eventId}")
    public ResponseEntity<ApiResponse<BroadcastDtos.AutomatedReminderConfig>> getEventReminders(
            @PathVariable UUID eventId) {
        BroadcastDtos.AutomatedReminderConfig response = reminderService.getReminderConfig(eventId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/reminders/event/{eventId}")
    public ResponseEntity<ApiResponse<BroadcastDtos.AutomatedReminderConfig>> updateEventReminders(
            @PathVariable UUID eventId,
            @RequestBody BroadcastDtos.UpdateRemindersRequest request) {
        BroadcastDtos.AutomatedReminderConfig response = reminderService.updateReminderConfig(eventId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
