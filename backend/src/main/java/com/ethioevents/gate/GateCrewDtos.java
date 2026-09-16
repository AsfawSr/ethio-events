package com.ethioevents.gate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public class GateCrewDtos {

    public static class CreateGateCrewPinRequest {
        @NotNull(message = "Event ID is required")
        private UUID eventId;

        @NotBlank(message = "Gate Name is required (e.g. North Turnstile 1)")
        private String gateName = "Main Turnstile Gate";

        private String crewMemberName;

        private Integer validHours = 24;

        public CreateGateCrewPinRequest() {}

        public UUID getEventId() {
            return eventId;
        }

        public void setEventId(UUID eventId) {
            this.eventId = eventId;
        }

        public String getGateName() {
            return gateName;
        }

        public void setGateName(String gateName) {
            this.gateName = gateName;
        }

        public String getCrewMemberName() {
            return crewMemberName;
        }

        public void setCrewMemberName(String crewMemberName) {
            this.crewMemberName = crewMemberName;
        }

        public Integer getValidHours() {
            return validHours != null ? validHours : 24;
        }

        public void setValidHours(Integer validHours) {
            this.validHours = validHours;
        }
    }

    public static class GateCrewPinDto {
        private UUID id;
        private UUID eventId;
        private String eventTitle;
        private String gateName;
        private String pinCode;
        private String crewMemberName;
        private Instant expiresAt;
        private boolean active;
        private Instant createdAt;
        private Instant lastUsedAt;
        private int loginCount;

        public GateCrewPinDto() {}

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public UUID getEventId() {
            return eventId;
        }

        public void setEventId(UUID eventId) {
            this.eventId = eventId;
        }

        public String getEventTitle() {
            return eventTitle;
        }

        public void setEventTitle(String eventTitle) {
            this.eventTitle = eventTitle;
        }

        public String getGateName() {
            return gateName;
        }

        public void setGateName(String gateName) {
            this.gateName = gateName;
        }

        public String getPinCode() {
            return pinCode;
        }

        public void setPinCode(String pinCode) {
            this.pinCode = pinCode;
        }

        public String getCrewMemberName() {
            return crewMemberName;
        }

        public void setCrewMemberName(String crewMemberName) {
            this.crewMemberName = crewMemberName;
        }

        public Instant getExpiresAt() {
            return expiresAt;
        }

        public void setExpiresAt(Instant expiresAt) {
            this.expiresAt = expiresAt;
        }

        public boolean isActive() {
            return active;
        }

        public void setActive(boolean active) {
            this.active = active;
        }

        public Instant getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(Instant createdAt) {
            this.createdAt = createdAt;
        }

        public Instant getLastUsedAt() {
            return lastUsedAt;
        }

        public void setLastUsedAt(Instant lastUsedAt) {
            this.lastUsedAt = lastUsedAt;
        }

        public int getLoginCount() {
            return loginCount;
        }

        public void setLoginCount(int loginCount) {
            this.loginCount = loginCount;
        }
    }

    public static class GateCrewPinLoginRequest {
        private UUID eventId;

        @NotBlank(message = "6-digit PIN code is required")
        private String pinCode;

        public GateCrewPinLoginRequest() {}

        public UUID getEventId() {
            return eventId;
        }

        public void setEventId(UUID eventId) {
            this.eventId = eventId;
        }

        public String getPinCode() {
            return pinCode;
        }

        public void setPinCode(String pinCode) {
            this.pinCode = pinCode;
        }
    }

    public static class GateCrewAuthResponse {
        private String token;
        private String role = "GATE_CREW";
        private UUID eventId;
        private String eventTitle;
        private String gateName;
        private String crewMemberName;
        private Instant expiresAt;

        public GateCrewAuthResponse() {}

        public GateCrewAuthResponse(String token, UUID eventId, String eventTitle, String gateName, String crewMemberName, Instant expiresAt) {
            this.token = token;
            this.eventId = eventId;
            this.eventTitle = eventTitle;
            this.gateName = gateName;
            this.crewMemberName = crewMemberName;
            this.expiresAt = expiresAt;
        }

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public UUID getEventId() {
            return eventId;
        }

        public void setEventId(UUID eventId) {
            this.eventId = eventId;
        }

        public String getEventTitle() {
            return eventTitle;
        }

        public void setEventTitle(String eventTitle) {
            this.eventTitle = eventTitle;
        }

        public String getGateName() {
            return gateName;
        }

        public void setGateName(String gateName) {
            this.gateName = gateName;
        }

        public String getCrewMemberName() {
            return crewMemberName;
        }

        public void setCrewMemberName(String crewMemberName) {
            this.crewMemberName = crewMemberName;
        }

        public Instant getExpiresAt() {
            return expiresAt;
        }

        public void setExpiresAt(Instant expiresAt) {
            this.expiresAt = expiresAt;
        }
    }
}
