package com.ethioevents.promo;

import com.ethioevents.common.ApiException;
import com.ethioevents.model.Event;
import com.ethioevents.model.PromoCode;
import com.ethioevents.repository.EventRepository;
import com.ethioevents.repository.PromoCodeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PromoService {

    private static final Logger log = LoggerFactory.getLogger(PromoService.class);

    private final PromoCodeRepository promoCodeRepository;
    private final EventRepository eventRepository;

    public PromoService(PromoCodeRepository promoCodeRepository,
                        EventRepository eventRepository) {
        this.promoCodeRepository = promoCodeRepository;
        this.eventRepository = eventRepository;
    }

    public PromoDtos.ValidatePromoResponse validatePromoCode(PromoDtos.ValidatePromoRequest request) {
        String code = request.code() != null ? request.code().trim() : "";
        if (code.isBlank()) {
            return new PromoDtos.ValidatePromoResponse(
                    false, code, "NONE", BigDecimal.ZERO, BigDecimal.ZERO, request.subtotal(), "Please provide a promo code"
            );
        }

        Optional<PromoCode> promoOpt = promoCodeRepository.findByCodeIgnoreCase(code);
        if (promoOpt.isEmpty()) {
            return new PromoDtos.ValidatePromoResponse(
                    false, code, "NONE", BigDecimal.ZERO, BigDecimal.ZERO, request.subtotal(), "Invalid promo code"
            );
        }

        PromoCode promo = promoOpt.get();

        if (!promo.isActive()) {
            return new PromoDtos.ValidatePromoResponse(
                    false, code, promo.getDiscountType(), BigDecimal.ZERO, BigDecimal.ZERO, request.subtotal(), "Promo code is inactive or disabled"
            );
        }

        if (promo.getValidUntil() != null && Instant.now().isAfter(promo.getValidUntil())) {
            return new PromoDtos.ValidatePromoResponse(
                    false, code, promo.getDiscountType(), BigDecimal.ZERO, BigDecimal.ZERO, request.subtotal(), "Promo code has expired"
            );
        }

        if (promo.getMaxUses() != null && promo.getTimesUsed() >= promo.getMaxUses()) {
            return new PromoDtos.ValidatePromoResponse(
                    false, code, promo.getDiscountType(), BigDecimal.ZERO, BigDecimal.ZERO, request.subtotal(), "Promo code usage limit reached"
            );
        }

        if (promo.getEvent() != null && request.eventId() != null && !promo.getEvent().getId().equals(request.eventId())) {
            return new PromoDtos.ValidatePromoResponse(
                    false, code, promo.getDiscountType(), BigDecimal.ZERO, BigDecimal.ZERO, request.subtotal(), "Promo code is not valid for this event"
            );
        }

        if (promo.getMinOrderAmount() != null && request.subtotal().compareTo(promo.getMinOrderAmount()) < 0) {
            return new PromoDtos.ValidatePromoResponse(
                    false, code, promo.getDiscountType(), BigDecimal.ZERO, BigDecimal.ZERO, request.subtotal(),
                    "Minimum order amount of " + promo.getMinOrderAmount() + " ETB required for this promo"
            );
        }

        // Calculate discount
        BigDecimal discountAmount = BigDecimal.ZERO;
        if ("PERCENTAGE".equalsIgnoreCase(promo.getDiscountType())) {
            discountAmount = request.subtotal()
                    .multiply(promo.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            if (promo.getMaxDiscountAmount() != null && discountAmount.compareTo(promo.getMaxDiscountAmount()) > 0) {
                discountAmount = promo.getMaxDiscountAmount();
            }
        } else {
            // FIXED_AMOUNT
            discountAmount = promo.getDiscountValue().min(request.subtotal());
        }

        BigDecimal finalTotal = request.subtotal().subtract(discountAmount).max(BigDecimal.ZERO);

        log.info("Validated promo code {}: Discount {} ETB, Final Total {} ETB", promo.getCode(), discountAmount, finalTotal);

        return new PromoDtos.ValidatePromoResponse(
                true,
                promo.getCode(),
                promo.getDiscountType(),
                promo.getDiscountValue(),
                discountAmount,
                finalTotal,
                "Promo code applied successfully!"
        );
    }

    @Transactional
    public PromoDtos.PromoCodeDto createPromoCode(PromoDtos.CreatePromoCodeRequest request) {
        String cleanCode = request.code().trim().toUpperCase();
        if (promoCodeRepository.existsByCodeIgnoreCase(cleanCode)) {
            throw new ApiException(HttpStatus.CONFLICT, "DUPLICATE_CODE", "A promo code with this name already exists");
        }

        Event event = null;
        if (request.eventId() != null) {
            event = eventRepository.findById(request.eventId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "Event not found"));
        }

        PromoCode promo = new PromoCode();
        promo.setCode(cleanCode);
        promo.setEvent(event);
        promo.setDiscountType(request.discountType() != null ? request.discountType() : "PERCENTAGE");
        promo.setDiscountValue(request.discountValue());
        promo.setMinOrderAmount(request.minOrderAmount() != null ? request.minOrderAmount() : BigDecimal.ZERO);
        promo.setMaxDiscountAmount(request.maxDiscountAmount());
        promo.setMaxUses(request.maxUses() != null ? request.maxUses() : 100);
        promo.setTimesUsed(0);
        promo.setValidUntil(request.validUntil());
        promo.setActive(true);

        PromoCode saved = promoCodeRepository.save(promo);
        log.info("Created new promo code: {} for Event: {}", saved.getCode(), event != null ? event.getTitle() : "All Events");

        return mapToDto(saved);
    }

    @Transactional
    public void incrementTimesUsed(String code) {
        if (code == null || code.isBlank()) return;
        promoCodeRepository.findByCodeIgnoreCase(code.trim()).ifPresent(p -> {
            p.setTimesUsed(p.getTimesUsed() + 1);
            promoCodeRepository.save(p);
        });
    }

    public List<PromoDtos.PromoCodeDto> getPromoCodesForEvent(UUID eventId) {
        return promoCodeRepository.findByEventId(eventId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<PromoDtos.PromoCodeDto> getAllPromoCodes() {
        return promoCodeRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private PromoDtos.PromoCodeDto mapToDto(PromoCode p) {
        return new PromoDtos.PromoCodeDto(
                p.getId(),
                p.getEvent() != null ? p.getEvent().getId() : null,
                p.getEvent() != null ? p.getEvent().getTitle() : "All Platform Events",
                p.getCode(),
                p.getDiscountType(),
                p.getDiscountValue(),
                p.getMinOrderAmount(),
                p.getMaxDiscountAmount(),
                p.getMaxUses(),
                p.getTimesUsed(),
                p.isActive(),
                p.getValidUntil(),
                p.getCreatedAt()
        );
    }
}
