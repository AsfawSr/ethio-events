package com.ethioevents.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organizer_id", nullable = false)
    private Organizer organizer;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "slug", nullable = false, unique = true, length = 250)
    private String slug;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "venue_name", nullable = false, length = 150)
    private String venueName;

    @Column(name = "venue_address", nullable = false, length = 255)
    private String venueAddress;

    @Column(name = "start_time_utc", nullable = false)
    private Instant startTimeUtc;

    @Column(name = "end_time_utc", nullable = false)
    private Instant endTimeUtc;

    @Column(name = "banner_image_url", nullable = false, columnDefinition = "TEXT")
    private String bannerImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private EventStatus status = EventStatus.PUBLISHED;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 50, nullable = true, columnDefinition = "varchar(50) default 'MUSIC_CONCERT'")
    private EventCategory category = EventCategory.MUSIC_CONCERT;

    @Enumerated(EnumType.STRING)
    @Column(name = "neighborhood", length = 50, nullable = true, columnDefinition = "varchar(50) default 'BOLE'")
    private Neighborhood neighborhood = Neighborhood.BOLE;

    @Column(name = "featured", nullable = true, columnDefinition = "boolean default false")
    private Boolean featured = false;

    @Column(name = "tags", length = 255, nullable = true, columnDefinition = "varchar(255) default ''")
    private String tags = "";

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TicketType> ticketTypes = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Event() {}

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Organizer getOrganizer() { return organizer; }
    public void setOrganizer(Organizer organizer) { this.organizer = organizer; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getVenueName() { return venueName; }
    public void setVenueName(String venueName) { this.venueName = venueName; }
    public String getVenueAddress() { return venueAddress; }
    public void setVenueAddress(String venueAddress) { this.venueAddress = venueAddress; }
    public Instant getStartTimeUtc() { return startTimeUtc; }
    public void setStartTimeUtc(Instant startTimeUtc) { this.startTimeUtc = startTimeUtc; }
    public Instant getEndTimeUtc() { return endTimeUtc; }
    public void setEndTimeUtc(Instant endTimeUtc) { this.endTimeUtc = endTimeUtc; }
    public String getBannerImageUrl() { return bannerImageUrl; }
    public void setBannerImageUrl(String bannerImageUrl) { this.bannerImageUrl = bannerImageUrl; }
    public EventStatus getStatus() { return status; }
    public void setStatus(EventStatus status) { this.status = status; }
    public EventCategory getCategory() { return category != null ? category : EventCategory.MUSIC_CONCERT; }
    public void setCategory(EventCategory category) { this.category = category; }
    public Neighborhood getNeighborhood() { return neighborhood != null ? neighborhood : Neighborhood.BOLE; }
    public void setNeighborhood(Neighborhood neighborhood) { this.neighborhood = neighborhood; }
    public boolean isFeatured() { return Boolean.TRUE.equals(featured); }
    public Boolean getFeatured() { return Boolean.TRUE.equals(featured); }
    public void setFeatured(boolean featured) { this.featured = featured; }
    public void setFeatured(Boolean featured) { this.featured = Boolean.TRUE.equals(featured); }
    public String getTags() { return tags != null ? tags : ""; }
    public void setTags(String tags) { this.tags = tags; }
    public List<TicketType> getTicketTypes() { return ticketTypes; }
    public void setTicketTypes(List<TicketType> ticketTypes) { this.ticketTypes = ticketTypes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
