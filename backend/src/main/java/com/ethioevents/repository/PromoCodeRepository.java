package com.ethioevents.repository;

import com.ethioevents.model.PromoCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PromoCodeRepository extends JpaRepository<PromoCode, UUID> {
    Optional<PromoCode> findByCodeIgnoreCase(String code);
    List<PromoCode> findByEventId(UUID eventId);
    boolean existsByCodeIgnoreCase(String code);
}
