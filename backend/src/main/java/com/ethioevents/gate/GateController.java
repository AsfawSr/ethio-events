package com.ethioevents.gate;

import com.ethioevents.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/gate")
public class GateController {

    private final GateValidationService gateValidationService;

    public GateController(GateValidationService gateValidationService) {
        this.gateValidationService = gateValidationService;
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
}
