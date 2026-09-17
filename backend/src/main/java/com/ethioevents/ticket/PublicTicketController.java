package com.ethioevents.ticket;

import com.ethioevents.common.ApiResponse;
import com.ethioevents.model.Ticket;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/tickets/public")
public class PublicTicketController {

    private final TicketService ticketService;
    private final PdfTicketGeneratorService pdfTicketGeneratorService;
    private final MobileWalletPassService mobileWalletPassService;

    public PublicTicketController(TicketService ticketService,
                                  PdfTicketGeneratorService pdfTicketGeneratorService,
                                  MobileWalletPassService mobileWalletPassService) {
        this.ticketService = ticketService;
        this.pdfTicketGeneratorService = pdfTicketGeneratorService;
        this.mobileWalletPassService = mobileWalletPassService;
    }

    @GetMapping("/pass/{securityHash}")
    public ResponseEntity<ApiResponse<TicketService.PublicTicketDetailsDto>> getPublicTicketByHash(
            @PathVariable String securityHash) {
        TicketService.PublicTicketDetailsDto ticket = ticketService.getPublicTicketBySecurityHash(securityHash);
        return ResponseEntity.ok(ApiResponse.ok(ticket));
    }

    @GetMapping("/code/{ticketCode}")
    public ResponseEntity<ApiResponse<TicketService.PublicTicketDetailsDto>> getPublicTicketByCode(
            @PathVariable String ticketCode) {
        TicketService.PublicTicketDetailsDto ticket = ticketService.getPublicTicketByCode(ticketCode);
        return ResponseEntity.ok(ApiResponse.ok(ticket));
    }

    /**
     * Download vector PDF E-Ticket Pass for offline printing or presentation
     */
    @GetMapping(value = "/pass/{securityHash}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadTicketPdf(@PathVariable String securityHash) {
        Ticket ticket = ticketService.getTicketBySecurityHash(securityHash);
        TicketService.PublicTicketDetailsDto dto = ticketService.getPublicTicketBySecurityHash(securityHash);

        byte[] pdfBytes = pdfTicketGeneratorService.generateTicketPdf(ticket, dto);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"EthioEvents-Ticket-" + ticket.getTicketCode() + ".pdf\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    /**
     * Apple Wallet Pass Data (.pkpass / JSON payload)
     */
    @GetMapping("/pass/{securityHash}/wallet/apple")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAppleWalletPass(@PathVariable String securityHash) {
        Ticket ticket = ticketService.getTicketBySecurityHash(securityHash);
        TicketService.PublicTicketDetailsDto dto = ticketService.getPublicTicketBySecurityHash(securityHash);

        Map<String, Object> passJson = mobileWalletPassService.generateAppleWalletPassJson(ticket, dto);
        return ResponseEntity.ok(ApiResponse.ok(passJson));
    }

    /**
     * Google Wallet Pass Claim & Save Link
     */
    @GetMapping("/pass/{securityHash}/wallet/google")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGoogleWalletPass(@PathVariable String securityHash) {
        Ticket ticket = ticketService.getTicketBySecurityHash(securityHash);
        TicketService.PublicTicketDetailsDto dto = ticketService.getPublicTicketBySecurityHash(securityHash);

        Map<String, Object> googlePass = mobileWalletPassService.generateGoogleWalletPassPayload(ticket, dto);
        return ResponseEntity.ok(ApiResponse.ok(googlePass));
    }

    /**
     * Transfer ticket to friend with cryptographic re-signing and SMS pass dispatch
     */
    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<TicketDtos.TransferTicketResponse>> transferTicket(
            @RequestBody TicketDtos.TransferTicketRequest request) {
        TicketDtos.TransferTicketResponse response = ticketService.transferTicket(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Get transfer history / audit trail for a ticket
     */
    @GetMapping("/transfers/{ticketCode}")
    public ResponseEntity<ApiResponse<java.util.List<TicketDtos.TicketTransferHistoryDto>>> getTicketTransferHistory(
            @PathVariable String ticketCode) {
        java.util.List<TicketDtos.TicketTransferHistoryDto> history = ticketService.getTransferHistoryByTicketCode(ticketCode);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }
}
