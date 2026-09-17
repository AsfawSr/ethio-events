package com.ethioevents.repository;

import com.ethioevents.model.TicketTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketTransferRepository extends JpaRepository<TicketTransfer, UUID> {

    List<TicketTransfer> findByTicketIdOrderByTransferredAtDesc(UUID ticketId);

    Optional<TicketTransfer> findByPreviousSecurityHash(String previousSecurityHash);

    Optional<TicketTransfer> findByNewSecurityHash(String newSecurityHash);

    List<TicketTransfer> findByRecipientPhoneOrderByTransferredAtDesc(String recipientPhone);

    List<TicketTransfer> findBySenderPhoneOrderByTransferredAtDesc(String senderPhone);
}
