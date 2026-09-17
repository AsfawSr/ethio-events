package com.ethioevents.broadcast;

import com.ethioevents.auth.SmsGatewayDispatcher;
import com.ethioevents.localization.EthiopianTimeConverter;
import com.ethioevents.model.*;
import com.ethioevents.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ScheduledEventReminderService {

    private static final Logger log = LoggerFactory.getLogger(ScheduledEventReminderService.class);

    private final EventRepository eventRepository;
    private final TicketRepository ticketRepository;
    private final EventAutomatedReminderRepository reminderRepository;
    private final SmsGatewayDispatcher smsDispatcher;

    @Value("${ethioevents.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    public ScheduledEventReminderService(
            EventRepository eventRepository,
            TicketRepository ticketRepository,
            EventAutomatedReminderRepository reminderRepository,
            SmsGatewayDispatcher smsDispatcher) {
        this.eventRepository = eventRepository;
        this.ticketRepository = ticketRepository;
        this.reminderRepository = reminderRepository;
        this.smsDispatcher = smsDispatcher;
    }

    /**
     * Checks published events every 5 minutes and dispatches automated 24h & 2h pre-event reminders
     */
    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void scanAndDispatchReminders() {
        Instant now = Instant.now();
        List<Event> publishedEvents = eventRepository.findByStatusOrderByStartTimeUtcAsc(EventStatus.PUBLISHED);

        for (Event event : publishedEvents) {
            Instant start = event.getStartTimeUtc();
            if (start == null || start.isBefore(now)) {
                continue;
            }

            long minutesUntilStart = ChronoUnit.MINUTES.between(now, start);

            // 1. T-Minus 24 Hours (between 23h and 25h)
            if (minutesUntilStart >= 23 * 60 && minutesUntilStart <= 25 * 60) {
                processReminder(event, "T_MINUS_24_HOURS");
            }

            // 2. T-Minus 2 Hours (between 1h and 2.5h)
            if (minutesUntilStart >= 60 && minutesUntilStart <= 150) {
                processReminder(event, "T_MINUS_2_HOURS");
            }
        }
    }

    private void processReminder(Event event, String reminderType) {
        EventAutomatedReminder reminder = reminderRepository.findByEventIdAndReminderType(event.getId(), reminderType)
                .orElseGet(() -> {
                    EventAutomatedReminder r = new EventAutomatedReminder();
                    r.setEventId(event.getId());
                    r.setReminderType(reminderType);
                    r.setEnabled(true);
                    r.setStatus("PENDING");
                    return reminderRepository.save(r);
                });

        if (!reminder.isEnabled() || !"PENDING".equalsIgnoreCase(reminder.getStatus())) {
            return;
        }

        log.info("⏰ Triggering automated [{}] pre-event reminders for event '{}'", reminderType, event.getTitle());

        List<Ticket> tickets = ticketRepository.findByEventId(event.getId());
        Map<String, Ticket> phoneToTicketMap = new LinkedHashMap<>();

        for (Ticket t : tickets) {
            if (t.getStatus() == TicketStatus.REVOKED) {
                continue;
            }
            String phone = t.getAttendeePhone();
            if (phone == null && t.getOrder() != null) {
                phone = t.getOrder().isGift() && t.getOrder().getGiftRecipientPhone() != null
                        ? t.getOrder().getGiftRecipientPhone()
                        : t.getOrder().getCustomerPhone();
            }
            if (phone != null && !phone.isBlank() && !phoneToTicketMap.containsKey(phone.trim())) {
                phoneToTicketMap.put(phone.trim(), t);
            }
        }

        String eventTime = EthiopianTimeConverter.toEthiopianTime(event.getStartTimeUtc()).fullTimeFormatted();
        int count = 0;

        for (Map.Entry<String, Ticket> entry : phoneToTicketMap.entrySet()) {
            String phone = entry.getKey();
            Ticket ticket = entry.getValue();
            String passLink = frontendBaseUrl + "/t/" + ticket.getSecurityHash();

            String message;
            if ("T_MINUS_24_HOURS".equals(reminderType)) {
                message = String.format(
                        "📅 EthioEvents Reminder: %s starts TOMORROW at %s (%s). Have your live QR pass ready: %s. ነገ እንዳይረሱ!",
                        event.getTitle(), eventTime, event.getVenueName(), passLink
                );
            } else {
                message = String.format(
                        "⚡ EthioEvents Alert: %s starts in 2 HOURS at %s! Open your QR pass for gate check-in: %s. ደስ የሚል ቆይታ!",
                        event.getTitle(), event.getVenueName(), passLink
                );
            }

            try {
                smsDispatcher.sendBroadcastSms(phone, message, event.getTitle());
                count++;
            } catch (Exception e) {
                log.error("Failed to send automated reminder to {}: {}", phone, e.getMessage());
            }
        }

        reminder.setStatus("SENT");
        reminder.setSentAt(OffsetDateTime.now());
        reminder.setTotalSent(count);
        reminderRepository.save(reminder);

        log.info("✓ Completed [{}] reminder blast for event '{}'. Dispatched to {} attendees.", reminderType, event.getTitle(), count);
    }

    @Transactional(readOnly = true)
    public BroadcastDtos.AutomatedReminderConfig getReminderConfig(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found with ID: " + eventId));

        Optional<EventAutomatedReminder> r24 = reminderRepository.findByEventIdAndReminderType(eventId, "T_MINUS_24_HOURS");
        Optional<EventAutomatedReminder> r2 = reminderRepository.findByEventIdAndReminderType(eventId, "T_MINUS_2_HOURS");

        return new BroadcastDtos.AutomatedReminderConfig(
                eventId,
                event.getTitle(),
                r24.map(EventAutomatedReminder::isEnabled).orElse(true),
                r24.map(r -> "SENT".equalsIgnoreCase(r.getStatus())).orElse(false),
                r24.map(EventAutomatedReminder::getSentAt).orElse(null),
                r24.map(EventAutomatedReminder::getTotalSent).orElse(0),
                r2.map(EventAutomatedReminder::isEnabled).orElse(true),
                r2.map(r -> "SENT".equalsIgnoreCase(r.getStatus())).orElse(false),
                r2.map(EventAutomatedReminder::getSentAt).orElse(null),
                r2.map(EventAutomatedReminder::getTotalSent).orElse(0)
        );
    }

    @Transactional
    public BroadcastDtos.AutomatedReminderConfig updateReminderConfig(UUID eventId, BroadcastDtos.UpdateRemindersRequest req) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found with ID: " + eventId));

        if (req.tMinus24HoursEnabled() != null) {
            EventAutomatedReminder r24 = reminderRepository.findByEventIdAndReminderType(eventId, "T_MINUS_24_HOURS")
                    .orElseGet(() -> {
                        EventAutomatedReminder r = new EventAutomatedReminder();
                        r.setEventId(eventId);
                        r.setReminderType("T_MINUS_24_HOURS");
                        return r;
                    });
            r24.setEnabled(req.tMinus24HoursEnabled());
            reminderRepository.save(r24);
        }

        if (req.tMinus2HoursEnabled() != null) {
            EventAutomatedReminder r2 = reminderRepository.findByEventIdAndReminderType(eventId, "T_MINUS_2_HOURS")
                    .orElseGet(() -> {
                        EventAutomatedReminder r = new EventAutomatedReminder();
                        r.setEventId(eventId);
                        r.setReminderType("T_MINUS_2_HOURS");
                        return r;
                    });
            r2.setEnabled(req.tMinus2HoursEnabled());
            reminderRepository.save(r2);
        }

        return getReminderConfig(eventId);
    }
}
