package com.ethioevents.ticket;

import java.time.Instant;
import java.util.UUID;

public class TicketDtos {

    public record TransferTicketRequest(
            String ticketSecurityHash,
            String senderName,
            String senderPhone,
            String recipientName,
            String recipientPhone,
            String reason
    ) {}

    public record TransferTicketResponse(
            UUID transferId,
            String ticketCode,
            String eventTitle,
            String previousSecurityHash,
            String newSecurityHash,
            String newTicketPassUrl,
            String recipientName,
            String recipientPhone,
            Instant transferredAt
    ) {}

    public record TicketTransferHistoryDto(
            UUID id,
            String senderName,
            String senderPhone,
            String recipientName,
            String recipientPhone,
            String reason,
            String previousSecurityHash,
            String newSecurityHash,
            Instant transferredAt
    ) {}
}
