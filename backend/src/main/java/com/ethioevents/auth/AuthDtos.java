package com.ethioevents.auth;

import jakarta.validation.constraints.NotBlank;

public class AuthDtos {

    public record OtpRequestDto(
            @NotBlank(message = "Phone number is required")
            String phoneNumber
    ) {}

    public record OtpVerifyDto(
            @NotBlank(message = "Phone number is required")
            String phoneNumber,

            @NotBlank(message = "OTP code is required")
            String otpCode,

            String fullName // Optional name if first time user
    ) {}

    public record AuthResponseDto(
            String token,
            String userId,
            String phoneNumber,
            String fullName,
            String role,
            String organizerId
    ) {}
}
