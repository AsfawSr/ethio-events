package com.ethioevents.promo;

import com.ethioevents.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/promo")
public class PromoController {

    private final PromoService promoService;

    public PromoController(PromoService promoService) {
        this.promoService = promoService;
    }

    /**
     * Public promo code validation during checkout
     */
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<PromoDtos.ValidatePromoResponse>> validatePromo(
            @Valid @RequestBody PromoDtos.ValidatePromoRequest request) {
        PromoDtos.ValidatePromoResponse result = promoService.validatePromoCode(request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Create new promotional discount or group voucher
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PromoDtos.PromoCodeDto>> createPromoCode(
            @Valid @RequestBody PromoDtos.CreatePromoCodeRequest request) {
        PromoDtos.PromoCodeDto created = promoService.createPromoCode(request);
        return ResponseEntity.ok(ApiResponse.ok(created));
    }

    /**
     * Get promo codes for specific event
     */
    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<List<PromoDtos.PromoCodeDto>>> getPromoCodesForEvent(
            @PathVariable UUID eventId) {
        List<PromoDtos.PromoCodeDto> list = promoService.getPromoCodesForEvent(eventId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /**
     * Get all promo codes
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PromoDtos.PromoCodeDto>>> getAllPromoCodes() {
        List<PromoDtos.PromoCodeDto> list = promoService.getAllPromoCodes();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }
}
