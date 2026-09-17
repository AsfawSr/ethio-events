package com.ethioevents.repository;

import com.ethioevents.model.AffiliateClick;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AffiliateClickRepository extends JpaRepository<AffiliateClick, UUID> {

    long countByAffiliateId(UUID affiliateId);
}
