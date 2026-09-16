package com.ethioevents.ticket;

import com.ethioevents.crypto.QrCodeGeneratorService;
import com.ethioevents.model.Ticket;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class PdfTicketGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(PdfTicketGeneratorService.class);
    private final QrCodeGeneratorService qrCodeGeneratorService;

    // Palette Colors
    private static final Color COLOR_PRIMARY = new Color(14, 22, 38);       // #0E1626 Deep Slate
    private static final Color COLOR_GOLD = new Color(245, 158, 11);        // #F59E0B Amber/Gold
    private static final Color COLOR_EMERALD = new Color(16, 185, 129);     // #10B981 Emerald Green
    private static final Color COLOR_LIGHT_BG = new Color(248, 250, 252);   // #F8FAFC Off-white
    private static final Color COLOR_BORDER = new Color(226, 232, 240);     // #E2E8F0 Slate Border
    private static final Color COLOR_MUTED = new Color(100, 116, 139);      // #64748B Muted Text

    public PdfTicketGeneratorService(QrCodeGeneratorService qrCodeGeneratorService) {
        this.qrCodeGeneratorService = qrCodeGeneratorService;
    }

    public byte[] generateTicketPdf(Ticket ticket, TicketService.PublicTicketDetailsDto dto) {
        try {
            // Standard A4 portrait
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter writer = PdfWriter.getInstance(document, out);

            document.open();

            // Font configurations
            Font fontHeaderTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.WHITE);
            Font fontHeaderSubtitle = FontFactory.getFont(FontFactory.HELVETICA, 10, COLOR_GOLD);
            Font fontEventTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, COLOR_PRIMARY);
            Font fontSectionHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, COLOR_PRIMARY);
            Font fontLabel = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_MUTED);
            Font fontValue = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, COLOR_PRIMARY);
            Font fontValueHighlight = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, COLOR_GOLD);
            Font fontCode = FontFactory.getFont(FontFactory.COURIER_BOLD, 14, COLOR_PRIMARY);
            Font fontSmall = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_MUTED);
            Font fontBadge = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_EMERALD);

            // ==========================================
            // HEADER BAR
            // ==========================================
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{65, 35});

            PdfPCell headerLeft = new PdfPCell();
            headerLeft.setBackgroundColor(COLOR_PRIMARY);
            headerLeft.setPadding(14);
            headerLeft.setBorder(Rectangle.NO_BORDER);

            Paragraph brandP = new Paragraph("ETHIOEVENTS • OFFICIAL ADMISSION PASS", fontHeaderSubtitle);
            Paragraph passP = new Paragraph("ELECTRONIC TICKET / ኢ-ቲኬት", fontHeaderTitle);
            headerLeft.addElement(brandP);
            headerLeft.addElement(passP);

            PdfPCell headerRight = new PdfPCell();
            headerRight.setBackgroundColor(COLOR_PRIMARY);
            headerRight.setPadding(14);
            headerRight.setBorder(Rectangle.NO_BORDER);
            headerRight.setHorizontalAlignment(Element.ALIGN_RIGHT);

            Paragraph codeLabel = new Paragraph("TICKET REF", fontHeaderSubtitle);
            codeLabel.setAlignment(Element.ALIGN_RIGHT);
            Paragraph codeVal = new Paragraph(dto.ticketCode(), fontHeaderTitle);
            codeVal.setAlignment(Element.ALIGN_RIGHT);
            headerRight.addElement(codeLabel);
            headerRight.addElement(codeVal);

            headerTable.addCell(headerLeft);
            headerTable.addCell(headerRight);
            document.add(headerTable);

            // Spacing
            document.add(new Paragraph(" "));

            // ==========================================
            // MAIN TICKET BODY CARD
            // ==========================================
            PdfPTable mainCard = new PdfPTable(2);
            mainCard.setWidthPercentage(100);
            mainCard.setWidths(new float[]{58, 42});

            // --- Left Column: Event & Attendee Details ---
            PdfPCell leftCell = new PdfPCell();
            leftCell.setBackgroundColor(COLOR_LIGHT_BG);
            leftCell.setBorderColor(COLOR_BORDER);
            leftCell.setPadding(16);

            // Event Title
            Paragraph evtTitle = new Paragraph(dto.eventTitle(), fontEventTitle);
            evtTitle.setSpacingAfter(8);
            leftCell.addElement(evtTitle);

            // Tier Badge
            Paragraph tierBadge = new Paragraph("TIER: " + dto.tierName().toUpperCase(), fontValueHighlight);
            tierBadge.setSpacingAfter(10);
            leftCell.addElement(tierBadge);

            // Divider Line
            Paragraph div = new Paragraph("--------------------------------------------------", fontSmall);
            div.setSpacingAfter(8);
            leftCell.addElement(div);

            // Date & Time
            leftCell.addElement(new Paragraph("EVENT DATE & TIME", fontLabel));
            leftCell.addElement(new Paragraph(dto.eventStartTime().gregorianFormatted(), fontValue));
            if (dto.eventStartTime().ethiopianFullFormatted() != null) {
                leftCell.addElement(new Paragraph("Ethiopian Time: " + dto.eventStartTime().ethiopianFullFormatted(), fontSmall));
            }
            leftCell.addElement(new Paragraph(" "));

            // Venue
            leftCell.addElement(new Paragraph("VENUE & LOCATION", fontLabel));
            leftCell.addElement(new Paragraph(dto.venueName(), fontValue));
            leftCell.addElement(new Paragraph(dto.venueAddress(), fontSmall));
            leftCell.addElement(new Paragraph(" "));

            // Attendee Details
            leftCell.addElement(new Paragraph("ATTENDEE / TICKET HOLDER", fontLabel));
            leftCell.addElement(new Paragraph(dto.attendeeName(), fontValue));
            leftCell.addElement(new Paragraph("Phone: " + dto.attendeePhone(), fontSmall));

            // Status Badge
            leftCell.addElement(new Paragraph(" "));
            leftCell.addElement(new Paragraph("STATUS: " + dto.status() + " (ED25519 VERIFIED)", fontBadge));

            // --- Right Column: QR Code & Validation ---
            PdfPCell rightCell = new PdfPCell();
            rightCell.setBackgroundColor(Color.WHITE);
            rightCell.setBorderColor(COLOR_BORDER);
            rightCell.setPadding(14);
            rightCell.setHorizontalAlignment(Element.ALIGN_CENTER);

            // Generate QR Code Image Bytes
            byte[] qrBytes = qrCodeGeneratorService.generateQrCodeBytes(dto.qrPayload(), 250, 250);
            Image qrImage = Image.getInstance(qrBytes);
            qrImage.setAlignment(Element.ALIGN_CENTER);
            qrImage.scaleToFit(170, 170);

            Paragraph scanHeader = new Paragraph("SCAN AT VENUE GATE", fontSectionHeader);
            scanHeader.setAlignment(Element.ALIGN_CENTER);
            scanHeader.setSpacingAfter(6);

            rightCell.addElement(scanHeader);
            rightCell.addElement(qrImage);

            Paragraph ticketCodeP = new Paragraph(dto.ticketCode(), fontCode);
            ticketCodeP.setAlignment(Element.ALIGN_CENTER);
            ticketCodeP.setSpacingBefore(6);
            rightCell.addElement(ticketCodeP);

            Paragraph qrNote = new Paragraph("Single-use cryptographic admission token\nValidated offline by Turnstile scanners", fontSmall);
            qrNote.setAlignment(Element.ALIGN_CENTER);
            qrNote.setSpacingBefore(4);
            rightCell.addElement(qrNote);

            mainCard.addCell(leftCell);
            mainCard.addCell(rightCell);
            document.add(mainCard);

            // Spacing
            document.add(new Paragraph(" "));

            // ==========================================
            // SECURITY NOTICE & FOOTER
            // ==========================================
            PdfPTable footerTable = new PdfPTable(1);
            footerTable.setWidthPercentage(100);

            PdfPCell noticeCell = new PdfPCell();
            noticeCell.setBackgroundColor(new Color(254, 243, 199)); // Light Amber
            noticeCell.setBorderColor(new Color(251, 191, 36));
            noticeCell.setPadding(10);

            Font fontNoticeTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(146, 64, 14));
            Font fontNoticeBody = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(146, 64, 14));

            Paragraph noticeTitle = new Paragraph("IMPORTANT ENTRY & ANTI-COUNTERFEIT INSTRUCTIONS:", fontNoticeTitle);
            Paragraph noticeBody = new Paragraph(
                    "1. Present either this printed PDF or the live digital pass on your phone at Millennium Hall gate turnstiles.\n" +
                    "2. Each QR code is uniquely encrypted with Ed25519 and will automatically be marked USED upon first scan.\n" +
                    "3. Do not forward, post online, or photocopy this pass to prevent duplicate entry rejection at the venue.\n" +
                    "4. For customer support or ticket lookup, visit https://ethioevents.et or dial +251 911 000 000.",
                    fontNoticeBody
            );

            noticeCell.addElement(noticeTitle);
            noticeCell.addElement(noticeBody);
            footerTable.addCell(noticeCell);
            document.add(footerTable);

            // Footer Timestamp
            Paragraph platformFoot = new Paragraph(
                    "Generated by EthioEvents Platform • Addis Ababa, Ethiopia • Pass Hash: " + dto.securityHash(),
                    fontSmall
            );
            platformFoot.setAlignment(Element.ALIGN_CENTER);
            platformFoot.setSpacingBefore(12);
            document.add(platformFoot);

            document.close();
            return out.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate PDF ticket pass: " + e.getMessage(), e);
            throw new RuntimeException("Error generating PDF ticket", e);
        }
    }
}
