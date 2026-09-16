package com.ethioevents.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Component("africasTalkingSmsGateway")
public class AfricasTalkingSmsGateway {

    private static final Logger log = LoggerFactory.getLogger(AfricasTalkingSmsGateway.class);

    private final HttpClient httpClient;
    private final String username;
    private final String apiKey;
    private final String senderId;
    private final String apiUrl;

    public AfricasTalkingSmsGateway(
            @Value("${ethioevents.sms.africas-talking.username:sandbox}") String username,
            @Value("${ethioevents.sms.africas-talking.api-key:atsk_demo_key}") String apiKey,
            @Value("${ethioevents.sms.africas-talking.sender-id:EthioEvents}") String senderId,
            @Value("${ethioevents.sms.africas-talking.api-url:https://api.africastalking.com/version1/messaging}") String apiUrl) {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.username = username;
        this.apiKey = apiKey;
        this.senderId = senderId;
        this.apiUrl = apiUrl;
    }

    public record SendResult(boolean success, String messageId, String error) {}

    public SendResult sendMessage(String phoneNumber, String message) {
        try {
            String formBody = "username=" + URLEncoder.encode(username, StandardCharsets.UTF_8) +
                    "&to=" + URLEncoder.encode(phoneNumber, StandardCharsets.UTF_8) +
                    "&message=" + URLEncoder.encode(message, StandardCharsets.UTF_8);

            if (senderId != null && !senderId.isBlank() && !senderId.equalsIgnoreCase("none")) {
                formBody += "&from=" + URLEncoder.encode(senderId, StandardCharsets.UTF_8);
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .header("apiKey", apiKey)
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();

            log.info("Dispatching SMS via Africa's Talking Gateway to {}: {}", phoneNumber, message);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Africa's Talking SMS sent successfully: {}", response.body());
                return new SendResult(true, "AT-" + System.currentTimeMillis(), null);
            } else {
                log.warn("Africa's Talking SMS returned HTTP {}: {}", response.statusCode(), response.body());
                return new SendResult(false, null, "HTTP " + response.statusCode() + ": " + response.body());
            }
        } catch (Exception e) {
            log.error("Africa's Talking SMS dispatch failed: " + e.getMessage(), e);
            return new SendResult(false, null, e.getMessage());
        }
    }
}
