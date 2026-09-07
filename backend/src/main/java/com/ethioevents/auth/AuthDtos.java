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
            String organizerId,
            String organizationName
    ) {}

    public record OrganizerRegisterDto(
            @NotBlank(message = "Phone number is required")
            String phoneNumber,

            @NotBlank(message = "Full name is required")
            String fullName,

            String email,

            @NotBlank(message = "Organization name is required")
            String organizationName,

            String businessLicenseNo,

            @NotBlank(message = "Bank name is required")
            String bankName,

            @NotBlank(message = "Bank account number is required")
            String bankAccountNo,

            @NotBlank(message = "Bank account holder name is required")
            String bankAccountName
    ) {}

    public record OrganizerProfileDto(
            java.util.UUID id,
            String organizationName,
            String businessLicenseNo,
            String bankName,
            String bankAccountNo,
            String bankAccountName,
            String status,
            String ownerName,
            String ownerPhone,
            String ownerEmail,
            long totalEvents,
            long totalTicketsSold,
            java.math.BigDecimal totalRevenueEtb
    ) {}
}
