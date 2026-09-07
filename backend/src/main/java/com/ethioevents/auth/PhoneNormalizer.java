package com.ethioevents.auth;

import com.ethioevents.common.ApiException;
import org.springframework.http.HttpStatus;

public class PhoneNormalizer {

    /**
     * Normalizes Ethiopian mobile phone numbers into strict E.164 (+2519XXXXXXXX or +2517XXXXXXXX)
     */
    public static String normalize(String rawPhone) {
        if (rawPhone == null || rawPhone.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PHONE_NUMBER", "Phone number is required");
        }

        // Remove all spaces, dashes, parentheses
        String clean = rawPhone.replaceAll("[\\s\\-\\(\\)]", "");

        if (clean.startsWith("+251")) {
            clean = clean.substring(4);
        } else if (clean.startsWith("251")) {
            clean = clean.substring(3);
        } else if (clean.startsWith("0")) {
            clean = clean.substring(1);
        }

        // Must now be 9 digits starting with 9 (Ethio Telecom) or 7 (Safaricom)
        if (!clean.matches("^[97]\\d{8}$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PHONE_NUMBER",
                    "Invalid Ethiopian phone number. Please enter a valid number (e.g. 0911 22 33 44 or 0711 22 33 44)");
        }

        return "+251" + clean;
    }

    public static String getProviderName(String normalizedPhone) {
        if (normalizedPhone.startsWith("+2519")) {
            return "Ethio Telecom";
        } else if (normalizedPhone.startsWith("+2517")) {
            return "Safaricom Ethiopia";
        }
        return "Unknown";
    }
}
