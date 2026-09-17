package com.ethioevents.event;

import com.ethioevents.common.ApiException;
import com.ethioevents.localization.LocalizedDateTimeDto;
import com.ethioevents.model.*;
import com.ethioevents.repository.EventRepository;
import com.ethioevents.repository.OrganizerRepository;
import com.ethioevents.repository.TicketTypeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class EventService {

    private final EventRepository eventRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final OrganizerRepository organizerRepository;

    public EventService(EventRepository eventRepository,
                        TicketTypeRepository ticketTypeRepository,
                        OrganizerRepository organizerRepository) {
        this.eventRepository = eventRepository;
        this.ticketTypeRepository = ticketTypeRepository;
        this.organizerRepository = organizerRepository;
    }

    public List<EventDtos.EventSummaryDto> getPublishedEvents() {
        List<Event> events = eventRepository.findByStatusOrderByStartTimeUtcAsc(EventStatus.PUBLISHED);
        return events.stream().map(this::mapToSummaryDto).collect(Collectors.toList());
    }

    public List<EventDtos.EventSummaryDto> getFeaturedEvents() {
        List<Event> events = eventRepository.findByStatusAndFeaturedTrueOrderByStartTimeUtcAsc(EventStatus.PUBLISHED);
        if (events.isEmpty()) {
            events = eventRepository.findByStatusOrderByStartTimeUtcAsc(EventStatus.PUBLISHED);
            if (events.size() > 3) {
                events = events.subList(0, 3);
            }
        }
        return events.stream().map(this::mapToSummaryDto).collect(Collectors.toList());
    }

    public List<EventDtos.EventSummaryDto> searchAndFilterEvents(
            String query,
            String categoryStr,
            String neighborhoodStr,
            BigDecimal minPriceFilter,
            BigDecimal maxPriceFilter,
            Boolean featuredOnly,
            String sortBy) {

        List<Event> events = eventRepository.findByStatusOrderByStartTimeUtcAsc(EventStatus.PUBLISHED);

        // 1. Text Query Search (title, description, venue, tags)
        if (query != null && !query.trim().isBlank()) {
            String q = query.trim().toLowerCase();
            events = events.stream().filter(e ->
                    e.getTitle().toLowerCase().contains(q) ||
                    e.getDescription().toLowerCase().contains(q) ||
                    e.getVenueName().toLowerCase().contains(q) ||
                    e.getVenueAddress().toLowerCase().contains(q) ||
                    e.getTags().toLowerCase().contains(q)
            ).collect(Collectors.toList());
        }

        // 2. Category Filter
        if (categoryStr != null && !categoryStr.trim().isBlank() && !categoryStr.equalsIgnoreCase("ALL")) {
            events = events.stream().filter(e ->
                    e.getCategory().name().equalsIgnoreCase(categoryStr.trim()) ||
                    e.getCategory().getEnglishName().equalsIgnoreCase(categoryStr.trim()) ||
                    e.getCategory().getAmharicName().equalsIgnoreCase(categoryStr.trim())
            ).collect(Collectors.toList());
        }

        // 3. Neighborhood Filter
        if (neighborhoodStr != null && !neighborhoodStr.trim().isBlank() && !neighborhoodStr.equalsIgnoreCase("ALL")) {
            events = events.stream().filter(e ->
                    e.getNeighborhood().name().equalsIgnoreCase(neighborhoodStr.trim()) ||
                    e.getNeighborhood().getEnglishName().equalsIgnoreCase(neighborhoodStr.trim()) ||
                    e.getNeighborhood().getAmharicName().equalsIgnoreCase(neighborhoodStr.trim())
            ).collect(Collectors.toList());
        }

        // 4. Featured Only Filter
        if (Boolean.TRUE.equals(featuredOnly)) {
            events = events.stream().filter(Event::isFeatured).collect(Collectors.toList());
        }

        // Map to summary DTOs
        List<EventDtos.EventSummaryDto> summaries = events.stream()
                .map(this::mapToSummaryDto)
                .collect(Collectors.toList());

        // 5. Price Range Filter
        if (minPriceFilter != null) {
            summaries = summaries.stream()
                    .filter(s -> s.minPrice().compareTo(minPriceFilter) >= 0)
                    .collect(Collectors.toList());
        }
        if (maxPriceFilter != null) {
            summaries = summaries.stream()
                    .filter(s -> s.minPrice().compareTo(maxPriceFilter) <= 0)
                    .collect(Collectors.toList());
        }

        // 6. Sorting
        if ("PRICE_LOW_HIGH".equalsIgnoreCase(sortBy)) {
            summaries.sort(Comparator.comparing(EventDtos.EventSummaryDto::minPrice));
        } else if ("PRICE_HIGH_LOW".equalsIgnoreCase(sortBy)) {
            summaries.sort((a, b) -> b.minPrice().compareTo(a.minPrice()));
        } else if ("FEATURED_FIRST".equalsIgnoreCase(sortBy)) {
            summaries.sort((a, b) -> Boolean.compare(b.featured(), a.featured()));
        }

        return summaries;
    }

    public EventDtos.FilterMetadataDto getFilterMetadata() {
        List<Event> published = eventRepository.findByStatusOrderByStartTimeUtcAsc(EventStatus.PUBLISHED);

        Map<EventCategory, Long> countByCategory = published.stream()
                .collect(Collectors.groupingBy(Event::getCategory, Collectors.counting()));

        Map<Neighborhood, Long> countByNeighborhood = published.stream()
                .collect(Collectors.groupingBy(Event::getNeighborhood, Collectors.counting()));

        List<EventDtos.CategoryFilterItemDto> categoryItems = new ArrayList<>();
        // All categories total
        categoryItems.add(new EventDtos.CategoryFilterItemDto(
                "ALL",
                "All Categories",
                "ሁሉም መድረኮች",
                "✨",
                published.size()
        ));

        for (EventCategory cat : EventCategory.values()) {
            if (cat == EventCategory.ALL) continue;
            long cnt = countByCategory.getOrDefault(cat, 0L);
            categoryItems.add(new EventDtos.CategoryFilterItemDto(
                    cat.name(),
                    cat.getEnglishName(),
                    cat.getAmharicName(),
                    cat.getIconEmoji(),
                    cnt
            ));
        }

        List<EventDtos.NeighborhoodFilterItemDto> neighborhoodItems = new ArrayList<>();
        neighborhoodItems.add(new EventDtos.NeighborhoodFilterItemDto(
                "ALL",
                "All Locations",
                "መላው አዲስ አበባ",
                published.size()
        ));

        for (Neighborhood nh : Neighborhood.values()) {
            if (nh == Neighborhood.ALL) continue;
            long cnt = countByNeighborhood.getOrDefault(nh, 0L);
            neighborhoodItems.add(new EventDtos.NeighborhoodFilterItemDto(
                    nh.name(),
                    nh.getEnglishName(),
                    nh.getAmharicName(),
                    cnt
            ));
        }

        BigDecimal minPrice = BigDecimal.ZERO;
        BigDecimal maxPrice = BigDecimal.valueOf(10000);

        List<TicketType> allTiers = ticketTypeRepository.findAll();
        if (!allTiers.isEmpty()) {
            minPrice = allTiers.stream().map(TicketType::getPrice).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            maxPrice = allTiers.stream().map(TicketType::getPrice).max(BigDecimal::compareTo).orElse(BigDecimal.valueOf(10000));
        }

        return new EventDtos.FilterMetadataDto(
                categoryItems,
                neighborhoodItems,
                minPrice,
                maxPrice,
                published.size()
        );
    }

    public EventDtos.EventDetailDto getEventBySlug(String slug) {
        Event event = eventRepository.findBySlug(slug)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "Event not found"));

        return mapToDetailDto(event);
    }

    @Transactional
    public EventDtos.EventDetailDto createEvent(EventDtos.CreateEventRequest request) {
        if (request.ticketTypes() == null || request.ticketTypes().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NO_TICKET_TYPES", "At least one ticket tier is required to register an event");
        }

        // Get or fallback to active organizer
        Organizer organizer = null;
        if (request.organizerId() != null && !request.organizerId().isBlank()) {
            try {
                UUID orgUuid = UUID.fromString(request.organizerId().trim());
                organizer = organizerRepository.findById(orgUuid).orElse(null);
            } catch (Exception ignored) {}
        }
        if (organizer == null && request.organizerName() != null && !request.organizerName().isBlank()) {
            organizer = organizerRepository.findAll().stream()
                    .filter(o -> o.getOrganizationName().equalsIgnoreCase(request.organizerName().trim()))
                    .findFirst()
                    .orElse(null);
        }
        if (organizer == null) {
            organizer = organizerRepository.findAll().stream().findFirst().orElseThrow(() ->
                    new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "NO_ORGANIZER", "No registered organizer found in system"));
        }

        String baseSlug = request.title().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        if (baseSlug.isBlank()) baseSlug = "addis-event";
        String uniqueSlug = baseSlug + "-" + (System.currentTimeMillis() % 100000);

        Instant startTime = Instant.parse(request.startTimeIsoUtc());
        Instant endTime = Instant.parse(request.endTimeIsoUtc());

        EventCategory cat = EventCategory.MUSIC_CONCERT;
        if (request.category() != null && !request.category().isBlank()) {
            try {
                cat = EventCategory.valueOf(request.category().trim().toUpperCase());
            } catch (Exception ignored) {}
        }

        Neighborhood nh = Neighborhood.BOLE;
        if (request.neighborhood() != null && !request.neighborhood().isBlank()) {
            try {
                nh = Neighborhood.valueOf(request.neighborhood().trim().toUpperCase());
            } catch (Exception ignored) {}
        }

        Event event = new Event();
        event.setOrganizer(organizer);
        event.setTitle(request.title().trim());
        event.setSlug(uniqueSlug);
        event.setDescription(request.description().trim());
        event.setVenueName(request.venueName().trim());
        event.setVenueAddress(request.venueAddress().trim());
        event.setStartTimeUtc(startTime);
        event.setEndTimeUtc(endTime);
        event.setBannerImageUrl(request.bannerImageUrl().trim());
        event.setStatus(EventStatus.PENDING_APPROVAL);
        event.setCategory(cat);
        event.setNeighborhood(nh);
        event.setFeatured(Boolean.TRUE.equals(request.featured()));
        event.setTags(request.tags() != null ? request.tags().trim() : "");
        if (request.latitude() != null) event.setLatitude(request.latitude());
        if (request.longitude() != null) event.setLongitude(request.longitude());

        Event savedEvent = eventRepository.save(event);

        List<EventDtos.TicketTypeDto> createdTiers = new ArrayList<>();
        for (EventDtos.CreateTicketTypeRequest tReq : request.ticketTypes()) {
            TicketType tt = new TicketType();
            tt.setEvent(savedEvent);
            tt.setName(tReq.name().trim());
            tt.setDescription(tReq.description() != null ? tReq.description().trim() : "");
            tt.setPrice(tReq.price());
            tt.setTotalCapacity(tReq.totalCapacity());
            tt.setAvailableCapacity(tReq.totalCapacity());
            tt.setReservedCapacity(0);
            tt.setMaxPerUser(tReq.maxPerUser() > 0 ? tReq.maxPerUser() : 5);
            tt.setSalesStartUtc(Instant.now());
            tt.setSalesEndUtc(startTime);

            TicketType savedTier = ticketTypeRepository.save(tt);
            createdTiers.add(new EventDtos.TicketTypeDto(
                    savedTier.getId(),
                    savedTier.getName(),
                    savedTier.getDescription(),
                    savedTier.getPrice(),
                    "ETB",
                    savedTier.getAvailableCapacity(),
                    savedTier.getMaxPerUser(),
                    true
            ));
        }

        return getEventBySlug(savedEvent.getSlug());
    }

    @Transactional
    public EventDtos.EventDetailDto approveEvent(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "Event not found"));
        event.setStatus(EventStatus.PUBLISHED);
        Event saved = eventRepository.save(event);
        return getEventBySlug(saved.getSlug());
    }

    @Transactional
    public EventDtos.EventDetailDto rejectEvent(UUID eventId, String feedback) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND", "Event not found"));
        event.setStatus(EventStatus.REJECTED);
        Event saved = eventRepository.save(event);
        return getEventBySlug(saved.getSlug());
    }

    public List<com.ethioevents.admin.AdminDtos.EventModerationDto> getEventsForAdmin(EventStatus statusFilter) {
        List<Event> events;
        if (statusFilter != null) {
            events = eventRepository.findByStatusOrderByCreatedAtDesc(statusFilter);
        } else {
            events = eventRepository.findByOrderByCreatedAtDesc();
        }

        return events.stream().map(event -> {
            List<TicketType> tiers = ticketTypeRepository.findByEventId(event.getId());

            BigDecimal minPrice = tiers.stream().map(TicketType::getPrice).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            BigDecimal maxPrice = tiers.stream().map(TicketType::getPrice).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            int totalCapacity = tiers.stream().mapToInt(TicketType::getTotalCapacity).sum();

            List<EventDtos.TicketTypeDto> tierDtos = tiers.stream().map(t -> new EventDtos.TicketTypeDto(
                    t.getId(),
                    t.getName(),
                    t.getDescription(),
                    t.getPrice(),
                    "ETB",
                    t.getAvailableCapacity(),
                    t.getMaxPerUser(),
                    t.getAvailableCapacity() > 0
            )).collect(Collectors.toList());

            Organizer org = event.getOrganizer();
            User owner = org != null ? org.getUser() : null;

            return new com.ethioevents.admin.AdminDtos.EventModerationDto(
                    event.getId(),
                    event.getTitle(),
                    event.getSlug(),
                    event.getDescription(),
                    event.getVenueName(),
                    event.getVenueAddress(),
                    LocalizedDateTimeDto.fromInstant(event.getStartTimeUtc()),
                    LocalizedDateTimeDto.fromInstant(event.getEndTimeUtc()),
                    event.getBannerImageUrl(),
                    event.getStatus().name(),
                    org != null ? org.getId() : null,
                    org != null ? org.getOrganizationName() : "Unknown",
                    owner != null ? owner.getPhoneNumber() : "",
                    owner != null ? owner.getEmail() : "",
                    minPrice,
                    maxPrice,
                    totalCapacity,
                    tierDtos,
                    event.getCreatedAt()
            );
        }).collect(Collectors.toList());
    }

    private double[] resolveCoordinates(Event event) {
        if (event.getLatitude() != null && event.getLongitude() != null) {
            return new double[]{event.getLatitude(), event.getLongitude()};
        }
        Neighborhood nh = event.getNeighborhood() != null ? event.getNeighborhood() : Neighborhood.BOLE;
        String venue = event.getVenueName() != null ? event.getVenueName().toLowerCase() : "";

        if (venue.contains("millennium") || nh == Neighborhood.BOLE) {
            return new double[]{9.0012, 38.7853};
        } else if (venue.contains("uneca") || venue.contains("interluxury") || nh == Neighborhood.KAZANCHIS) {
            return new double[]{9.0145, 38.7634};
        } else if (venue.contains("theatre") || venue.contains("hager fikir") || nh == Neighborhood.PIASSA) {
            return new double[]{9.0182, 38.7523};
        } else if (venue.contains("meskel") || venue.contains("exhibition") || nh == Neighborhood.MESKEL_SQUARE) {
            return new double[]{9.0105, 38.7612};
        } else if (venue.contains("golf") || venue.contains("african union") || nh == Neighborhood.SARBET) {
            return new double[]{8.9950, 38.7350};
        } else if (venue.contains("entoto") || nh == Neighborhood.ENTOTO) {
            return new double[]{9.0820, 38.7621};
        } else if (venue.contains("century") || venue.contains("summit") || nh == Neighborhood.CMC) {
            return new double[]{9.0250, 38.8350};
        } else if (venue.contains("imperial") || nh == Neighborhood.GERJI) {
            return new double[]{9.0020, 38.8050};
        } else if (venue.contains("kuriftu") || venue.contains("bishoftu") || nh == Neighborhood.BISHOFTU) {
            return new double[]{8.7520, 38.9850};
        } else if (nh == Neighborhood.HAWASSA) {
            return new double[]{7.0504, 38.4763};
        }
        return new double[]{9.0105, 38.7612};
    }

    private EventDtos.EventSummaryDto mapToSummaryDto(Event event) {
        List<TicketType> tiers = ticketTypeRepository.findByEventId(event.getId());

        BigDecimal minPrice = tiers.stream().map(TicketType::getPrice).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        BigDecimal maxPrice = tiers.stream().map(TicketType::getPrice).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        boolean isSoldOut = tiers.stream().mapToInt(TicketType::getAvailableCapacity).sum() == 0;

        List<String> tagsList = Arrays.stream(event.getTags().split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());

        EventCategory cat = event.getCategory() != null ? event.getCategory() : EventCategory.MUSIC_CONCERT;
        Neighborhood nh = event.getNeighborhood() != null ? event.getNeighborhood() : Neighborhood.BOLE;
        double[] coords = resolveCoordinates(event);

        return new EventDtos.EventSummaryDto(
                event.getId(),
                event.getTitle(),
                event.getSlug(),
                event.getDescription(),
                event.getVenueName(),
                event.getVenueAddress(),
                LocalizedDateTimeDto.fromInstant(event.getStartTimeUtc()),
                LocalizedDateTimeDto.fromInstant(event.getEndTimeUtc()),
                event.getBannerImageUrl(),
                event.getStatus().name(),
                minPrice,
                maxPrice,
                "ETB",
                isSoldOut,
                cat.name(),
                cat.getAmharicName(),
                cat.getIconEmoji(),
                nh.getEnglishName(),
                nh.getAmharicName(),
                event.isFeatured(),
                tagsList,
                coords[0],
                coords[1]
        );
    }

    private EventDtos.EventDetailDto mapToDetailDto(Event event) {
        List<TicketType> tiers = ticketTypeRepository.findByEventId(event.getId());

        List<EventDtos.TicketTypeDto> tierDtos = tiers.stream().map(t -> new EventDtos.TicketTypeDto(
                t.getId(),
                t.getName(),
                t.getDescription(),
                t.getPrice(),
                "ETB",
                t.getAvailableCapacity(),
                t.getMaxPerUser(),
                t.getAvailableCapacity() > 0
        )).collect(Collectors.toList());

        List<String> tagsList = Arrays.stream(event.getTags().split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());

        EventCategory cat = event.getCategory() != null ? event.getCategory() : EventCategory.MUSIC_CONCERT;
        Neighborhood nh = event.getNeighborhood() != null ? event.getNeighborhood() : Neighborhood.BOLE;
        double[] coords = resolveCoordinates(event);

        return new EventDtos.EventDetailDto(
                event.getId(),
                event.getTitle(),
                event.getSlug(),
                event.getDescription(),
                event.getVenueName(),
                event.getVenueAddress(),
                LocalizedDateTimeDto.fromInstant(event.getStartTimeUtc()),
                LocalizedDateTimeDto.fromInstant(event.getEndTimeUtc()),
                event.getBannerImageUrl(),
                event.getStatus().name(),
                event.getOrganizer().getOrganizationName(),
                cat.name(),
                cat.getAmharicName(),
                cat.getIconEmoji(),
                nh.getEnglishName(),
                nh.getAmharicName(),
                event.isFeatured(),
                tagsList,
                coords[0],
                coords[1],
                tierDtos
        );
    }
}
