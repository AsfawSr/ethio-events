package com.ethioevents.repository;

import com.ethioevents.model.SmsLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SmsLogRepository extends JpaRepository<SmsLog, UUID> {
    List<SmsLog> findByPhoneNumberOrderByCreatedAtDesc(String phoneNumber);
    List<SmsLog> findByOrderByCreatedAtDesc();
    List<SmsLog> findTop50ByOrderByCreatedAtDesc();
}
