package com.ethioevents.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * AfroMessage (https://afromessage.com/) SMS Gateway Integration for Ethiopia.
 * Dispatches OTPs, Transactional Ticket Passes, Transfers, and Broadcasts
 * directly to Ethio Telecom (+2519...) and Safaricom Ethiopia (+2517...) mobile devices.
 */
@Component("afroMessageSmsGateway")
public class AfroMessageSmsGateway {

    private static final Logger log = LoggerFactory.getLogger(AfroMessageSmsGateway.class);

    private final HttpClient httpClient;
    private final String apiToken;
    private final String senderId;
    private final String identifierId;
    private final String apiUrl;

    public AfroMessageSmsGateway(
            @Value("${ethioevents.sms.afromessage.token:demo_afromessage_token}") String apiToken,
            @Value("${ethioevents.sms.afromessage.sender-id:EthioEvents}") String senderId,
            @Value("${ethioevents.sms.afromessage.identifier-id:}") String identifierId,
            @Value("${ethioevents.sms.afromessage.api-url:https://api.afromessage.com/api/send}") String apiUrl) {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.apiToken = apiToken;
        this.senderId = senderId;
        this.identifierId = identifierId;
        this.apiUrl = apiUrl;
    }

    public record SendResult(boolean success, String messageId, String error) {}

    /**
     * Sends SMS to Ethiopian phone number via AfroMessage REST API.
     */
    public SendResult sendMessage(String phoneNumber, String message) {
        if (apiToken == null || apiToken.isBlank() || "demo_afromessage_token".equalsIgnoreCase(apiToken.trim())) {
            log.warn("⚠ AfroMessage API token is not configured or using demo placeholder. Simulating dispatch...");
            String mockId = "afro_sim_" + System.currentTimeMillis();
            return new SendResult(true, mockId, null);
        }

        try {
            // Build AfroMessage JSON payload
            StringBuilder jsonBuilder = new StringBuilder("{");
            jsonBuilder.append("\"to\":\"").append(escapeJson(phoneNumber)).append("\",");
            jsonBuilder.append("\"message\":\"").append(escapeJson(message)).append("\"");

            if (identifierId != null && !identifierId.isBlank()) {
                jsonBuilder.append(",\"from\":\"").append(escapeJson(identifierId)).append("\"");
            } else if (senderId != null && !senderId.isBlank() && !"none".equalsIgnoreCase(senderId)) {
                jsonBuilder.append(",\"sender\":\"").append(escapeJson(senderId)).append("\"");
            }
            jsonBuilder.append("}");

            String jsonPayload = jsonBuilder.toString();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiToken)
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                String body = response.body();
                String messageId = extractField(body, "id");
                if (messageId == null) {
                    messageId = "afro_" + System.currentTimeMillis();
                }
                log.info("✓ AfroMessage SMS sent successfully to {}. Ref ID: {}", phoneNumber, messageId);
                return new SendResult(true, messageId, null);
            } else {
                String errorMsg = "AfroMessage HTTP " + response.statusCode() + ": " + response.body();
                log.error("✗ Failed to send SMS via AfroMessage: {}", errorMsg);
                return new SendResult(false, null, errorMsg);
            }
        } catch (Exception e) {
            log.error("✗ Exception during AfroMessage dispatch to {}: {}", phoneNumber, e.getMessage());
            return new SendResult(false, null, e.getMessage());
        }
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String extractField(String json, String field) {
        if (json == null) return null;
        String pattern = "\"" + field + "\"\\s*:\\s*\"([^\"]+)\"";
        java.util.regex.Pattern r = java.util.regex.Pattern.compile(pattern);
        java.util.regex.Matcher m = r.matcher(json);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }
}
