package com.ethioevents.auth;

import com.ethioevents.common.ApiResponse;
import com.ethioevents.model.Organizer;
import com.ethioevents.model.User;
import com.ethioevents.model.UserRole;
import com.ethioevents.repository.OrganizerRepository;
import com.ethioevents.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final OtpService otpService;
    private final UserRepository userRepository;
    private final OrganizerRepository organizerRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(OtpService otpService,
                          UserRepository userRepository,
                          OrganizerRepository organizerRepository,
                          JwtTokenProvider jwtTokenProvider) {
        this.otpService = otpService;
        this.userRepository = userRepository;
        this.organizerRepository = organizerRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/otp/request")
    public ResponseEntity<ApiResponse<String>> requestOtp(@Valid @RequestBody AuthDtos.OtpRequestDto request) {
        otpService.requestOtp(request.phoneNumber());
        return ResponseEntity.ok(ApiResponse.ok("Verification code sent successfully to " + PhoneNormalizer.normalize(request.phoneNumber())));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponseDto>> verifyOtp(@Valid @RequestBody AuthDtos.OtpVerifyDto request) {
        String normalizedPhone = PhoneNormalizer.normalize(request.phoneNumber());
        otpService.verifyOtp(normalizedPhone, request.otpCode());

        // Find or create customer
        User user = userRepository.findByPhoneNumber(normalizedPhone).orElseGet(() -> {
            User newUser = new User();
            newUser.setPhoneNumber(normalizedPhone);
            newUser.setFullName(request.fullName() != null && !request.fullName().isBlank() ? request.fullName().trim() : "Event Guest");
            newUser.setRole(UserRole.CUSTOMER);
            return userRepository.save(newUser);
        });

        // Check if user is also an organizer
        UUID organizerId = null;
        String organizationName = null;
        if (user.getRole() == UserRole.ORGANIZER) {
            Optional<Organizer> orgOpt = organizerRepository.findByUserId(user.getId());
            if (orgOpt.isPresent()) {
                organizerId = orgOpt.get().getId();
                organizationName = orgOpt.get().getOrganizationName();
            }
        }

        String token = jwtTokenProvider.generateAccessToken(user, organizerId);
        AuthDtos.AuthResponseDto responseDto = new AuthDtos.AuthResponseDto(
                token,
                user.getId().toString(),
                user.getPhoneNumber(),
                user.getFullName(),
                user.getRole().name(),
                organizerId != null ? organizerId.toString() : null,
                organizationName
        );

        return ResponseEntity.ok(ApiResponse.ok(responseDto));
    }

    @PostMapping("/organizer/register")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponseDto>> registerOrganizer(
            @Valid @RequestBody AuthDtos.OrganizerRegisterDto request) {
        String normalizedPhone = PhoneNormalizer.normalize(request.phoneNumber());

        User user = userRepository.findByPhoneNumber(normalizedPhone).orElseGet(() -> {
            User newUser = new User();
            newUser.setPhoneNumber(normalizedPhone);
            return newUser;
        });

        user.setFullName(request.fullName().trim());
        if (request.email() != null && !request.email().isBlank()) {
            user.setEmail(request.email().trim());
        }
        user.setRole(UserRole.ORGANIZER);
        User savedUser = userRepository.save(user);

        Organizer organizer = organizerRepository.findByUserId(savedUser.getId()).orElseGet(() -> {
            Organizer newOrg = new Organizer();
            newOrg.setUser(savedUser);
            return newOrg;
        });

        organizer.setOrganizationName(request.organizationName().trim());
        organizer.setBusinessLicenseNo(request.businessLicenseNo() != null ? request.businessLicenseNo().trim() : "");
        organizer.setBankName(request.bankName().trim());
        organizer.setBankAccountNo(request.bankAccountNo().trim());
        organizer.setBankAccountName(request.bankAccountName().trim());
        organizer.setStatus(com.ethioevents.model.OrganizerStatus.VERIFIED);
        Organizer savedOrganizer = organizerRepository.save(organizer);

        String token = jwtTokenProvider.generateAccessToken(savedUser, savedOrganizer.getId());
        AuthDtos.AuthResponseDto responseDto = new AuthDtos.AuthResponseDto(
                token,
                savedUser.getId().toString(),
                savedUser.getPhoneNumber(),
                savedUser.getFullName(),
                savedUser.getRole().name(),
                savedOrganizer.getId().toString(),
                savedOrganizer.getOrganizationName()
        );

        return ResponseEntity.ok(ApiResponse.ok(responseDto));
    }
}
