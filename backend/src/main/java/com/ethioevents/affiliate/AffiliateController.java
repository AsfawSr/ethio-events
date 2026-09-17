package com.ethioevents.affiliate;

import com.ethioevents.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/affiliates")
public class AffiliateController {

    private final AffiliateService affiliateService;

    public AffiliateController(AffiliateService affiliateService) {
        this.affiliateService = affiliateService;
    }

    /**
     * Record a click from an affiliate tracking link (e.g. ?ref=tikvahethiopia)
     */
    @PostMapping("/track")
    public ResponseEntity<ApiResponse<AffiliateDtos.TrackClickResponse>> trackClick(
            @RequestParam String code,
            @RequestParam(required = false) UUID eventId,
            HttpServletRequest request) {

        String ip = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        AffiliateDtos.TrackClickResponse response = affiliateService.recordClick(code, eventId, ip, userAgent);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Public registration for event promoters, influencers, and campus ambassadors
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AffiliateDtos.AffiliateDto>> registerAffiliate(
            @Valid @RequestBody AffiliateDtos.RegisterAffiliateRequest request) {
        UUID currentUserId = getCurrentUserId();
        AffiliateDtos.AffiliateDto dto = affiliateService.registerAffiliate(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(dto));
    }

    /**
     * Get promoter dashboard performance analytics and referral earnings
     */
    @GetMapping("/portal/{identifier}")
    public ResponseEntity<ApiResponse<AffiliateDtos.AffiliateDashboardDto>> getDashboard(
            @PathVariable String identifier) {
        AffiliateDtos.AffiliateDashboardDto dashboard = affiliateService.getAffiliateDashboard(identifier);
        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }

    /**
     * Organizer / Admin endpoint to list all active promoter affiliate codes
     */
    @GetMapping("/organizer")
    public ResponseEntity<ApiResponse<List<AffiliateDtos.AffiliateDto>>> getOrganizerAffiliates() {
        UUID currentUserId = getCurrentUserId();
        List<AffiliateDtos.AffiliateDto> list = affiliateService.getOrganizerAffiliates(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /**
     * Organizer creates a customized affiliate link with tailored commission split
     */
    @PostMapping("/organizer/create")
    public ResponseEntity<ApiResponse<AffiliateDtos.AffiliateDto>> createOrganizerAffiliate(
            @Valid @RequestBody AffiliateDtos.CreateOrganizerAffiliateRequest request) {
        UUID currentUserId = getCurrentUserId();
        AffiliateDtos.AffiliateDto dto = affiliateService.createOrganizerAffiliate(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(dto));
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

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }
}
