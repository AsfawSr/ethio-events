package com.ethioevents.gate;

import com.ethioevents.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/gate/crew")
public class GateCrewPinController {

    private final GateCrewPinService gateCrewPinService;

    public GateCrewPinController(GateCrewPinService gateCrewPinService) {
        this.gateCrewPinService = gateCrewPinService;
    }

    /**
     * Generate a new temporary 6-digit Gate Crew access PIN for turnstile gates
     */
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<GateCrewDtos.GateCrewPinDto>> generatePin(
            @Valid @RequestBody GateCrewDtos.CreateGateCrewPinRequest request) {
        UUID userId = getCurrentUserId();
        GateCrewDtos.GateCrewPinDto pinDto = gateCrewPinService.createPin(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(pinDto));
    }

    /**
     * List all active and past gate crew PINs for an event
     */
    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<List<GateCrewDtos.GateCrewPinDto>>> listPinsForEvent(
            @PathVariable UUID eventId) {
        List<GateCrewDtos.GateCrewPinDto> pins = gateCrewPinService.listPinsForEvent(eventId);
        return ResponseEntity.ok(ApiResponse.ok(pins));
    }

    /**
     * Authenticate gate staff using a 6-digit PIN
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<GateCrewDtos.GateCrewAuthResponse>> loginWithPin(
            @Valid @RequestBody GateCrewDtos.GateCrewPinLoginRequest request) {
        GateCrewDtos.GateCrewAuthResponse authResponse = gateCrewPinService.loginWithPin(request);
        return ResponseEntity.ok(ApiResponse.ok(authResponse));
    }

    /**
     * Revoke an active Gate Crew PIN immediately
     */
    @DeleteMapping("/{pinId}")
    public ResponseEntity<ApiResponse<String>> revokePin(
            @PathVariable UUID pinId) {
        gateCrewPinService.revokePin(pinId);
        return ResponseEntity.ok(ApiResponse.ok("Gate crew PIN revoked successfully"));
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            try {
                return UUID.fromString(auth.getName());
            } catch (Exception ignored) {}
        }
        return null;
    }
}
