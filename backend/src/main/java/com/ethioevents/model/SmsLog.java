package com.ethioevents.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sms_logs")
public class SmsLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "phone_number", nullable = false, length = 25)
    private String phoneNumber;

    @Column(name = "message_type", nullable = false, length = 30)
    private String messageType; // OTP, TICKET_CONFIRMATION, EVENT_UPDATE

    @Column(name = "provider", nullable = false, length = 30)
    private String provider; // MOCK, ETHIO_TELECOM, AFRICASTALKING, TWILIO

    @Column(name = "status", nullable = false, length = 20)
    private String status; // SENT, FAILED, DELIVERED

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "external_message_id", length = 100)
    private String externalMessageId;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public SmsLog() {}

    public SmsLog(String phoneNumber, String messageType, String provider, String status, String content) {
        this.phoneNumber = phoneNumber;
        this.messageType = messageType;
        this.provider = provider;
        this.status = status;
        this.content = content;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getExternalMessageId() { return externalMessageId; }
    public void setExternalMessageId(String externalMessageId) { this.externalMessageId = externalMessageId; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
