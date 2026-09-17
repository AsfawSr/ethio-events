package com.ethioevents.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ticket_transfers")
public class TicketTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Column(name = "sender_name", nullable = false, length = 100)
    private String senderName;

    @Column(name = "sender_phone", nullable = false, length = 30)
    private String senderPhone;

    @Column(name = "recipient_name", nullable = false, length = 100)
    private String recipientName;

    @Column(name = "recipient_phone", nullable = false, length = 30)
    private String recipientPhone;

    @Column(name = "reason", length = 255)
    private String reason;

    @Column(name = "previous_security_hash", nullable = false, length = 64)
    private String previousSecurityHash;

    @Column(name = "new_security_hash", nullable = false, length = 64)
    private String newSecurityHash;

    @Column(name = "previous_signature", nullable = false, columnDefinition = "TEXT")
    private String previousSignature;

    @Column(name = "new_signature", nullable = false, columnDefinition = "TEXT")
    private String newSignature;

    @Column(name = "transferred_at", nullable = false, updatable = false)
    private Instant transferredAt = Instant.now();

    public TicketTransfer() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Ticket getTicket() { return ticket; }
    public void setTicket(Ticket ticket) { this.ticket = ticket; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getSenderPhone() { return senderPhone; }
    public void setSenderPhone(String senderPhone) { this.senderPhone = senderPhone; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getRecipientPhone() { return recipientPhone; }
    public void setRecipientPhone(String recipientPhone) { this.recipientPhone = recipientPhone; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getPreviousSecurityHash() { return previousSecurityHash; }
    public void setPreviousSecurityHash(String previousSecurityHash) { this.previousSecurityHash = previousSecurityHash; }

    public String getNewSecurityHash() { return newSecurityHash; }
    public void setNewSecurityHash(String newSecurityHash) { this.newSecurityHash = newSecurityHash; }

    public String getPreviousSignature() { return previousSignature; }
    public void setPreviousSignature(String previousSignature) { this.previousSignature = previousSignature; }

    public String getNewSignature() { return newSignature; }
    public void setNewSignature(String newSignature) { this.newSignature = newSignature; }

    public Instant getTransferredAt() { return transferredAt; }
    public void setTransferredAt(Instant transferredAt) { this.transferredAt = transferredAt; }
}
