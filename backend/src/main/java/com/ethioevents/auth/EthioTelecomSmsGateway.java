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

@Component("ethioTelecomSmsGateway")
public class EthioTelecomSmsGateway {

    private static final Logger log = LoggerFactory.getLogger(EthioTelecomSmsGateway.class);

    private final HttpClient httpClient;
    private final String apiUrl;
    private final String apiKey;
    private final String senderId;

    public EthioTelecomSmsGateway(
            @Value("${ethioevents.sms.ethio-telecom.api-url:https://sms.ethiotelecom.et/api/v1/messages}") String apiUrl,
            @Value("${ethioevents.sms.ethio-telecom.api-key:ET_SMS_DEMO_KEY}") String apiKey,
            @Value("${ethioevents.sms.ethio-telecom.sender-id:EthioEvents}") String senderId) {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.senderId = senderId;
    }

    public record SendResult(boolean success, String messageId, String error) {}

    public SendResult sendMessage(String phoneNumber, String message) {
        // Strip '+' from phone for Ethio Telecom format (e.g. 251911223344)
        String cleanPhone = phoneNumber.replace("+", "").trim();

        // Escape JSON message content
        String escapedMsg = message.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");

        String jsonPayload = String.format(
                "{\"sender\":\"%s\",\"recipient\":\"%s\",\"message\":\"%s\"}",
                senderId, cleanPhone, escapedMsg
        );

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            log.info("Dispatching SMS via Ethio Telecom Gateway to {}: {}", cleanPhone, message);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Ethio Telecom SMS sent successfully. Response: {}", response.body());
                return new SendResult(true, "ET-" + System.currentTimeMillis(), null);
            } else {
                log.warn("Ethio Telecom SMS Gateway returned HTTP {}: {}", response.statusCode(), response.body());
                return new SendResult(false, null, "HTTP " + response.statusCode() + ": " + response.body());
            }
        } catch (Exception e) {
            log.error("Ethio Telecom SMS dispatch failed: " + e.getMessage(), e);
            return new SendResult(false, null, e.getMessage());
        }
    }
}
