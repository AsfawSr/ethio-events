package com.ethioevents.ticket;

import com.ethioevents.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tickets/public")
public class PublicTicketController {

    private final TicketService ticketService;

    public PublicTicketController(TicketService ticketService) {
        this.ticketService = ticketService;
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
}
