package com.ethioevents.auth;

import com.ethioevents.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final int OTP_VALIDITY_SECONDS = 180; // 3 minutes
    private static final int MAX_ATTEMPTS = 3;

    private final SmsGatewayService smsGatewayService;
    private final boolean mockAutoVerify;
    private final SecureRandom secureRandom = new SecureRandom();

    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private final Map<String, Instant> rateLimitStore = new ConcurrentHashMap<>();

    public record OtpEntry(
            String code,
            Instant expiresAt,
            int attempts
    ) {}

    public OtpService(SmsGatewayService smsGatewayService,
                      @Value("${ethioevents.sms.mock-auto-verify:false}") boolean mockAutoVerify) {
        this.smsGatewayService = smsGatewayService;
        this.mockAutoVerify = mockAutoVerify;
    }

    public void requestOtp(String rawPhone) {
        String normalizedPhone = PhoneNormalizer.normalize(rawPhone);

        // Rate limiting: 1 request per 30 seconds
        Instant lastSent = rateLimitStore.get(normalizedPhone);
        if (lastSent != null && Instant.now().isBefore(lastSent.plusSeconds(30))) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED",
                    "Please wait a moment before requesting another verification code.");
        }

        String otpCode = String.format("%06d", secureRandom.nextInt(1_000_000));
        Instant expiresAt = Instant.now().plusSeconds(OTP_VALIDITY_SECONDS);

        otpStore.put(normalizedPhone, new OtpEntry(otpCode, expiresAt, 0));
        rateLimitStore.put(normalizedPhone, Instant.now());

        smsGatewayService.sendOtpSms(normalizedPhone, otpCode);
    }

    public boolean verifyOtp(String rawPhone, String inputCode) {
        String normalizedPhone = PhoneNormalizer.normalize(rawPhone);

        // Master dev override or test phone numbers
        if (mockAutoVerify && "123456".equals(inputCode)) {
            return true;
        }

        OtpEntry entry = otpStore.get(normalizedPhone);
        if (entry == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP_NOT_FOUND", "No OTP was requested for this phone number.");
        }

        if (Instant.now().isAfter(entry.expiresAt())) {
            otpStore.remove(normalizedPhone);
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP_EXPIRED", "The verification code has expired. Please request a new one.");
        }

        if (entry.attempts() >= MAX_ATTEMPTS) {
            otpStore.remove(normalizedPhone);
            throw new ApiException(HttpStatus.BAD_REQUEST, "MAX_ATTEMPTS_EXCEEDED", "Too many invalid attempts. Please request a new code.");
        }

        if (!entry.code().equals(inputCode.trim())) {
            otpStore.put(normalizedPhone, new OtpEntry(entry.code(), entry.expiresAt(), entry.attempts() + 1));
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Incorrect verification code. Please try again.");
        }

        // Successfully verified -> invalidate
        otpStore.remove(normalizedPhone);
        return true;
    }
}
