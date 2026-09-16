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
import java.util.Base64;

@Component("twilioSmsGateway")
public class TwilioSmsGateway {

    private static final Logger log = LoggerFactory.getLogger(TwilioSmsGateway.class);

    private final HttpClient httpClient;
    private final String accountSid;
    private final String authToken;
    private final String fromNumber;

    public TwilioSmsGateway(
            @Value("${ethioevents.sms.twilio.account-sid:AC_DEMO_SID}") String accountSid,
            @Value("${ethioevents.sms.twilio.auth-token:TW_DEMO_TOKEN}") String authToken,
            @Value("${ethioevents.sms.twilio.from-number:+1234567890}") String fromNumber) {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.fromNumber = fromNumber;
    }

    public record SendResult(boolean success, String messageId, String error) {}

    public SendResult sendMessage(String phoneNumber, String message) {
        try {
            String url = String.format("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", accountSid);
            String formBody = "To=" + URLEncoder.encode(phoneNumber, StandardCharsets.UTF_8) +
                    "&From=" + URLEncoder.encode(fromNumber, StandardCharsets.UTF_8) +
                    "&Body=" + URLEncoder.encode(message, StandardCharsets.UTF_8);

            String auth = accountSid + ":" + authToken;
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .header("Authorization", "Basic " + encodedAuth)
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();

            log.info("Dispatching SMS via Twilio Gateway to {}: {}", phoneNumber, message);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Twilio SMS sent successfully: {}", response.body());
                return new SendResult(true, "TW-" + System.currentTimeMillis(), null);
            } else {
                log.warn("Twilio SMS returned HTTP {}: {}", response.statusCode(), response.body());
                return new SendResult(false, null, "HTTP " + response.statusCode() + ": " + response.body());
            }
        } catch (Exception e) {
            log.error("Twilio SMS dispatch failed: " + e.getMessage(), e);
            return new SendResult(false, null, e.getMessage());
        }
    }
}
