package com.ethioevents.common;

import com.ethioevents.model.*;
import com.ethioevents.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final OrganizerRepository organizerRepository;
    private final EventRepository eventRepository;
    private final TicketTypeRepository ticketTypeRepository;
    private final GateCrewAssignmentRepository gateCrewAssignmentRepository;

    public DataSeeder(UserRepository userRepository,
                      OrganizerRepository organizerRepository,
                      EventRepository eventRepository,
                      TicketTypeRepository ticketTypeRepository,
                      GateCrewAssignmentRepository gateCrewAssignmentRepository) {
        this.userRepository = userRepository;
        this.organizerRepository = organizerRepository;
        this.eventRepository = eventRepository;
        this.ticketTypeRepository = ticketTypeRepository;
        this.gateCrewAssignmentRepository = gateCrewAssignmentRepository;
    }

    @Override
    public void run(String... args) {
        if (eventRepository.count() > 0) {
            log.info("Database already contains events. Skipping seed.");
            return;
        }

        log.info("Seeding initial Addis Ababa events and ticket tiers...");

        // 1. Users
        User admin = userRepository.findByPhoneNumber("+251911000001").orElseGet(() -> {
            User u = new User("+251911000001", "EthioEvents Admin", UserRole.ADMIN);
            u.setEmail("admin@ethioevents.com");
            return userRepository.save(u);
        });

        User organizerUser = userRepository.findByPhoneNumber("+251911000002").orElseGet(() -> {
            User u = new User("+251911000002", "Admas Entertainment", UserRole.ORGANIZER);
            u.setEmail("admas@ethioevents.com");
            return userRepository.save(u);
        });

        User gateUser = userRepository.findByPhoneNumber("+251911000003").orElseGet(() -> {
            User u = new User("+251911000003", "Addis Gate Crew Lead", UserRole.GATE_CREW);
            u.setEmail("gate@ethioevents.com");
            return userRepository.save(u);
        });

        // 2. Organizer
        Organizer organizer = organizerRepository.findByUserId(organizerUser.getId()).orElseGet(() -> {
            Organizer org = new Organizer();
            org.setUser(organizerUser);
            org.setOrganizationName("Admas Events & Entertainment");
            org.setBusinessLicenseNo("BL-AA-2024-9981");
            org.setBankName("Commercial Bank of Ethiopia");
            org.setBankAccountNo("1000123456789");
            org.setBankAccountName("Admas Entertainment PLC");
            org.setStatus(OrganizerStatus.VERIFIED);
            return organizerRepository.save(org);
        });

        // 3. Event 1: Rophnan Millennium Hall
        Event rophnanEvent = new Event();
        rophnanEvent.setOrganizer(organizer);
        rophnanEvent.setTitle("ROPHNAN - SOST (፫) LIVE in Addis Ababa");
        rophnanEvent.setSlug("rophnan-sost-live-millennium-hall");
        rophnanEvent.setDescription("The ultimate electronic-folk spectacle by ROPHNAN. Featuring an immersive 360 audio-visual stage at Millennium Hall with special guest traditional instrumentalists from across Ethiopia.");
        rophnanEvent.setVenueName("Millennium Hall (ሚሌኒየም አዳራሽ)");
        rophnanEvent.setVenueAddress("Bole Sub-City, Africa Avenue, Addis Ababa");
        rophnanEvent.setStartTimeUtc(Instant.now().plus(30, ChronoUnit.DAYS));
        rophnanEvent.setEndTimeUtc(Instant.now().plus(30, ChronoUnit.DAYS).plus(6, ChronoUnit.HOURS));
        rophnanEvent.setBannerImageUrl("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop");
        rophnanEvent.setStatus(EventStatus.PUBLISHED);
        Event savedRophnan = eventRepository.save(rophnanEvent);

        createTicketType(savedRophnan, "Early Bird General", "Standing area access with standard stage view", new BigDecimal("800.00"), 5000, 4820);
        createTicketType(savedRophnan, "VIP Front Stage", "Front circle priority access + fast-track gate entry", new BigDecimal("2500.00"), 1500, 1420);
        createTicketType(savedRophnan, "VVIP Lounge & Drinks", "Elevated lounge with free welcome drinks & artist backstage meetup", new BigDecimal("6000.00"), 200, 185);

        // Event 2: Addis Tech Summit
        Event techEvent = new Event();
        techEvent.setOrganizer(organizer);
        techEvent.setTitle("Addis Tech Summit & AI Expo 2026");
        techEvent.setSlug("addis-tech-summit-2026");
        techEvent.setDescription("Ethiopia’s premier tech, fintech, and AI summit bringing together 2,000+ software engineers, founders, venture capitalists, and policy makers from across the Horn of Africa.");
        techEvent.setVenueName("Ethiopian Skylight Hotel");
        techEvent.setVenueAddress("Bole Airport Road, Addis Ababa");
        techEvent.setStartTimeUtc(Instant.now().plus(60, ChronoUnit.DAYS));
        techEvent.setEndTimeUtc(Instant.now().plus(61, ChronoUnit.DAYS));
        techEvent.setBannerImageUrl("https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop");
        techEvent.setStatus(EventStatus.PUBLISHED);
        Event savedTech = eventRepository.save(techEvent);

        createTicketType(savedTech, "Standard Pass (2 Days)", "Full access to keynotes, exhibitions, and networking lounges", new BigDecimal("1500.00"), 1000, 950);
        createTicketType(savedTech, "Executive VIP & Gala Dinner", "Includes Executive VIP Lounge + Gala Dinner at Ethiopian Skylight Hotel", new BigDecimal("5000.00"), 300, 280);

        // Event 3: Comedy Night at Ghion
        Event comedyEvent = new Event();
        comedyEvent.setOrganizer(organizer);
        comedyEvent.setTitle("Habesha Stand-Up Comedy Night & Jazz");
        comedyEvent.setSlug("habesha-comedy-night-ghion");
        comedyEvent.setDescription("An evening of premier Ethiopian stand-up comedy and live Ethio-Jazz under the historic trees of Ghion Hotel Addis Ababa.");
        comedyEvent.setVenueName("Ghion Hotel Gardens");
        comedyEvent.setVenueAddress("Ras Desta Damtew St, Addis Ababa");
        comedyEvent.setStartTimeUtc(Instant.now().plus(15, ChronoUnit.DAYS));
        comedyEvent.setEndTimeUtc(Instant.now().plus(15, ChronoUnit.DAYS).plus(4, ChronoUnit.HOURS));
        comedyEvent.setBannerImageUrl("https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop");
        comedyEvent.setStatus(EventStatus.PUBLISHED);
        Event savedComedy = eventRepository.save(comedyEvent);

        createTicketType(savedComedy, "Regular Seat", "Table seating in garden amphitheater", new BigDecimal("500.00"), 400, 360);

        // Assign Gate Crew
        GateCrewAssignment assignment = new GateCrewAssignment(gateUser, savedRophnan);
        gateCrewAssignmentRepository.save(assignment);

        log.info("Database successfully seeded with 3 events and ticket tiers!");
    }

    private void createTicketType(Event event, String name, String desc, BigDecimal price, int total, int available) {
        TicketType tt = new TicketType();
        tt.setEvent(event);
        tt.setName(name);
        tt.setDescription(desc);
        tt.setPrice(price);
        tt.setTotalCapacity(total);
        tt.setAvailableCapacity(available);
        tt.setReservedCapacity(0);
        tt.setMaxPerUser(5);
        tt.setSalesStartUtc(Instant.now().minus(5, ChronoUnit.DAYS));
        tt.setSalesEndUtc(event.getStartTimeUtc());
        ticketTypeRepository.save(tt);
    }
}
