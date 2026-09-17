package com.ethioevents.repository;

import com.ethioevents.model.Affiliate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AffiliateRepository extends JpaRepository<Affiliate, UUID> {

    Optional<Affiliate> findByAffiliateCodeIgnoreCaseAndActiveTrue(String affiliateCode);

    Optional<Affiliate> findByPhoneNumber(String phoneNumber);

    Optional<Affiliate> findByUserId(UUID userId);

    List<Affiliate> findByOrganizerIdOrderByCreatedAtDesc(UUID organizerId);

    List<Affiliate> findAllByOrderByCreatedAtDesc();

    boolean existsByAffiliateCodeIgnoreCase(String affiliateCode);
}
