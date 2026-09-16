package com.ethioevents.gate;

import com.ethioevents.auth.JwtTokenProvider;
import com.ethioevents.common.ApiException;
import com.ethioevents.model.Event;
import com.ethioevents.model.GateCrewPin;
import com.ethioevents.model.Organizer;
import com.ethioevents.model.User;
import com.ethioevents.model.UserRole;
import com.ethioevents.repository.EventRepository;
import com.ethioevents.repository.GateCrewPinRepository;
import com.ethioevents.repository.OrganizerRepository;
import com.ethioevents.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GateCrewPinService {

    private final GateCrewPinRepository gateCrewPinRepository;
    private final EventRepository eventRepository;
    private final OrganizerRepository organizerRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final SecureRandom secureRandom = new SecureRandom();

    public GateCrewPinService(GateCrewPinRepository gateCrewPinRepository,
                              EventRepository eventRepository,
                              OrganizerRepository organizerRepository,
                              UserRepository userRepository,
                              JwtTokenProvider jwtTokenProvider) {
        this.gateCrewPinRepository = gateCrewPinRepository;
        this.eventRepository = eventRepository;
        this.organizerRepository = organizerRepository;
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public GateCrewDtos.GateCrewPinDto createPin(UUID currentUserId, GateCrewDtos.CreateGateCrewPinRequest req) {
        Event event = eventRepository.findById(req.getEventId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "Event not found with ID: " + req.getEventId()));

        Organizer organizer = null;
        if (currentUserId != null) {
            User currentUser = userRepository.findById(currentUserId).orElse(null);
            if (currentUser != null && currentUser.getRole() == UserRole.ORGANIZER) {
                organizer = organizerRepository.findByUserId(currentUserId).orElse(null);
            }
        }

        // Generate 6-digit numeric PIN
        String pinCode = String.format("%06d", secureRandom.nextInt(900000) + 100000);

        GateCrewPin pin = new GateCrewPin();
        pin.setEvent(event);
        pin.setOrganizer(organizer != null ? organizer : event.getOrganizer());
        pin.setGateName(req.getGateName() != null && !req.getGateName().isBlank() ? req.getGateName() : "Main Turnstile Gate");
        pin.setCrewMemberName(req.getCrewMemberName());
        pin.setPinCode(pinCode);
        pin.setExpiresAt(Instant.now().plus(Duration.ofHours(req.getValidHours())));
        pin.setActive(true);

        GateCrewPin saved = gateCrewPinRepository.save(pin);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<GateCrewDtos.GateCrewPinDto> listPinsForEvent(UUID eventId) {
        return gateCrewPinRepository.findByEventIdOrderByCreatedAtDesc(eventId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public GateCrewDtos.GateCrewAuthResponse loginWithPin(GateCrewDtos.GateCrewPinLoginRequest req) {
        String pinCode = req.getPinCode().trim();
        GateCrewPin pin;

        if (req.getEventId() != null) {
            pin = gateCrewPinRepository.findByEventIdAndPinCodeAndActiveTrue(req.getEventId(), pinCode)
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_PIN", "Invalid or expired 6-digit Gate Crew PIN for this event"));
        } else {
            pin = gateCrewPinRepository.findByPinCodeAndActiveTrue(pinCode)
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_PIN", "Invalid or expired 6-digit Gate Crew PIN"));
        }

        if (pin.getExpiresAt().isBefore(Instant.now())) {
            pin.setActive(false);
            gateCrewPinRepository.save(pin);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "EXPIRED_PIN", "This Gate Crew PIN has expired. Please contact the event organizer for a new code.");
        }

        // Update login stats
        pin.setLoginCount(pin.getLoginCount() + 1);
        pin.setLastUsedAt(Instant.now());
        gateCrewPinRepository.save(pin);

        long remainingMs = Duration.between(Instant.now(), pin.getExpiresAt()).toMillis();
        long tokenDurationMs = Math.max(3600000L, remainingMs); // minimum 1 hour, or until expiry

        String token = jwtTokenProvider.generateGateCrewToken(
                pin.getId(),
                pin.getEvent().getId(),
                pin.getGateName(),
                pin.getCrewMemberName(),
                tokenDurationMs
        );

        return new GateCrewDtos.GateCrewAuthResponse(
                token,
                pin.getEvent().getId(),
                pin.getEvent().getTitle(),
                pin.getGateName(),
                pin.getCrewMemberName(),
                pin.getExpiresAt()
        );
    }

    @Transactional
    public void revokePin(UUID pinId) {
        GateCrewPin pin = gateCrewPinRepository.findById(pinId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PIN_NOT_FOUND", "Gate crew PIN not found"));
        pin.setActive(false);
        gateCrewPinRepository.save(pin);
    }

    private GateCrewDtos.GateCrewPinDto mapToDto(GateCrewPin entity) {
        GateCrewDtos.GateCrewPinDto dto = new GateCrewDtos.GateCrewPinDto();
        dto.setId(entity.getId());
        dto.setEventId(entity.getEvent().getId());
        dto.setEventTitle(entity.getEvent().getTitle());
        dto.setGateName(entity.getGateName());
        dto.setPinCode(entity.getPinCode());
        dto.setCrewMemberName(entity.getCrewMemberName());
        dto.setExpiresAt(entity.getExpiresAt());
        dto.setActive(entity.isActive() && entity.getExpiresAt().isAfter(Instant.now()));
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setLastUsedAt(entity.getLastUsedAt());
        dto.setLoginCount(entity.getLoginCount());
        return dto;
    }
}
