package com.ethioevents.affiliate;

import com.ethioevents.auth.PhoneNormalizer;
import com.ethioevents.common.ApiException;
import com.ethioevents.model.*;
import com.ethioevents.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AffiliateService {

    private static final Logger log = LoggerFactory.getLogger(AffiliateService.class);

    private final AffiliateRepository affiliateRepository;
    private final AffiliateReferralRepository affiliateReferralRepository;
    private final AffiliateClickRepository affiliateClickRepository;
    private final EventRepository eventRepository;
    private final OrganizerRepository organizerRepository;
    private final UserRepository userRepository;

    public AffiliateService(AffiliateRepository affiliateRepository,
                            AffiliateReferralRepository affiliateReferralRepository,
                            AffiliateClickRepository affiliateClickRepository,
                            EventRepository eventRepository,
                            OrganizerRepository organizerRepository,
                            UserRepository userRepository) {
        this.affiliateRepository = affiliateRepository;
        this.affiliateReferralRepository = affiliateReferralRepository;
        this.affiliateClickRepository = affiliateClickRepository;
        this.eventRepository = eventRepository;
        this.organizerRepository = organizerRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AffiliateDtos.TrackClickResponse recordClick(String affiliateCode, UUID eventId, String ipAddress, String userAgent) {
        if (affiliateCode == null || affiliateCode.isBlank()) {
            return new AffiliateDtos.TrackClickResponse(false, null, null, BigDecimal.ZERO);
        }

        Affiliate affiliate = affiliateRepository.findByAffiliateCodeIgnoreCaseAndActiveTrue(affiliateCode.trim())
                .orElse(null);

        if (affiliate == null) {
            return new AffiliateDtos.TrackClickResponse(false, affiliateCode, null, BigDecimal.ZERO);
        }

        Event event = null;
        if (eventId != null) {
            event = eventRepository.findById(eventId).orElse(null);
        }

        // Increment click counter
        affiliate.setTotalClicks(affiliate.getTotalClicks() + 1);
        affiliateRepository.save(affiliate);

        // Record telemetry log
        AffiliateClick click = new AffiliateClick(affiliate, event, ipAddress, userAgent);
        affiliateClickRepository.save(click);

        return new AffiliateDtos.TrackClickResponse(
                true,
                affiliate.getAffiliateCode(),
                affiliate.getPromoterName(),
                affiliate.getCommissionRate()
        );
    }

    @Transactional
    public AffiliateDtos.AffiliateDto registerAffiliate(UUID currentUserId, AffiliateDtos.RegisterAffiliateRequest req) {
        String cleanCode = req.getAffiliateCode().trim().toLowerCase();

        if (affiliateRepository.existsByAffiliateCodeIgnoreCase(cleanCode)) {
            throw new ApiException(HttpStatus.CONFLICT, "CODE_TAKEN", "Affiliate code '" + cleanCode + "' is already in use by another promoter");
        }

        String normalizedPhone = PhoneNormalizer.normalize(req.getPhoneNumber());

        User user = null;
        if (currentUserId != null) {
            user = userRepository.findById(currentUserId).orElse(null);
        }

        Affiliate affiliate = new Affiliate();
        affiliate.setUser(user);
        affiliate.setAffiliateCode(cleanCode);
        affiliate.setPromoterName(req.getPromoterName().trim());
        affiliate.setPhoneNumber(normalizedPhone);
        affiliate.setEmail(req.getEmail());
        affiliate.setBankName(req.getBankName() != null ? req.getBankName() : "Commercial Bank of Ethiopia (CBE)");
        affiliate.setBankAccountNo(req.getBankAccountNo());
        affiliate.setBankAccountName(req.getBankAccountName() != null ? req.getBankAccountName() : req.getPromoterName());
        affiliate.setCommissionRate(new BigDecimal("5.00")); // Standard 5%
        affiliate.setActive(true);

        Affiliate saved = affiliateRepository.save(affiliate);
        log.info("New promoter affiliate registered: {} ({})", saved.getPromoterName(), saved.getAffiliateCode());
        return mapToDto(saved);
    }

    @Transactional
    public AffiliateDtos.AffiliateDto createOrganizerAffiliate(UUID currentUserId, AffiliateDtos.CreateOrganizerAffiliateRequest req) {
        String cleanCode = req.getAffiliateCode().trim().toLowerCase();

        if (affiliateRepository.existsByAffiliateCodeIgnoreCase(cleanCode)) {
            throw new ApiException(HttpStatus.CONFLICT, "CODE_TAKEN", "Affiliate code '" + cleanCode + "' is already registered");
        }

        Organizer organizer = null;
        if (currentUserId != null) {
            organizer = organizerRepository.findByUserId(currentUserId).orElse(null);
        }

        String normalizedPhone = PhoneNormalizer.normalize(req.getPhoneNumber());

        Affiliate affiliate = new Affiliate();
        affiliate.setOrganizer(organizer);
        affiliate.setAffiliateCode(cleanCode);
        affiliate.setPromoterName(req.getPromoterName().trim());
        affiliate.setPhoneNumber(normalizedPhone);
        affiliate.setEmail(req.getEmail());
        affiliate.setCommissionRate(req.getCommissionRate() != null ? req.getCommissionRate() : new BigDecimal("5.00"));
        affiliate.setBankName(req.getBankName() != null ? req.getBankName() : "Commercial Bank of Ethiopia (CBE)");
        affiliate.setBankAccountNo(req.getBankAccountNo());
        affiliate.setBankAccountName(req.getBankAccountName() != null ? req.getBankAccountName() : req.getPromoterName());
        affiliate.setActive(true);

        Affiliate saved = affiliateRepository.save(affiliate);
        return mapToDto(saved);
    }

    @Transactional
    public void recordOrderReferral(Order order, String affiliateCode) {
        if (affiliateCode == null || affiliateCode.isBlank() || order == null) {
            return;
        }

        Affiliate affiliate = affiliateRepository.findByAffiliateCodeIgnoreCaseAndActiveTrue(affiliateCode.trim())
                .orElse(null);

        if (affiliate == null) {
            return;
        }

        BigDecimal orderAmount = order.getTotalAmount();
        BigDecimal commissionRate = affiliate.getCommissionRate();
        BigDecimal commissionAmount = orderAmount.multiply(commissionRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        AffiliateReferral referral = new AffiliateReferral();
        referral.setAffiliate(affiliate);
        referral.setOrder(order);
        referral.setEvent(order.getEvent());
        referral.setOrderAmount(orderAmount);
        referral.setCommissionAmount(commissionAmount);
        referral.setStatus("CONFIRMED");

        affiliateReferralRepository.save(referral);

        // Update promoter affiliate metrics
        affiliate.setTotalConversions(affiliate.getTotalConversions() + 1);
        affiliate.setTotalSalesEtb(affiliate.getTotalSalesEtb().add(orderAmount));
        affiliate.setTotalCommissionEtb(affiliate.getTotalCommissionEtb().add(commissionAmount));
        affiliateRepository.save(affiliate);

        log.info("Recorded affiliate referral for {}: Order {} -> {} ETB (Commission: {} ETB)",
                affiliate.getAffiliateCode(), order.getOrderNumber(), orderAmount, commissionAmount);
    }

    @Transactional(readOnly = true)
    public AffiliateDtos.AffiliateDashboardDto getAffiliateDashboard(String identifier) {
        Affiliate affiliate = affiliateRepository.findByAffiliateCodeIgnoreCaseAndActiveTrue(identifier)
                .or(() -> affiliateRepository.findByPhoneNumber(identifier))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "AFFILIATE_NOT_FOUND", "Promoter affiliate profile not found for: " + identifier));

        List<AffiliateDtos.AffiliateReferralDto> referrals = affiliateReferralRepository
                .findByAffiliateIdOrderByCreatedAtDesc(affiliate.getId())
                .stream()
                .limit(50)
                .map(this::mapReferralToDto)
                .collect(Collectors.toList());

        double convRate = 0.0;
        if (affiliate.getTotalClicks() > 0) {
            convRate = Math.round(((double) affiliate.getTotalConversions() / affiliate.getTotalClicks() * 100.0) * 10.0) / 10.0;
        }

        return new AffiliateDtos.AffiliateDashboardDto(mapToDto(affiliate), referrals, convRate);
    }

    @Transactional(readOnly = true)
    public List<AffiliateDtos.AffiliateDto> getOrganizerAffiliates(UUID currentUserId) {
        if (currentUserId == null) {
            return affiliateRepository.findAllByOrderByCreatedAtDesc().stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        }

        Organizer organizer = organizerRepository.findByUserId(currentUserId).orElse(null);
        if (organizer != null) {
            return affiliateRepository.findByOrganizerIdOrderByCreatedAtDesc(organizer.getId()).stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        }

        return affiliateRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private AffiliateDtos.AffiliateDto mapToDto(Affiliate a) {
        AffiliateDtos.AffiliateDto dto = new AffiliateDtos.AffiliateDto();
        dto.setId(a.getId());
        dto.setAffiliateCode(a.getAffiliateCode());
        dto.setPromoterName(a.getPromoterName());
        dto.setPhoneNumber(a.getPhoneNumber());
        dto.setEmail(a.getEmail());
        dto.setBankName(a.getBankName());
        dto.setBankAccountNo(a.getBankAccountNo());
        dto.setBankAccountName(a.getBankAccountName());
        dto.setCommissionRate(a.getCommissionRate());
        dto.setTotalClicks(a.getTotalClicks());
        dto.setTotalConversions(a.getTotalConversions());
        dto.setTotalSalesEtb(a.getTotalSalesEtb());
        dto.setTotalCommissionEtb(a.getTotalCommissionEtb());
        dto.setPaidCommissionEtb(a.getPaidCommissionEtb());
        dto.setUnpaidCommissionEtb(a.getUnpaidCommissionEtb());
        dto.setActive(a.isActive());
        dto.setCreatedAt(a.getCreatedAt());
        return dto;
    }

    private AffiliateDtos.AffiliateReferralDto mapReferralToDto(AffiliateReferral r) {
        AffiliateDtos.AffiliateReferralDto dto = new AffiliateDtos.AffiliateReferralDto();
        dto.setId(r.getId());
        dto.setOrderNumber(r.getOrder() != null ? r.getOrder().getOrderNumber() : "N/A");
        dto.setEventTitle(r.getEvent() != null ? r.getEvent().getTitle() : "Event");
        dto.setOrderAmount(r.getOrderAmount());
        dto.setCommissionAmount(r.getCommissionAmount());
        dto.setStatus(r.getStatus());
        dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }
}
