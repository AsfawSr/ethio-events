package com.ethioevents.crypto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class Ed25519TicketSignerTest {

    private Ed25519TicketSigner signer;

    @BeforeEach
    void setUp() {
        signer = new Ed25519TicketSigner("VGVzdEVkaW8yMDI2RXZlbnRzU2VlZEZvclNpZ25pbmdLZXk=");
    }

    @Test
    void testSignAndVerifyTicket() {
        UUID ticketId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        String ticketCode = "ETH-99A1B2";

        Ed25519TicketSigner.SignedTicketPayload payload = signer.signTicket(ticketId, eventId, ticketCode);

        assertNotNull(payload.fullQrPayload());
        assertNotNull(payload.signatureHex());
        assertNotNull(payload.securityHash());
        assertTrue(payload.fullQrPayload().startsWith("v1."));

        // Verify valid QR
        boolean isValid = signer.verifyQrPayload(payload.fullQrPayload());
        assertTrue(isValid, "Legitimate QR code signature must verify successfully");

        // Verify tampered QR is rejected
        String tampered = payload.fullQrPayload().substring(0, payload.fullQrPayload().length() - 4) + "0000";
        assertFalse(signer.verifyQrPayload(tampered), "Tampered QR code signature must be rejected");

        String tamperedId = payload.fullQrPayload().replace(ticketId.toString(), UUID.randomUUID().toString());
        assertFalse(signer.verifyQrPayload(tamperedId), "Tampered ticket ID must be rejected");
    }
}
