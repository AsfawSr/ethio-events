package com.ethioevents.ticket;

import com.ethioevents.model.Ticket;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MobileWalletPassService {

    /**
     * Generates an Apple Wallet pass.json structure for the ticket pass
     */
    public Map<String, Object> generateAppleWalletPassJson(Ticket ticket, TicketService.PublicTicketDetailsDto dto) {
        Map<String, Object> pass = new HashMap<>();
        pass.put("formatVersion", 1);
        pass.put("passTypeIdentifier", "pass.com.ethioevents.event");
        pass.put("serialNumber", ticket.getTicketCode());
        pass.put("teamIdentifier", "ETHIOEVENTS");
        pass.put("organizationName", "EthioEvents");
        pass.put("description", dto.eventTitle());
        pass.put("logoText", "EthioEvents");
        pass.put("foregroundColor", "rgb(255, 255, 255)");
        pass.put("backgroundColor", "rgb(14, 22, 38)");
        pass.put("labelColor", "rgb(245, 158, 11)");

        // Barcode
        Map<String, Object> barcode = new HashMap<>();
        barcode.put("format", "PKBarcodeFormatQR");
        barcode.put("message", dto.qrPayload());
        barcode.put("messageEncoding", "iso-8859-1");
        barcode.put("altText", dto.ticketCode());
        pass.put("barcode", barcode);
        pass.put("barcodes", List.of(barcode));

        // Event Ticket Fields
        Map<String, Object> eventTicket = new HashMap<>();

        // Primary: Event Title
        Map<String, Object> primaryField = new HashMap<>();
        primaryField.put("key", "event");
        primaryField.put("label", "EVENT / መድረክ");
        primaryField.put("value", dto.eventTitle());
        eventTicket.put("primaryFields", List.of(primaryField));

        // Secondary: Attendee & Tier
        Map<String, Object> secField1 = new HashMap<>();
        secField1.put("key", "tier");
        secField1.put("label", "TIER / አይነት");
        secField1.put("value", dto.tierName());

        Map<String, Object> secField2 = new HashMap<>();
        secField2.put("key", "attendee");
        secField2.put("label", "ATTENDEE / ተሳታፊ");
        secField2.put("value", dto.attendeeName());
        eventTicket.put("secondaryFields", List.of(secField1, secField2));

        // Auxiliary: Date & Venue
        Map<String, Object> auxField1 = new HashMap<>();
        auxField1.put("key", "date");
        auxField1.put("label", "DATE & TIME / ቀን");
        auxField1.put("value", dto.eventStartTime().gregorianFormatted());

        Map<String, Object> auxField2 = new HashMap<>();
        auxField2.put("key", "venue");
        auxField2.put("label", "VENUE / ቦታ");
        auxField2.put("value", dto.venueName());
        eventTicket.put("auxiliaryFields", List.of(auxField1, auxField2));

        // Back fields: Info & Gate terms
        Map<String, Object> backField1 = new HashMap<>();
        backField1.put("key", "terms");
        backField1.put("label", "Gate Entry Rules");
        backField1.put("value", "Validated cryptographically at gate turnstiles. Each pass can only be scanned once.");

        Map<String, Object> backField2 = new HashMap<>();
        backField2.put("key", "ethiopianDate");
        backField2.put("label", "Ethiopian Calendar");
        backField2.put("value", dto.eventStartTime().ethiopianFullFormatted() != null ? dto.eventStartTime().ethiopianFullFormatted() : "N/A");

        Map<String, Object> backField3 = new HashMap<>();
        backField3.put("key", "support");
        backField3.put("label", "Customer Support");
        backField3.put("value", "support@ethioevents.et | +251 911 000 000");

        eventTicket.put("backFields", List.of(backField1, backField2, backField3));
        pass.put("eventTicket", eventTicket);

        return pass;
    }

    /**
     * Generates a Google Wallet Pass save claims payload
     */
    public Map<String, Object> generateGoogleWalletPassPayload(Ticket ticket, TicketService.PublicTicketDetailsDto dto) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("issuerEmail", "passes@ethioevents.et");
        payload.put("issuerId", "ethioevents-issuer-id");

        Map<String, Object> eventObject = new HashMap<>();
        eventObject.put("id", "ethioevents." + ticket.getTicketCode());
        eventObject.put("classId", "ethioevents.event." + ticket.getEvent().getId());
        eventObject.put("state", "ACTIVE");
        eventObject.put("ticketHolderName", dto.attendeeName());
        eventObject.put("ticketNumber", dto.ticketCode());
        eventObject.put("eventName", dto.eventTitle());
        eventObject.put("venueName", dto.venueName());
        eventObject.put("venueAddress", dto.venueAddress());
        eventObject.put("seatInfo", dto.tierName());
        eventObject.put("dateTime", dto.eventStartTime().gregorianFormatted());
        eventObject.put("ethiopianDateTime", dto.eventStartTime().ethiopianFullFormatted());

        Map<String, Object> barcode = new HashMap<>();
        barcode.put("type", "QR_CODE");
        barcode.put("value", dto.qrPayload());
        barcode.put("alternateText", dto.ticketCode());
        eventObject.put("barcode", barcode);

        payload.put("eventTicketObject", eventObject);
        payload.put("saveUrl", "https://pay.google.com/gp/v/save/ethioevents-" + ticket.getSecurityHash());

        return payload;
    }
}
