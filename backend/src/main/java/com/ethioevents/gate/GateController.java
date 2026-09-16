package com.ethioevents.gate;

import com.ethioevents.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/gate")
public class GateController {

    private final GateValidationService gateValidationService;
    private final GateLiveStreamService gateLiveStreamService;

    public GateController(GateValidationService gateValidationService,
                          GateLiveStreamService gateLiveStreamService) {
        this.gateValidationService = gateValidationService;
        this.gateLiveStreamService = gateLiveStreamService;
    }

    @GetMapping("/manifest/{eventId}")
    public ResponseEntity<ApiResponse<GateDtos.GateManifestDto>> getManifest(
            @PathVariable UUID eventId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant since) {
        GateDtos.GateManifestDto manifest = gateValidationService.getEventManifest(eventId, since);
        return ResponseEntity.ok(ApiResponse.ok(manifest));
    }

    @PostMapping("/validate-online")
    public ResponseEntity<ApiResponse<GateDtos.ValidateResultDto>> validateOnline(
            @Valid @RequestBody GateDtos.OnlineValidateRequest request) {
        GateDtos.ValidateResultDto result = gateValidationService.validateTicketOnline(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/sync-batch")
    public ResponseEntity<ApiResponse<GateDtos.BatchSyncResponse>> syncBatch(
            @Valid @RequestBody GateDtos.BatchSyncRequest request) {
        GateDtos.BatchSyncResponse response = gateValidationService.processBatchSync(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Real-time Server-Sent Events stream for live turnstile gate check-in events
     */
    @GetMapping(value = "/live-stream/{eventId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamGateCheckIns(@PathVariable UUID eventId) {
        return gateLiveStreamService.subscribe(eventId);
    }

    /**
     * Current gate occupancy and check-in stats for organizers and gate crew
     */
    @GetMapping("/live-stats/{eventId}")
    public ResponseEntity<ApiResponse<GateDtos.GateLiveStatsDto>> getLiveStats(@PathVariable UUID eventId) {
        GateDtos.GateLiveStatsDto stats = gateValidationService.getLiveStats(eventId);
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
