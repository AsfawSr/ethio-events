package com.ethioevents.repository;

import com.ethioevents.model.AffiliateReferral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AffiliateReferralRepository extends JpaRepository<AffiliateReferral, UUID> {

    List<AffiliateReferral> findByAffiliateIdOrderByCreatedAtDesc(UUID affiliateId);

    List<AffiliateReferral> findByEventIdOrderByCreatedAtDesc(UUID eventId);

    long countByAffiliateId(UUID affiliateId);
}
